#!/bin/bash
# Enable Neo4j backup systemd timer unit.
#
# Copies neo4j-backup.service and neo4j-backup.timer into
# /etc/systemd/system, reloads systemd, and enables/starts the timer.
#
# Idempotent — safe to re-run.  Never runs docker.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_DIR="/etc/systemd/system"

SERVICE_SRC="${SCRIPT_DIR}/neo4j-backup.service"
TIMER_SRC="${SCRIPT_DIR}/neo4j-backup.timer"

SERVICE_DST="${UNIT_DIR}/neo4j-backup.service"
TIMER_DST="${UNIT_DIR}/neo4j-backup.timer"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
if [[ ! -f "$SERVICE_SRC" ]]; then
    echo "ERROR: Missing source unit: ${SERVICE_SRC}" >&2
    exit 1
fi

if [[ ! -f "$TIMER_SRC" ]]; then
    echo "ERROR: Missing source unit: ${TIMER_SRC}" >&2
    exit 1
fi

if [[ ! -d "$UNIT_DIR" ]]; then
    echo "ERROR: Target directory does not exist: ${UNIT_DIR}" >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Deploy unit files
# ---------------------------------------------------------------------------
echo "Copying unit files to ${UNIT_DIR}..."
cp "$SERVICE_SRC" "$SERVICE_DST"
cp "$TIMER_SRC" "$TIMER_DST"
chmod 644 "$SERVICE_DST" "$TIMER_DST"

echo "Reloading systemd daemon..."
systemctl daemon-reload

# ---------------------------------------------------------------------------
# Enable and start the timer (idempotent)
# ---------------------------------------------------------------------------
ENABLED_STATUS=$(systemctl is-enabled neo4j-backup.timer 2>/dev/null || echo "disabled")

if [[ "$ENABLED_STATUS" == "enabled" ]]; then
    echo "Timer neo4j-backup.timer is already enabled."
else
    echo "Enabling neo4j-backup.timer..."
    systemctl enable neo4j-backup.timer
fi

ACTIVE_STATUS=$(systemctl is-active neo4j-backup.timer 2>/dev/null || echo "inactive")

if [[ "$ACTIVE_STATUS" == "active" ]]; then
    echo "Timer neo4j-backup.timer is already running."
else
    echo "Starting neo4j-backup.timer..."
    systemctl start neo4j-backup.timer
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Neo4j backup timer status ==="
systemctl status neo4j-backup.timer --no-pager 2>&1 || true
echo ""
echo "Next trigger:"
systemctl list-timers --no-pager --all 2>&1 | grep -i neo4j || true
