# Maps Widget

## Dependencies (Linux)
- None (Leaflet.js loaded from CDN)

## Fastify Endpoints
- None (uses external OSRM API)

## Frontend Logic
- Mini-map in dashboard tile: Leaflet + OpenStreetMap tiles
- Route fetched from OSRM: `https://router.project-osrm.org/route/v1/driving/{start};{end}?overview=full&geometries=geojson`
- Zoom/pan disabled on mini-map (static indicator)
- Click opens `maps.html` in iframe (full interactive map with Waze Live)

## Coordinates
- Start: Shchaslyve, Zhytomyrska 6 -> 50.3752, 30.7989
- End: Livoberezhna metro, Kyiv -> 50.4517, 30.5981
- Route via M06/E40 (Boryspil highway)

## Spoke (maps.html)
- Waze Live Map Embed: `https://www.waze.com/livemap/embed?zoom=11&lat=50.4150&lon=30.6980`
- Shows live traffic and ETA
