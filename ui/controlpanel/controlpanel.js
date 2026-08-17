// e-Node ControlPanel — autonomous X11-window UI.
// Mirrors Legacy Slot0 functionality. Does NOT depend on Dashboard DOM.
// Home/Logo talk to the e-Node backend via HTTP IPC; the backend (or a
// Dashboard bridge) drives the existing Dashboard Window.

const CP_API = "http://127.0.0.1:3000";

// Send a command to the backend. The backend stores it; the Dashboard
// bridge (cp-bridge.js, loaded inside the Dashboard Window) polls and acts.
async function sendCommand(cmd) {
  try {
    await fetch(CP_API + "/api/cp/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd }),
    });
  } catch (e) {
    console.warn("ControlPanel: command failed", cmd, e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const homeBtn = document.getElementById("cp-home");
  const logoBtn = document.getElementById("cp-logo-btn");

  if (homeBtn) {
    homeBtn.addEventListener("click", () => sendCommand("home"));
  }

  if (logoBtn) {
    logoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Agent WebUI: open in a new tab (matches Legacy Slot0 behaviour).
      window.open("/", "_blank");
    });
  }

  // Brightness / Volume / Settings: UI present (mirrors Legacy Slot0),
  // no backend logic wired yet — preserve original behaviour.
  const brightness = document.getElementById("cp-brightness-slider");
  const volume = document.getElementById("cp-volume-slider");
  const settings = document.getElementById("cp-settings");
  if (brightness) brightness.addEventListener("input", () => {/* TODO: wire to backend */});
  if (volume) volume.addEventListener("input", () => {/* TODO: wire to backend */});
  if (settings) settings.addEventListener("click", () => {/* TODO: wire to backend */});
});
