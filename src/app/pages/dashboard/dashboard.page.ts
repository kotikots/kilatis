// ============================================================
// src/app/pages/dashboard/dashboard.page.ts
// Controller for the Dashboard / Prices tab.
//
// Features:
//  - Loads commodity data via DataService (HttpClient)
//  - Filters list by search text and category chip selection
//  - Saves/removes items from Watchlist (localStorage)
//  - Triggers Capacitor Haptics on bookmark action
//  - Presents an alert to let the user set a target price
// ============================================================

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DataService, DEFAULT_COMMODITIES, DEFAULT_MARKETS } from '../../services/data.service';
import { Commodity, Market, BasketItem, BagsakanInfo, OverpriceReport } from '../../models/commodity.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {

  // The full list fetched from the JSON file or defaults
  allCommodities: Commodity[] = [...DEFAULT_COMMODITIES];

  // The filtered list bound to the template *ngFor
  filteredCommodities: Commodity[] = [...DEFAULT_COMMODITIES];

  // Monitored markets list for resolving market names
  markets: Market[] = [...DEFAULT_MARKETS];

  // The current value of the search bar input
  searchTerm: string = '';

  // The currently selected category filter ('All' by default)
  selectedCategory: string = 'All';

  // Live map of item quantities in the user's basket
  basketItemCounts: { [commodityId: number]: number } = {};

  // Active Market Filter (either from URL navigation, map click, or search bar)
  selectedMarketFilter: Market | null = null;
  activeDisplayMarket: Market | null = null;
  detectedLocationName: string = '';

  // A distinct list of category names for the filter chips
  categories: string[] = ['All'];

  // Loading state: false by default since default data is instantly available
  isLoading: boolean = false;

  // Trading phase & Bagsakan intelligence
  bagsakanInfo: BagsakanInfo = this.dataService.getBagsakanStatus();
  showBagsakanDetails: boolean = false;

  // Bantay Overpricing & Camera Report Modal
  @ViewChild('cameraFileInput') cameraFileInput?: ElementRef<HTMLInputElement>;
  showReportModal: boolean = false;
  reportingCommodity: Commodity | null = null;
  reportMarketName: string = '';
  reportObservedPrice: number | null = null;
  reportStallInfo: string = '';
  reportPhoto: string | null = null;
  reportIsSubmitting: boolean = false;

  // Hybrid Near Me (GPS) & Aking Palengke (Home Market) State
  userCoords: { lat: number; lng: number } | null = null;
  isGpsActive: boolean = false;
  isLocating: boolean = false;
  nearbyMarketsCache: { market: Market; distanceKm: number }[] = [];
  showMarketPickerModal: boolean = false;
  marketPickerSearch: string = '';
  marketPickerResults: Market[] = [];
  expandedMarketCards: { [commodityId: number]: boolean } = {};
  displayLimit: number = 25;
  private marketPricesCache = new Map<number, any[]>();

  popularLocations: { label: string; city?: string; isGps?: boolean }[] = [
    { label: '📍 Malapit sa Akin', isGps: true },
    { label: 'Gapan', city: 'Gapan' },
    { label: 'Cabanatuan', city: 'Cabanatuan' },
    { label: 'Sangitan', city: 'Sangitan' },
    { label: 'San Jose City', city: 'San Jose' },
    { label: 'Muñoz', city: 'Muñoz' },
    { label: 'Talavera', city: 'Talavera' },
    { label: 'Guimba', city: 'Guimba' },
    { label: 'San Leonardo', city: 'San Leonardo' },
    { label: 'Santa Rosa', city: 'Santa Rosa' },
    { label: 'Bongabon', city: 'Bongabon' },
    { label: 'Zaragoza', city: 'Zaragoza' }
  ];

  constructor(
    private dataService: DataService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.buildCategoryList(this.allCommodities);
    this.loadSavedHomeMarket();
    this.loadCommodities();
    this.loadMarkets();
    this.listenToRouteParams();
    this.listenToSharedMarket();
    this.listenToBasketUpdates();
    this.updateBasketCounts();
  }

  listenToBasketUpdates() {
    this.dataService.basket$.subscribe(() => {
      this.updateBasketCounts();
    });
  }

  listenToSharedMarket() {
    this.dataService.selectedMarket$.subscribe(market => {
      if (market) {
        this.selectedMarketFilter = market;
        this.activeDisplayMarket = market;
        this.detectedLocationName = market.name;
        this.searchTerm = '';
        this.applyFilters();
      }
    });
  }

  listenToRouteParams() {
    this.route.queryParams.subscribe(params => {
      this.handleIncomingParams(params);
    });
  }

  handleIncomingParams(params: any) {
    if (!params || (!params['marketId'] && !params['marketName'])) return;
    const id = parseInt(params['marketId'], 10);
    const marketName = params['marketName'];

    const found = this.markets.find(m =>
      (id && m.id === id) ||
      (marketName && m.name.toLowerCase() === marketName.toLowerCase())
    );

    if (found) {
      this.setMarketFilter(found);
    } else if (marketName) {
      this.setMarketFilter({
        id: id || 9999,
        name: marketName,
        address: 'Monitored Market',
        lat: 0,
        lng: 0,
        operatingHours: '5:00 AM - 7:00 PM',
        description: '',
        isOpen: true
      });
    }
  }

  setMarketFilter(market: Market) {
    if (!market) return;
    this.selectedMarketFilter = market;
    this.activeDisplayMarket = market;
    this.detectedLocationName = market.name;
    this.searchTerm = '';
    this.dataService.setSelectedMarket(market);
    this.applyFilters();
    this.showToast(`📍 Showing accurate prices for ${market.name}`, 'primary');
  }

  clearMarketFilter() {
    this.dataService.setSelectedMarket(null);
    this.selectedMarketFilter = null;
    this.activeDisplayMarket = null;
    this.detectedLocationName = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  ionViewWillEnter() {
    this.loadCommodities();
    this.loadMarkets();
    this.updateBasketCounts();

    const sharedMarket = this.dataService.getSelectedMarket();
    if (sharedMarket) {
      this.setMarketFilter(sharedMarket);
      return;
    }

    const params = {
      ...this.route.root.snapshot.queryParams,
      ...this.router.routerState.snapshot.root.queryParams,
      ...this.route.snapshot.queryParams
    };
    this.handleIncomingParams(params);
  }

  loadMarkets() {
    this.dataService.getMarkets().subscribe({
      next: (markets) => {
        if (markets && markets.length > 0) {
          this.markets = markets;

          const activeMarket = this.selectedMarketFilter || this.dataService.getSelectedMarket();
          if (activeMarket) {
            const found = this.markets.find(m =>
              m.id === Number(activeMarket.id) ||
              m.name.toLowerCase() === activeMarket.name.toLowerCase()
            );
            const resolved = found || activeMarket;
            this.selectedMarketFilter = resolved;
            this.activeDisplayMarket = resolved;
            this.detectedLocationName = resolved.name;
            this.applyFilters();
          } else {
            const params = {
              ...this.route.root.snapshot.queryParams,
              ...this.router.routerState.snapshot.root.queryParams,
              ...this.route.snapshot.queryParams
            };
            this.handleIncomingParams(params);
          }

          // Populate nearby markets relative to user GPS or active market
          this.updateNearbyMarkets();
        }
      }
    });
  }

  loadSavedHomeMarket() {
    try {
      const saved = localStorage.getItem('kilatis_home_market');
      if (saved) {
        const parsed: Market = JSON.parse(saved);
        if (parsed && parsed.name) {
          this.selectedMarketFilter = parsed;
          this.activeDisplayMarket = parsed;
          this.detectedLocationName = parsed.name;
        }
      }
      const savedCoords = localStorage.getItem('kilatis_user_coords');
      if (savedCoords) {
        this.userCoords = JSON.parse(savedCoords);
        this.isGpsActive = true;
      }
    } catch (e) {
      console.warn('Error reading saved location:', e);
    }
  }

  saveHomeMarket(market: Market) {
    try {
      localStorage.setItem('kilatis_home_market', JSON.stringify(market));
    } catch (e) {}
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  updateNearbyMarkets(coords?: { lat: number; lng: number }) {
    if (!this.markets || this.markets.length === 0) return;

    // Determine reference point: coords -> userCoords -> active market -> fallback (Gapan Nueva Ecija: 15.3082, 120.9478)
    let refLat = 15.3082;
    let refLng = 120.9478;

    if (coords && coords.lat && coords.lng) {
      refLat = coords.lat;
      refLng = coords.lng;
    } else if (this.userCoords && this.userCoords.lat && this.userCoords.lng) {
      refLat = this.userCoords.lat;
      refLng = this.userCoords.lng;
    } else if (this.activeDisplayMarket && this.activeDisplayMarket.lat && this.activeDisplayMarket.lng) {
      refLat = this.activeDisplayMarket.lat;
      refLng = this.activeDisplayMarket.lng;
    }

    const calculated: { market: Market; distanceKm: number }[] = [];
    for (const m of this.markets) {
      if (m.lat && m.lng) {
        const d = this.calculateDistance(refLat, refLng, m.lat, m.lng);
        calculated.push({ market: m, distanceKm: d });
      }
    }

    calculated.sort((a, b) => a.distanceKm - b.distanceKm);
    this.nearbyMarketsCache = calculated.slice(0, 30);

    // If no market is active yet, default to the closest one
    if (!this.activeDisplayMarket && this.nearbyMarketsCache.length > 0) {
      const closest = this.nearbyMarketsCache[0].market;
      this.selectedMarketFilter = closest;
      this.activeDisplayMarket = closest;
      this.detectedLocationName = closest.name;
    }
  }

  locateNearMe() {
    if (!navigator.geolocation) {
      this.showToast('Hindi suportado ang GPS sa browser o device na ito.', 'warning');
      return;
    }

    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.isLocating = false;
        this.isGpsActive = true;
        this.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          localStorage.setItem('kilatis_user_coords', JSON.stringify(this.userCoords));
        } catch (e) {}

        this.updateNearbyMarkets(this.userCoords);
        if (this.nearbyMarketsCache.length > 0) {
          const closest = this.nearbyMarketsCache[0].market;
          this.setMarketFilter(closest);
          this.saveHomeMarket(closest);
          this.showToast(`📍 Natukoy ang lokasyon: Malapit sa ${closest.name} (${this.formatDistance(this.nearbyMarketsCache[0].distanceKm)})`, 'success');
        }
      },
      (err) => {
        this.isLocating = false;
        console.warn('Geolocation error:', err);
        this.showToast('Hindi nakuha ang GPS. Piliin ang iyong palengke sa "Aking Palengke".', 'medium');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  openMarketSelector() {
    this.marketPickerSearch = '';
    this.marketPickerResults = this.markets.slice(0, 40);
    this.showMarketPickerModal = true;
  }

  closeMarketSelector() {
    this.showMarketPickerModal = false;
  }

  onMarketPickerSearch(event: any) {
    const q = (event.detail.value || '').trim().toLowerCase();
    this.marketPickerSearch = q;
    if (!q) {
      this.marketPickerResults = this.markets.slice(0, 40);
      return;
    }
    this.marketPickerResults = this.markets.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.address && m.address.toLowerCase().includes(q))
    ).slice(0, 40);
  }

  selectHomeMarket(market: Market) {
    this.setMarketFilter(market);
    this.saveHomeMarket(market);
    if (market.lat && market.lng) {
      this.updateNearbyMarkets({ lat: market.lat, lng: market.lng });
    }
    this.showMarketPickerModal = false;
    this.showToast(`🏬 Itinalaga ang ${market.name} bilang Aking Palengke!`, 'success');
  }

  selectQuickLocation(item: { label: string; city?: string; isGps?: boolean }) {
    if (item.isGps) {
      this.locateNearMe();
      return;
    }
    if (item.city) {
      const cityLower = item.city.toLowerCase();
      const found = this.markets.find(m =>
        m.name.toLowerCase().includes(cityLower) ||
        (m.address && m.address.toLowerCase().includes(cityLower))
      );
      if (found) {
        this.setMarketFilter(found);
        this.saveHomeMarket(found);
        if (found.lat && found.lng) {
          this.updateNearbyMarkets({ lat: found.lat, lng: found.lng });
        }
        this.showToast(`📍 Itinalaga ang palengke: ${found.name}`, 'primary');
      }
    }
  }

  toggleExpandMarkets(commodityId: number) {
    this.expandedMarketCards[commodityId] = !this.expandedMarketCards[commodityId];
  }

  isMarketCardExpanded(commodityId: number): boolean {
    return !!this.expandedMarketCards[commodityId];
  }

  getMarketName(marketId: number): string {
    const found = this.markets.find(m => m.id === marketId);
    return found ? found.name : `Market ${marketId}`;
  }

  loadCommodities() {
    this.dataService.getCommodities().subscribe({
      next: (data: Commodity[]) => {
        if (data && data.length > 0) {
          this.allCommodities = data;
          this.applyFilters();
          this.buildCategoryList(this.allCommodities);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load commodities', err);
        this.isLoading = false;
      }
    });
  }

  buildCategoryList(commodities: Commodity[]) {
    const uniqueCategories = [...new Set(commodities.map(c => c.category))];
    this.categories = ['All', ...uniqueCategories];
  }

  // ----------------------------------------------------------------
  // Called by the ion-searchbar (ionInput event).
  // Supports both commodity name search AND place/market name search.
  // ----------------------------------------------------------------
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.applyFilters();
  }

  // ----------------------------------------------------------------
  // Called when a category chip is tapped.
  // Updates the selected category and re-applies the filters.
  // ----------------------------------------------------------------
  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  // ----------------------------------------------------------------
  // Core filter logic: applies search text, location/market detection,
  // and category filter simultaneously.
  // ----------------------------------------------------------------
  applyFilters() {
    const rawQuery = (this.searchTerm || '').trim().toLowerCase();
    let commodityQuery = rawQuery;

    // Smart location & market detection
    if (rawQuery && this.markets.length > 0) {
      let matched = this.markets.find(m =>
        m.name.toLowerCase().includes(rawQuery) ||
        (m.address && m.address.toLowerCase().includes(rawQuery))
      );

      // Support multi-word queries like "cabanatuan rice" or "gapan tilapia"
      if (!matched && rawQuery.includes(' ')) {
        const tokens = rawQuery.split(/\s+/);
        for (const token of tokens) {
          if (token.length >= 3) {
            const tokenMatch = this.markets.find(m =>
              m.name.toLowerCase().includes(token) ||
              (m.address && m.address.toLowerCase().includes(token))
            );
            if (tokenMatch) {
              matched = tokenMatch;
              commodityQuery = tokens.filter(t => t !== token).join(' ');
              break;
            }
          }
        }
      }

      if (matched) {
        this.selectedMarketFilter = matched;
        this.activeDisplayMarket = matched;
        this.detectedLocationName = matched.name;
        this.dataService.setSelectedMarket(matched);

        // If the query was the market name itself and no commodities have this name,
        // show all commodities for this market instead of 0 results
        const hasCommodityMatch = this.allCommodities.some(c =>
          c.name.toLowerCase().includes(commodityQuery) ||
          c.category.toLowerCase().includes(commodityQuery)
        );

        if (!hasCommodityMatch) {
          commodityQuery = '';
        }
      } else if (this.selectedMarketFilter) {
        // If a market filter is already active, check if query matches the market name
        const selName = this.selectedMarketFilter.name.toLowerCase();
        if (selName.includes(rawQuery)) {
          commodityQuery = '';
        }
        this.activeDisplayMarket = this.selectedMarketFilter;
      } else {
        this.activeDisplayMarket = null;
        this.detectedLocationName = '';
      }
    } else if (this.selectedMarketFilter) {
      this.activeDisplayMarket = this.selectedMarketFilter;
    } else {
      this.activeDisplayMarket = null;
      this.detectedLocationName = '';
    }

    this.filteredCommodities = this.allCommodities.filter(commodity => {
      const matchesSearch = !commodityQuery ||
        commodity.name.toLowerCase().includes(commodityQuery) ||
        commodity.category.toLowerCase().includes(commodityQuery);
      const matchesCategory =
        this.selectedCategory === 'All' || commodity.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });

    this.displayLimit = 25;
    this.marketPricesCache.clear();
  }

  loadMoreCommodities(event: any) {
    this.displayLimit += 25;
    event.target.complete();
  }

  trackByCommodityId(index: number, commodity: Commodity): number {
    return commodity.id;
  }

  // Resolves the price for the actively selected or detected market
  getMarketSpecificPrice(commodity: Commodity): { price: number; lastUpdated: string; isReported: boolean } {
    if (!this.activeDisplayMarket) {
      return { price: this.getLowestPrice(commodity), lastUpdated: 'Multiple Markets', isReported: false };
    }
    return this.dataService.getMarketPrice(commodity, this.activeDisplayMarket);
  }

  // Returns market prices to display on the card, prioritized by physical proximity (Near Me / Aking Palengke)
  getDisplayMarketPrices(commodity: Commodity): {
    marketId: number;
    marketName: string;
    price: number;
    lastUpdated: string;
    isHighlighted: boolean;
    distanceText: string;
    isHome: boolean;
  }[] {
    const isExpanded = !!this.expandedMarketCards[commodity.id];
    const cacheKey = commodity.id * 10 + (isExpanded ? 1 : 0);
    const cached = this.marketPricesCache.get(cacheKey);
    if (cached) return cached;

    const list: {
      marketId: number;
      marketName: string;
      price: number;
      lastUpdated: string;
      isHighlighted: boolean;
      distanceText: string;
      isHome: boolean;
    }[] = [];

    const maxItems = isExpanded ? 8 : 4;

    // 1. If an active display / home market is selected, pin it first
    if (this.activeDisplayMarket) {
      const specific = this.dataService.getMarketPrice(commodity, this.activeDisplayMarket);
      let distStr = 'Aking Palengke';
      if (this.userCoords && this.activeDisplayMarket.lat && this.activeDisplayMarket.lng) {
        const d = this.calculateDistance(
          this.userCoords.lat,
          this.userCoords.lng,
          this.activeDisplayMarket.lat,
          this.activeDisplayMarket.lng
        );
        distStr = this.formatDistance(d);
      }
      list.push({
        marketId: this.activeDisplayMarket.id,
        marketName: this.activeDisplayMarket.name,
        price: specific.price,
        lastUpdated: specific.lastUpdated,
        isHighlighted: true,
        distanceText: distStr,
        isHome: true
      });
    }

    // 2. Add physically closest markets from nearbyMarketsCache
    if (this.nearbyMarketsCache.length > 0) {
      for (const item of this.nearbyMarketsCache) {
        if (this.activeDisplayMarket && Number(item.market.id) === Number(this.activeDisplayMarket.id)) {
          continue;
        }
        const priceInfo = this.dataService.getMarketPrice(commodity, item.market);
        list.push({
          marketId: item.market.id,
          marketName: item.market.name,
          price: priceInfo.price,
          lastUpdated: priceInfo.lastUpdated,
          isHighlighted: false,
          distanceText: this.formatDistance(item.distanceKm),
          isHome: false
        });

        if (list.length >= maxItems) break;
      }
    } else if (commodity.prices) {
      // Fallback
      for (const p of commodity.prices) {
        if (this.activeDisplayMarket && Number(p.marketId) === Number(this.activeDisplayMarket.id)) continue;
        list.push({
          marketId: p.marketId,
          marketName: this.getMarketName(p.marketId),
          price: p.price,
          lastUpdated: p.lastUpdated,
          isHighlighted: false,
          distanceText: '',
          isHome: false
        });
        if (list.length >= maxItems) break;
      }
    }

    this.marketPricesCache.set(cacheKey, list);
    return list;
  }
  // all markets for a given commodity.
  // ----------------------------------------------------------------
  getLowestPrice(commodity: Commodity): number {
    return this.dataService.getLowestPrice(commodity);
  }

  // ----------------------------------------------------------------
  // Delegate to DataService helper: gets the highest price.
  // ----------------------------------------------------------------
  getHighestPrice(commodity: Commodity): number {
    return this.dataService.getHighestPrice(commodity);
  }

  // ----------------------------------------------------------------
  // Delegate to DataService helper: checks if the lowest price
  // exceeds the government SRP (Suggested Retail Price).
  // ----------------------------------------------------------------
  isOverSRP(commodity: Commodity): boolean {
    return this.dataService.isOverSRP(commodity);
  }

  // ----------------------------------------------------------------
  // Delegate to DataService: checks if an item is on the Watchlist.
  // Used in the template to show the filled or outline bookmark icon.
  // ----------------------------------------------------------------
  isWatched(commodity: Commodity): boolean {
    return this.dataService.isInWatchlist(commodity.id);
  }

  // ----------------------------------------------------------------
  // Called when the user taps the bookmark icon on a commodity card.
  //
  // If already watched: removes it immediately.
  // If not watched: shows an Alert asking for the user's target price,
  // then saves the item with that price to the Watchlist.
  //
  // Also triggers Capacitor Haptics for tactile feedback.
  // ----------------------------------------------------------------
  async toggleWatchlist(commodity: Commodity) {

    if (this.isWatched(commodity)) {
      // --- REMOVE from watchlist ---
      this.dataService.removeFromWatchlist(commodity.id);
      await this.triggerHaptic();
      this.showToast(`${commodity.name} removed from Watchlist.`, 'warning');

    } else {
      // --- PROMPT for target price, then ADD to watchlist ---
      const alert = await this.alertCtrl.create({
        header: 'Set Price Alert',
        subHeader: `${commodity.name}`,
        message: `Current best price: ₱${this.getLowestPrice(commodity).toFixed(2)}/${commodity.unit}. Set your target price to track.`,
        inputs: [
          {
            name: 'targetPrice',
            type: 'number',
            placeholder: 'Enter your target price (₱)',
            // Pre-fill with the current lowest price as a suggestion
            value: this.getLowestPrice(commodity)
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Save to Watchlist',
            handler: async (data) => {
              const targetPrice = parseFloat(data.targetPrice);

              // Validate that the user entered a number
              if (isNaN(targetPrice) || targetPrice <= 0) {
                this.showToast('Please enter a valid price.', 'danger');
                return false; // Keep the alert open
              }

              // Save to localStorage via DataService
              const saved = this.dataService.saveToWatchlist(commodity, targetPrice);

              if (saved) {
                // Trigger a physical vibration on the device
                await this.triggerHaptic();
                this.showToast(`${commodity.name} added to Watchlist! 🔖`, 'success');
              } else {
                this.showToast('Item is already in your Watchlist.', 'warning');
              }
              return true; // Close the alert
            }
          }
        ]
      });

      await alert.present();
    }
  }

  // ----------------------------------------------------------------
  // BASKET CALCULATOR INTEGRATION
  // Quick-add commodities directly from the price list to the Basket.
  // ----------------------------------------------------------------
  updateBasketCounts() {
    try {
      const basket = this.dataService.getBasket();
      const counts: { [id: number]: number } = {};
      if (Array.isArray(basket)) {
        for (const item of basket) {
          counts[item.commodityId] = (counts[item.commodityId] || 0) + (item.quantity || 1);
        }
      }
      this.basketItemCounts = counts;
    } catch {
      this.basketItemCounts = {};
    }
  }

  getBasketCount(commodityId: number): number {
    return this.basketItemCounts[commodityId] || 0;
  }

  async addToBasket(commodity: Commodity) {
    try {
      const targetMarket = this.selectedMarketFilter || this.activeDisplayMarket;
      this.dataService.addToBasket(commodity, targetMarket, 1);
      this.updateBasketCounts();
      await this.triggerHaptic();

      const count = this.getBasketCount(commodity.id);
      const toast = await this.toastCtrl.create({
        message: `🛒 Idinagdag ang ${commodity.name} (${count}x) sa Basket!`,
        duration: 3500,
        color: 'success',
        position: 'top',
        buttons: [
          {
            side: 'end',
            text: 'Buksan ang Basket',
            role: 'info',
            handler: () => {
              this.router.navigate(['/tabs/basket']);
            }
          }
        ]
      });
      await toast.present();
    } catch (e) {
      console.error('Failed to add to basket', e);
    }
  }

  // ----------------------------------------------------------------
  // PULL-TO-REFRESH & ONLINE WEB SYNC
  // Fetches latest prices from online web feed or baseline.
  // ----------------------------------------------------------------
  handleRefresh(event: any) {
    this.syncOnlinePrices(event);
  }

  async syncOnlinePrices(event?: any) {
    this.dataService.syncOnlinePrices().subscribe({
      next: (items) => {
        this.allCommodities = items;
        this.applyFilters();
        this.buildCategoryList(this.allCommodities);
        this.showToast(`🌐 Live web sync complete! ${items.length} commodities updated.`, 'success');
        if (event) event.target.complete();
      },
      error: (err) => {
        console.warn('Online sync failed, retaining current data:', err);
        this.showToast('Using latest cached price guide.', 'medium');
        if (event) event.target.complete();
      }
    });
  }

  // ----------------------------------------------------------------
  // BANTAY OVERPRICING & CAMERA EVIDENCE REPORTING
  // Allows shoppers/vendors to report on-the-ground prices with photo/receipt evidence.
  // ----------------------------------------------------------------
  openReportPriceModal(commodity: Commodity) {
    this.reportingCommodity = commodity;
    this.reportMarketName = this.activeDisplayMarket?.name
      || this.selectedMarketFilter?.name
      || (this.markets.length > 0 ? this.markets[0].name : 'Gapan City Public Market');
    this.reportObservedPrice = null;
    this.reportStallInfo = '';
    this.reportPhoto = null;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.reportingCommodity = null;
    this.reportPhoto = null;
    this.reportObservedPrice = null;
    this.reportStallInfo = '';
  }

  /**
   * Activates Camera or Gallery via Capacitor Camera with fallback to file input
   */
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Ebidensya ng Presyo',
        promptLabelPhoto: 'Pumili sa Gallery',
        promptLabelPicture: 'Kuhanan gamit ang Camera'
      });

      if (image && image.dataUrl) {
        this.reportPhoto = image.dataUrl;
        await this.triggerHaptic();
      }
    } catch (err) {
      console.warn('Capacitor camera dismissed or web fallback needed:', err);
      this.triggerFileInput();
    }
  }

  triggerFileInput() {
    if (this.cameraFileInput && this.cameraFileInput.nativeElement) {
      this.cameraFileInput.nativeElement.click();
    }
  }

  onPhotoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.reportPhoto = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.reportPhoto = null;
    if (this.cameraFileInput && this.cameraFileInput.nativeElement) {
      this.cameraFileInput.nativeElement.value = '';
    }
  }

  getReportOverpriceStatus(): { isOverpriced: boolean; percent: number; diff: number } | null {
    if (!this.reportingCommodity || !this.reportObservedPrice || this.reportObservedPrice <= 0) {
      return null;
    }
    const srp = this.reportingCommodity.suggestedRetailPrice;
    const diff = +(this.reportObservedPrice - srp).toFixed(2);
    const percent = Math.round((diff / srp) * 100);
    return {
      isOverpriced: diff > (srp * 0.1), // >10% over SRP
      percent,
      diff
    };
  }

  async submitPriceReport() {
    if (!this.reportingCommodity) return;

    const price = Number(this.reportObservedPrice);
    if (!price || isNaN(price) || price <= 0) {
      this.showToast('Pakilagay ang wastong presyo sa ₱.', 'warning');
      return;
    }

    const marketName = (this.reportMarketName || '').trim() || 'Local Public Market';
    const market = this.dataService.findOrCreateMarket(marketName);

    // Save reported price into the system database
    const success = this.dataService.reportMarketPrice(this.reportingCommodity.id, market.id, price);

    if (success) {
      const status = this.getReportOverpriceStatus();
      const report: OverpriceReport = {
        id: 'rep_' + Date.now(),
        commodityId: this.reportingCommodity.id,
        commodityName: this.reportingCommodity.name,
        marketId: market.id,
        marketName: market.name,
        price,
        srp: this.reportingCommodity.suggestedRetailPrice,
        isOverpriced: !!status?.isOverpriced,
        overpricePercent: status ? status.percent : 0,
        photoDataUrl: this.reportPhoto || undefined,
        stallInfo: this.reportStallInfo ? this.reportStallInfo.trim() : undefined,
        date: new Date().toISOString()
      };

      this.dataService.saveOverpriceReport(report);

      await this.triggerHaptic();
      this.loadCommodities();
      this.loadMarkets();

      const photoMsg = this.reportPhoto ? ' Kalakip ang litrato ng ebidensya!' : '';
      this.showToast(
        `✅ Naitala ang report para sa ${market.name}: ₱${price.toFixed(2)}/${this.reportingCommodity.unit}.${photoMsg}`,
        'success'
      );

      this.closeReportModal();
    } else {
      this.showToast('Hindi na-save ang price report. Pakisubukang muli.', 'danger');
    }
  }

  async saveReportedPrice(commodity: Commodity, marketName: string, price: number) {
    // Match existing market or add a new one
    const market = this.dataService.findOrCreateMarket(marketName);

    // Save reported price
    const success = this.dataService.reportMarketPrice(commodity.id, market.id, price);

    if (success) {
      await this.triggerHaptic();
      // Reload commodities and markets to reflect update in real-time
      this.loadCommodities();
      this.loadMarkets();
      this.showToast(
        `✅ Price reported! ${market.name}: ₱${price.toFixed(2)}/${commodity.unit} for ${commodity.name}.`,
        'success'
      );
    } else {
      this.showToast('Failed to save price report.', 'danger');
    }
  }

  toggleBagsakanDetails() {
    this.showBagsakanDetails = !this.showBagsakanDetails;
  }

  // ----------------------------------------------------------------
  // BANTAY OVERPRICING: Flags commodities selling >10% over DA SRP
  // ----------------------------------------------------------------
  checkCommodityOverpricing(commodity: Commodity): { isOverpriced: boolean; percent: number; diff: number; currentPrice: number } {
    const market = this.selectedMarketFilter || this.activeDisplayMarket;
    const currentPrice = market
      ? this.getMarketSpecificPrice(commodity).price
      : (commodity.prices && commodity.prices.length > 0 ? commodity.prices[0].price : commodity.suggestedRetailPrice);

    const srp = commodity.suggestedRetailPrice;
    const check = this.dataService.checkOverpricing(currentPrice, srp);
    return {
      ...check,
      currentPrice
    };
  }

  // ----------------------------------------------------------------
  // DTI / DA VIOLATION & HOTLINE REPORTER
  // Direct hotlines to DTI Consumer Care (1-384 / 1-DTI) & DA Bantay Presyo
  // ----------------------------------------------------------------
  async openDtiHotlineModal(commodity?: Commodity) {
    const targetMarketName = (this.selectedMarketFilter || this.activeDisplayMarket)?.name || 'Local Public Market';
    const itemName = commodity ? commodity.name : 'Staple Commodity';
    const srp = commodity ? `₱${commodity.suggestedRetailPrice}/${commodity.unit}` : 'DA SRP';

    const alert = await this.alertCtrl.create({
      header: '⚖️ Bantay Presyo & DTI Hotline',
      subHeader: commodity ? `I-report ang overpricing sa: ${itemName}` : 'Official Consumer Assistance',
      message: `
        DTI Consumer Hotline: 1-DTI (1-384)
        DA Bantay Presyo: (02) 8928-8741
        Email: consumercare@dti.gov.ph

        Sa ilalim ng Republic Act 7581 (Price Act), ipinagbabawal ang hindi makatarungang pagtaas ng presyo (profiteering).
      `,
      buttons: [
        {
          text: 'Isara',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // ----------------------------------------------------------------
  // Uses the Capacitor Haptics plugin to create a medium-strength
  // vibration ("MEDIUM" impact). This provides tactile confirmation
  // that a save/remove action was performed.
  //
  // Note: Haptics only work on a physical device (Android/iOS).
  // In a browser, the error is caught and silently ignored.
  // ----------------------------------------------------------------
  async triggerHaptic() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Haptics unavailable in browser/emulator — this is expected
      console.warn('Haptics not available on this platform:', error);
    }
  }

  // ----------------------------------------------------------------
  // Helper to display a brief toast notification at the bottom
  // of the screen. The color parameter controls the toast style.
  // ----------------------------------------------------------------
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'
    });
    await toast.present();
  }
}
