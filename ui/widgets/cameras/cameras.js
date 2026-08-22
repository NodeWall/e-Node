export const camerasWidget = {
  init() {
    this.el = document.getElementById("cameras-widget") || document.getElementById("widget-cameras");
    if (!this.el) return;
    this.render();
    this.bindEvents();
  },
  render() {
    const cell = "position:relative;overflow:hidden;border-radius:8px;background:#000;min-width:0;min-height:0;cursor:pointer;";
    const frame = "width:100%;height:100%;border:none;pointer-events:none;border-radius:8px;";
    const host = location.hostname;
    this.el.innerHTML = `
      <div class="cameras-grid" style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;height:100%;">
        <div class="camera-cell" style="${cell}"><iframe src="https://www.youtube.com/embed/uercaVcv3Lw?autoplay=1&mute=1&controls=0&loop=1&playlist=uercaVcv3Lw" allow="autoplay" style="${frame}"></iframe></div>
        <div class="camera-cell" style="${cell}"><iframe src="https://www.youtube.com/embed/BTMjD7_evjE?autoplay=1&mute=1&controls=0&loop=1&playlist=BTMjD7_evjE" allow="autoplay" style="${frame}"></iframe></div>
        <div class="camera-cell" data-camera="tapo_hd" style="${cell}"><iframe src="http://${host}:1984/stream.html?src=tapo_sd&mode=webrtc" allow="autoplay" style="${frame}"></iframe></div>
        <div class="camera-cell" style="display:flex;align-items:center;justify-content:center;height:100%;background:#111;border:1px solid #2a2a2a;border-radius:8px;"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#555" stroke-width="1.5"><rect x="3" y="6" width="18" height="13" rx="3"/><circle cx="12" cy="12.5" r="3.2"/></svg></div>
      </div>`;
  },
  bindEvents() {
    this.el.querySelectorAll(".camera-cell").forEach(cell => {
      cell.addEventListener("click", () => {
        cell.style.position = "fixed";
        cell.style.top = "0";
        cell.style.left = "0";
        cell.style.width = "100vw";
        cell.style.height = "100vh";
        cell.style.zIndex = "999";
        cell.style.borderRadius = "0";
        const iframe = cell.querySelector("iframe");
        if (iframe && cell.dataset.camera === "tapo_hd") {
            const host = location.hostname;
            iframe.src = "http://" + host + ":1984/stream.html?src=tapo_hd&mode=webrtc";
        }
      });
      cell.addEventListener("dblclick", () => {
        cell.style.position = "relative";
        cell.style.width = "100%";
        cell.style.height = "100%";
        cell.style.zIndex = "1";
        cell.style.borderRadius = "8px";
        const iframe = cell.querySelector("iframe");
        if (iframe && cell.dataset.camera === "tapo_hd") {
            const host = location.hostname;
            iframe.src = "http://" + host + ":1984/stream.html?src=tapo_sd&mode=webrtc";
        }
      });
    });
  }
};
