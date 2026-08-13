export const homeassistantWidget = {
  init() {
    this.el = document.getElementById('homeassistant-widget');
    if (!this.el) return;
    this.render();
  },
  render() {
    this.el.innerHTML = '<div class="widget-card">' +
      '<div class="widget-header">' +
      '<img src="/widgets/homeassistant/logo.png" style="width:32px;height:32px;object-fit:contain;">' +
      '<span class="widget-title">Home Assistant</span></div>' +
      '<div class="widget-body">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="color:#3ddc84;font-size:1.6rem;">&#9679;</span>' +
      '<span style="font-size:1.6rem;font-weight:600;">Xiaomi Gateway 3: v1.5.4</span></div>' +
      '<div style="font-size:1.6rem;opacity:0.7;margin-bottom:6px;">Увімкнено ламп: 0</div>' +
      '<div style="font-size:1.6rem;opacity:0.7;">Температура: +23&deg;C</div></div>' +
      '<div class="widget-footer">' +
      '<span>127.0.0.1</span>' +
      '<span>LAN</span></div></div>';
  }
};
