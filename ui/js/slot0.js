document.addEventListener("DOMContentLoaded", () => {
  const homeBtn = document.getElementById("slot0-home");
  const viewport = document.getElementById("main-viewport");
  const logoBtn = document.getElementById("slot0-logo-btn");
  if (!homeBtn || !viewport || !logoBtn) return;

  homeBtn.addEventListener("click", () => {
    viewport.src = "dashboard.html";
  });

  logoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.top.location.href = "/";
  });
});