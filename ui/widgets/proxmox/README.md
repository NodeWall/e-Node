# Proxmox Widget

## Dependencies (Linux)
- None (uses built-in `top`, `free`, `df`)

## Fastify Endpoints
- `GET /api/system/proxmox-status` -> { cpu, memory: {percent,total,used}, disk: {total,used,available,percent}, hostname, uptime, source }

## Frontend Logic
- Fetches `/api/system/proxmox-status` every 10 sec
- Progress bars for CPU/RAM/SSD
- Node name fetched dynamically via SSH to the Proxmox host (configure host in src/config.js)
- Click opens WebUI in new window: `window.open(PROXMOX_NODE_URL, '_blank')`

## Variables
- `#proxmox-cpu`, `#proxmox-ram`, `#proxmox-disk`
- `#proxmox-cpu-bar`, `#proxmox-ram-bar`, `#proxmox-disk-bar`
- `#proxmox-node`, `#proxmox-uptime`

## Config
- `PROXMOX_NODE_URL` in `src/config.js`
