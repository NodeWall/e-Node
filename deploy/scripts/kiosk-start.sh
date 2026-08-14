#!/bin/bash
# eNode Kiosk Start — all GUI inside CT300, display streamed from host X socket
set -e

CT_ID="${1:-300}"
BACKEND="http://127.0.0.1:3000"

echo "[kiosk-start] Linking host X socket into CT $CT_ID..."
pct exec "$CT_ID" -- bash -c "mkdir -p /tmp/.X11-unix && ln -sf /opt/.X11-unix/X0 /tmp/.X11-unix/X0" 2>/dev/null || true

echo "[kiosk-start] Waiting for eNode Backend on port 3000 (max 30s)..."
MAX=30; N=0
until pct exec "$CT_ID" -- curl -s -o /dev/null "$BACKEND"; do
  sleep 1; N=$((N+1))
  if [ "$N" -ge "$MAX" ]; then echo "[kiosk-start] ERROR: backend timeout"; exit 1; fi
done
echo "[kiosk-start] Backend is UP."

echo "[kiosk-start] Killing any existing chromium..."
pct exec "$CT_ID" -- bash -c "pkill -f chromium || true" 2>/dev/null || true
sleep 1

echo "[kiosk-start] Launching Openbox + Chromium kiosk..."
pct exec "$CT_ID" -- bash -c "export DISPLAY=:0; nohup openbox --replace >/dev/null 2>&1 &" 2>/dev/null || true
sleep 2

pct exec "$CT_ID" -- bash -c "export DISPLAY=:0; exec chromium \
  --kiosk --no-first-run --no-sandbox --disable-gpu --use-gl=swiftshader \
  --touch-events=enabled --ignore-certificate-errors \
  --user-data-dir=/root/.config/chromium \
  --disable-dev-shm-usage --disk-cache-dir=/dev/null --disk-cache-size=1 --media-cache-size=1 --nocache \
  '$BACKEND'" 2>&1

echo "[kiosk-start] Chromium launched."
