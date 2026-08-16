# Security & Scope

eNode is a **home/lab** project. Read this before running `eNode-install` on
any machine you care about.

## What eNode-install changes on the host

The installer does **not** containerize everything. For display streaming to
work, it places services directly on the Proxmox node:

| Change | Location |
| :--- | :--- |
| Xorg bare server | `/etc/X11/xorg.conf`, `/etc/X11/xorg.conf.d/` |
| systemd units | `/etc/systemd/system/xorg-core.service`, `kiosk.service`, `metrics-publisher.service` |
| MQTT broker | `/etc/mosquitto/conf.d/enode.conf` + `mosquitto.service` |
| Helper scripts | `/usr/local/bin/kiosk-start.sh`, `metrics-publisher.sh`, `metrics-subscriber.sh` |

It also creates an LXC container and installs `xserver-xorg-core`,
`x11-xserver-utils`, `libinput-bin`, `mosquitto` via `apt`.

## Risks

- **Host software changes.** Proxmox is designed to be minimal. Adding Xorg +
  mosquitto is unusual. On a production cluster this can interfere with
  updates or other workloads.
- **Display takeover.** The host's physical console is replaced by the eNode
  kiosk at boot (recoverable via `Ctrl+Shift+F1`/`F2`).
- **No sandbox for host services.** Host units run on the node, not in a VM.
- **DNS is changed only if missing.** `eNode-install` rewrites the host
  `/etc/resolv.conf` to a fallback nameserver **only when it has no valid
  nameserver** (a `.eNode-bak` backup is kept). If your host already resolves
  names, nothing is touched. It never removes existing nameservers.
- **Repository fix is opt-in and minimal.** `--fix-repos` only edits APT source
  files in `/etc/apt/sources.list.d/` (adds `Enabled: false` to Enterprise
  sources, ensures a `pve-no-subscription` source is present). It never weakens
  APT signature verification, never uses `--allow-insecure`, and never disables
  the Debian security suite. Without `--fix-repos` the installer **aborts** if it
  detects a broken Enterprise-only repo config, leaving the host untouched.
- **`--dry-run` is strictly read-only.** It performs only detection and prints a
  plan; it never downloads the Debian template, runs `apt-get`, creates the CT,
  starts Xorg, or modifies any system file.

## Recommendations

1. **Test on a spare host first.** A cheap convertible/lab box is ideal.
2. Use `--dry-run` to review every action before executing.
3. Do **not** run on a production Proxmox cluster without isolating eNode on a
   dedicated node.
4. The LXC clones the repo **anonymously** (no token, no push access). Only
   `NodeWall` collaborators can write to the repo; users only pull.

## Credentials

`eNode-install` never embeds or transmits any credential. It detects the host
IP at runtime and writes it to the git-ignored `src/config.local.js` inside the
CT. The Proxmox root password (if used for an SSH variant) is supplied by the
operator at runtime and never stored in the repo.
