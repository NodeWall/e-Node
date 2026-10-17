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
        <div class="camera-cell" data-camera="ocean" style="${cell}"><iframe src="https://www.youtube.com/embed/uercaVcv3Lw?autoplay=1&mute=1&controls=0&loop=1&playlist=uercaVcv3Lw" allow="autoplay" style="${frame}"></iframe></div>
        <div class="camera-cell" data-camera="alps" style="${cell}"><iframe src="https://www.youtube.com/embed/BTMjD7_evjE?autoplay=1&mute=1&controls=0&loop=1&playlist=BTMjD7_evjE" allow="autoplay" style="${frame}"></iframe></div>
        <div class="camera-cell" data-camera="tapo" style="${cell}"><iframe src="http://${host}:1984/stream.html?src=tapo_sd&mode=webrtc" allow="autoplay" style="${frame}"></iframe></div>
        <div class="camera-cell" data-camera="glacier" style="${cell}"><iframe src="https://portofcams.com/embed/glac-westentrance/" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="${frame}"></iframe></div>
      </div>`;
  },
  bindEvents() {
    this.el.querySelectorAll(".camera-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        const cam = cell.dataset.camera;
        let src = '';
        if (cam === "ocean") src = "/widgets/cameras/spoke.html?type=youtube&src=uercaVcv3Lw";
        else if (cam === "alps") src = "/widgets/cameras/spoke.html?type=youtube&src=BTMjD7_evjE";
        else if (cam === "tapo") src = "/widgets/cameras/spoke.html?type=go2rtc&src=tapo_hd";
        else if (cam === "glacier") src = "/widgets/cameras/spoke.html?type=glacier&src=glac-westentrance";
        if (src) window.sendSpoke(src);
      });
    });
  },
};
