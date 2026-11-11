$ql = @"
[out:json][timeout:300];
{{geocodeArea:Philippines}}->searchArea;
(
  node["amenity"="marketplace"](area.searchArea);
  way["amenity"="marketplace"](area.searchArea);
  relation["amenity"="marketplace"](area.searchArea);
);
out center;
"@

Invoke-WebRequest -Uri "https://overpass-api.de/api/interpreter" -Method POST -Body $ql -Headers @{'User-Agent'='Mozilla/5.0'} -ContentType "application/x-www-form-urlencoded" -OutFile "src/assets/data/markets_raw.json"