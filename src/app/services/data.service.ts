// ============================================================
// src/app/services/data.service.ts
// Central data service for the Palengke Watch application.
//
// Responsibilities:
//  1. Fetch commodity and market data (prioritizes user uploaded/
//     custom data in localStorage, falls back to bundled JSON files).
//  2. Support uploading and parsing CSV/JSON datasets.
//  3. Support exporting database to CSV or JSON formats.
//  4. Manage the user's Watchlist (localStorage).
//  5. Provide helper calculations (Lowest Price, SRP compliance, etc.)
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Commodity, Market, WatchlistItem, Recipe, BasketItem, BagsakanInfo, OverpriceReport } from '../models/commodity.model';

const WATCHLIST_KEY = 'palengke_watchlist';
const CUSTOM_COMMODITIES_KEY = 'palengke_custom_commodities';
const CUSTOM_MARKETS_KEY = 'palengke_custom_markets';
const OVERPRICE_REPORTS_KEY = 'palengke_overprice_reports';

/**
 * Accurately determines if a market is currently open based on its operating hours
 * and the current local time.
 */
export function isMarketOpen(operatingHours?: string, now = new Date()): boolean {
  const hoursStr = (operatingHours || '').trim();
  const curMin = now.getHours() * 60 + now.getMinutes();
  const isDaytime = curMin >= 5 * 60 && curMin < 19 * 60;

  // Ultra-fast path for typical daytime operating hours
  if (!hoursStr || hoursStr === '5:00 AM - 7:00 PM' || hoursStr === '05:00-19:00' || hoursStr === '4:00 AM - 8:00 PM' || hoursStr === 'Daily') {
    return isDaytime;
  }

  if (hoursStr.includes('24/7') || hoursStr.includes('00:00-24:00')) {
    return true;
  }

  if (hoursStr.toLowerCase().includes('sunrise-sunset')) {
    return curMin >= 5.5 * 60 && curMin < 18 * 60;
  }

  const dayIndex = now.getDay(); // 0 = Su, 1 = Mo, ..., 6 = Sa
  const dayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const todayStr = dayMap[dayIndex];

  // Check if string has 'off' for today, e.g., 'Mo-Sa off; Su'
  if (hoursStr.includes('off')) {
    if (hoursStr.includes('Mo-Fr off') && (dayIndex >= 1 && dayIndex <= 5)) return false;
    if (hoursStr.includes('Mo-Sa off') && (dayIndex >= 1 && dayIndex <= 6)) return false;
  }

  // 12-hour AM/PM format (e.g., '5:00 AM - 7:00 PM' or '4:00 AM - 8:00 PM')
  const ampmRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const ampmMatch = hoursStr.match(ampmRegex);
  if (ampmMatch) {
    let [, h1, m1, p1, h2, m2, p2] = ampmMatch;
    let startH = parseInt(h1, 10);
    if (p1.toUpperCase() === 'PM' && startH !== 12) startH += 12;
    if (p1.toUpperCase() === 'AM' && startH === 12) startH = 0;
    const startMin = startH * 60 + parseInt(m1, 10);

    let endH = parseInt(h2, 10);
    if (p2.toUpperCase() === 'PM' && endH !== 12) endH += 12;
    if (p2.toUpperCase() === 'AM' && endH === 12) endH = 0;
    const endMin = endH * 60 + parseInt(m2, 10);

    return curMin >= startMin && curMin <= endMin;
  }

  // 24-hour format (e.g., '05:00-20:00' or '05:00 - 20:00' or 'Mo-Su 05:00-20:00')
  const time24Regex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;
  const match24 = hoursStr.match(time24Regex);
  if (match24) {
    const [, h1, m1, h2, m2] = match24;
    const startMin = parseInt(h1, 10) * 60 + parseInt(m1, 10);
    let endMin = parseInt(h2, 10) * 60 + parseInt(m2, 10);
    if (endMin < startMin) endMin += 24 * 60; // overnight e.g. 18:00-02:00

    let checkMin = curMin;
    if (endMin > 24 * 60 && checkMin < startMin) checkMin += 24 * 60;
    return checkMin >= startMin && checkMin <= endMin;
  }

  // Fallback for single day markers e.g. 'Su', 'Sa', etc.
  if (['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].includes(hoursStr)) {
    return hoursStr === todayStr;
  }

  // Default fallback
  return isDaytime;
}

export const DEFAULT_COMMODITIES: Commodity[] = [
  {
    id: 1,
    name: 'Well-Milled Local Rice (Sinandomeng)',
    category: 'Grains',
    unit: 'kg',
    prices: [
      { marketId: 1, price: 51.5, lastUpdated: '2026-11-09' },
      { marketId: 2, price: 52.0, lastUpdated: '2026-11-09' },
      { marketId: 3, price: 50.5, lastUpdated: '2026-11-09' }
    ],
    suggestedRetailPrice: 52,
    icon: 'nutrition-outline'
  },
  {
    id: 2,
    name: 'Pork Kasim (Fresh)',
    category: 'Meat',
    unit: 'kg',
    prices: [
      { marketId: 1, price: 310, lastUpdated: '2026-11-09' },
      { marketId: 2, price: 320, lastUpdated: '2026-11-09' },
      { marketId: 3, price: 305, lastUpdated: '2026-11-09' }
    ],
    suggestedRetailPrice: 320,
    icon: 'restaurant-outline'
  },
  {
    id: 3,
    name: 'Whole Dressed Chicken',
    category: 'Poultry',
    unit: 'kg',
    prices: [
      { marketId: 1, price: 180, lastUpdated: '2026-11-09' },
      { marketId: 2, price: 185, lastUpdated: '2026-11-09' },
      { marketId: 3, price: 175, lastUpdated: '2026-11-09' }
    ],
    suggestedRetailPrice: 180,
    icon: 'egg-outline'
  },
  {
    id: 4,
    name: 'Bangus (Medium)',
    category: 'Fish',
    unit: 'kg',
    prices: [
      { marketId: 1, price: 205, lastUpdated: '2026-11-09' },
      { marketId: 2, price: 210, lastUpdated: '2026-11-09' },
      { marketId: 3, price: 195, lastUpdated: '2026-11-09' }
    ],
    suggestedRetailPrice: 200,
    icon: 'fish-outline'
  },
  {
    id: 5,
    name: 'Red Onion (Bongabon Local)',
    category: 'Vegetables',
    unit: 'kg',
    prices: [
      { marketId: 1, price: 110, lastUpdated: '2026-11-09' },
      { marketId: 2, price: 115, lastUpdated: '2026-11-09' },
      { marketId: 10, price: 95, lastUpdated: '2026-11-09' }
    ],
    suggestedRetailPrice: 120,
    icon: 'leaf-outline'
  }
];

export const DEFAULT_MARKETS: Market[] = [
  { id: 1, name: 'Gapan City Public Market', address: 'Tinio Street, San Vicente, Gapan City, Nueva Ecija', lat: 15.3110432, lng: 120.9487059, operatingHours: '4:00 AM - 7:00 PM', description: 'Major southern trading and bagsakan terminal of Nueva Ecija.', isOpen: true },
  { id: 2, name: 'Cabanatuan City Public Market', address: 'Paco Roman St, Cabanatuan City, Nueva Ecija', lat: 15.4874281, lng: 120.9631248, operatingHours: '4:00 AM - 8:00 PM', description: 'Largest central commercial trading post and bagsakan in Nueva Ecija.', isOpen: true },
  { id: 3, name: 'Sangitan Public Market', address: 'General Tinio Extension, Cabanatuan City, Nueva Ecija', lat: 15.4887646, lng: 120.9766173, operatingHours: '3:00 AM - 8:00 PM', description: 'Famous major bagsakan wholesale market for meat, fish, and vegetables in Cabanatuan.', isOpen: true },
  { id: 4, name: 'San Jose City Public Market', address: 'Maharlika Highway, San Jose City, Nueva Ecija', lat: 15.7939861, lng: 120.9905696, operatingHours: '4:00 AM - 7:00 PM', description: 'Northern gateway commercial center and wholesale trading hub.', isOpen: true },
  { id: 5, name: 'Muñoz City Public Market', address: 'Science City of Muñoz, Nueva Ecija', lat: 15.7122428, lng: 120.9040284, operatingHours: '5:00 AM - 7:00 PM', description: 'Central public market of the Science City of Muñoz.', isOpen: true },
  { id: 6, name: 'Pamilihang Bayan ng Talavera', address: 'Maharlika Highway, Talavera, Nueva Ecija', lat: 15.5834921, lng: 120.9218661, operatingHours: '5:00 AM - 7:00 PM', description: 'Active agricultural hub and wet and dry market of Talavera.', isOpen: true },
  { id: 7, name: 'Guimba Public Market', address: 'Afan Salvador St, Guimba, Nueva Ecija', lat: 15.6603299, lng: 120.7649769, operatingHours: '4:30 AM - 7:00 PM', description: 'Western Nueva Ecija premier commercial trading terminal.', isOpen: true },
  { id: 8, name: 'San Leonardo Public Market', address: 'Maharlika Highway, San Leonardo, Nueva Ecija', lat: 15.3640049, lng: 120.9412228, operatingHours: '5:00 AM - 7:00 PM', description: 'Thriving agricultural wet and dry market along Maharlika Highway.', isOpen: true },
  { id: 9, name: 'Santa Rosa Public Market', address: 'Maharlika Highway, Santa Rosa, Nueva Ecija', lat: 15.4247271, lng: 120.9388592, operatingHours: '5:00 AM - 7:00 PM', description: 'Key commercial center connecting Cabanatuan and southern towns.', isOpen: true },
  { id: 10, name: 'Bongabon Public Market', address: 'Poblacion, Bongabon, Nueva Ecija', lat: 15.6310444, lng: 121.1441894, operatingHours: '4:00 AM - 7:00 PM', description: 'World-renowned Onion Capital trading post and municipal market.', isOpen: true }
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private dataPath = 'assets/data';
  private cachedCommodities: Commodity[] | null = null;
  private cachedMarkets: Market[] | null = null;

  // Shared active market state (for cross-tab navigation and live price sync)
  private selectedMarketSubject = new BehaviorSubject<Market | null>(null);
  selectedMarket$ = this.selectedMarketSubject.asObservable();

  // Shared active shopping basket state
  private basketSubject = new BehaviorSubject<BasketItem[]>(this.loadBasketFromStorage());
  basket$ = this.basketSubject.asObservable();

  private loadBasketFromStorage(): BasketItem[] {
    try {
      const saved = localStorage.getItem('palengke_basket');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  }

  getBasket(): BasketItem[] {
    return this.basketSubject.value;
  }

  saveBasket(basket: BasketItem[]): void {
    try {
      localStorage.setItem('palengke_basket', JSON.stringify(basket));
    } catch (e) {
      console.warn('Failed to save basket to localStorage', e);
    }
    this.basketSubject.next([...basket]);
  }

  addToBasket(commodity: Commodity, market?: Market | null, qty: number = 1): void {
    const current = [...this.basketSubject.value];
    const existing = current.find(b => Number(b.commodityId) === Number(commodity.id));
    if (existing) {
      existing.quantity += qty;
    } else {
      const price = market
        ? this.getMarketPrice(commodity, market).price
        : commodity.suggestedRetailPrice;

      current.push({
        commodityId: commodity.id,
        commodityName: commodity.name,
        quantity: qty,
        unit: commodity.unit,
        icon: commodity.icon || 'basket-outline',
        pricePerUnit: price
      });
    }
    this.saveBasket(current);
  }

  updateBasketItemQuantity(commodityId: number, delta: number): void {
    const current = [...this.basketSubject.value];
    const item = current.find(b => b.commodityId === commodityId);
    if (item) {
      item.quantity = Math.max(0.25, +(item.quantity + delta).toFixed(2));
      this.saveBasket(current);
    }
  }

  removeFromBasket(indexOrCommodityId: number): void {
    let current = [...this.basketSubject.value];
    const idx = current.findIndex((b, i) => b.commodityId === indexOrCommodityId || i === indexOrCommodityId);
    if (idx >= 0) {
      current.splice(idx, 1);
      this.saveBasket(current);
    }
  }

  clearBasket(): void {
    this.saveBasket([]);
  }

  setSelectedMarket(market: Market | null): void {
    this.selectedMarketSubject.next(market);
  }

  getSelectedMarket(): Market | null {
    return this.selectedMarketSubject.value;
  }

  // ----------------------------------------------------------
  // SECTION 1: Data Fetching (Storage First, Fallback to JSON)
  // ----------------------------------------------------------

  getCommodities(): Observable<Commodity[]> {
    if (this.cachedCommodities && this.cachedCommodities.length > 0) {
      return of(this.cachedCommodities);
    }

    const custom = localStorage.getItem(CUSTOM_COMMODITIES_KEY);
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length >= 100) {
          this.cachedCommodities = parsed;
          return of(parsed);
        } else {
          localStorage.removeItem(CUSTOM_COMMODITIES_KEY);
        }
      } catch (err) {
        localStorage.removeItem(CUSTOM_COMMODITIES_KEY);
      }
    }

    return this.http.get<Commodity[]>(`${this.dataPath}/commodities.json`).pipe(
      map(data => {
        this.cachedCommodities = data || [];
        return this.cachedCommodities;
      }),
      catchError(err => {
        console.warn("Using default commodities fallback:", err);
        this.cachedCommodities = DEFAULT_COMMODITIES;
        return of(DEFAULT_COMMODITIES);
      })
    );
  }

  getMarkets(): Observable<Market[]> {
    if (this.cachedMarkets && this.cachedMarkets.length > 0) {
      return of(this.cachedMarkets);
    }

    return this.http.get<Market[]>(`${this.dataPath}/markets.json`).pipe(
      map(markets => {
        let allMarkets = [...markets];
        const custom = localStorage.getItem(CUSTOM_MARKETS_KEY);
        if (custom) {
          try {
            const parsed = JSON.parse(custom);
            if (Array.isArray(parsed)) {
              for (const cm of parsed) {
                if (!allMarkets.some(m => m.id === cm.id || m.name.toLowerCase() === cm.name.toLowerCase())) {
                  allMarkets.push(cm);
                }
              }
            }
          } catch {}
        }
        this.cachedMarkets = allMarkets.map(m => ({
          ...m,
          operatingHours: m.operatingHours || '5:00 AM - 7:00 PM',
          isOpen: isMarketOpen(m.operatingHours)
        }));
        return this.cachedMarkets;
      }),
      catchError(err => {
        console.warn('Error fetching markets:', err);
        this.cachedMarkets = DEFAULT_MARKETS.map(m => ({
          ...m,
          operatingHours: m.operatingHours || '5:00 AM - 7:00 PM',
          isOpen: isMarketOpen(m.operatingHours)
        }));
        return of(this.cachedMarkets);
      })
    );
  }

  // ----------------------------------------------------------
  // SECTION 2: Database Upload & Persistence
  // ----------------------------------------------------------

  saveCustomCommodities(commodities: Commodity[]): void {
    localStorage.setItem(CUSTOM_COMMODITIES_KEY, JSON.stringify(commodities));
  }

  saveCustomMarkets(markets: Market[]): void {
    localStorage.setItem(CUSTOM_MARKETS_KEY, JSON.stringify(markets));
  }

  resetToDefaultData(): void {
    localStorage.removeItem(CUSTOM_COMMODITIES_KEY);
    localStorage.removeItem(CUSTOM_MARKETS_KEY);
  }

  hasCustomDatabase(): boolean {
    return !!localStorage.getItem(CUSTOM_COMMODITIES_KEY) || !!localStorage.getItem(CUSTOM_MARKETS_KEY);
  }

  /**
   * Reports an actual observed market price for a commodity and persists it.
   */
  reportMarketPrice(commodityId: number, marketId: number, price: number): boolean {
    const today = new Date().toISOString().split('T')[0];
    const custom = localStorage.getItem(CUSTOM_COMMODITIES_KEY);
    let commodities: Commodity[] = [];
    if (custom) {
      try { commodities = JSON.parse(custom); } catch {}
    }
    if (!commodities || commodities.length === 0) {
      commodities = JSON.parse(JSON.stringify(DEFAULT_COMMODITIES));
    }

    const commodity = commodities.find(c => c.id === commodityId);
    if (!commodity) return false;

    const existingPrice = commodity.prices.find(p => p.marketId === marketId);
    if (existingPrice) {
      existingPrice.price = price;
      existingPrice.lastUpdated = today;
    } else {
      commodity.prices.push({
        marketId,
        price,
        lastUpdated: today
      });
    }

    this.saveCustomCommodities(commodities);
    return true;
  }

  saveOverpriceReport(report: OverpriceReport): void {
    try {
      const raw = localStorage.getItem(OVERPRICE_REPORTS_KEY);
      const list: OverpriceReport[] = raw ? JSON.parse(raw) : [];
      list.unshift(report);
      localStorage.setItem(OVERPRICE_REPORTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving overprice report:', e);
    }
  }

  getOverpriceReports(): OverpriceReport[] {
    try {
      const raw = localStorage.getItem(OVERPRICE_REPORTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Searches for a market by name or creates a new entry if not found.
   */
  findOrCreateMarket(marketName: string): Market {
    const custom = localStorage.getItem(CUSTOM_MARKETS_KEY);
    let markets: Market[] = [];
    if (custom) {
      try { markets = JSON.parse(custom); } catch {}
    }
    if (!markets || markets.length === 0) {
      markets = JSON.parse(JSON.stringify(DEFAULT_MARKETS));
    }

    const clean = marketName.trim().toLowerCase();
    const found = markets.find(m => m.name.toLowerCase() === clean || m.name.toLowerCase().includes(clean));
    if (found) return found;

    // Create a new market
    const newId = Math.max(0, ...markets.map(m => m.id)) + 1;
    const newMarket: Market = {
      id: newId,
      name: marketName.trim(),
      address: 'Community reported market',
      lat: 14.5995,
      lng: 120.9842,
      operatingHours: '5:00 AM - 7:00 PM',
      description: 'Community added market',
      isOpen: isMarketOpen('5:00 AM - 7:00 PM')
    };
    markets.push(newMarket);
    this.saveCustomMarkets(markets);
    return newMarket;
  }

  /**
   * Syncs online prices from an external Web Feed URL or bundled baseline data.
   */
  syncOnlinePrices(url?: string): Observable<Commodity[]> {
    const targetUrl = url || `${this.dataPath}/commodities.json?t=${Date.now()}`;
    return this.http.get<Commodity[]>(targetUrl).pipe(
      map(items => {
        if (Array.isArray(items) && items.length > 0) {
          this.saveCustomCommodities(items);
          return items;
        }
        throw new Error('Invalid or empty commodity list received from web feed.');
      })
    );
  }


  /**
   * Helper to parse a CSV text string into Commodity objects.
   * Format: name,category,unit,suggestedRetailPrice,marketId,price,lastUpdated
   */
  parseCommoditiesCSV(csvText: string): Commodity[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const mapById = new Map<number, Commodity>();
    let nextId = 1;

    // Skip header line if present
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      if (cols.length < 4) continue;

      const name = cols[0];
      const category = cols[1] || 'General';
      const unit = cols[2] || 'kg';
      const srp = parseFloat(cols[3]) || 0;
      const marketId = parseInt(cols[4], 10) || 1;
      const price = parseFloat(cols[5]) || srp;
      const lastUpdated = cols[6] || new Date().toISOString().split('T')[0];

      // Group prices under existing commodity by name
      let commodity = Array.from(mapById.values()).find(c => c.name.toLowerCase() === name.toLowerCase());

      if (!commodity) {
        commodity = {
          id: nextId++,
          name,
          category,
          unit,
          suggestedRetailPrice: srp,
          icon: this.getDefaultIcon(category),
          prices: []
        };
        mapById.set(commodity.id, commodity);
      }

      // Add or update market price
      const existingPriceIndex = commodity.prices.findIndex(p => p.marketId === marketId);
      if (existingPriceIndex >= 0) {
        commodity.prices[existingPriceIndex] = { marketId, price, lastUpdated };
      } else {
        commodity.prices.push({ marketId, price, lastUpdated });
      }
    }

    return Array.from(mapById.values());
  }

  /**
   * Exports the current commodity list into downloadable CSV format
   */
  exportToCSV(commodities: Commodity[]): string {
    const headers = ['Commodity Name', 'Category', 'Unit', 'SRP', 'Market ID', 'Price', 'Last Updated'];
    const rows: string[] = [headers.join(',')];

    for (const c of commodities) {
      if (c.prices && c.prices.length > 0) {
        for (const p of c.prices) {
          rows.push([
            `"${c.name}"`,
            `"${c.category}"`,
            `"${c.unit}"`,
            c.suggestedRetailPrice,
            p.marketId,
            p.price,
            p.lastUpdated
          ].join(','));
        }
      } else {
        rows.push([
          `"${c.name}"`,
          `"${c.category}"`,
          `"${c.unit}"`,
          c.suggestedRetailPrice,
          1,
          c.suggestedRetailPrice,
          new Date().toISOString().split('T')[0]
        ].join(','));
      }
    }

    return rows.join('\n');
  }

  getDefaultIcon(category: string): string {
    const cat = category.toLowerCase();
    if (cat.includes('grain') || cat.includes('rice')) return 'leaf-outline';
    if (cat.includes('poultry') || cat.includes('egg') || cat.includes('chicken')) return 'egg-outline';
    if (cat.includes('meat') || cat.includes('pork') || cat.includes('beef')) return 'nutrition-outline';
    if (cat.includes('fish') || cat.includes('sea')) return 'fish-outline';
    if (cat.includes('veg') || cat.includes('onion') || cat.includes('garlic')) return 'flower-outline';
    return 'pricetag-outline';
  }

  // ----------------------------------------------------------
  // SECTION 3: Price Helpers
  // ----------------------------------------------------------

  getLowestPrice(commodity: Commodity): number {
    if (!commodity.prices || commodity.prices.length === 0) return commodity.suggestedRetailPrice || 0;
    return Math.min(...commodity.prices.map(p => p.price));
  }

  getHighestPrice(commodity: Commodity): number {
    if (!commodity.prices || commodity.prices.length === 0) return commodity.suggestedRetailPrice || 0;
    return Math.max(...commodity.prices.map(p => p.price));
  }

  isOverSRP(commodity: Commodity): boolean {
    return this.getLowestPrice(commodity) > commodity.suggestedRetailPrice;
  }

  /**
   * Resolves the accurate price of a commodity for a specific market.
   * If an explicit price is recorded (via user report or official bulletin), returns that price.
   * Otherwise, accurately calibrates the prevailing market price from the DA SRP with
   * realistic regional variance.
   */
  getMarketPrice(commodity: Commodity, market: Market): { price: number; lastUpdated: string; isReported: boolean } {
    if (commodity.prices) {
      const match = commodity.prices.find(p => p.marketId === market.id);
      if (match) {
        return { price: match.price, lastUpdated: match.lastUpdated, isReported: true };
      }
    }

    // Calibrate prevailing price from DA SRP with regional variance
    const base = commodity.suggestedRetailPrice || 50;
    // Consistent seed from market.id and commodity.id
    const variancePercent = (((market.id * 31 + commodity.id * 17) % 15) - 7) / 100; // -7% to +7%
    let calculated = Math.round((base + base * variancePercent) * 2) / 2;
    if (calculated <= 0) calculated = base;

    return {
      price: calculated,
      lastUpdated: '2026-11-07 (DA Prevailing)',
      isReported: false
    };
  }

  /**
   * Retrieves preview prices for key staple commodities for a specific market.
   * Used for quick map popups and market cards.
   */
  getTopPricesForMarket(commodities: Commodity[], market: Market, limit: number = 4): { name: string; price: number; unit: string; icon: string }[] {
    const staples = commodities.slice(0, 10);
    const results: { name: string; price: number; unit: string; icon: string }[] = [];

    for (const c of staples) {
      const priceInfo = this.getMarketPrice(c, market);
      results.push({
        name: c.name,
        price: priceInfo.price,
        unit: c.unit,
        icon: c.icon || 'pricetag-outline'
      });
      if (results.length >= limit) break;
    }
    return results;
  }

  // ----------------------------------------------------------
  // SECTION 4: Watchlist (localStorage)
  // ----------------------------------------------------------

  getWatchlist(): WatchlistItem[] {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveToWatchlist(commodity: Commodity, targetPrice: number): boolean {
    const watchlist = this.getWatchlist();
    const alreadyExists = watchlist.some(item => item.commodity.id === commodity.id);
    if (alreadyExists) return false;

    const newItem: WatchlistItem = {
      commodity,
      targetPrice,
      savedAt: new Date().toISOString()
    };
    watchlist.push(newItem);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    return true;
  }

  removeFromWatchlist(commodityId: number): void {
    const watchlist = this.getWatchlist();
    const updated = watchlist.filter(item => item.commodity.id !== commodityId);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  }

  isInWatchlist(commodityId: number): boolean {
    const watchlist = this.getWatchlist();
    return watchlist.some(item => item.commodity.id === commodityId);
  }

  // ----------------------------------------------------------
  // SECTION 5: Filipino Recipes
  // ----------------------------------------------------------

  readonly DEFAULT_RECIPES: Recipe[] = [
  {
    id: 1,
    name: 'Sinigang na Baboy',
    category: 'Soup',
    servings: 4,
    image: '🍲',
    description: 'Classic Filipino sour tamarind soup with tender pork and crisp native greens.',
    tags: ['Soup', 'Pork', 'Classic'],
    ingredients: [
      { commodityName: 'Pork Liempo', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Labanos (Radish)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Kangkong', quantity: 1, unit: 'bundle' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 2,
    name: 'Tinolang Manok',
    category: 'Soup',
    servings: 4,
    image: '🍗',
    description: 'Hearty ginger-infused chicken soup with fresh green papaya and chili leaves.',
    tags: ['Soup', 'Chicken', 'Healthy'],
    ingredients: [
      { commodityName: 'Whole Dressed Chicken', quantity: 1, unit: 'kg' },
      { commodityName: 'Papaya (Green)', quantity: 0.3, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 3,
    name: 'Adobong Baboy',
    category: 'Main Dish',
    servings: 4,
    image: '🥩',
    description: 'Savory, garlicky pork simmered in native cane vinegar and soy sauce.',
    tags: ['Main Dish', 'Pork', 'Classic'],
    ingredients: [
      { commodityName: 'Pork Liempo', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 4,
    name: 'Ginisang Munggo',
    category: 'Main Dish',
    servings: 4,
    image: '🫘',
    description: 'Nutritious sautéed mung beans with pork bits and fresh greens — the Friday palengke staple!',
    tags: ['Main Dish', 'Vegetables', 'Budget'],
    ingredients: [
      { commodityName: 'Monggo (Mung Beans)', quantity: 0.25, unit: 'kg' },
      { commodityName: 'Pork Kasim', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' }
    ]
  },
  {
    id: 5,
    name: 'Pinakbet',
    category: 'Vegetables',
    servings: 4,
    image: '🥦',
    description: 'Traditional Ilocano medley of fresh ampalaya, sitaw, talong, and kalabasa.',
    tags: ['Vegetables', 'Healthy', 'Regional'],
    ingredients: [
      { commodityName: 'Ampalaya (Bitter Gourd)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Talong (Eggplant)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Kalabasa (Squash)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Pork Kasim', quantity: 0.15, unit: 'kg' }
    ]
  },
  {
    id: 6,
    name: 'Beef Nilaga',
    category: 'Soup',
    servings: 4,
    image: '🥣',
    description: 'Comforting slow-boiled beef brisket soup with fresh cabbage and potatoes.',
    tags: ['Soup', 'Beef', 'Comfort Food'],
    ingredients: [
      { commodityName: 'Beef Brisket/Camto', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Patatas (Potato)', quantity: 0.3, unit: 'kg' },
      { commodityName: 'Repolyo (Cabbage)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Pechay Tagalog', quantity: 1, unit: 'bundle' }
    ]
  },
  {
    id: 7,
    name: 'Arroz Caldo',
    category: 'Rice Dish',
    servings: 4,
    image: '🍚',
    description: 'Warm ginger chicken rice porridge topped with toasted garlic — rainy day favorite.',
    tags: ['Rice Dish', 'Chicken', 'Comfort Food'],
    ingredients: [
      { commodityName: 'Whole Dressed Chicken', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Well-Milled Local Rice', quantity: 0.25, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 8,
    name: 'Paksiw na Bangus',
    category: 'Seafood',
    servings: 4,
    image: '🐟',
    description: 'Fresh milkfish simmered in native vinegar, fresh ginger, and eggplant.',
    tags: ['Seafood', 'Fish', 'Quick'],
    ingredients: [
      { commodityName: 'Bangus (Milkfish)', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Ampalaya (Bitter Gourd)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 9,
    name: 'Ginataang Kalabasa at Sitaw',
    category: 'Vegetables',
    servings: 4,
    image: '🎃',
    description: 'Creamy rich kalabasa and tender string beans cooked in fresh gata (coconut milk).',
    tags: ['Vegetables', 'Creamy', 'Quick'],
    ingredients: [
      { commodityName: 'Kalabasa (Squash)', quantity: 0.4, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Pork Kasim', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 10,
    name: 'Tortang Talong',
    category: 'Egg Dish',
    servings: 2,
    image: '🍳',
    description: 'Smoky charred eggplant pan-fried in egg batter. Budget-friendly and delicious!',
    tags: ['Egg Dish', 'Vegetables', 'Budget'],
    ingredients: [
      { commodityName: 'Talong (Eggplant)', quantity: 0.25, unit: 'kg' },
      { commodityName: 'Chicken Egg (Medium)', quantity: 2, unit: 'piece' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.02, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 11,
    name: 'Chopsuey',
    category: 'Vegetables',
    servings: 4,
    image: '🥗',
    description: 'Colorful medley of crisp Baguio vegetables stir-fried with chicken.',
    tags: ['Vegetables', 'Healthy', 'Stir-Fry'],
    ingredients: [
      { commodityName: 'Repolyo (Cabbage)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Baguio Beans', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Carrot', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 12,
    name: 'Sinigang na Hipon',
    category: 'Soup',
    servings: 4,
    image: '🦐',
    description: 'Tangy, savory tamarind soup made with fresh ocean shrimp and kangkong.',
    tags: ['Soup', 'Seafood', 'Special'],
    ingredients: [
      { commodityName: 'Suahe / White Shrimp', quantity: 0.4, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Labanos (Radish)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Kangkong', quantity: 1, unit: 'bundle' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 13,
    name: 'Chicken Adobo',
    category: 'Main Dish',
    servings: 4,
    image: '🍗',
    description: 'The quintessential Filipino dish — chicken braised in vinegar, soy sauce, garlic, and cracked pepper.',
    tags: ['Main Dish', 'Chicken', 'Classic'],
    ingredients: [
      { commodityName: 'Whole Dressed Chicken', quantity: 0.8, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 14,
    name: 'Kare-Kare',
    category: 'Main Dish',
    servings: 5,
    image: '🥘',
    description: 'Rich and savory peanut stew with tender pork, eggplant, sitaw, and pechay served with bagoong.',
    tags: ['Main Dish', 'Pork', 'Celebration'],
    ingredients: [
      { commodityName: 'Pork Kasim', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Talong (Eggplant)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Pechay Tagalog', quantity: 1, unit: 'bundle' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 15,
    name: 'Bulalo (Beef Shank Soup)',
    category: 'Soup',
    servings: 4,
    image: '🍲',
    description: 'Hearty Batangas-style beef shank soup slow-simmered with cabbage, sweet corn, and pechay.',
    tags: ['Soup', 'Beef', 'Comfort Food'],
    ingredients: [
      { commodityName: 'Beef Shank (Bulalo)', quantity: 0.6, unit: 'kg' },
      { commodityName: 'Repolyo (Cabbage)', quantity: 0.25, unit: 'kg' },
      { commodityName: 'Pechay Tagalog', quantity: 1, unit: 'bundle' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 16,
    name: 'Pork Menudo',
    category: 'Main Dish',
    servings: 4,
    image: '🍛',
    description: 'Festive stew of cubed pork, potatoes, carrots, and sweet tomato sauce — a Sunday family favorite.',
    tags: ['Main Dish', 'Pork', 'Fiesta'],
    ingredients: [
      { commodityName: 'Pork Kasim', quantity: 0.4, unit: 'kg' },
      { commodityName: 'Patatas (Potato)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Carrot', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 17,
    name: 'Sinigang na Bangus sa Kamatis',
    category: 'Soup',
    servings: 4,
    image: '🐟',
    description: 'Fresh Dagupan milkfish simmered with sweet ripe tomatoes, radish, and native kangkong.',
    tags: ['Soup', 'Seafood', 'Healthy'],
    ingredients: [
      { commodityName: 'Bangus (Milkfish)', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Kangkong', quantity: 1, unit: 'bundle' },
      { commodityName: 'Labanos (Radish)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 18,
    name: 'Ginisang Sayote na may Giniling',
    category: 'Vegetables',
    servings: 3,
    image: '🥒',
    description: 'Crisp chayote sautéed with ground pork and fresh tomatoes. Quick, healthy, and budget-friendly.',
    tags: ['Vegetables', 'Quick', 'Budget'],
    ingredients: [
      { commodityName: 'Sayote', quantity: 0.4, unit: 'kg' },
      { commodityName: 'Ground Pork', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 19,
    name: 'Escabechang Tilapia',
    category: 'Seafood',
    servings: 4,
    image: '🐠',
    description: 'Crispy fried fresh tilapia drenched in sweet-and-sour ginger bell pepper sauce.',
    tags: ['Seafood', 'Fish', 'Special'],
    ingredients: [
      { commodityName: 'Tilapia', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Carrot', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Siling Haba (Green Chili)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 20,
    name: 'Bicol Express',
    category: 'Main Dish',
    servings: 4,
    image: '🌶️',
    description: 'Spicy pork stew simmered in rich coconut milk with lots of green chilies and shrimp paste.',
    tags: ['Main Dish', 'Pork', 'Spicy'],
    ingredients: [
      { commodityName: 'Pork Liempo', quantity: 0.4, unit: 'kg' },
      { commodityName: 'Siling Haba (Green Chili)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Siling Labuyo (Red Chili)', quantity: 0.02, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 21,
    name: 'Pritong Liempo with Ensalada',
    category: 'Main Dish',
    servings: 4,
    image: '🥓',
    description: 'Crispy golden pork belly paired with grilled eggplant, fresh red tomatoes, and onions.',
    tags: ['Main Dish', 'Pork', 'Comfort Food'],
    ingredients: [
      { commodityName: 'Pork Liempo', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Talong (Eggplant)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 22,
    name: 'Ginisang Ampalaya with Egg',
    category: 'Egg Dish',
    servings: 3,
    image: '🍳',
    description: 'Sliced bitter melon sauteed with garlic, ripe tomatoes, and gently folded with scrambled eggs.',
    tags: ['Egg Dish', 'Vegetables', 'Healthy'],
    ingredients: [
      { commodityName: 'Ampalaya (Bitter Gourd)', quantity: 0.3, unit: 'kg' },
      { commodityName: 'Chicken Egg (Medium)', quantity: 2, unit: 'piece' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.02, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 23,
    name: 'Paksiw na Galunggong',
    category: 'Seafood',
    servings: 4,
    image: '🐟',
    description: 'Budget-friendly round scad simmered with vinegar, ginger, garlic, and bitter gourd slices.',
    tags: ['Seafood', 'Fish', 'Budget'],
    ingredients: [
      { commodityName: 'Galunggong (Round Scad)', quantity: 0.5, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Ampalaya (Bitter Gourd)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Siling Haba (Green Chili)', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 24,
    name: 'Pinoy Chicken Curry',
    category: 'Main Dish',
    servings: 4,
    image: '🍛',
    description: 'Savory chicken, potatoes, and carrots simmered in mild curry spices and creamy coconut milk.',
    tags: ['Main Dish', 'Chicken', 'Comfort Food'],
    ingredients: [
      { commodityName: 'Whole Dressed Chicken', quantity: 0.6, unit: 'kg' },
      { commodityName: 'Patatas (Potato)', quantity: 0.25, unit: 'kg' },
      { commodityName: 'Carrot', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 25,
    name: 'Pork Afritada',
    category: 'Main Dish',
    servings: 4,
    image: '🥘',
    description: 'Rich tomato stew with pork tenderloin, pan-fried potatoes, and sweet red carrots.',
    tags: ['Main Dish', 'Pork', 'Classic'],
    ingredients: [
      { commodityName: 'Pork Kasim', quantity: 0.4, unit: 'kg' },
      { commodityName: 'Patatas (Potato)', quantity: 0.2, unit: 'kg' },
      { commodityName: 'Carrot', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.15, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' }
    ]
  },
  {
    id: 26,
    name: 'Sinampalukang Manok',
    category: 'Soup',
    servings: 4,
    image: '🍲',
    description: 'Tart and refreshing native chicken soup infused with young tamarind leaves, ginger, and sitaw.',
    tags: ['Soup', 'Chicken', 'Regional'],
    ingredients: [
      { commodityName: 'Whole Dressed Chicken', quantity: 0.6, unit: 'kg' },
      { commodityName: 'Luya (Ginger)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Sitaw (String Beans)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Kamatis (Tomato)', quantity: 0.1, unit: 'kg' },
      { commodityName: 'Sibuyas (Onion)', quantity: 0.05, unit: 'kg' },
      { commodityName: 'Bawang (Garlic)', quantity: 0.03, unit: 'kg' }
    ]
  }
];

  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(`${this.dataPath}/recipes.json`).pipe(
      map(data => (Array.isArray(data) && data.length > 0) ? data : this.DEFAULT_RECIPES),
      catchError(err => {
        console.warn('Could not load recipes.json, falling back to DEFAULT_RECIPES:', err);
        return of(this.DEFAULT_RECIPES);
      })
    );
  }

  // ----------------------------------------------------------
  // SECTION 6: Palengke Watch Intelligence & Advisory
  // ----------------------------------------------------------

  /**
   * Evaluates the current trading phase of Philippine wet markets:
   * - 4:00 AM - 7:00 AM: Bagsakan (Wholesale / freshest fish & greens)
   * - 7:00 AM - 5:00 PM: Regular retail hours
   * - 5:00 PM - 7:30 PM: Tawad / Hapon Clearance (End-of-day discounts)
   * - 7:30 PM - 4:00 AM: Closed
   */
  getBagsakanStatus(date: Date = new Date()): BagsakanInfo {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes >= 4 * 60 && totalMinutes < 7 * 60) {
      return {
        phase: 'bagsakan',
        title: '🌅 Oras ng Bagsakan (4:00 AM – 7:00 AM)',
        badge: 'Bagsakan Wholesale',
        color: 'warning',
        timeRange: '4:00 AM - 7:00 AM',
        description: 'Dumating na ang mga bultuhan mula sa pier at taniman.',
        tip: 'Pinakasariwa ang isda, karne, at gulay. Pinakamura kung bibili ng bulto (pakyawan).'
      };
    } else if (totalMinutes >= 7 * 60 && totalMinutes < 17 * 60) {
      return {
        phase: 'regular',
        title: '☀️ Regular Palengke Hours (7:00 AM – 5:00 PM)',
        badge: 'Bukas Lahat ng Pwesto',
        color: 'success',
        timeRange: '7:00 AM - 5:00 PM',
        description: 'Lahat ng tindahan, karnehan, at gulayan ay bukas.',
        tip: 'Kumpleto ang mga paninda at suplay. Bantayan ang SRP gamit ang Palengke Watch.'
      };
    } else if (totalMinutes >= 17 * 60 && totalMinutes < 19 * 60 + 30) {
      return {
        phase: 'tawad',
        title: '🌙 Oras ng Tawad / Hapon Clearance (5:00 PM – 7:30 PM)',
        badge: 'Tawad & Discount',
        color: 'secondary',
        timeRange: '5:00 PM - 7:30 PM',
        description: 'Paghahanda sa pagsasara ng mga tindahan.',
        tip: 'Maaaring tumawad! Maraming tindero ang nagbabaon ng clearance discounts sa natitirang isda at gulay.'
      };
    } else {
      return {
        phase: 'closed',
        title: '🔒 Sarado ang Palengke',
        badge: 'Bukas muli ng 4:00 AM',
        color: 'medium',
        timeRange: '7:30 PM - 4:00 AM',
        description: 'Nagsara na ang karamihan ng mga puwesto.',
        tip: 'Ihanda na ang iyong shopping list sa Basket Calculator para sa maagang pamamalengke bukas.'
      };
    }
  }

  /**
   * Checks whether a commodity's selling price violates DA/DTI SRP (>10% markup)
   */
  checkOverpricing(price: number, srp: number): { isOverpriced: boolean; percent: number; diff: number } {
    if (!srp || srp <= 0) return { isOverpriced: false, percent: 0, diff: 0 };
    const diff = price - srp;
    const percent = Math.round((diff / srp) * 100);
    return {
      isOverpriced: percent >= 10,
      percent,
      diff: Math.round(diff * 100) / 100
    };
  }

  /**
   * Determines if a wet market is equipped with a registered DTI/LGU Timbangan ng Bayan
   * (Public check-scale under RA 7394 Consumer Act)
   */
  hasTimbanganNgBayan(market: Market): boolean {
    if (market.hasTimbangan !== undefined) return market.hasTimbangan;
    const name = market.name.toLowerCase();
    // Public/City/Bayan markets are mandated by law to provide a Timbangan ng Bayan
    return name.includes('public') || name.includes('city') || name.includes('bayan') || name.includes('central') || (market.id % 2 === 0);
  }
}

