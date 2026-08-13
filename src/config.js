// === eNode Configuration ===
// No hardcoded addresses. Proxmox endpoint is resolved at runtime:
//   1. from PROXMOX_URL env (if set), else
//   2. written by eNode-install into config.local.js (git-ignored), else
//   3. falls back to a LAN-local placeholder the operator must adjust.
//
// The deploy script (eNode-install) detects the host IP and writes config.local.js,
// so this file stays free of any internal network detail.

import { PROXMOX_NODE_URL as LOCAL_PROXMOX_URL } from './config.local.js';

export const HERMES_WEBUI_URL = 'http://localhost:3000';

// Prefer env, then generated local config, then a safe placeholder.
export const PROXMOX_NODE_URL =
  process.env.PROXMOX_URL ||
  LOCAL_PROXMOX_URL ||
  'https://proxmox.local:8006';

export const NODE_ADDRESS = process.env.NODE_ADDRESS || (typeof LOCAL_PROXMOX_URL === 'string' ? new URL(LOCAL_PROXMOX_URL).hostname : 'proxmox.local');
