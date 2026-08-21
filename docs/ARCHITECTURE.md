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
│  │ LXC container "eNode-<node>"                │         │
│  │                                             │         │
│  │  Two Chromium X11 windows  ──paint──▶ host X│         │
│  │        │                                    │         │
│  │  Fastify backend (Node.js)                  │         │
│  │    - serves ui/ (HTML/CSS/JS)               │         │
│  │    - /api/proxy/* → Proxmox / Hermes WebUI  │         │
│  │    - /api/system/* → host metrics (MQTT)    │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

> **CT privilege (current implementation, not a project requirement).**
> The container is created **privileged** (`unprivileged=0`) so it can bind-mount
> the host X socket, `/dev/input`, and `/dev/dri`. Whether eNode should run on a
> privileged or unprivileged CT is still an open question under separate
> investigation; the description above reflects what `eNode-install` does today,
> not a settled design decision.

## X11 Window vs UI — two distinct concepts

eNode draws the interface with **Chromium X11 windows** on the host's bare X
server. Each window is a *display surface*; the *content* rendered inside it is a
separate *web UI*. Do not conflate the two:

- The **X11 Window** is what Chromium/X11 creates on the host display — it has a
  position and a size in screen pixels (`--window-position`, `--window-size`).
- The **UI** is the HTML/CSS/JS loaded from the eNode backend (`ui/…`) and laid
  out inside that window's viewport. The UI has its own dimensions and internal
  positioning, which are independent of the X11 window's pixel size.

Geometry of an X11 Window (where it sits on the physical screen, how many pixels
it occupies) is a different thing from the geometry of the UI painted inside it.

## Display surfaces

The display runtime launches **two independent Chromium X11 windows**, each with
its own `--user-data-dir`:

| X11 Window | Content (UI) | Launched at |
| :--- | :--- | :--- |
| **Dashboard X11 Window** | **Dashboard UI** — `ui/dashboard.html` (the widget grid: clock, maps, network, Proxmox, cameras, Home Assistant) | `http://localhost:3000/` |
| **ControlPanel X11 Window** | **ControlPanel UI** — `ui/controlpanel.html` (the control bar: logo, brightness, home, volume, settings) | `http://localhost:3000/controlpanel.html` |

Both windows stream onto the host `:0` from inside the CT. The Dashboard UI is
the primary surface; the ControlPanel UI is a slim, always-available control bar
driven by its own X11 window.

### ControlPanel geometry — current implementation note

This is a current implementation characteristic of the display runtime, not a
troubleshooting note:

- The ControlPanel X11 Window is requested at **60 px** height
  (`--window-size=<W>,60`).
- In the current Chromium/X11 behaviour the window is **actually created at
  87 px** height, not 60 px.
- The **ControlPanel UI itself is 60 px** tall and is positioned at the top edge
  of the window viewport (`top: 0`).
- With the ControlPanel X11 Window placed at **Y = 1020** on a **1920×1080**
  display (Dashboard Window occupies Y 0–1020), the 60 px of visible UI
  (Y 1020–1080) stay on screen, while the extra ~27 px of the 87 px window
  (Y 1080–1107) falls past the physical bottom edge of the display.

The net effect is correct: the ControlPanel UI is fully visible at the bottom of
the screen, and the overflowing window portion is simply clipped by the display
boundary.

## Data flow (on a finger)

1. Host boots Proxmox. `xorg-core.service` starts a bare X server on the
   physical display (and creates `/tmp/.X11-unix/X0`). No login manager, no desktop.
2. `eNode-install` **starts the host X server and the MQTT broker first**, then
   creates the LXC and passes the X socket + input devices into it (bind mount /
   device passthrough). The X11 socket is bound with `optional` and the parent
   dir `/opt/.X11-unix` is created in the CT rootfs so the bind mount succeeds.
   The installer refuses to start the CT until the host X socket exists.
3. Inside the LXC, `enode-display.service` (host-side, `Type=simple`,
   `After=xorg-core.service pve-guests.service`, waits for the CT to be running)
   launches the **two** Chromium X11 windows described above, each pointing at
   its UI endpoint.
4. Chromium renders into the host's X server → the physical screen shows the
   eNode Dashboard UI (with the ControlPanel UI bar) instead of a blank console.
5. The UI is generic: it can show the Proxmox WebUI, Home Assistant, OMV, or
   any web service via reverse proxy (`/api/proxy/*`).
6. Host metrics (CPU/RAM/disk) are published by `metrics-publisher.service`
   over MQTT; `metrics-subscriber.sh` (inside LXC) writes them to
   `src/data/host-metrics.json` for the dashboard. `src/data/` is runtime-generated
   and is git-ignored.

## Host services

| Service | Runs on | Role |
| :--- | :--- | :--- |
| `xorg-core.service` | host | bare X server on `:0` at boot |
| `enode-display.service` | host | launches/stops the two Chromium X11 windows inside the CT |
| `metrics-publisher.service` | host | publishes host metrics to MQTT |
| `mosquitto.service` | host | local MQTT broker (listens on host IP) |
| `enode-backend.service` | CT | Fastify backend (serves `ui/`, proxies, metrics API) |
| `metrics-subscriber.service` | CT | subscribes MQTT → `src/data/host-metrics.json` |

The display runtime uses two helper scripts deployed on the host:
`enode-display-start.sh` (launches the Chromium windows inside the CT) and
`enode-display-stop.sh` (stops exactly the e-Node Chromium processes on service
stop, so no orphan survives).

## Display lifecycle

- `enode-display.service` does **not** start until the CT is running
  (`ExecStartPre` waits up to 90s for `pct status <id> running`) and `xorg-core.service`
  is up, so a cold host boot recovers the two-window display automatically once the
  CT boots.
- On start, `enode-display-start.sh` links the host X socket into the CT's
  standard `/tmp/.X11-unix/X0` path, waits for the backend on `:3000`, reads the
  real screen geometry from the host X server, and launches the Dashboard and
  ControlPanel Chromium windows with separate profiles.
- On stop, `enode-display-stop.sh` terminates precisely the e-Node Chromium
  processes (by their tracked PIDs and profile paths) and clears any leftover
  profile lock, so the next start is clean.
- `enode-backend.service`, `metrics-subscriber.service`, and
  `metrics-publisher.service` all use `Restart=always`. A CT reboot self-heals the
  UI and metrics.

## Why not GPU passthrough?

Passthrough binds the GPU to one VM and complicates the host. eNode keeps the
GPU on the host (Xorg) and lets the container *share* the already-rendered
output. Simpler, works on any iGPU, and the native console stays one keystroke
away (`Ctrl+Shift+F1` / `F2`).

## Keyboard / console escape

With a keyboard attached, the host's standard console is always reachable.
Switch to it and back to the LXC GUI with `Ctrl+Shift+F1` / `F2`. The container
UI is an overlay, not a cage.

## Known issues / out of scope

- **Physical UI sizing.** Chromium is launched fullscreen at the host X server's
  real geometry, but on some panels the e-Node UI does not fill the physical
  display as expected. This is a separate display-mode investigation; it is not
  patched by the installer.
- **Second Xorg layer.** A second/compositing Xorg layer is **experimental and
  not part of the supported deployment**. The supported path uses the single bare
  host X server described above.

## File layout (this repo)

| Path | Role |
| :--- | :--- |
| `server.js` | Fastify backend entrypoint |
| `src/` | backend routes + config (no hardcoded addresses) |
| `ui/` | frontend (HTML/CSS/JS, widgets) |
| `deploy/host/` | declarative host files (xorg, systemd, mosquitto) |
| `deploy/scripts/` | host-side helper scripts |
| `eNode-install` | host bootstrap (creates CT, clones repo, deploys host) |
