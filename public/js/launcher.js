const layouts = ['grid-2x2', 'grid-2x3', 'grid-3x3'];

export const launcher = {
  next() {
    const app = document.getElementById('app');
    const current = app.className || 'grid-2x2';
    const idx = layouts.indexOf(current);
    const next = layouts[(idx + 1) % layouts.length];
    app.className = next;
    try { localStorage.setItem('enode:layout', next); } catch (e) {}
    console.log('layout =>', next);
  }
};
