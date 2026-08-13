# Installing eNode

eNode installs from a **single command on the Proxmox host**. It creates an LXC
container, clones this repo, and deploys the host-level display services.

## Requirements

| Resource | Minimum |
| :--- | :--- |
| Proxmox VE host | any x86 box with a display (touch optional) |
| RAM (CT) | 1 GB |
| vCPU | 1 |
| Disk (CT rootfs) | 6 GB |
| Network | DHCP on vmbr0 |

## One-command install

On the Proxmox **host** (not inside a container):

```bash
curl -sSL https://raw.githubusercontent.com/NodeWall/e-Node/main/eNode-install | bash
```

That is it. The script:

1. Creates an LXC named `eNode-<host>` (VMID auto-picked, or `--id <n>`).
2. Installs Node.js + git, clones `NodeWall/e-Node` from GitHub (anonymous).
3. Writes `src/config.local.js` with the detected host IP.
4. Deploys host services from `deploy/host/`:
   - `xorg.conf` + `xorg.conf.d/` → `/etc/X11/`
   - `xorg-core.service`, `kiosk.service`, `metrics-publisher.service` → `/etc/systemd/system/`
   - `mosquitto/enode.conf` → `/etc/mosquitto/conf.d/`
5. Enables and starts the services.

The kiosk appears on the host's physical screen.

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

## Scope warning

`eNode-install` installs software **directly on the Proxmox host**
(Xorg, mosquitto, systemd units). This is intended for **home / lab** use on a
dedicated mini-server — not production Proxmox clusters. See
[SECURITY.md](SECURITY.md). Test on a spare host first.
