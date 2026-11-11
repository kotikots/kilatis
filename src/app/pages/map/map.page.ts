// ============================================================
// src/app/pages/map/map.page.ts
// Controller for the Market Map tab.
//
// Features:
//  - Interactive slidable/draggable Leaflet map
//  - Real-time search bar + quick filter chips
//  - Dedicated Zoom In (+) / Zoom Out (-) and Recenter controls
//  - Native mouse wheel zooming and touch pinch gestures
//  - Slidable horizontal market cards carousel synced with pins
//  - Geolocation (Locate Me)
// ============================================================

import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  NgZone
} from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/lazy';
import * as L from 'leaflet';
(window as any).L = L;
import 'leaflet.markercluster';
import { DataService, isMarketOpen } from '../../services/data.service';
import { Market, Commodity } from '../../models/commodity.model';

const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
const iconUrl = 'assets/leaflet/marker-icon.png';
const shadowUrl = 'assets/leaflet/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: false,
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  private dataService = inject(DataService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private zone = inject(NgZone);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('cardsTrack', { static: false }) cardsTrack?: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private markersLayer: any = null;
  private userMarker: L.Marker | null = null;
  private marketMarkers = new Map<number, L.Marker>();

  markets: Market[] = [];
  commodities: Commodity[] = [];
  filteredMarkets: Market[] = [];
  carouselMarkets: Market[] = [];
  searchQuery: string = '';
  selectedRegion: string = '';
  selectedMarket: Market | null = null;
  isTrayCollapsed: boolean = false;
  isSearching: boolean = false;
  geocodeResult: string = '';

  private resizeHandler = () => {
    if (this.map) {
      this.map.invalidateSize();
    }
  };

  ngOnInit() {
    (window as any).palengkeNavigateToPrices = (marketId: number, encodedName: string) => {
      const name = decodeURIComponent(encodedName || '');
      const id = parseInt(marketId as any, 10);
      const found = this.markets.find(m => m.id === id || (name && m.name.toLowerCase() === name.toLowerCase())) || {
        id,
        name: name,
        address: 'Monitored Market',
        lat: 0,
        lng: 0,
        operatingHours: '5:00 AM - 7:00 PM',
        description: '',
        isOpen: true
      };
      this.dataService.setSelectedMarket(found);
      this.zone.run(() => {
        this.viewPrices(found);
      });
    };
    this.loadMarkets();
    this.loadCommodities();
    window.addEventListener('resize', this.resizeHandler);
  }

  loadCommodities() {
    this.dataService.getCommodities().subscribe({
      next: (commodities) => {
        this.commodities = commodities || [];
        if (this.map && this.filteredMarkets.length > 0) {
          this.renderMarkers();
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 150);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    try { delete (window as any).palengkeNavigateToPrices; } catch {}
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  ionViewDidEnter() {
    if (!this.map && this.mapContainer) {
      this.initMap();
    }

    // Refresh size and ensure markets are loaded and rendered smoothly
    setTimeout(() => {
      this.map?.invalidateSize(true);
      if (this.markets.length === 0) {
        this.loadMarkets();
      } else if (this.marketMarkers.size === 0) {
        this.renderMarkers();
      } else {
        this.updateCarouselMarkets();
      }
    }, 120);

    setTimeout(() => {
      this.map?.invalidateSize(true);
      this.updateCarouselMarkets();
    }, 400);

    setTimeout(() => {
      this.map?.invalidateSize(true);
    }, 850);
  }

  ionViewDidLeave() {
    // Keep map instance alive across tab switches so pins and user location are not wiped out
  }

  initMap() {
    if (!this.mapContainer || !this.mapContainer.nativeElement) return;
    if (this.map) return;

    const container = this.mapContainer.nativeElement;
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    // Initialize Leaflet map with all interactive capabilities enabled
    this.map = L.map(container, {
      center: [15.4865, 120.9734], // Center of Nueva Ecija
      zoom: 10, // Show Nueva Ecija clearly
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false, // Using our prominent dedicated controls
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      attributionControl: true
    });

    // Ensure mouse wheel zoom is explicitly active
    this.map.scrollWheelZoom.enable();

    // OpenStreetMap standard tiles (100% free, no API key required, zero watermarks)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Gracefully handle MarkerClusterGroup or fallback to FeatureGroup
    const LGlobal: any = (window as any).L || L;
    if (typeof LGlobal.markerClusterGroup === 'function') {
      this.markersLayer = LGlobal.markerClusterGroup({
        maxClusterRadius: 55,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 17,
        chunkedLoading: true,
        chunkInterval: 100
      }).addTo(this.map);
    } else {
      console.warn('MarkerClusterGroup not available, falling back to L.featureGroup');
      this.markersLayer = L.featureGroup().addTo(this.map);
    }

    // Refresh carousel items when user finishes panning or zooming
    this.map.on('moveend', () => this.updateCarouselMarkets());
    this.map.on('zoomend', () => this.updateCarouselMarkets());

    // Ensure buttons inside popups are interactive and click events are not intercepted
    this.map.on('popupopen', (e: any) => {
      const popupEl = e.popup?.getElement();
      if (!popupEl) return;
      const btn = popupEl.querySelector('.btn-view-market-prices');
      if (btn) {
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.disableScrollPropagation(btn);
        btn.addEventListener('click', (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
          const id = parseInt(btn.getAttribute('data-market-id') || '0', 10);
          const name = decodeURIComponent(btn.getAttribute('data-market-name') || '');
          const market = this.markets.find(m => m.id === id) || {
            id,
            name,
            address: 'Monitored Market',
            lat: 0,
            lng: 0,
            operatingHours: '5:00 AM - 7:00 PM',
            description: '',
            isOpen: true
          };
          this.zone.run(() => {
            this.viewPrices(market);
          });
        });
      }
    });

    // Force size recalculation
    setTimeout(() => this.map?.invalidateSize(true), 150);
    setTimeout(() => this.map?.invalidateSize(true), 400);

    // Initial render
    if (this.markets.length > 0) {
      this.renderMarkers();
    }
  }

  loadMarkets() {
    this.dataService.getMarkets().subscribe({
      next: (markets: Market[]) => {
        this.markets = (markets || []).map(m => ({
          ...m,
          operatingHours: m.operatingHours || '5:00 AM - 7:00 PM',
          isOpen: isMarketOpen(m.operatingHours)
        }));
        this.filteredMarkets = [...this.markets];
        if (this.map) {
          this.renderMarkers();
        }
      },
      error: err => console.error('Failed to load markets:', err)
    });
  }

  // Batch render markers with Leaflet MarkerCluster
  renderMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    this.marketMarkers.clear();

    const markersToAdd: L.Marker[] = [];

    this.filteredMarkets.forEach(market => {
      market.isOpen = isMarketOpen(market.operatingHours);
      const markerColor = market.isOpen ? '#2e7d32' : '#eb445a';
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 13px;
            cursor: pointer;
          ">🛒</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16]
      });

      const samplePrices = this.dataService.getTopPricesForMarket(this.commodities, market, 3);
      let samplePricesHtml = '';
      if (samplePrices.length > 0) {
        samplePricesHtml = `
          <div style="margin-top:6px;border-top:1px dashed #ddd;padding-top:4px;font-size:0.78rem;">
            <strong style="color:#2e7d32;display:block;margin-bottom:2px;">Prevailing Prices:</strong>
            ${samplePrices.map(p => `
              <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="color:#444;">${p.name.split(' ')[0]} ${p.name.split(' ')[1] || ''}:</span>
                <strong style="color:#1b5e20;">₱${p.price.toFixed(2)}/${p.unit}</strong>
              </div>
            `).join('')}
          </div>
        `;
      }

      const hasTimbangan = this.dataService.hasTimbanganNgBayan(market);

      const marker = L.marker([market.lat, market.lng], { icon: customIcon });
      marker.bindPopup(() => this.getMarketPopupHtml(market), { maxWidth: 260 });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-view-prices-${market.id}`);
          if (btn) {
            L.DomEvent.disableClickPropagation(btn);
            L.DomEvent.disableScrollPropagation(btn);
            btn.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              this.zone.run(() => this.viewPrices(market));
            };
          }
        }, 50);
      });

      marker.on('click', () => {
        this.selectMarket(market, false);
      });

      markersToAdd.push(marker);
      this.marketMarkers.set(market.id, marker);
    });

    // High performance insertion into cluster or feature group
    if (this.markersLayer) {
      if (typeof this.markersLayer.addLayers === 'function') {
        this.markersLayer.addLayers(markersToAdd);
      } else if (typeof this.markersLayer.addLayer === 'function') {
        for (const m of markersToAdd) {
          this.markersLayer.addLayer(m);
        }
      }
    }
    this.updateCarouselMarkets();
  }

  // Lazy HTML generation for marker popups (only computed when clicked)
  getMarketPopupHtml(market: Market): string {
    const markerColor = market.isOpen ? '#2e7d32' : '#eb445a';
    const samplePrices = this.dataService.getTopPricesForMarket(this.commodities, market, 3);
    let samplePricesHtml = '';
    if (samplePrices.length > 0) {
      samplePricesHtml = `
        <div style="margin-top:6px;border-top:1px dashed #ddd;padding-top:4px;font-size:0.78rem;">
          <strong style="color:#2e7d32;display:block;margin-bottom:2px;">Prevailing Prices:</strong>
          ${samplePrices.map(p => `
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
              <span style="color:#444;">${p.name.split(' ')[0]} ${p.name.split(' ')[1] || ''}:</span>
              <strong style="color:#1b5e20;">₱${p.price.toFixed(2)}/${p.unit}</strong>
            </div>
          `).join('')}
        </div>
      `;
    }

    const hasTimbangan = this.dataService.hasTimbanganNgBayan(market);

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:190px;padding:4px;">
        <strong style="font-size:1.05rem;color:#1b5e20;">${market.name}</strong><br/>
        <span style="font-size:0.82rem;color:#555;">${market.address}</span><br/>
        <div style="margin-top:4px;font-size:0.82rem;">
          <span>🕐 ${market.operatingHours || '5:00 AM - 7:00 PM'}</span><br/>
          <span style="color:${markerColor};font-weight:700;">
            ${market.isOpen ? '✅ Open Now' : '❌ Currently Closed'}
          </span>
          ${hasTimbangan ? `
            <br/><span style="display:inline-block;margin-top:4px;font-size:0.72rem;background:#ecfdf5;color:#065f46;padding:2px 6px;border-radius:4px;border:1px solid #a7f3d0;font-weight:700;">
              ⚖️ Timbangan ng Bayan Active
            </span>
          ` : ''}
          <br/><span style="display:inline-block;margin-top:2px;font-size:0.72rem;color:#b45309;font-weight:600;">
            🌅 Bagsakan: 4:00 AM – 7:00 AM
          </span>
        </div>
        ${samplePricesHtml}
        <div style="margin-top:8px;text-align:center;">
          <button
            id="btn-view-prices-${market.id}"
            class="btn-view-market-prices"
            type="button"
            data-market-id="${market.id}"
            data-market-name="${encodeURIComponent(market.name)}"
            onclick="window.palengkeNavigateToPrices(${market.id}, '${encodeURIComponent(market.name)}'); return false;"
            style="display:block;width:100%;background:#2e7d32;color:#ffffff;padding:8px 0;border-radius:6px;border:none;cursor:pointer;font-size:0.8rem;font-weight:700;box-shadow:0 2px 4px rgba(0,0,0,0.15);pointer-events:auto !important;touch-action:manipulation;">
            View Prices for this Market &rarr;
          </button>
        </div>
      </div>
    `;
  }

  // Updates carousel with only the currently visible or closest 25 markets
  updateCarouselMarkets(): void {
    if (!this.map || this.filteredMarkets.length === 0) {
      this.carouselMarkets = [];
      return;
    }

    try {
      const bounds = this.map.getBounds();
      const center = this.map.getCenter();
      const visible = this.filteredMarkets.filter(m => bounds.contains([m.lat, m.lng]));

      if (visible.length > 0) {
        visible.sort((a, b) => {
          const distA = Math.hypot(a.lat - center.lat, a.lng - center.lng);
          const distB = Math.hypot(b.lat - center.lat, b.lng - center.lng);
          return distA - distB;
        });
        this.carouselMarkets = visible.slice(0, 25);
      } else {
        const sorted = [...this.filteredMarkets].sort((a, b) => {
          const distA = Math.hypot(a.lat - center.lat, a.lng - center.lng);
          const distB = Math.hypot(b.lat - center.lat, b.lng - center.lng);
          return distA - distB;
        });
        this.carouselMarkets = sorted.slice(0, 25);
      }
    } catch {
      this.carouselMarkets = this.filteredMarkets.slice(0, 25);
    }
  }

  // ---------------------------------------------------------------------
  // Search input handler — searches markets AND geocodes places
  onSearchChange(event?: any) {
    let query = '';
    if (event && event.detail && typeof event.detail.value === 'string') {
      query = event.detail.value;
    } else if (event && event.target && typeof event.target.value === 'string') {
      query = event.target.value;
    } else {
      query = this.searchQuery || '';
    }

    this.searchQuery = query;
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      this.onClearSearch();
      return;
    }

    // 1) Filter markets by name / address / description
    this.filteredMarkets = this.markets.filter(m =>
      m.name.toLowerCase().includes(cleanQuery) ||
      m.address.toLowerCase().includes(cleanQuery) ||
      m.description.toLowerCase().includes(cleanQuery)
    );

    if (this.filteredMarkets.length > 0) {
      this.geocodeResult = '';
      this.renderMarkers();
      if (this.filteredMarkets.length === 1) {
        this.selectMarket(this.filteredMarkets[0], true);
      } else if (this.map) {
        const bounds = this.filteredMarkets.map(m => [m.lat, m.lng] as [number, number]);
        this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 14 });
      }
    } else {
      // No markets matched — geocode the place name
      this.geocodePlaceAndPan(query);
    }
  }

  // Geocode a place using Nominatim (OpenStreetMap), restricted to Philippines
  private geocodePlaceAndPan(placeName: string): void {
    if (!this.map) return;
    this.isSearching = true;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)},Philippines&format=json&limit=1&countrycodes=ph`;

    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then((results: any[]) => {
        this.isSearching = false;
        if (results && results.length > 0) {
          const { lat, lon, display_name } = results[0];
          const latlng: [number, number] = [parseFloat(lat), parseFloat(lon)];
          this.map?.flyTo(latlng, 13, { animate: true, duration: 1 });
          this.geocodeResult = display_name.split(',')[0];
          this.filteredMarkets = [...this.markets];
        } else {
          this.geocodeResult = '';
        }
      })
      .catch(() => {
        this.isSearching = false;
        this.geocodeResult = '';
      });
  }

  onClearSearch() {
    this.searchQuery = '';
    this.selectedRegion = '';
    this.geocodeResult = '';
    this.isSearching = false;
    this.filteredMarkets = [...this.markets];
    this.selectedMarket = null;
    this.renderMarkers();
    if (this.map) {
      this.map.setView([15.4865, 120.9734], 10);
    }
  }

  // Filter by region / city name chip
  filterByRegion(region: string) {
    this.selectedRegion = region;
    if (!region) {
      this.onClearSearch();
      return;
    }
    this.searchQuery = region;
    const clean = region.toLowerCase();
    this.filteredMarkets = this.markets.filter(m =>
      m.name.toLowerCase().includes(clean) ||
      m.address.toLowerCase().includes(clean) ||
      m.description.toLowerCase().includes(clean)
    );
    this.renderMarkers();
    if (this.filteredMarkets.length > 0 && this.map) {
      const bounds = this.filteredMarkets.map(m => [m.lat, m.lng] as [number, number]);
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 13 });
    }
  }

  getShortMarketName(name: string): string {
    return name
      .replace('Public Market', '')
      .replace("People's Market", '')
      .replace('City', '')
      .trim();
  }

  selectMarket(market: Market, flyToMap: boolean = true) {
    this.selectedMarket = market;
    this.isTrayCollapsed = false;

    if (flyToMap && this.map) {
      this.map.flyTo([market.lat, market.lng], 15, { animate: true, duration: 0.8 });
    }

    const marker = this.marketMarkers.get(market.id);
    if (marker) {
      marker.openPopup();
    }
  }

  // Zoom controls
  zoomIn(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.map) this.map.zoomIn();
  }

  zoomOut(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.map) this.map.zoomOut();
  }

  fitAllMarkers(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.map) return;
    this.selectedMarket = null;
    if (this.filteredMarkets.length > 0) {
      const bounds = this.filteredMarkets.map(m => [m.lat, m.lng] as [number, number]);
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 13 });
    } else {
      this.map.setView([15.4865, 120.9734], 10);
    }
  }

  toggleTray() {
    this.isTrayCollapsed = !this.isTrayCollapsed;
    if (this.map) {
      setTimeout(() => this.map?.invalidateSize(), 300);
    }
  }

  locateMe() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (this.userMarker && this.map) {
          this.map.removeLayer(this.userMarker);
        }
        const userIcon = L.divIcon({
          className: 'user-location-pin',
          html: `
            <div style="
              background-color: #1976d2;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 0 5px rgba(25, 118, 210, 0.35);
            "></div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        this.userMarker = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(this.map!)
          .bindPopup('<strong>📍 You Are Here</strong>')
          .openPopup();
        this.map!.flyTo([latitude, longitude], 14, { animate: true, duration: 1.0 });
      },
      error => {
        let msg = 'Could not get your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser/device.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  viewPrices(market: Market) {
    this.dataService.setSelectedMarket(market);
    this.router.navigate(['/tabs/dashboard'], {
      queryParams: { marketId: market.id, marketName: market.name }
    });
  }

  getOpenCount(): number {
    return this.filteredMarkets.filter(m => m.isOpen).length;
  }

  getClosedCount(): number {
    return this.filteredMarkets.filter(m => !m.isOpen).length;
  }

  hasTimbangan(market: Market): boolean {
    return this.dataService.hasTimbanganNgBayan(market);
  }

  async openTimbanganGuide() {
    const alert = await this.alertCtrl.create({
      header: '⚖️ Gabay sa Timbangan ng Bayan',
      subHeader: 'Proteksyon Laban sa Dayang Timbangan (RA 7394)',
      message: `
        Ano ang Timbangan ng Bayan?
        Ito ay opisyal at government-calibrated na timbangan na makikita sa mga pampublikong palengke. LIBRE itong gamitin ng sinumang mamimili upang suriin ang timbang ng biniling karne, isda, manok, o gulay.

        Paano Gamitin:
        1. Bago umalis sa palengke, dalhin ang pinamili sa Timbangan ng Bayan station.
        2. Tingnan kung tugma ang gramo o kilo sa binayaran.
        3. Kung kulang, agad ipagbigay-alam sa Market Administrator / Bantay Palengke o tumawag sa 1-DTI (1-384).

        Ipinagbabawal ng Republic Act 7394 (Consumer Act) ang paggamit ng depektibo o binagong timbangan.
      `,
      buttons: ['Naiintindihan']
    });
    await alert.present();
  }
}
