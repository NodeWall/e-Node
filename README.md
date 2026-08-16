# ![eNode](ui/assets/eNode-logo.png) eNode

**Self-Displaying Node** — part of the [NodeWall](https://github.com/NodeWall/NodeWall.Tech) ecosystem.

![eNode](ui/assets/eNode.png)

## What is eNode?

eNode turns a headless Proxmox server into a self-contained physical
touchscreen web console — without installing a full desktop environment
on the hypervisor.

A physical server becomes both:
- a headless hypervisor;
- and a local touchscreen web console.

The display, touch and keyboard remain attached to the physical server,
while the web application layer runs separately and is exposed through
the local display.

```
Physical server
    │
    ├── Display
    ├── Touch
    └── Keyboard
          │
          ▼
        eNode
          │
    ┌─────┼─────┬───────┐
    ▼     ▼     ▼       ▼
 Proxmox  PBS   Home    Cameras
  WebUI   WebUI Assistant
                         │
                      Maps /
                    other Web apps
```

eNode is a local web console for a server — not just a web dashboard for Proxmox.
The Proxmox WebUI is only one of many possible web interfaces; the console can
switch between different web applications, and the dashboard can aggregate
information from multiple sources. The physical display, touch and keyboard
belong to the server, while the web application layer stays isolated from the
hypervisor host.

## Beyond the Headless Server

Most servers run headless — a black box you only touch over SSH. **eNode goes further
than that paradigm.** It turns a commodity x86 machine with a screen into a node whose own
display shows a real GUI — rendered by a container living *inside* the same host.

Not a thin client. Not a wall tablet. The server itself becomes the interface.

Instead of the **standard text console**, the host's screen renders a full HTML page served
from the node's own LXC. This is not GPU passthrough — it is display streaming: the host
runs a bare X server, the LXC shares the X socket, and a Chromium kiosk inside the container
paints the UI straight onto the monitor.

Works with **any** display. A touchscreen is just a bonus interaction layer — the core idea
works on a plain monitor too. Point it at the Proxmox Web UI and the machine boots into a
real management console, not a shell.

With a keyboard attached, the **native console is always one keystroke away**: switch to the
host's default console and back to the LXC GUI at any time (e.g. `Ctrl+Shift+F1` / `F2`).
The container UI is an overlay, not a cage.

## Why it fits on modest hardware

eNode is built around a **minimal LXC** — no Desktop Environment, no heavy browser stack
beyond what the kiosk needs. Tested on a Dell 7275 with just 8 GB of RAM: the display layer
sips resources, leaving the rest for the VMs and containers you actually want to run. You can
scale the container up (add RAM, CPU, disk) after install if your box allows. Start small,
grow later.

## Architectural Pillars

### 🧱 Monolithic Two-Tier Design
eNode runs a strict, resource-optimized monolith:

- **Tier 1 — Physical Host (Proxmox VE):** Provides KVM/LXC, allocates the framebuffer,
  launches a bare X server, and passes the graphics socket + input devices into the
  container.
- **Tier 2 — Monolithic LXC:** Contains *everything* — the Node.js/Fastify backend, static
  UI assets, metrics collection, and the Chromium kiosk that renders the interface onto the
  host's display.

### 🎯 Hub & Spoke Dashboard (example workload)
The display layer is generic — it can show *any* web UI. A reference **Hub & Spoke**
dashboard demonstrates this: a persistent home surface (`Slot0`) with widgets that launch
full web interfaces of services you already run (Proxmox, PBS, Home Assistant, OMV, and
anything else with a web UI). The dashboard is a showcase, not the core — the core is the
display streaming itself.

## One-Command Install

The single canonical command — run it **on the Proxmox host** (not inside a
container, not on your laptop):

```bash
curl -sSL https://raw.githubusercontent.com/NodeWall/e-Node/main/eNode-install | bash
```

That is the only command a user needs. The installer:

- **installs `git` (and `curl`, `ca-certificates`) on the host itself** if they
  are missing — you do **not** install `git` by hand first;
- runs a **Proxmox repository preflight** and tells you clearly (before changing
  anything) if the Enterprise repository is enabled without a working
  **No-Subscription** repository configured (a fresh, subscription-less Proxmox
  needs No-Subscription for `apt` to work);
- then installs the host display stack, creates the CT, and deploys e-Node.

`eNode-install` will:
1. Bootstrap host prerequisites it needs (`git`, `curl`, `ca-certificates`).
2. Install and **start** the host display stack (Xorg) and the MQTT broker
   (mosquitto, listening on the host IP) — **before** the CT exists.
3. Create an LXC named `eNode-<host>` (VMID auto-picked or `--id`), bind the
   host X socket + input + dri into it, and start it once the host X socket exists.
4. Inside the CT, install Node.js + git + curl, then Chromium in a separate
   step (`--no-install-recommends`), clone this repo from GitHub
   (anonymous, no credentials), and deploy the backend + metrics subscriber.
5. Deploy the host `kiosk.service` and verify the full stack. A full, timestamped
   log is written to `/var/log/eNode-install-<timestamp>.log`.

> Advanced / developer method: if you already cloned the repo, you can run
> `bash /path/to/eNode-install` from the checkout — but the `curl | bash`
> command above is the supported, recommended path for users.

The installer also has optional modes, fully documented in
[Install](docs/INSTALL.md): `--dry-run` (a strictly read-only preview of what it
would do, making no changes) and `--fix-repos` (a documented, reversible fix for
subscription-less Proxmox hosts whose Enterprise repository is still enabled).

> See [Install](docs/INSTALL.md) for the exact supported deployment order,
> options, and boot/recovery behaviour. The supported path uses a single bare
> host X server; a second Xorg layer is experimental and out of scope.

Update later (inside the CT): `bash eNode-update`.

> ⚠️ **Scope note:** `eNode-install` installs software **directly on the Proxmox host**
> (Xorg, MQTT broker, systemd units). Intended for **home/lab** use on a dedicated
> mini-server — not production Proxmox clusters. Test on a spare host first.

## Minimum Requirements

| Resource | Minimum |
| :--- | :--- |
| RAM (CT) | 1 GB |
| vCPU | 1 |
| Disk (rootfs) | 6 GB |
| Host | Proxmox VE; any x86 display (touch optional) |

## Affordability

eNode is built on second-life hardware. Example units tested by the project (used eBay
finds — rare low bids, not average market rates):

| Device | Spec | Acquired |
| :--- | :--- |
| Dell 7275 2-in-1 | m5 / 8 GB / 128 GB SATA | ~$45 |
| Dell 7285 2-in-1 | i7-7Y75 / 16 GB / 256 GB NVMe | ~$67 |
| HP Elite x2 G4 | i5-8365U / 16 GB / 256 GB SATA | ~$85 |
| HP Elite x2 G8 | i7-1185G7 / 16 GB / 256 GB SATA | ~$125 |

Second-life x86 with a display is an accessible, low-cost alternative to enterprise
rack gear. If you have an old laptop or x86 tablet lying unused, eNode is a great way to
put that e-waste to work — or pick up a cheap used unit and give it a second life as a
self-controlled interactive node.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how host + LXC stream the display
- [Install](docs/INSTALL.md) — one-command setup, options, updating
- [Security & Scope](docs/SECURITY.md) — what the installer changes on the host, risks

## Status

🚧 **Active Development.** eNode is a core project of the NodeWall ecosystem, maturing
toward public disclosure. This repository presents the architecture, install script, and
vision.

## Connect

- 🌐 [nodewall.tech](https://nodewall.tech/)
- 📫 nodewall.tech@gmail.com
- 🐙 GitHub: [NodeWall](https://github.com/NodeWall)
- 👥 Reddit: [NodeWall-Tech](https://www.reddit.com/user/NodeWall-Tech/)

---

![eNode](ui/assets/eNode-logo-tiny.png) © 2026 NodeWall.
