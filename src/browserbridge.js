// e-Node BrowserBridge — minimal in-process Chromium control capability.
//
// Single responsibility on this stage:
//   HOME -> navigate the EXISTING Dashboard Chromium current tab to the Hub.
//
// This is NOT a daemon, service, process, or polling consumer. It is a small
// module imported by the Fastify backend. It does a one-shot:
//   connect -> Page.navigate -> close
// using the Node 20 built-in WebSocket (--experimental-websocket).
//
// Design boundary: system.js (the HTTP backend) stays free of Chromium
// DevTools internals; this module owns them.

// CDP HTTP endpoint for the Dashboard Chromium only.
// Dashboard Chromium is launched (enode-display-start.sh) with
// --remote-debugging-port bound to 127.0.0.1, so this port belongs
// exclusively to the Dashboard instance, never to ControlPanel.
const CDP_HTTP = 'http://127.0.0.1:9222';

// Hub URL the Dashboard tab is navigated to.
const DASHBOARD_HUB_URL = 'http://127.0.0.1:3000/dashboard.html';

// Pick the existing Dashboard page target deterministically.
// The Dashboard Chromium runs exactly one top-level tab (kiosk), so we
// select the single target of type "page" and never create/open anything.
async function getDashboardTarget() {
  const res = await fetch(`${CDP_HTTP}/json`);
  if (!res.ok) {
    throw new Error(`CDP /json unreachable (status ${res.status})`);
  }
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page');
  if (!page || !page.webSocketDebuggerUrl) {
    throw new Error('No existing Dashboard page target found via CDP');
  }
  return page.webSocketDebuggerUrl;
}

// Open a CDP WebSocket, send one command, await its result, close.
function cdpSend(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let settled = false;
    const msgId = 1;

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch { /* ignore */ }
      if (err) reject(err);
      else resolve(value);
    };

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return finish(new Error('Invalid CDP message: ' + e.message));
      }
      if (msg.id === msgId) {
        if (msg.error) {
          return finish(new Error(`CDP ${method} failed: ${msg.error.message}`));
        }
        return finish(null, msg.result);
      }
    });

    ws.addEventListener('error', (event) => {
      finish(new Error('CDP WebSocket error: ' + (event.message || 'unknown')));
    });

    // Fail fast if Chromium is not reachable.
    setTimeout(() => finish(new Error('CDP WebSocket timeout')), 5000);
  });
}

// Navigate the existing Dashboard tab to the Hub.
export async function home() {
  const wsUrl = await getDashboardTarget();
  await cdpSend(wsUrl, 'Page.navigate', { url: DASHBOARD_HUB_URL });
  return { ok: true, url: DASHBOARD_HUB_URL };
}
