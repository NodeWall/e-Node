#!/bin/bash
# eNode Display Runtime (NEW) — two independent Chromium kiosk windows on Xorg :0.
# Legacy kiosk-start.sh is intentionally untouched and remains the fallback.
set -u
CT_ID="${1:-300}"
exec pct exec "$CT_ID" -- bash -c '
  set -u
  BACKEND="http://127.0.0.1:3000"
  CONTROL_PANEL_HEIGHT=60
  export DISPLAY=:0

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
  DASHBOARD_HEIGHT=$((DISPLAY_Y - CONTROL_PANEL_HEIGHT))
  echo "[enode-display] Display=${DISPLAY_X}x${DISPLAY_Y} ControlPanel_height=${CONTROL_PANEL_HEIGHT} Dashboard_height=${DASHBOARD_HEIGHT}"

  chromium --kiosk --window-position=0,0 --window-size=${DISPLAY_X},${DASHBOARD_HEIGHT} \
    --no-first-run --no-sandbox --touch-events=enabled --ignore-certificate-errors \
    --user-data-dir=/root/.config/chromium --disable-dev-shm-usage \
    "$BACKEND" &
  P_DASH=$!

  chromium --kiosk --window-position=0,${DASHBOARD_HEIGHT} --window-size=${DISPLAY_X},${CONTROL_PANEL_HEIGHT} \
    --no-first-run --no-sandbox --touch-events=enabled --ignore-certificate-errors \
    --user-data-dir=/root/.config/chromium-controlpanel --disable-dev-shm-usage \
    "$BACKEND/controlpanel.html" &
  P_CP=$!

  trap "kill $P_DASH $P_CP 2>/dev/null" EXIT TERM INT
  echo "[enode-display] Two Chromium launched (dash=$P_DASH cp=$P_CP). Holding via wait."
  wait
'
