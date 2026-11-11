// ============================================================
// src/app/models/commodity.model.ts
// Defines the TypeScript interfaces for all data shapes used
// throughout the application. Using interfaces ensures type
// safety and makes the code self-documenting.
// ============================================================

/**
 * Represents a price entry for a specific commodity at a specific market.
 */
export interface MarketPrice {
  marketId: number;        // References a Market's id
  price: number;           // Price in Philippine Peso (₱)
  lastUpdated: string;     // ISO date string of when the price was recorded
}

/**
 * Represents a basic commodity (product) tracked in the app.
 */
export interface Commodity {
  id: number;
  name: string;            // e.g., "Sinandomeng Rice"
  category: string;        // e.g., "Grains", "Poultry", "Seafood"
  unit: string;            // e.g., "kg", "liter", "piece"
  prices: MarketPrice[];   // Price list across all markets
  suggestedRetailPrice: number; // Government-set SRP for reference
  icon: string;            // Ionicon name for the list icon
}

/**
 * Represents a public wet market location shown on the map.
 */
export interface Market {
  id: number;
  name: string;            // e.g., "Hagonoy Public Market"
  address: string;
  lat: number;             // Latitude for Leaflet map marker
  lng: number;             // Longitude for Leaflet map marker
  operatingHours: string;  // e.g., "5:00 AM - 6:00 PM"
  description: string;
  isOpen: boolean;         // Whether the market is currently open
  hasTimbangan?: boolean;  // Whether the market has a public Timbangan ng Bayan
  bagsakanHours?: string;  // e.g., "4:00 AM - 7:00 AM"
}

/**
 * Palengke trading phase status (Bagsakan, Regular, Tawad/Clearance, Closed)
 */
export interface BagsakanInfo {
  phase: 'bagsakan' | 'regular' | 'tawad' | 'closed';
  title: string;
  badge: string;
  color: string;
  description: string;
  tip: string;
  timeRange: string;
}

/**
 * Represents an item saved to the user's personal Watchlist.
 * Wraps a Commodity with the user's target price and the date saved.
 */
export interface WatchlistItem {
  commodity: Commodity;
  targetPrice: number;     // The price the user wants to monitor
  savedAt: string;         // ISO date string of when it was added
}

/**
 * Represents an item in the user's shopping basket.
 */
export interface BasketItem {
  commodityId: number;
  commodityName: string;
  quantity: number;
  unit: string;
  icon: string;
  pricePerUnit?: number;
}

/**
 * Represents an ingredient in a recipe.
 */
export interface RecipeIngredient {
  commodityName: string;
  quantity: number;
  unit: string;
}

/**
 * Represents a Filipino recipe.
 */
export interface Recipe {
  id: number;
  name: string;
  category: string;
  servings: number;
  image: string;
  description: string;
  tags?: string[];
  ingredients: RecipeIngredient[];
}

/**
 * Represents a market comparison entry.
 */
export interface MarketComparison {
  market: Market;
  items: { commodityName: string; price: number; unit: string; quantity: number; total: number }[];
  grandTotal: number;
}

/**
 * Represents a crowdsourced or evidence-backed Overpricing Report with photo/receipt.
 */
export interface OverpriceReport {
  id: string;
  commodityId: number;
  commodityName: string;
  marketId: number;
  marketName: string;
  price: number;
  srp: number;
  isOverpriced: boolean;
  overpricePercent: number;
  photoDataUrl?: string;
  stallInfo?: string;
  date: string;
}


