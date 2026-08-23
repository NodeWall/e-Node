# eNode Host Files

This directory holds the host-level configuration and scripts that `eNode-install`
deploys onto the Proxmox node. It is the declarative source for everything that
runs **on the host** (not inside the LXC).

## Display runtime

The current display runtime is the **two-window Xorg** model: the host runs a
single bare X server (`:0`), and the host-side `enode-display.service` launches
**two** Chromium X11 windows inside the CT — the **Dashboard** window
(`ui/dashboard.html`) and the **ControlPanel** window (`ui/controlpanel.html`) —
each with its own `--user-data-dir`. See `docs/ARCHITECTURE.md` for the full
picture.

### ControlPanel Home — local-only CDP endpoint

The **Dashboard Chromium** is launched with a **local-only** CDP endpoint
(`--remote-debugging-address=127.0.0.1 --remote-debugging-port=9222`, bound to
`127.0.0.1` only). This endpoint is used by the in-process **BrowserBridge**
(`src/browserbridge.js`) to navigate the existing Dashboard tab back to the Hub
when the ControlPanel **Home** action is triggered. The backend runs with Node's
built-in WebSocket support (`--experimental-websocket`) for this narrow Home path.
The **ControlPanel Chromium has no CDP debugging endpoint.** Do not remove these
flags — without them the ControlPanel Home action cannot reach the Dashboard tab.

## Contents

| File | Purpose |
|------|---------|
| `xorg.conf` | Bare Xorg server config for the physical display |
| `xorg.conf.d/10-input.conf` | Input device (touch/keyboard) passthrough |
| `systemd/xorg-core.service` | Starts Xorg on `:0` at boot |
| `systemd/enode-display.service` | Launches/stops the two Chromium X11 windows inside the CT |
| `systemd/metrics-publisher.service` | Publishes host metrics to MQTT |
| `mosquitto/enode.conf` | Local Mosquitto broker config |
| `../scripts/enode-display-start.sh` | Launches the Chromium windows inside the CT |
| `../scripts/enode-display-stop.sh` | Stops the e-Node Chromium processes on service stop |

## System dependencies (installed by eNode-install)

- `xserver-xorg-core`, `x11-xserver-utils`, `libinput-bin` — graphics stack
- `mosquitto`, `mosquitto-clients` — MQTT broker + `mosquitto_pub`

## Deploy target paths

| Source | Installed to |
|--------|--------------|
| `xorg.conf` | `/etc/X11/xorg.conf` |
| `xorg.conf.d/*` | `/etc/X11/xorg.conf.d/` |
| `systemd/*.service` | `/etc/systemd/system/` |
| `mosquitto/enode.conf` | `/etc/mosquitto/conf.d/enode.conf` |
| `../scripts/enode-display-*.sh` | `/usr/local/bin/` |

No manual symlinks needed — `eNode-install` copies these files directly.
