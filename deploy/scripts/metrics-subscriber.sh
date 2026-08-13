#!/bin/bash
set -euo pipefail
TOPIC="enode/host/metrics"
BROKER="${ENODE_MQTT_BROKER:-localhost}"
OUT="/var/www/enode/src/data/host-metrics.json"
while true; do
  mosquitto_sub -h "$BROKER" -t "$TOPIC" -C 1 -W 20 >/tmp/_metrics_payload.json 2>/dev/null || true
  if [ -s /tmp/_metrics_payload.json ]; then
    cp /tmp/_metrics_payload.json "$OUT"
    chown www-data:www-data "$OUT" 2>/dev/null || true
    chmod 644 "$OUT" 2>/dev/null || true
  fi
done
