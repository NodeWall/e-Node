#!/bin/bash
# eNode Metrics Subscriber — runs INSIDE the CT, subscribes to host MQTT metrics
# and writes them to src/data/host-metrics.json for the Fastify API to serve.
set -e

CT_DIR="/var/www/e-node"
OUT="$CT_DIR/src/data/host-metrics.json"
mkdir -p "$(dirname "$OUT")"

# Broker = host IP where mosquitto listens (CT reaches it via vmbr0 bridge).
# The host IP is injected at deploy time via BROKER env (set by eNode-install).
BROKER="${BROKER}"

echo "[metrics-subscriber] Broker: $BROKER, topic: enode/host/metrics"
while true; do
  mosquitto_sub -h "$BROKER" -t "enode/host/metrics" -C 1 -W 20 >/tmp/_metrics_payload.json 2>/dev/null || true
  if [ -s /tmp/_metrics_payload.json ]; then
    cp /tmp/_metrics_payload.json "$OUT"
    chown www-data:www-data "$OUT" 2>/dev/null || true
    chmod 644 "$OUT" 2>/dev/null || true
  fi
  sleep 2
done
