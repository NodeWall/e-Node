// e-Node BrowserBridge — minimal in-process Chromium control capability.
//
// Single responsibility on this stage:
//   HOME -> activate the EXISTING persistent Hub Dashboard target.
//   SPOKE -> create/activate ephemeral Spoke, Hub stays alive.
//
// This is NOT a daemon, service, process, or polling consumer. It is a small
// module imported by the Fastify backend. It does one-shot:
//   connect -> Target.createTarget/activateTarget/closeTarget -> close
// using the Node 20 built-in WebSocket (--experimental-websocket).
//
// Design boundary: system.js (the HTTP backend) stays free of Chromium
// DevTools internals; this module owns them.

const CDP_HTTP = 'http://127.0.0.1:9222';
const DASHBOARD_HUB_URL = 'http://127.0.0.1:3000/dashboard.html';

async function getBrowserWsUrl() {
  const res = await fetch(`${CDP_HTTP}/json/version`);
  if (!res.ok) throw new Error(`CDP /json/version unreachable (status ${res.status})`);
  const version = await res.json();
  if (!version?.webSocketDebuggerUrl) throw new Error('No browser WebSocket URL found in version info');
  return version.webSocketDebuggerUrl;
}

async function getHubTarget() {
  const res = await fetch(`${CDP_HTTP}/json`);
  if (!res.ok) throw new Error(`CDP /json unreachable (status ${res.status})`);
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page' && t.url === DASHBOARD_HUB_URL);
  if (!page || !page.webSocketDebuggerUrl) throw new Error('No existing Hub target found via CDP');
  return { wsUrl: page.webSocketDebuggerUrl, targetId: page.id };
}

function cdpSend(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let settled = false;
    const msgId = 1;
    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      if (err) reject(err);
      else resolve(value);
    };
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (e) { return finish(new Error('Invalid CDP message: ' + e.message)); }
      if (msg.id === msgId) {
        if (msg.error) return finish(new Error(`CDP ${method} failed: ${msg.error.message}`));
        return finish(null, msg.result);
      }
    });
    ws.addEventListener('error', (event) => finish(new Error('CDP WebSocket error: ' + (event.message || 'unknown'))));
    setTimeout(() => finish(new Error('CDP WebSocket timeout')), 5000);
  });
}

let trackedSpokeId = '';

export async function openSpoke(url) {
  const browserWs = await getBrowserWsUrl();
  await getHubTarget();

  // Fix: Ensure URL is fully qualified for CDP
  const fullUrl = url.startsWith('http') ? url : `http://127.0.0.1:3000${url.startsWith('/') ? '' : '/'}${url}`;

  if (trackedSpokeId) {
    try { await cdpSend(browserWs, 'Target.closeTarget', { targetId: trackedSpokeId }); } catch {}
  }
  const created = await cdpSend(browserWs, 'Target.createTarget', { url: fullUrl });
  const spokeId = created.targetId;
  await cdpSend(browserWs, 'Target.activateTarget', { targetId: spokeId });
  trackedSpokeId = spokeId;
  return { ok: true, spokeId };
}

export async function home() {
  const browserWs = await getBrowserWsUrl();
  const { targetId: hubId } = await getHubTarget();

  // Fix: Close ALL targets except the Hub to prevent memory leaks
  const res = await fetch(`${CDP_HTTP}/json`);
  if (res.ok) {
    const targets = await res.json();
    for (const target of targets) {
      if (target.id !== hubId && target.type === 'page') {
        try { await cdpSend(browserWs, 'Target.closeTarget', { targetId: target.id }); } catch {}
      }
    }
  }
  
  trackedSpokeId = '';
  await cdpSend(browserWs, 'Target.activateTarget', { targetId: hubId });
  return { ok: true, targetId: hubId };
}
