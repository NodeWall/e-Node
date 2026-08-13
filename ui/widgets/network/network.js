export const networkWidget = {
  init() {
    this.el = document.getElementById('network-widget');
    if (!this.el) return;
    this.render();
    this.refreshData();
    setInterval(() => this.refreshData(), 5 * 60 * 1000);
  },
  render() {
    this.el.innerHTML = '<div class="widget-card">' +
      '<div class="widget-header">' +
      '<img src="/widgets/network/logo.png" style="width:32px;height:32px;object-fit:contain;">' +
      '<span class="widget-title">ISP: Triolan</span></div>' +
      '<div class="widget-body">' +
      '<div class="metric"><span class="metric-value color-ping" id="net-ping">--</span><span class="metric-label">Ping ms</span></div>' +
      '<div class="metric"><span class="metric-value color-download" id="net-download">--</span><span class="metric-label">Download Mbps</span></div>' +
      '<div class="metric"><span class="metric-value color-upload" id="net-upload">--</span><span class="metric-label">Upload Mbps</span></div></div>' +
      '<div class="widget-footer">' +
      '<span>ROG.KYIV.UA: Online</span>' +
      '<span id="net-timestamp">--:--</span></div></div>';
  },
  async refreshData() {
    try {
      var resp = await fetch('/api/system/network-status');
      var data = await resp.json();
      var p=document.getElementById('net-ping'); if(p) p.textContent=data.ping||'--';
      var d=document.getElementById('net-download'); if(d) d.textContent=data.download||'--';
      var u=document.getElementById('net-upload'); if(u) u.textContent=data.upload||'--';
      var t=document.getElementById('net-timestamp'); if(t&&data.timestamp){
        var dt=new Date(data.timestamp); t.textContent=dt.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
      }

    } catch(e) {}
  }
};
