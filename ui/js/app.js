const app = {
  init() {
    try {
      const saved = localStorage.getItem('enode:layout');
      if (saved) document.getElementById('app').className = saved;
    } catch (e) {
      console.warn('localStorage unavailable');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());
