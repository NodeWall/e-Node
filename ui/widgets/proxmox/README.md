# Proxmox Widget

## Dependencies (Linux)
- None (uses built-in `top`, `free`, `df`)

## Fastify Endpoints
- `GET /api/system/proxmox-status` -> { cpu, memory: {percent,total,used}, disk: {total,used,available,percent}, hostname, ip, uptime, source, proxmoxUrl }

## Frontend Logic
- Fetches `/api/system/proxmox-status` every 10 sec
- Progress bars for CPU/RAM/SSD
- Node name fetched dynamically via SSH to the Proxmox host (configure host in src/config.js)
- Click navigates the **existing Dashboard tab** to the Proxmox WebUI as a **Spoke**
  (top-level navigation via `window.location.href = proxmoxUrl`). **Home** (ControlPanel)
  returns the Dashboard Content to the Hub. No new window, tab, or Chromium is created.

## Variables
- `#proxmox-cpu`, `#proxmox-ram`, `#proxmox-disk`
- `#proxmox-cpu-bar`, `#proxmox-ram-bar`, `#proxmox-disk-bar`
- `#proxmox-node`, `#proxmox-uptime`

## Config
- `PROXMOX_NODE_URL` in `src/config.js`
