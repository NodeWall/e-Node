# eNode

> **Monolithic Interactive Node** — part of the [NodeWall](https://github.com/NodeWall) ecosystem.

![eNode](e-Wall.png)

## Beyond the Headless Server: The Interactive HomeLab Node

Traditional HomeLabs force a choice between two extremes:
1. A **"blind, silent" server** tucked away in a closet (Proxmox/Ceph) with zero spatial awareness.
2. A **"dumb" wall tablet** (iPad/Android) acting merely as a thin client dashboard.

**eNode eliminates this divide.** It transforms commodity x86 hardware that already has a display and touch input (2-in-1 convertibles, touch laptops) into a self-controlled, interactive virtualization host — where the machine's own screen becomes the primary control surface.

## Architectural Pillars

### 🖥️ Monolithic Two-Tier Design
eNode runs a strict, resource-optimized monolith — no Desktop Environment, no network chaos:

- **Tier 1 — Physical Host (Proxmox VE):** Provides KVM/LXC, allocates the framebuffer, launches a bare X server, and passes the graphics socket + input devices (touchscreen/trackpad) into the container.
- **Tier 2 — Monolithic LXC:** Contains *everything* — the Node.js/Fastify backend, static UI assets, metrics collection, and a Chromium kiosk that renders the interface straight onto the host's display via the X socket.

### 🎯 Hub & Spoke UI
The interface follows a strict **Hub & Spoke** navigation model with a persistent home surface (`Slot0`) and rigid DOM-identifier validation — keeping the kiosk UI predictable and crash-resistant.

### 🔋 Native Node Resilience
Each node carries its own integrated battery, providing native node-level power resilience without external UPS hardware.

## Status

🚧 **Active Development.** eNode is a core project of the NodeWall ecosystem, maturing toward public disclosure. This repository presents the architecture and vision.

## Connect

- 🌐 [nodewall.tech](https://nodewall.tech/)
- 📫 nodewall.tech@gmail.com
- 🐙 GitHub: [NodeWall](https://github.com/NodeWall)
- 👥 Reddit: [NodeWall-Tech](https://www.reddit.com/user/NodeWall-Tech/)

---

© 2026 NodeWall. Part of the NodeWall ecosystem.
