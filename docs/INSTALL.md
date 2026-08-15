# Installing eNode

eNode installs from a **single command on the Proxmox host**. The installer
creates an LXC container, clones this repo, and deploys the host-level display
services. It also bootstraps the few host prerequisites it needs, so you do not
have to run `apt install` by hand first.

## Requirements

| Resource | Minimum |
| :--- | :--- |
| Proxmox VE host | any x86 box with a display (touch optional) |
| RAM (CT) | 1 GB |
| vCPU | 1 |
| Disk (CT rootfs) | 6 GB |
| Network | DHCP on vmbr0 |

The installer self-provides `git`, `curl`, and `ca-certificates` on the host, and
`nodejs`, `npm`, `git`, `curl`, `chromium` inside the CT. A working `deb`
package source and outbound internet (for the GitHub clone + Debian template
download) are required.

## One-command install

On the Proxmox **host** (not inside a container):

```bash
curl -sSL https://raw.githubusercontent.com/NodeWall/e-Node/main/eNode-install | bash
```

or, after cloning:

```bash
git clone https://github.com/NodeWall/e-Node.git /tmp/e-Node
bash /tmp/e-Node/eNode-install
```

That is it. The script runs the supported deployment order described below.

> ⚠️ **Scope note:** `eNode-install` installs software **directly on the Proxmox
> host** (Xorg, MQTT broker, systemd units). It is intended for **home/lab** use
> on a dedicated mini-server — not production Proxmox clusters. Run with
> `--dry-run` first to review, and test on a spare host.

## What the installer does (and in what order)

1. **Bootstrap** — ensures `git`, `curl`, `ca-certificates` are present on the host.
2. **Host display + MQTT** — installs and **starts** the bare X server
   (`xorg-core.service`) and the MQTT broker (`mosquitto`, listening on the host
   IP). This runs **before** the CT is created, because the CT binds
   `/tmp/.X11-unix/X0`, which only exists once host Xorg is running.
3. **CT create + bind + start** — creates `eNode-<host>` (VMID auto-picked, or
   `--id`), binds the X socket (`/tmp/.X11-unix/X0`) plus `/dev/input` and
   `/dev/dri` into the CT (`optional`), and creates `/opt/.X11-unix` inside the
   CT rootfs so the bind succeeds. The installer waits for the host X socket
   before starting the CT.
4. **Inside CT** — installs Node.js + chromium, clones the repo, runs
   `npm install --omit=dev`, writes `src/config.local.js` with the detected host
   IP, and deploys `enode-backend.service` + `metrics-subscriber.service`.
5. **Kiosk** — deploys the host `kiosk.service`
   (`Type=simple`, `After=xorg-core.service pve-guests.service`, waits for the
   CT, `Restart=always`) which drives Chromium inside the CT onto the host `:0`.
6. **Verify** — checks X0, CT running, backend `/api/health`, mosquitto on
   `:1883`, the subscriber unit, and `kiosk.service`; prints a clear failure and
   a non-zero exit if anything is missing.

## Common options

```bash
# custom CT name + VMID
bash eNode-install --name eNode-pve1 --id 301

# preview every action without executing
bash eNode-install --dry-run

# custom storage / template
bash eNode-install --storage local-zfs --template local:vztmpl/debian-12-standard_*.tar.zst
```

## Updating

Inside the CT:

```bash
bash eNode-update
```

Pulls the latest `main` and reinstalls Node deps. No reinstall needed.

## Boot / recovery behaviour

- `kiosk.service` does **not** start until the CT is running (`ExecStartPre`
  waits up to 90s for `pct status <id> running`) and `xorg-core.service` is up,
  so a cold host boot recovers the kiosk automatically once the CT boots.
- `enode-backend.service`, `metrics-subscriber.service`, and `metrics-publisher.service`
  all use `Restart=always`. A CT reboot self-heals the UI and metrics.

## Logging

`eNode-install` writes a full timestamped transcript to
`/var/log/eNode-install-<timestamp>.log` (in addition to the console). Keep this
file — it helps diagnose failures and is useful to share when asking for support.

## Tested on

| Component | Version |
| :--- | :--- |
| Proxmox VE (host) | 9.2.x |
| Linux kernel (host) | 7.0.x (pve) |
| LXC template | Debian 13 (standard) |
| Node.js (inside CT) | 20.x or newer |

Newer Proxmox/LXC versions may change library behaviour; if an update breaks the
display stack, this is the known-good baseline.

## Known issues / investigation

- **Physical UI sizing on some displays.** Chromium is launched with the true
  screen geometry read from the host X server (e.g. 1920×1080) and renders
  fullscreen (`~1919×1079+0+0`), but on certain panels the e-Node UI may not
  fill the physical display as expected. This is a separate display-mode
  investigation and is **not** worked around by the installer.
- **Second Xorg layer.** A second/compositing Xorg layer is **experimental and
  out of scope** of the supported deployment. The supported path uses the single
  bare host X server described above.
