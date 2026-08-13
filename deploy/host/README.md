# eNode Host Files

This directory holds the host-level configuration and scripts that `eNode-install`
deploys onto the Proxmox node. It is the declarative source for everything that
runs **on the host** (not inside the LXC).

## Contents

| File | Purpose |
|------|---------|
| `xorg.conf` | Bare Xorg server config for the physical display |
| `xorg.conf.d/10-input.conf` | Input device (touch/keyboard) passthrough |
| `systemd/xorg-core.service` | Starts Xorg on `:0` at boot |
| `systemd/kiosk.service` | Launches the Chromium kiosk inside the LXC |
| `systemd/metrics-publisher.service` | Publishes host metrics to MQTT |
| `mosquitto/enode.conf` | Local Mosquitto broker config |

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

No manual symlinks needed — `eNode-install` copies these files directly.
