#!/bin/bash
# Master backup script — runs all chemie-lernen.org backups
# Expected to be called from a systemd timer or cron job.
# Configure alerting via HEALTHCHECK_URL env var (healthchecks.io or similar).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/backups/logs"
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
set -e

TOTAL_EXIT=$((CHEMIE_EXIT + CHEMIE_KG_EXIT + LEADS_EXIT))
echo "=== Complete: chemie-neo4j=${CHEMIE_EXIT}, chemie-kg=${CHEMIE_KG_EXIT}, leads=${LEADS_EXIT} ===" | tee -a "${LOG_DIR}/master.log"

    if [[ "$TOTAL_EXIT" -ne 0 ]]; then
    echo "WARNING: Some backups failed — check logs above." | tee -a "${LOG_DIR}/master.log"
    ping_healthcheck "fail" "$TOTAL_EXIT"
else
    ping_healthcheck "" 0
fi

exit "$TOTAL_EXIT"
