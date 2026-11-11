# KILATIS (Palengke Price Guide) — Final Case Study Documentation & Submission Kit

**Course:** Mobile Application Technology  
**Project Title:** KILATIS — Public Wet Market Price Transparency & Budget Guide  
**Target Platform:** Mobile (Ionic 9 / Angular 22 / Capacitor 8 / Android)

---

## 1. Project Information
- **Project Name:** KILATIS (Bantay Presyo sa Palengke)
- **Problem Category:** Consumer Protection & Wet Market Price Transparency

---

## 2. Problem & Proposed Solution

### The Problem
In Philippine public wet markets (*palengke*), commodity prices (such as rice, poultry, meat, and vegetables) fluctuate daily without centralized publication. Consumers face widespread price opacity, irregular pricing across adjacent stalls, and instances of price gouging beyond the Department of Agriculture (DA) Suggested Retail Price (SRP). Furthermore, shoppers struggle to budget effectively for daily household meals (*ulam*) or identify which local market offers the most economical prices.

### Target Users
- Everyday Filipino consumers and household budget managers (*nanay*, *tatay*, homemakers)
- Budget-conscious students and meal planners
- Community consumer advocates reporting overpricing

### The Proposed Solution: KILATIS
**KILATIS** is a focused mobile application providing transparent market price guidance:
1. **Live Price & SRP Comparison:** Instant search across ~150+ commodities with government SRP benchmarks and real-time overpricing warnings.
2. **Hybrid Near Me & "Aking Palengke" Geolocation:** Automatic GPS distance calculation relative to the user's physical location, with an instant home market selector and proximity-sorted prices on every commodity card.
3. **Interactive Market Geolocation:** Map-based exploration of 2,455 Philippine markets using Leaflet and clustering.
4. **Smart Shopping Basket & Budget Planner:** Dynamic calculation showing remaining allowance and over-budget warnings.
5. **"Ulam Budget" Planner (26 Classic Dishes):** Recipe-based ingredient estimation with 1-click basket loading and portion multipliers (1x, 2x, 3x).
6. **Multi-Market Comparison ("Saan Mas Mura?"):** Side-by-side comparative table highlighting the cheapest market with 1-tap staple addition chips.
7. **Bantay Overpricing Feature (Capacitor Camera):** Citizen evidence reporting tool allowing users to capture photos of stalls or receipts when prices exceed SRP.

---

## 3. Technical Implementation & Mobile Capabilities

### Architecture & Tech Stack
- **Framework:** Ionic Framework v9 with Angular 22 (Standalone & Modular architecture)
- **Build Target:** Capacitor 8 (`@capacitor/core`, `@capacitor/camera`, `@capacitor/haptics`)
- **Map & Geolocation:** Leaflet + Leaflet.markercluster + OpenStreetMap Nominatim Geocoding
- **State & Data Management:** Angular `HttpClient`, RxJS `BehaviorSubject`, and persistent browser/device `localStorage`

### Mobile Device Capabilities (Course Outcome CO2)
1. **Camera (`@capacitor/camera`):** Integrated into the "Bantay Overpricing" reporting modal. Allows capturing photos of actual market stalls, price tags, or receipts as verifiable evidence.
2. **Haptics (`@capacitor/haptics`):** Provides physical tactical feedback (`ImpactStyle.Medium`) on critical user actions such as bookmarking items into the Watchlist and removing items from the list.
3. **Geolocation & Map Services:** Real-time device position retrieval ("Locate Me") and geographic bounding calculations for nearby market discovery.

---

## 4. Testing and Evaluation Matrix (Required for Report)

| # | Feature / User Task | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **T1** | Search commodity (e.g., "Sinandomeng" or "manok") | Displays matching commodities filtered in real-time | Instant matches displayed with category chips | **PASS** |
| **T2** | Filter by specific market | Shows localized prices for selected market | Header pill activates; prices update to market rates | **PASS** |
| **T3** | SRP Warning Badge | Flags items priced above DA SRP in red/warning | Red border and warning badge appear with percentage over SRP | **PASS** |
| **T4** | Add to Basket & Adjust Quantity | Item added with stepper; updates subtotal and grand total | Quantity increments by 0.25 kg; totals recalculate immediately | **PASS** |
| **T5** | Budget Limit Calculator | Alerts if total basket exceeds user budget | Green badge if within budget; red warning with excess amount if over | **PASS** |
| **T6** | "Ulam Budget" Recipe Loading | Recipe ingredients scale and load directly into Basket | Ingredients transfer to Basket without duplication | **PASS** |
| **T7** | "Saan Mas Mura?" Comparison | Multi-market comparison highlights cheapest market | Winning market marked with trophy; cheapest cell highlighted | **PASS** |
| **T8** | Interactive Map & Cluster | Displays 2,455 markets with cluster bubbles and carousel | Map smoothly clusters; bottom tray shows nearby markets | **PASS** |
| **T9** | Watchlist Target Price & Deal Alert | Alerts when market price drops to or below target | High-contrast "Deal Found!" deep green badge appears with market name | **PASS** |
| **T10** | Bantay Overpricing Camera Report | Opens camera/photo picker to attach evidence with report | Photo attached, overprice margin calculated, report saved | **PASS** |
| **T11** | Hybrid "Near Me" GPS & Distance | Calculates distances (m/km) and orders markets by physical proximity | Nearest markets displayed with distance badge (e.g. 1.2 km); expand toggle works | **PASS** |
| **T12** | Scaled Ulam Budget (26 Recipes) | Calculates dish cost per plate for selected market and portions (1x, 2x, 3x) | Accurately calculates recipe cost from market prices and transfers to Basket | **PASS** |
| **T13** | Bottom Navigation Bar Responsiveness | 7-tab layout (Presyo, Basket, Ulam, Compare, Palengke, Bantay, Admin) on narrow mobile screens | Flex layout with dynamic labels and ellipsis prevents tab clipping on small viewports | **PASS** |
| **T14** | Mobile Map Engine & Cluster Stability | Leaflet rendering on native Android WebView across tab switches | CartoDB CDN tiles + chunked cluster loading + multi-stage invalidation ensure 100% viewport fill | **PASS** |

---

## 5. Observed Limitations & Proposed Improvements (Course Outcome CO4)

### Current Limitations
1. **Crowdsourced Price Verification:** User-submitted overprice reports are currently stored locally on the device.
2. **Offline Data Freshness:** In the absence of an internet connection, the application falls back to pre-packaged DA baseline data.

### Proposed Future Improvements
1. **Cloud Backend Synchronization:** Connect to a centralized Firebase or Supabase backend to aggregate citizen overpricing reports directly to local DTI/DA offices.
2. **OCR Receipt Parsing:** Integrate on-device Machine Learning (ML Kit) to automatically read prices from receipt photos taken with the Camera.
3. **Push Notifications:** Alert users when their favorite watched staple reaches a target discount price at a nearby market.

---

## 6. AI Usage Disclosure (Required by Rubric)

- **AI Tools Used:** Google Antigravity (DeepMind agentic coding assistant)
- **Tasks Assisted:**
  - Automated normalization of Philippine OpenStreetMap market coordinates and address metadata.
  - Refactoring token-based search and fuzzy commodity name resolution (`resolveCommodity`).
  - SCSS responsive layout adjustments for the mobile map tray, navigation tab bar, and card viewport heights.
  - Troubleshooting native Android WebView Leaflet engine compatibility, cleartext traffic permissions, and bundle configurations.
- **Human Review & Verification:**
  - Every AI-suggested code block was compiled, tested with Angular CLI builds, and visually verified in browser mobile emulation.
  - Filipino nomenclature, DTI guidelines, and DA SRP values were manually verified against official Philippine government publications.

---

## 7. Presentation Guide (8–12 Minutes)

| Time | Section | Key Points to Cover |
|---|---|---|
| **0:00 - 1:30** | Problem & Solution | Explain price volatility in palengkes; introduce KILATIS. |
| **1:30 - 5:30** | App Walkthrough | Demo Prices tab, Basket budget calculator, Ulam planner, Map, and Compare page. |
| **5:30 - 7:30** | Technical & Code Explanation | Show `@capacitor/camera` implementation in `dashboard.page.ts` and `initMap()` in `map.page.ts`. |
| **7:30 - 9:00** | Testing & Usability Improvements | Present the testing table and future cloud synchronization plans. |
| **9:00 - 9:30** | AI Usage Disclosure & Conclusion | Briefly state AI assistance was used for data normalization and UI refactoring, followed by team testing. |

