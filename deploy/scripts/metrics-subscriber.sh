#!/bin/bash
# eNode Metrics Subscriber — runs INSIDE the CT, subscribes to host MQTT metrics
# and writes them to src/data/host-metrics.json for the Fastify API to serve.
set -e

CT_DIR="/var/www/e-node"
OUT="$CT_DIR/src/data/host-metrics.json"
mkdir -p "$(dirname "$OUT")"

echo "[metrics-subscriber] Subscribing to enode/host/metrics ..."
while true; do
  mosquitto_sub -h 10.10.10.1 -p 1883 -t "enode/host/metrics" -C 1 2>/dev/null \
    | python3 -c "import sys,json,datetime; d=json.load(sys.stdin); d['_ts']=datetime.datetime.utcnow().isoformat(); print(json.dumps(d))" \
    > "$OUT" 2>/dev/null || true
  sleep 2
done
