export const proxmoxWidget = {
  init() {
    this.el = document.getElementById('proxmox-widget');
    if (!this.el) return;
    this.render();
    this.refreshMetrics();
    setInterval(() => this.refreshMetrics(), 10000);
    // Click handler: open the Proxmox Web UI using the single source of truth
    // for the host address (PROXMOX_NODE_URL), served as `proxmoxUrl` by
    // /api/system/proxmox-status. Avoids re-building the URL from metrics/hostname.
    this.el.addEventListener('click', async () => {
      try {
        const resp = await fetch('/api/system/proxmox-status');
        const data = await resp.json();
        const url = data.proxmoxUrl;
        if (url) {
          // Top-level navigation in the SAME Dashboard tab (no iframe / no proxy).
          window.location.href = url;
        }
      } catch (e) {
        // Fallback: best-effort direct navigation using a fresh status call.
        fetch('/api/system/proxmox-status')
          .then((r) => r.json())
          .then((d) => { if (d.proxmoxUrl) window.location.href = d.proxmoxUrl; })
          .catch(() => {});
      }
    });
  },
  render() {
    this.el.innerHTML = '<div class="widget-card">' +
      '<div class="widget-header">' +
      '<img src="/widgets/proxmox/logo.png" style="width:32px;height:32px;object-fit:contain;">' +
      '<span class="widget-title">Proxmox VE</span></div>' +
      '<div class="widget-body">' +
      '<div class="metric-row"><span class="metric-label">CPU</span><span class="metric-value" id="proxmox-cpu">--%</span></div>' +
      '<div class="progress-track"><div class="progress-fill green" id="proxmox-cpu-bar"></div></div>' +
      '<div class="metric-row"><span class="metric-label">RAM</span><span class="metric-value" id="proxmox-ram">--%</span></div>' +
      '<div class="progress-track"><div class="progress-fill blue" id="proxmox-ram-bar"></div></div>' +
      '<div class="metric-row"><span class="metric-label">SSD</span><span class="metric-value" id="proxmox-disk">--%</span></div>' +
      '<div class="progress-track"><div class="progress-fill orange" id="proxmox-disk-bar"></div></div></div>' +
      '<div class="widget-footer">' +
      '<span id="proxmox-node">hp3</span>' +
      '<span id="proxmox-uptime"></span></div></div>';
  },
  async refreshMetrics() {
    try {
      var resp = await fetch('/api/system/proxmox-status');
      var data = await resp.json();
      if(document.getElementById('proxmox-cpu')) document.getElementById('proxmox-cpu').textContent=(data.cpu||0)+'%';
      if(document.getElementById('proxmox-ram')) document.getElementById('proxmox-ram').textContent=(data.memory?.percent||0)+'%';
      if(document.getElementById('proxmox-disk')) document.getElementById('proxmox-disk').textContent=(data.disk?.percent||0)+'%';
      var cb=document.getElementById('proxmox-cpu-bar'); if(cb) cb.style.width=(data.cpu||0)+'%';
      var rb=document.getElementById('proxmox-ram-bar'); if(rb) rb.style.width=(data.memory?.percent||0)+'%';
      var db=document.getElementById('proxmox-disk-bar'); if(db) db.style.width=(data.disk?.percent||0)+'%';
      if(document.getElementById('proxmox-node')) {
        var nodeLabel = data.hostname || 'hp3';
        if (data.ip) nodeLabel += ' · ' + data.ip;
        document.getElementById('proxmox-node').textContent = nodeLabel;
      }
      if(document.getElementById('proxmox-uptime')) document.getElementById('proxmox-uptime').textContent='Up:'+Math.round((data.uptime||0)/3600)+'h';

    } catch(e) {}
  }
};
