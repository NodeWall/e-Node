# eNode Architecture

How eNode turns a headless Proxmox box with a screen into a self-displaying
interactive node. No GPU passthrough, no desktop environment — just display
streaming from an LXC container to the host's bare X server.

## Two tiers

```
┌─────────────────────────────────────────────────────────┐
│  Proxmox VE HOST  (the physical x86 box with a screen)   │
│                                                           │
│  ┌────────────────────────────────────────────┐         │
│  │ Bare X server (Xorg, no DE)                 │         │
│  │  - owns the framebuffer + input devices     │         │
│  │  - unix socket: /tmp/.X11-unix/X0           │         │
│  └────────────────────────────────────────────┘         │
│            │ shares X socket + /dev/input                  │
│            ▼                                               │
│  ┌────────────────────────────────────────────┐         │
│  │ LXC container "eNode-<node>"  (unprivileged)│         │
│  │                                             │         │
│  │  Chromium kiosk  ──paints──▶ host X socket  │         │
│  │        │                                    │         │
│  │  Fastify backend (Node.js)                  │         │
│  │    - serves ui/ (HTML/CSS/JS)               │         │
│  │    - /api/proxy/* → Proxmox / Hermes WebUI  │         │
│  │    - /api/system/* → host metrics (MQTT)    │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## Data flow (on a finger)

1. Host boots Proxmox. `xorg-core.service` starts a bare X server on the
   physical display. No login manager, no desktop.
2. `eNode-install` creates the LXC and passes the X socket + input devices
   into it (bind mount / device passthrough).
3. Inside the LXC, `kiosk.service` launches Chromium in kiosk mode pointing
   at `http://localhost:3000` (the Fastify backend).
4. Chromium renders into the host's X server → the physical screen shows the
   eNode UI instead of a blank console.
5. The UI is generic: it can show the Proxmox WebUI, Home Assistant, OMV, or
   any web service via reverse proxy (`/api/proxy/*`).
6. Host metrics (CPU/RAM/disk) are published by `metrics-publisher.service`
   over MQTT; `metrics-subscriber.sh` (inside LXC) writes them to
   `src/data/host-metrics.json` for the dashboard.

## Why not GPU passthrough?

Passthrough binds the GPU to one VM and complicates the host. eNode keeps the
GPU on the host (Xorg) and lets the container *share* the already-rendered
output. Simpler, works on any iGPU, and the native console stays one keystroke
away (`Ctrl+Shift+F1` / `F2`).

## Keyboard / console escape

With a keyboard attached, the host's standard console is always reachable.
Switch to it and back to the LXC GUI with `Ctrl+Shift+F1` / `F2`. The container
UI is an overlay, not a cage.

## File layout (this repo)

| Path | Role |
| :--- | :--- |
| `server.js` | Fastify backend entrypoint |
| `src/` | backend routes + config (no hardcoded addresses) |
| `ui/` | frontend (HTML/CSS/JS, widgets) |
| `deploy/host/` | declarative host files (xorg, systemd, mosquitto) |
| `deploy/scripts/` | host-side helper scripts |
| `eNode-install` | host bootstrap (creates CT, clones repo, deploys host) |
| `eNode-update` | pull latest from GitHub inside the CT |
