const ctrl = {
  toggle() {
    document.getElementById('control-panel').classList.toggle('is-open');
  },
  log(msg) {
    const el = document.getElementById('system-log');
    if (!el) return;
    el.textContent = `[${new Date().toISOString()}] ${msg}`;
  }
};

export default ctrl;
