import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROXMOX_NODE_URL, HERMES_WEBUI_URL } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const NETWORK_STATUS_FILE = path.join(DATA_DIR, 'network-status.json');
const HOST_METRICS_FILE = path.join(DATA_DIR, 'host-metrics.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ControlPanel -> Dashboard Window IPC (lightweight command channel).
// ControlPanel POSTs a command; the Dashboard bridge polls state and acts.
let lastCpCommand = { cmd: null, ts: 0 };

function readHostMetrics() {
  try {
    if (fs.existsSync(HOST_METRICS_FILE)) {
      const raw = fs.readFileSync(HOST_METRICS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {}
  return { cpu: 0, memory: { percent: 0 }, disk: { percent: 0 }, hostname: '', uptime: 0, ip: '' };
}

async function getCpuUsage() { return readHostMetrics().cpu; }
async function getMemoryUsage() { return readHostMetrics().memory; }
async function getDiskUsage() { return readHostMetrics().disk; }
async function getNodeHostname() { return readHostMetrics().hostname || 'hp3'; }

async function runSpeedTest() {
  try {
    const { execSync } = await import('node:child_process');
    const stdout = execSync('speedtest-cli --json --timeout 60 2>/dev/null', { timeout: 90000 });
    const result = JSON.parse(stdout);
    return {
      download: Math.round(result.download / 1000000),
      upload: Math.round(result.upload / 1000000),
      ping: result.ping,
      timestamp: Date.now(),
      method: 'speedtest-cli',
    };
  } catch {
    return { download: 0, upload: 0, ping: 0, timestamp: Date.now(), method: 'failed' };
  }
}

async function backgroundSpeedTest() {
  const result = await runSpeedTest();
  try { fs.writeFileSync(NETWORK_STATUS_FILE, JSON.stringify(result, null, 2)); } catch(e) {}
  console.log('[Network] Speed test:', result.download, 'Mbps');
}

setInterval(backgroundSpeedTest, 30 * 60 * 1000);
setTimeout(backgroundSpeedTest, 10000);

export default async function systemRoutes(fastify, opts) {
  fastify.get('/api/system/brightness', async () => ({ brightness: 100 }));
  fastify.post('/api/system/brightness', async (req) => {
    const { value } = req.body || {};
    return { ok: true, value };
  });
  fastify.get('/api/system/screen', async () => ({ state: 'on' }));
  fastify.post('/api/system/screen', async (req) => {
    const { state } = req.body || {};
    return { ok: true, state };
  });
  fastify.get('/api/system/volume', async () => ({ volume: 50 }));
  fastify.post('/api/system/volume', async (req) => {
    const { value } = req.body || {};
    return { ok: true, value };
  });

  fastify.get('/api/system/proxmox-status', async () => {
    const metrics = readHostMetrics();
    return {
      cpu: metrics.cpu,
      memory: metrics.memory,
      disk: metrics.disk,
      hostname: metrics.hostname || 'hp3',
      ip: metrics.ip || '',
      uptime: Math.round(process.uptime()),
      timestamp: Date.now(),
      source: 'mqtt-host',
      proxmoxUrl: PROXMOX_NODE_URL,
    };
  });

  fastify.get('/api/system/network-status', async () => {
    try {
      if (fs.existsSync(NETWORK_STATUS_FILE)) {
        return JSON.parse(fs.readFileSync(NETWORK_STATUS_FILE, 'utf8'));
      }
    } catch {}
    return { download: 0, upload: 0, ping: 0, timestamp: Date.now(), source: 'pending' };
  });

  fastify.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    url: '/api/proxy/hermes/*',
    handler: async (req, reply) => {
      const url = req.url.replace('/api/proxy/hermes/', '');
      try {
        await reply.from(HERMES_WEBUI_URL + '/' + url, {
          rewriteRequestHeaders: (orig, headers) => ({ ...headers, host: 'localhost:3000' }),
        });
      } catch (err) {
        reply.code(502).send({ error: 'Hermes proxy error', message: err.message });
      }
    }
  });

  fastify.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    url: '/api/proxy/proxmox/*',
    handler: async (req, reply) => {
      const url = req.url.replace('/api/proxy/proxmox/', '');
      try {
        await reply.from(PROXMOX_NODE_URL + '/' + url, {
          rewriteRequestHeaders: (orig, headers) => ({ ...headers, host: new URL(PROXMOX_NODE_URL).host }),
          rewriteHeaders: (headers) => {
            const c = { ...headers };
            delete c['x-frame-options'];
            delete c['content-security-policy'];
            delete c['content-security-policy-report-only'];
            c['x-frame-options'] = 'SAMEORIGIN';
            return c;
          },
        });
      } catch (err) {
        reply.code(502).send({ error: 'Proxmox proxy error', message: err.message });
      }
    }
  });

  // ControlPanel -> Dashboard Window command channel (Home / Logo etc.)
  fastify.post('/api/cp/command', async (req) => {
    const { cmd } = req.body || {};
    if (!cmd) return reply.code(400).send({ error: 'missing cmd' });
    lastCpCommand = { cmd, ts: Date.now() };
    return { ok: true, cmd, ts: lastCpCommand.ts };
  });

  fastify.get('/api/cp/state', async () => lastCpCommand);
}