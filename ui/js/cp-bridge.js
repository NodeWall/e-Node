// e-Node Dashboard bridge for ControlPanel IPC.
// Polls the backend command channel and drives the existing Dashboard Window
// (the #main-viewport iframe). Loaded inside index.html (Dashboard Window).
// This bridge lives in the Dashboard context; ControlPanel never touches
// the Dashboard DOM directly — it only sends commands via the backend.

const CP_API = "http://127.0.0.1:3000";
let lastSeenTs = 0;

async function poll() {
  try {
    const res = await fetch(CP_API + "/api/cp/state");
    const data = await res.json();
    if (data && data.ts && data.ts !== lastSeenTs) {
      lastSeenTs = data.ts;
      const viewport = document.getElementById("main-viewport");
      if (data.cmd === "home" && viewport) {
        viewport.src = "dashboard.html";
      } else if (data.cmd === "logo") {
        window.top.location.href = "/";
      }
    }
  } catch (e) {
    // backend unreachable — ignore, retry next tick
  }
  setTimeout(poll, 400);
}

document.addEventListener("DOMContentLoaded", () => {
  // seed lastSeenTs so we don't replay an old command on load
  fetch(CP_API + "/api/cp/state")
    .then((r) => r.json())
    .then((d) => { if (d && d.ts) lastSeenTs = d.ts; })
    .catch(() => {});
  poll();
});
