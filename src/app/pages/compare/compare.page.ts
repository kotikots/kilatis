import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, DEFAULT_COMMODITIES, DEFAULT_MARKETS } from '../../services/data.service';
import { Commodity, Market, BasketItem } from '../../models/commodity.model';
import { ToastController } from '@ionic/angular';

export interface CompareRow {
  commodityName: string;
  unit: string;
  quantity: number;
  prices: (number | null)[];
  cheapestIndex: number;
}

@Component({
  selector: 'app-compare',
  templateUrl: './compare.page.html',
  styleUrls: ['./compare.page.scss'],
  standalone: false
})
export class ComparePage implements OnInit {
  allCommodities: Commodity[] = [...DEFAULT_COMMODITIES];
  allMarkets: Market[] = [...DEFAULT_MARKETS];

  // Dynamic number of market slots – starts at 2, user can add more
  numSlots = 2;
  selectedMarkets: (Market | null)[] = [
    DEFAULT_MARKETS[0] || null,
    DEFAULT_MARKETS[1] || null
  ];
  marketSearches: string[] = [
    DEFAULT_MARKETS[0]?.name || '',
    DEFAULT_MARKETS[1]?.name || ''
  ];
  marketResultsList: Market[][] = [[], []];
  showMarketResultsList: boolean[] = [false, false];

  get slotIndices(): number[] {
    return Array.from({ length: this.numSlots }, (_, i) => i);
  }

  addSlot() {
    if (this.numSlots >= 5) return; // hard cap at 5
    this.numSlots++;
    this.selectedMarkets.push(null);
    this.marketSearches.push('');
    this.marketResultsList.push([]);
    this.showMarketResultsList.push(false);
  }

  // Items to compare
  compareItems: BasketItem[] = [];

  // Item search
  itemSearch = '';
  itemResults: Commodity[] = [];
  showItemResults = false;

  // Quick staple suggestions for 1-tap comparison additions
  quickSuggestions = [
    'Whole Dressed Chicken',
    'Pork Liempo',
    'Tilapia',
    'Kamatis (Tomato)',
    'Sibuyas (Onion)',
    'Chicken Egg (Medium)'
  ];

  // Comparison results
  compareRows: CompareRow[] = [];
  marketTotals: number[] = [];
  cheapestMarketIndex = -1;

  constructor(
    private dataService: DataService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
    this.listenToBasketUpdates();
  }

  listenToBasketUpdates() {
    this.dataService.basket$.subscribe(items => {
      if (items && items.length > 0) {
        this.loadBasketItems(false);
        this.refreshComparison();
      }
    });
  }

  ionViewWillEnter() {
    this.loadBasketItems(false);
    this.refreshComparison();
  }

  loadData() {
    this.dataService.getCommodities().subscribe(c => {
      if (c && c.length > 0) {
        this.allCommodities = c;
      }
      this.refreshComparison();
    });
    this.dataService.getMarkets().subscribe(m => {
      if (m && m.length > 0) {
        this.allMarkets = m;
        // Preselect default markets if none selected
        if (!this.selectedMarkets[0] && m.length > 0) {
          this.selectedMarkets[0] = m[0];
          this.marketSearches[0] = m[0].name;
        }
        if (!this.selectedMarkets[1] && m.length > 1) {
          this.selectedMarkets[1] = m[1];
          this.marketSearches[1] = m[1].name;
        }
      }
      this.refreshComparison();
    });
  }

  loadBasketItems(forceSync = false) {
    try {
      let parsed = this.dataService.getBasket();
      if (!parsed || parsed.length === 0) {
        const saved = localStorage.getItem('palengke_basket');
        parsed = saved ? JSON.parse(saved) : [];
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        if (this.compareItems.length === 0 || forceSync) {
          this.compareItems = [...parsed];
        } else {
          // Merge basket items into compareItems without duplicates
          parsed.forEach(b => {
            const existing = this.compareItems.find(c =>
              (b.commodityId && Number(c.commodityId) === Number(b.commodityId)) ||
              c.commodityName.trim().toLowerCase() === b.commodityName.trim().toLowerCase()
            );
            if (existing) {
              existing.quantity = b.quantity;
            } else {
              this.compareItems.push(b);
            }
          });
        }
      }
    } catch {
      // fallback
    }

    // If still empty, seed default staples
    if (this.compareItems.length === 0 && this.allCommodities.length > 0) {
      this.seedDefaultStaples();
    }
  }

  seedDefaultStaples() {
    const staples = ['Well-Milled Local Rice', 'Whole Dressed Chicken', 'Pork Liempo', 'Galunggong (Round Scad)', 'Kamatis (Tomato)'];
    staples.forEach(name => {
      const match = this.resolveCommodity({ commodityName: name } as BasketItem);
      if (match) {
        this.compareItems.push({
          commodityId: match.id,
          commodityName: match.name,
          quantity: 1,
          unit: match.unit,
          icon: match.icon,
          pricePerUnit: match.suggestedRetailPrice
        });
      }
    });
  }

  // === MARKET SELECTION ===
  onMarketSearch(slot: number, event?: any) {
    let q = '';
    if (event && event.detail && typeof event.detail.value === 'string') {
      q = event.detail.value;
    } else if (event && event.target && typeof event.target.value === 'string') {
      q = event.target.value;
    } else {
      q = this.marketSearches[slot] || '';
    }
    this.marketSearches[slot] = q;

    const clean = q.trim().toLowerCase();
    if (!clean) {
      this.marketResultsList[slot] = [];
      this.showMarketResultsList[slot] = false;
      return;
    }
    this.marketResultsList[slot] = this.allMarkets
      .filter(m => m.name.toLowerCase().includes(clean) || m.address.toLowerCase().includes(clean))
      .slice(0, 6);
    this.showMarketResultsList[slot] = true;
  }

  selectMarket(slot: number, market: Market) {
    this.selectedMarkets[slot] = market;
    this.marketSearches[slot] = market.name;
    this.showMarketResultsList[slot] = false;
    this.refreshComparison();
  }

  clearMarket(slot: number) {
    this.selectedMarkets[slot] = null;
    this.marketSearches[slot] = '';
    this.showMarketResultsList[slot] = false;
    this.refreshComparison();
  }

  hideMarketSearch(slot: number) {
    setTimeout(() => {
      this.showMarketResultsList[slot] = false;
    }, 250);
  }

  // === ITEM MANAGEMENT ===
  onItemSearch(event?: any) {
    let q = '';
    if (event && event.detail && typeof event.detail.value === 'string') {
      q = event.detail.value;
    } else if (event && event.target && typeof event.target.value === 'string') {
      q = event.target.value;
    } else {
      q = this.itemSearch || '';
    }
    this.itemSearch = q;

    const clean = q.trim().toLowerCase();
    if (!clean) {
      this.itemResults = [];
      this.showItemResults = false;
      return;
    }

    if (!this.allCommodities || this.allCommodities.length === 0) {
      this.allCommodities = [...DEFAULT_COMMODITIES];
    }

    this.itemResults = this.allCommodities
      .filter(c =>
        c.name.toLowerCase().includes(clean) ||
        c.category.toLowerCase().includes(clean)
      )
      .slice(0, 8);
    this.showItemResults = this.itemResults.length > 0;
  }

  onItemSearchEnter() {
    if (this.itemResults && this.itemResults.length > 0) {
      this.addItem(this.itemResults[0]);
    }
  }

  clearItemSearch() {
    this.itemSearch = '';
    this.itemResults = [];
    this.showItemResults = false;
  }

  addItem(c: Commodity) {
    const existing = this.compareItems.find(i =>
      Number(i.commodityId) === Number(c.id) ||
      i.commodityName.trim().toLowerCase() === c.name.trim().toLowerCase()
    );

    if (existing) {
      existing.quantity = +(existing.quantity + 1).toFixed(2);
      this.showToast(`Dinagdagan ang dami ng ${c.name} (${existing.quantity} ${existing.unit})`);
    } else {
      this.compareItems.push({
        commodityId: c.id,
        commodityName: c.name,
        quantity: 1,
        unit: c.unit,
        icon: c.icon || 'basket-outline',
        pricePerUnit: c.suggestedRetailPrice
      });
      this.showToast(`Idinagdag ang ${c.name} sa paghahambing!`);
    }
    this.itemSearch = '';
    this.itemResults = [];
    this.showItemResults = false;
    this.refreshComparison();
  }

  addQuickStaple(name: string) {
    const match = this.allCommodities.find(c =>
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    );
    if (match) {
      this.addItem(match);
    } else {
      const existing = this.compareItems.find(i => i.commodityName.toLowerCase().includes(name.toLowerCase()));
      if (existing) {
        existing.quantity = +(existing.quantity + 1).toFixed(2);
        this.showToast(`Dinagdagan ang dami ng ${name} (${existing.quantity} ${existing.unit})`);
      } else {
        this.compareItems.push({
          commodityId: 9980 + Math.floor(Math.random() * 15),
          commodityName: name,
          quantity: 1,
          unit: 'kg',
          icon: 'basket-outline',
          pricePerUnit: 180
        });
        this.showToast(`Idinagdag ang ${name} sa paghahambing!`);
      }
      this.refreshComparison();
    }
  }

  removeItem(index: number) {
    this.compareItems.splice(index, 1);
    this.refreshComparison();
  }

  async loadFromBasket() {
    try {
      // 1. Try in-memory dataService basket
      let parsed = this.dataService.getBasket();
      // 2. Fallback to localStorage
      if (!parsed || parsed.length === 0) {
        const saved = localStorage.getItem('palengke_basket');
        parsed = saved ? JSON.parse(saved) : [];
      }

      if (parsed && parsed.length > 0) {
        this.compareItems = [...parsed];
        this.refreshComparison();
        this.showToast(`Nai-load ang ${parsed.length} paninda mula sa iyong Basket`, 'success');
      } else {
        this.showToast('Walang laman ang Basket sa ngayon', 'warning');
      }
    } catch {
      // fallback
    }
  }

  private async showToast(message: string, color = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1800,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  getActiveMarkets(): Market[] {
    return this.selectedMarkets.filter((m): m is Market => m !== null);
  }

  get winningMarket(): Market | null {
    const active = this.getActiveMarkets();
    if (this.cheapestMarketIndex >= 0 && this.cheapestMarketIndex < active.length) {
      return active[this.cheapestMarketIndex];
    }
    return null;
  }

  get winningTotal(): number {
    if (this.cheapestMarketIndex >= 0 && this.cheapestMarketIndex < this.marketTotals.length) {
      return this.marketTotals[this.cheapestMarketIndex] || 0;
    }
    return 0;
  }

  /**
   * Resiliently finds the matching commodity in the catalog using ID,
   * exact name, clean name, word tokens, and keyword fallback (e.g. Whole Chicken -> Whole Dressed Chicken).
   */
  resolveCommodity(item: BasketItem): Commodity | undefined {
    if (!this.allCommodities || this.allCommodities.length === 0) {
      this.allCommodities = [...DEFAULT_COMMODITIES];
    }

    // 1. By ID (numeric or string)
    if (item.commodityId !== undefined && item.commodityId !== null) {
      const byId = this.allCommodities.find(c => Number(c.id) === Number(item.commodityId));
      if (byId) return byId;
    }

    const rawName = (item.commodityName || '').toLowerCase().trim();
    if (!rawName) return undefined;

    // 2. Exact match
    const byExact = this.allCommodities.find(c => c.name.toLowerCase().trim() === rawName);
    if (byExact) return byExact;

    // 3. Clean name without parentheses
    const cleanTarget = rawName.split('(')[0].trim();
    const byClean = this.allCommodities.find(c => {
      const cClean = c.name.toLowerCase().split('(')[0].trim();
      return cClean === cleanTarget || cClean.includes(cleanTarget) || cleanTarget.includes(cClean);
    });
    if (byClean) return byClean;

    // 4. Word tokens (e.g. 'whole chicken' -> 'whole dressed chicken')
    const tokens = cleanTarget.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length > 0) {
      const byTokens = this.allCommodities.find(c => {
        const cClean = c.name.toLowerCase();
        return tokens.every(token => cClean.includes(token));
      });
      if (byTokens) return byTokens;
    }

    // 5. Keyword fallback for poultry / chicken
    if (rawName.includes('chicken') || rawName.includes('manok')) {
      const poultry = this.allCommodities.find(c =>
        c.name.toLowerCase().includes('chicken') || c.category.toLowerCase().includes('poultry')
      );
      if (poultry) return poultry;
    }

    return undefined;
  }

  refreshComparison() {
    const activeMarkets = this.getActiveMarkets();
    if (activeMarkets.length === 0 || this.compareItems.length === 0) {
      this.compareRows = [];
      this.marketTotals = [];
      this.cheapestMarketIndex = -1;
      return;
    }

    this.compareRows = this.compareItems.map(item => {
      const commodity = this.resolveCommodity(item);

      const prices = activeMarkets.map(m => {
        if (commodity) {
          return this.dataService.getMarketPrice(commodity, m).price;
        }
        // Fallback realistic price so item always participates in calculations
        const base = item.pricePerUnit || 150;
        const variance = (((m.id * 31 + (Number(item.commodityId) || 1) * 17) % 15) - 7) / 100;
        const calculated = Math.round((base + base * variance) * 2) / 2;
        return calculated > 0 ? calculated : base;
      });

      const validPrices = prices.filter((p): p is number => p !== null);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      const cheapestIndex = prices.indexOf(minPrice);

      return {
        commodityName: item.commodityName,
        unit: item.unit || 'kg',
        quantity: item.quantity || 1,
        prices,
        cheapestIndex
      };
    });

    // Compute total per market
    this.marketTotals = activeMarkets.map((_, mi) => {
      return this.compareRows.reduce((sum, row) => {
        const price = row.prices[mi];
        return sum + (price !== null ? price * row.quantity : 0);
      }, 0);
    });

    if (this.marketTotals.length > 0) {
      const minTotal = Math.min(...this.marketTotals);
      this.cheapestMarketIndex = this.marketTotals.indexOf(minTotal);
    } else {
      this.cheapestMarketIndex = -1;
    }
  }

  goToMarketOnMap(market: Market) {
    this.router.navigate(['/tabs/map'], {
      queryParams: {
        marketId: market.id,
        marketName: market.name
      }
    });
  }
}
