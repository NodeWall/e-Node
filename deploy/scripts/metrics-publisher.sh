#!/bin/bash
set -euo pipefail
TOPIC="enode/host/metrics"
INTERVAL="${METRICS_INTERVAL:-10}"
while true; do
  CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}' || echo 0)
  MEM_TOTAL=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
  MEM_AVAIL=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
  if [ -n "${MEM_TOTAL}" ] && [ "${MEM_TOTAL}" -gt 0 ] 2>/dev/null; then
    MEM_PCT=$(awk "BEGIN {printf \"%.1f\", (1-${MEM_AVAIL}/${MEM_TOTAL})*100}")
  else
    MEM_PCT="0"
  fi
  DISK_PCT=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%' || echo 0)
  HOSTNAME_V=$(hostname)
  UPTIME=$(awk '{print int($1/3600)}' /proc/uptime)
  IP=$(hostname -I | awk '{print $1}' || echo "10.10.10.15")
  TS=$(date +%s)
  PAYLOAD=$(printf '{"cpu":%s,"memory":{"percent":%s},"disk":{"percent":%s},"hostname":"%s","uptime":%s,"ip":"%s","timestamp":%s}' "$CPU" "$MEM_PCT" "$DISK_PCT" "$HOSTNAME_V" "$UPTIME" "$IP" "$TS")
  mosquitto_pub -h 127.0.0.1 -t "$TOPIC" -m "$PAYLOAD" -q 1 2>/dev/null || true
  sleep "$INTERVAL"
done
