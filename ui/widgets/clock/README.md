# Clock Widget

## Dependencies (Linux)
- None

## Fastify Endpoints
- None

## Frontend Logic
- Updates every second for time
- Updates weather every 10 minutes via Open-Meteo API (Kyiv coordinates)
- Weather: default fallback `+22°C` if API fetch fails
- Block order: weather → time → date/weekday
- Weather block contains:
  - Centered temperature (`+N°C`)
  - Centered short description
- No SVG sun icon

## Structure
```
+22°C
Мінливо хмари
HH:MM (large bold)
П'ятниця
25 червня
```
