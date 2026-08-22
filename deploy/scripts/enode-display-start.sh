#!/bin/bash
# eNode Display Runtime (NEW) — two independent Chromium kiosk windows on Xorg :0.
# Legacy kiosk-start.sh is intentionally untouched and remains the fallback.
#
# Lifecycle fix (restart-loop remediation):
#   * On start we free any stale Chromium profile lock left behind by a previous
#     run whose inner shell was killed without cleaning up (the original root
#     cause of the restart-loop: a surviving orphan Chromium held the singleton
#     lock on --user-data-dir, the new launcher exited on profile conflict, and
#     Restart=always spun a loop).
#   * Chromium PIDs are tracked in a state file so the stop helper can address
#     exactly the e-Node Chromium processes instead of a broad pkill.
#   * The inner shell installs a trap that terminates both Chromium trees on
#     EXIT/TERM/INT so a managed stop is clean and leaves no orphans.
set -u
CT_ID="${1:-300}"

exec pct exec "$CT_ID" -- bash -c '
  set -u
  CT_ID="$1"
  BACKEND="http://127.0.0.1:3000"
  CONTROL_PANEL_WINDOW_HEIGHT=60
  export DISPLAY=:0

  # Ensure the X11 socket is reachable at the standard path inside the CT.
  # The host X socket is bind-mounted at /opt/.X11-unix/X0; without a symlink to
  # /tmp/.X11-unix/X0 (what DISPLAY=:0 resolves to), Chromium fails with
  # "Missing X server or $DISPLAY" and the display never appears after a reboot.
  mkdir -p /tmp/.X11-unix
  if [ -S /opt/.X11-unix/X0 ] && [ ! -e /tmp/.X11-unix/X0 ]; then
    ln -sf /opt/.X11-unix/X0 /tmp/.X11-unix/X0
  fi

  echo "[enode-display] Waiting for eNode Backend on :3000 (max 30s)..."
  N=0
  until curl -s -o /dev/null "$BACKEND"; do
    sleep 1; N=$((N+1))
    if [ "$N" -ge 30 ]; then echo "[enode-display] ERROR: backend timeout"; exit 1; fi
  done
  echo "[enode-display] Backend UP."

  DIM=$(xdpyinfo 2>/dev/null | awk "/dimensions:/ {print \$2}")
  [ -z "$DIM" ] && DIM="1920x1080"
  DISPLAY_X=${DIM%x*}; DISPLAY_Y=${DIM#*x}
  DASHBOARD_WINDOW_HEIGHT=$((DISPLAY_Y - CONTROL_PANEL_WINDOW_HEIGHT))
  echo "[enode-display] Display=${DISPLAY_X}x${DISPLAY_Y} ControlPanel_height=${CONTROL_PANEL_WINDOW_HEIGHT} Dashboard_height=${DASHBOARD_WINDOW_HEIGHT}"

  # Lifecycle fix: drop any stale SingletonLock/Socket from a previous run so a
  # restart cannot fail with "profile is in use by another process".
  for ud in /root/.config/chromium /root/.config/chromium-controlpanel; do
    if [ -S "$ud/SingletonSocket" ] || [ -e "$ud/SingletonLock" ]; then
      rm -f "$ud/SingletonLock" "$ud/SingletonSocket" "$ud/SingletonCookie"
    fi
  done

  chromium --kiosk --window-position=0,0 --window-size=${DISPLAY_X},${DASHBOARD_WINDOW_HEIGHT} \
    --no-first-run --no-sandbox --touch-events=enabled --ignore-certificate-errors \
    --user-data-dir=/root/.config/chromium --disable-dev-shm-usage \
    "$BACKEND" &
  P_DASH=$!

  chromium --kiosk --window-position=0,${DASHBOARD_WINDOW_HEIGHT} --window-size=${DISPLAY_X},${CONTROL_PANEL_WINDOW_HEIGHT} \
    --no-first-run --no-sandbox --touch-events=enabled --ignore-certificate-errors \
    --user-data-dir=/root/.config/chromium-controlpanel --disable-dev-shm-usage \
    "$BACKEND/controlpanel.html" &
  P_CP=$!

  # Persist tracked PIDs so the stop helper can address exactly these Chromium
  # instances (and their process groups) instead of a broad pkill.
  echo "$$ $P_DASH $P_CP" > /run/enode-display.${CT_ID}.pids

  cleanup() {
    echo "[enode-display] Stopping Chromium (dash=$P_DASH cp=$P_CP)..."
    # Send TERM to the two main (browser) Chromium processes. In this LXC the
    # reported pgid is 0, so `kill -TERM -<pgid>` would resolve to -0 and only
    # hit our own group; addressing the positive PIDs lets Chromium tear down its
    # own zygote/gpu/renderer children, leaving no orphans.
    kill -TERM "$P_DASH" 2>/dev/null
    kill -TERM "$P_CP" 2>/dev/null
    # Give them a moment to exit gracefully.
    for _ in 1 2 3 4 5; do
      kill -0 "$P_DASH" 2>/dev/null || kill -0 "$P_CP" 2>/dev/null || break
      sleep 1
    done
    # Hard kill only the two tracked Chromium roots if still alive.
    kill -KILL "$P_DASH" 2>/dev/null
    kill -KILL "$P_CP" 2>/dev/null
    # Drop leftover singleton lock so a later start is conflict-free.
    rm -f /root/.config/chromium/SingletonLock /root/.config/chromium/SingletonSocket /root/.config/chromium/SingletonCookie
    rm -f /root/.config/chromium-controlpanel/SingletonLock /root/.config/chromium-controlpanel/SingletonSocket /root/.config/chromium-controlpanel/SingletonCookie
    rm -f /run/enode-display.${CT_ID}.pids
  }
  trap cleanup EXIT TERM INT

  echo "[enode-display] Two Chromium launched (dash=$P_DASH cp=$P_CP). Holding via wait."
  wait
' _ "$CT_ID"
