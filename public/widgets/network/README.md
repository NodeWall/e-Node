# Network Widget

## Dependencies (Linux)
```bash
apt install speedtest-cli
```

## Fastify Endpoints
- `GET /api/system/network-status` -> { download, upload, ping, timestamp, method }

## Frontend Logic
- Fetches `/api/system/network-status` every 5 min
- Fallback static values: Ping=2ms, Download=942Mbps, Upload=935Mbps
- Logo: `/widgets/network/logo.png` (Triolan brand)

## Variables
- `#net-ping`, `#net-download`, `#net-upload`, `#net-timestamp`
