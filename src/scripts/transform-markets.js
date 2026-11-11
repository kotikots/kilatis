// Transform OSM raw market data to the app's markets.json format
// Supports both Overpass JSON (raw.elements) and GeoJSON FeatureCollection (raw.features)
const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '..', 'assets', 'data', 'markets_raw.json');
const outPath = path.join(__dirname, '..', 'assets', 'data', 'markets.json');

if (!fs.existsSync(rawPath)) {
  console.error('Raw market file not found:', rawPath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
// Overpass JSON format
const elements = raw.elements || [];
// GeoJSON FeatureCollection format
const features = raw.features || [];
let idCounter = 1;
const markets = [];

// Helper to extract lat/lng from a GeoJSON feature
function extractLatLng(feature) {
  if (!feature || !feature.geometry) return { lat: 0, lng: 0 };
  const geom = feature.geometry;
  if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
    // GeoJSON coordinates are [lon, lat]
    return { lat: geom.coordinates[1] || 0, lng: geom.coordinates[0] || 0 };
  }
  if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
    // Approximate centroid by averaging first ring vertices
    const ring = geom.coordinates[0] || [];
    if (ring.length === 0) return { lat: 0, lng: 0 };
    let sumLat = 0, sumLng = 0, count = 0;
    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        sumLng += coord[0];
        sumLat += coord[1];
        count++;
      }
    }
    return { lat: sumLat / count || 0, lng: sumLng / count || 0 };
  }
  return { lat: 0, lng: 0 };
}

// Process Overpass elements (nodes, ways, relations)
for (const el of elements) {
  const tags = el.tags || {};
  const name = tags.name || `Market ${idCounter}`;
  const addressParts = [];
  if (tags['addr:street']) addressParts.push(tags['addr:street']);
  if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
  if (tags['addr:city']) addressParts.push(tags['addr:city']);
  const address = addressParts.join(', ') || 'Unknown address';
  let lat = el.lat;
  let lng = el.lon;
  if ((el.type === 'way' || el.type === 'relation') && el.center) {
    lat = el.center.lat;
    lng = el.center.lon;
  }
  const operatingHours = tags.opening_hours || '';
  const description = tags.description || '';
  const isOpen = /24\/7/.test(operatingHours);
  markets.push({
    id: idCounter++,
    name,
    address,
    lat: lat || 0,
    lng: lng || 0,
    operatingHours,
    description,
    isOpen
  });
}

// Process GeoJSON features (if any)
for (const f of features) {
  const props = f.properties || {};
  const name = props.name || `Market ${idCounter}`;
  const addressParts = [];
  if (props['addr:street']) addressParts.push(props['addr:street']);
  if (props['addr:housenumber']) addressParts.push(props['addr:housenumber']);
  if (props['addr:city']) addressParts.push(props['addr:city']);
  const address = addressParts.join(', ') || 'Unknown address';
  const { lat, lng } = extractLatLng(f);
  const operatingHours = props.opening_hours || '';
  const description = props.description || '';
  const isOpen = /24\/7/.test(operatingHours);
  markets.push({
    id: idCounter++,
    name,
    address,
    lat,
    lng,
    operatingHours,
    description,
    isOpen
  });
}

fs.writeFileSync(outPath, JSON.stringify(markets, null, 2), 'utf8');
console.log(`Transformed ${markets.length} markets to ${outPath}`);
