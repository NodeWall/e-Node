// e-Node ControlPanel — autonomous X11-window UI.
// Standalone ControlPanel UI in its own X11 window.
// Home/Logo talk to the e-Node backend via HTTP IPC; the backend
// drives the existing Dashboard Window.

const CP_API = "http://127.0.0.1:3000";

async function sendCommand(cmd, extra = {}) {
  try {
    await fetch(CP_API + "/api/cp/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd, ...extra }),
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
      window.open("/", "_blank");
    });
  }

  const brightness = document.getElementById("cp-brightness-slider");
  const volume = document.getElementById("cp-volume-slider");
  const settings = document.getElementById("cp-settings");
  if (brightness) brightness.addEventListener("input", () => {/* TODO: wire to backend */});
  if (volume) volume.addEventListener("input", () => {/* TODO: wire to backend */});
  if (settings) settings.addEventListener("click", () => {/* TODO: wire to backend */});
});
