#!/bin/bash
# Master backup script — runs all chemie-lernen.org backups
# Expected to be called from a systemd timer or cron job.
# Configure alerting via HEALTHCHECK_URL env var (healthchecks.io or similar).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_DIR}/backups/logs"
mkdir -p "$LOG_DIR"

HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"

echo "=== Chemie Backup: $(date) ===" | tee -a "${LOG_DIR}/master.log"

ping_healthcheck() {
    local status="$1"
    local exit_code="$2"
    if [[ -n "$HEALTHCHECK_URL" ]]; then
        curl -fsS -m 10 \
            "${HEALTHCHECK_URL}/${status}" \
            --data-raw "exit=${exit_code} $(date)" \
            >/dev/null 2>&1 || true
    fi
}

set +e
bash "${SCRIPT_DIR}/backup-chemie-neo4j.sh" 2>&1 | tee -a "${LOG_DIR}/master.log"
CHEMIE_EXIT=${PIPESTATUS[0]}

bash "${SCRIPT_DIR}/backup-chemie-kg.sh" 2>&1 | tee -a "${LOG_DIR}/master.log"
CHEMIE_KG_EXIT=${PIPESTATUS[0]}

bash "${SCRIPT_DIR}/backup-leads-neo4j.sh" 2>&1 | tee -a "${LOG_DIR}/master.log"
LEADS_EXIT=${PIPESTATUS[0]}

# ── Chunked graph backup to dedicated git repo ───────────────────────
bash "${SCRIPT_DIR}/backup-graph-git.sh" 2>&1 | tee -a "${LOG_DIR}/master.log"
GRAPH_GIT_EXIT=${PIPESTATUS[0]}

# ── Auth DB backup ──────────────────────────────────────────────────
AUTH_DB_SRC="${PROJECT_DIR}/api/data/users.json"
AUTH_DB_DIR="${PROJECT_DIR}/backups/auth-db"
mkdir -p "$AUTH_DB_DIR"
if [[ -f "$AUTH_DB_SRC" ]]; then
    AUTH_DB_FILENAME="auth-db-$(date +%Y%m%d_%H%M%S).json"
    cp "$AUTH_DB_SRC" "${AUTH_DB_DIR}/${AUTH_DB_FILENAME}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] Auth DB backed up: ${AUTH_DB_DIR}/${AUTH_DB_FILENAME}" | tee -a "${LOG_DIR}/master.log"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] Auth DB not found at ${AUTH_DB_SRC} — skipping" | tee -a "${LOG_DIR}/master.log"
fi

# ── Off-site backup (restic) ────────────────────────────────────────
RESTIC_EXIT=0
if [[ -n "${RESTIC_REPOSITORY:-}" ]] && [[ -n "${RESTIC_PASSWORD:-}" ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Starting off-site restic backup..." | tee -a "${LOG_DIR}/master.log"
    node "${SCRIPT_DIR}/backup-db.js" 2>&1 | tee -a "${LOG_DIR}/master.log"
    RESTIC_EXIT=${PIPESTATUS[0]}
    if [[ "$RESTIC_EXIT" -ne 0 ]]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Off-site restic backup failed (exit=${RESTIC_EXIT})" | tee -a "${LOG_DIR}/master.log"
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] Off-site restic backup complete" | tee -a "${LOG_DIR}/master.log"
    fi
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] RESTIC_REPOSITORY / RESTIC_PASSWORD not set — skipping off-site backup" | tee -a "${LOG_DIR}/master.log"
fi
set -e

TOTAL_EXIT=$((CHEMIE_EXIT + CHEMIE_KG_EXIT + LEADS_EXIT + GRAPH_GIT_EXIT + RESTIC_EXIT))
echo "=== Complete: chemie-neo4j=${CHEMIE_EXIT}, chemie-kg=${CHEMIE_KG_EXIT}, leads=${LEADS_EXIT}, graph-git=${GRAPH_GIT_EXIT} ===" | tee -a "${LOG_DIR}/master.log"

    if [[ "$TOTAL_EXIT" -ne 0 ]]; then
    echo "WARNING: Some backups failed — check logs above." | tee -a "${LOG_DIR}/master.log"
    ping_healthcheck "fail" "$TOTAL_EXIT"
else
    ping_healthcheck "" 0
fi

exit "$TOTAL_EXIT"
