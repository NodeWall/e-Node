#!/bin/bash
# eNode Kiosk Start — all GUI inside CT300

# 1. Setup X11 socket link in CT300
pct exec 300 -- bash -c "mkdir -p /tmp/.X11-unix && ln -sf /opt/.X11-unix/X0 /tmp/.X11-unix/X0" 2>/dev/null

# 2. Wait for Backend API to be ready (up to 30 seconds)
echo "Waiting for eNode Backend on port 3000..."
MAX_RETRIES=30
COUNT=0
while ! pct exec 300 -- curl -s http://127.0.0.1:3000 > /dev/null; do
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Backend timeout: Port 3000 not available after 30s"
        exit 1
    fi
done
echo "Backend is UP. Launching Chromium..."

# 3. Kill existing chromium
pct exec 300 -- bash -c "pkill -f chromium || true" 2>/dev/null
sleep 1

# 4. Start openbox window manager in CT300
pct exec 300 -- bash -c "export DISPLAY=:0; nohup openbox --replace > /dev/null 2>&1 &" 2>/dev/null
sleep 2

# 5. Start Chromium kiosk (FOREGROUND)
exec pct exec 300 -- env DISPLAY=:0 /bin/chromium --kiosk --window-position=0,0 --window-size=1920,1280 --no-first-run --no-sandbox --disable-gpu --use-gl=swiftshader --touch-events=enabled --ignore-certificate-errors --user-data-dir=/root/.config/chromium --disable-dev-shm-usage --disk-cache-dir=/dev/null --disk-cache-size=1 --media-cache-size=1 --nocache http://127.0.0.1:3000
