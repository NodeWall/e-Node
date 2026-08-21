#!/bin/bash
# eNode Display Runtime — stop helper (lifecycle fix for the restart-loop).
#
# The host enode-display.service runs `pct exec 300 -- bash -c '...'`. When
# systemd stops the service it kills the host-side pct exec, but that does not
# reliably deliver SIGTERM into the inner bash inside the CT, so the two
# Chromium instances (and their children) survive as orphans. On the next
# start they still hold the singleton lock on their --user-data-dir, the new
# launcher exits on a profile conflict, and Restart=always enters a loop.
#
# This helper terminates *exactly* the e-Node Chromium processes inside the CT:
#   1. by their tracked PIDs (written by enode-display-start.sh); and
#   2. by matching the two well-known --user-data-dir profile paths.
#
# NOTE on killing: in this LXC `ps`/proc report pgid==0 for the Chromium
# processes, so `kill -TERM -<pgid>` would resolve to `kill -TERM -0` and only
# hit the helper's own group. We therefore address the *positive* PIDs of the
# main (browser) Chromium processes. Sending TERM to the main processes makes
# Chromium tear down its own zygote/gpu/renderer children cleanly, so no broad
# pkill is needed. A final KILL pass covers any stragglers (still matched by
# profile, never a global pkill).
set -u
CT_ID="${1:-300}"

pct exec "$CT_ID" -- bash -c '
  set -u
  PROFILES=("/root/.config/chromium" "/root/.config/chromium-controlpanel")

  # Main (browser) Chromium PIDs = chromium processes whose cmdline has NO
  # "--type=" argument. Killing these lets Chromium clean up its children.
  main_pids() {
    local p
    for p in $(pgrep -x chromium 2>/dev/null); do
      [ -r "/proc/$p/cmdline" ] || continue
      if ! tr "\0" " " < "/proc/$p/cmdline" | grep -q -- "--type="; then
        echo "$p"
      fi
    done
  }

  echo "[enode-display-stop] terminating e-Node Chromium (profile-matched)..."

  # 1) tracked PIDs from the state file (dash/cp browser PIDs).
  PF="/run/enode-display.'"$CT_ID"'.pids"
  if [ -r "$PF" ]; then
    for pid in $(awk "{print \$2, \$3}" "$PF"); do
      kill -TERM "$pid" 2>/dev/null
    done
    inner=$(awk "{print \$1}" "$PF"); kill -TERM "$inner" 2>/dev/null
    rm -f "$PF"
  fi

  # 2) address-specific kill by the two e-Node profile paths.
  for pid in $(pgrep -x chromium 2>/dev/null); do
    [ -r "/proc/$pid/cmdline" ] || continue
    cmd=$(tr "\0" " " < "/proc/$pid/cmdline")
    for ud in "${PROFILES[@]}"; do
      if echo "$cmd" | grep -q -- "--user-data-dir=$ud"; then
        # Only signal the main browser processes; they cascade to children.
        if ! echo "$cmd" | grep -q -- "--type="; then
          kill -TERM "$pid" 2>/dev/null
        fi
        break
      fi
    done
  done

  # Graceful wait for the profile-matched processes to exit.
  for _ in 1 2 3 4 5 6; do
    alive=0
    for pid in $(pgrep -x chromium 2>/dev/null); do
      [ -r "/proc/$pid/cmdline" ] || continue
      cmd=$(tr "\0" " " < "/proc/$pid/cmdline")
      for ud in "${PROFILES[@]}"; do
        echo "$cmd" | grep -q -- "--user-data-dir=$ud" && { alive=1; break; }
      done
      [ "$alive" -eq 1 ] && break
    done
    [ "$alive" -eq 0 ] && break
    sleep 1
  done

  # 3) hard-kill any still-alive profile-matched process (by positive PID).
  for pid in $(pgrep -x chromium 2>/dev/null); do
    [ -r "/proc/$pid/cmdline" ] || continue
    cmd=$(tr "\0" " " < "/proc/$pid/cmdline")
    for ud in "${PROFILES[@]}"; do
      if echo "$cmd" | grep -q -- "--user-data-dir=$ud"; then
        kill -KILL "$pid" 2>/dev/null
        break
      fi
    done
  done

  # Drop any leftover singleton lock so the next start is clean (no conflict).
  for ud in "${PROFILES[@]}"; do
    rm -f "$ud/SingletonLock" "$ud/SingletonSocket" "$ud/SingletonCookie"
  done

  left=$(pgrep -x chromium 2>/dev/null | wc -l)
  echo "[enode-display-stop] done (remaining chromium: $left)"
'
