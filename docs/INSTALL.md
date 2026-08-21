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
| Disk (CT rootfs) | 12 GB |
| Network | DHCP on vmbr0 |

The installer self-provides `git`, `curl`, and `ca-certificates` on the host, and
`nodejs`, `npm`, `git`, `curl`, `chromium` inside the CT. A working `deb`
package source and outbound internet (for the GitHub clone + Debian
template download) are required. **On a fresh Proxmox host without a subscription,
enable the No-Subscription repository first** (see "Proxmox repository check"
below) — the installer will refuse to start if the Enterprise repository is the
only configured PVE source.

## One-command install

Run this **on the Proxmox host** (not inside a container, not on your laptop):

```bash
curl -sSL https://raw.githubusercontent.com/NodeWall/e-Node/main/eNode-install | bash
```

This is the single supported command for users. The installer **installs `git`
itself** if it is missing, so you **do not** need to run `git`/`apt` by hand
first. It also runs the Proxmox repository preflight and stops with a clear
message if a subscription-less host still has the Enterprise repo enabled
without No-Subscription configured.

> Advanced / developer method: if you already cloned the repo, run
> `bash /path/to/eNode-install` from the checkout. This is equivalent, but the
> `curl | bash` command above is the recommended path.

That is it. The script runs the supported deployment order described below.

> ⚠️ **Scope note:** `eNode-install` installs software **directly on the Proxmox
> host** (Xorg, MQTT broker, systemd units). It is intended for **home/lab** use
> on a dedicated mini-server — not production Proxmox clusters. Test on a spare
> host first.

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
4. **Inside CT** — installs Node.js + git + curl (base step), then Chromium
   **in a separate step** with `--no-install-recommends`; clones the repo, runs
   `npm install --omit=dev`, writes `src/config.local.js` with the detected host
   IP, and deploys `enode-backend.service` + `metrics-subscriber.service`.
5. **Display** — deploys the host `enode-display.service`
   (`Type=simple`, `After=xorg-core.service pve-guests.service`, waits for the
   CT) which launches **two** independent Chromium X11 windows inside the CT
   onto the host `:0` (Dashboard window → `/`, ControlPanel window →
   `/controlpanel.html`), each with its own `--user-data-dir`. The helper scripts
   `enode-display-start.sh` and `enode-display-stop.sh` are installed on the host
   to drive the windows.
6. **Verify** — checks X0, CT running, backend `/api/health`, mosquitto on
   `:1883`, the subscriber unit, and `enode-display.service`; prints a clear failure and
   a non-zero exit if anything is missing.

## Safety & reliability behaviour

- **APT is bounded.** Every `apt-get` runs with `Acquire::Retries=3` and
  connect/read timeouts (15s/60s). The Debian security suite and package
  signatures are **never** disabled.
- **Chromium is installed in its own step** with `--no-install-recommends`, so a
  Chromium problem is isolated and diagnosable and does not pull the whole
  printing/avahi/GTK desktop stack.
- **DNS is touched only as a last resort.** The installer rewrites the host
  `/etc/resolv.conf` to a fallback nameserver **only if it has no valid
  nameserver at all** (it keeps a `.eNode-bak` backup). If the host already has
  DNS, it is left untouched.
- **Re-running is safe.** If `/var/www/e-node` already exists as an eNode git
  checkout, the installer updates it in place (`git pull`) instead of deleting
  it. It refuses to silently overwrite a CT that does not look like an eNode
  deployment.

## Proxmox repository check (preflight) — for subscription-less hosts

A fresh Proxmox VE install enables the **Enterprise** repository
(`enterprise.proxmox.com`), which returns **HTTP 401** without a valid
subscription. On such a host a plain `apt-get update` fails.

`eNode-install` runs a **read-only preflight** before touching anything and
detects the repository state from the DEB822 `.sources` files in
`/etc/apt/sources.list.d/` (and legacy `.list`):

- If the **Enterprise PVE repo is enabled** and the **No-Subscription repo is not
  configured** (or is also enabled, which still 401s), the installer prints a
  clear explanation and exits non-zero **before any deployment** — no partial
  state, no `apt-get update` 401 in your face. This is part of the normal
  install flow and needs no extra flag.
- To proceed on a subscription-less host, either fix the repos manually
  (disable Enterprise, enable `pve-no-subscription`), or pass **`--fix-repos`**,
  an **optional** mode that performs exactly the documented, reversible Proxmox
  change:
  - adds `Enabled: false` to every Enterprise source
  - ensures a `pve-no-subscription` source is present and enabled
- `--fix-repos` only ever modifies APT source files; it never weakens signature
  verification or touches anything else.

```bash
# installer explains the problem and stops:
curl -sSL .../eNode-install | bash
#   ERROR: Enterprise PVE repository is enabled but No-Subscription ...
#   Fix it manually, or re-run with:  eNode-install --fix-repos

# let the installer apply the safe, reversible fix, then deploy:
curl -sSL .../eNode-install | bash -s -- --fix-repos
```

## Options

```bash
# custom CT name + VMID
bash eNode-install --name eNode-pve1 --id 301

# preview every action without executing
bash eNode-install --dry-run

# custom storage / template (Debian 13 is the standard target)
bash eNode-install --storage local-zfs --template local:vztmpl/debian-13-standard_*.tar.zst
```

## Boot / recovery behaviour

- `enode-display.service` does **not** start until the CT is running (`ExecStartPre`
  waits up to 90s for `pct status <id> running`) and `xorg-core.service` is up,
  so a cold host boot recovers the two-window display automatically once the CT boots.
- `enode-backend.service`, `metrics-subscriber.service`, and `metrics-publisher.service`
  all use `Restart=always`. A CT reboot self-heals the UI and metrics.

## Display surfaces

The display runtime opens **two** Chromium X11 windows (do not confuse the window
with the UI rendered inside it):

| X11 Window | UI | Loaded from |
| :--- | :--- | :--- |
| Dashboard X11 Window | Dashboard UI (widget grid) | `http://localhost:3000/` |
| ControlPanel X11 Window | ControlPanel UI (control bar) | `http://localhost:3000/controlpanel.html` |

The ControlPanel X11 Window is requested at 60 px height; the current Chromium/X11
implementation creates the window at 87 px, while the ControlPanel UI itself is
60 px tall and sits at the top of the window viewport. Placed at Y = 1020 on a
1920×1080 display, the 60 px UI stays visible and the extra window height is
clipped by the physical display edge.

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
  fullscreen, but on certain panels the e-Node UI may not fill the physical
  display as expected. This is a separate display-mode investigation and is
  **not** worked around by the installer.
- **Second Xorg layer.** A second/compositing Xorg layer is **experimental and
  out of scope** of the supported deployment. The supported path uses the single
  bare host X server described above.
