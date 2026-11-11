const fs = require('fs');

let code = fs.readFileSync('src/app/services/data.service.ts', 'utf8');

// 1. Optimize isMarketOpen with fast daytime check
const oldIsMarketOpen = `export function isMarketOpen(operatingHours?: string, now = new Date()): boolean {
  const hoursStr = (operatingHours || '').trim();
  if (!hoursStr) {
    // Default Philippine public market hours: 5:00 AM to 7:00 PM (daily)
    const curMin = now.getHours() * 60 + now.getMinutes();
    return curMin >= 5 * 60 && curMin < 19 * 60;
  }`;

const newIsMarketOpen = `export function isMarketOpen(operatingHours?: string, now = new Date()): boolean {
  const hoursStr = (operatingHours || '').trim();
  const curMin = now.getHours() * 60 + now.getMinutes();
  const isDaytime = curMin >= 5 * 60 && curMin < 19 * 60;

  // Ultra-fast path for typical daytime operating hours
  if (!hoursStr || hoursStr === '5:00 AM - 7:00 PM' || hoursStr === '05:00-19:00' || hoursStr === '4:00 AM - 8:00 PM') {
    return isDaytime;
  }`;

if (code.includes(oldIsMarketOpen)) {
  code = code.replace(oldIsMarketOpen, newIsMarketOpen);
  console.log('Optimized isMarketOpen fast-path!');
}

// 2. Replace lines from 'export const DEFAULT_COMMODITIES: Commodity[] = [' to '@Injectable({'
const lines = code.split('\n');
const startCommIdx = lines.findIndex(l => l.startsWith('export const DEFAULT_COMMODITIES: Commodity[] = ['));
const endMktIdx = lines.findIndex(l => l.startsWith('@Injectable({'));

console.log('Replacing from line', startCommIdx, 'to', endMktIdx);

const compactCommodities = `export const DEFAULT_COMMODITIES: Commodity[] = [
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
];`;

const before = lines.slice(0, startCommIdx).join('\n');
const after = lines.slice(endMktIdx).join('\n');

let newCode = before + '\n' + compactCommodities + '\n\n' + after;

// 3. Add memory caching to DataService
const oldClassFields = `  private dataPath = 'assets/data';

  // Shared active market state (for cross-tab navigation and live price sync)`;

const newClassFields = `  private dataPath = 'assets/data';
  private cachedCommodities: Commodity[] | null = null;
  private cachedMarkets: Market[] | null = null;

  // Shared active market state (for cross-tab navigation and live price sync)`;

newCode = newCode.replace(oldClassFields, newClassFields);

// 4. Update getCommodities() with memory cache
const oldGetCommodities = `  getCommodities(): Observable<Commodity[]> {
    const custom = localStorage.getItem(CUSTOM_COMMODITIES_KEY);
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        // Only use custom cache if it has at least as many commodities as our 156-item catalog
        if (Array.isArray(parsed) && parsed.length >= DEFAULT_COMMODITIES.length) {
          return of(parsed);
        } else {
          // Clear stale 28-item cache from previous sessions to upgrade to full 156 items
          localStorage.removeItem(CUSTOM_COMMODITIES_KEY);
        }
      } catch (err) {
        console.error('Failed to parse custom commodities from storage', err);
        localStorage.removeItem(CUSTOM_COMMODITIES_KEY);
      }
    }

    return this.http.get<Commodity[]>(` + '`${this.dataPath}/commodities.json`' + `).pipe(
      catchError(err => {
        console.warn("Using default commodities fallback:", err);
        return of(DEFAULT_COMMODITIES);
      })
    );
  }`;

const newGetCommodities = `  getCommodities(): Observable<Commodity[]> {
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

    return this.http.get<Commodity[]>(` + '`${this.dataPath}/commodities.json`' + `).pipe(
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
  }`;

newCode = newCode.replace(oldGetCommodities, newGetCommodities);

// 5. Update getMarkets() with memory cache
const oldGetMarkets = `  getMarkets(): Observable<Market[]> {
    return this.http.get<Market[]>(` + '`${this.dataPath}/markets.json`' + `).pipe(
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
        return allMarkets.map(m => ({
          ...m,
          operatingHours: m.operatingHours || '5:00 AM - 7:00 PM',
          isOpen: isMarketOpen(m.operatingHours)
        }));
      }),
      catchError(err => {
        console.warn('Error fetching markets:', err);
        return of(DEFAULT_MARKETS.map(m => ({
          ...m,
          operatingHours: m.operatingHours || '5:00 AM - 7:00 PM',
          isOpen: isMarketOpen(m.operatingHours)
        })));
      })
    );
  }`;

const newGetMarkets = `  getMarkets(): Observable<Market[]> {
    if (this.cachedMarkets && this.cachedMarkets.length > 0) {
      return of(this.cachedMarkets);
    }

    return this.http.get<Market[]>(` + '`${this.dataPath}/markets.json`' + `).pipe(
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
  }`;

newCode = newCode.replace(oldGetMarkets, newGetMarkets);

fs.writeFileSync('src/app/services/data.service.ts', newCode, 'utf8');
console.log('Successfully optimized src/app/services/data.service.ts!');

