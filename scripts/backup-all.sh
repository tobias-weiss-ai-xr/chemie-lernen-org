#!/bin/bash
# Master backup script — runs all chemie-lernen.org backups
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/backups/logs"
mkdir -p "$LOG_DIR"

echo "=== Chemie Backup: $(date) ===" | tee -a "${LOG_DIR}/master.log"

set +e
bash "${SCRIPT_DIR}/backup-chemie-neo4j.sh" 2>&1 | tee -a "${LOG_DIR}/master.log"
CHEMIE_EXIT=${PIPESTATUS[0]}

bash "${SCRIPT_DIR}/backup-leads-neo4j.sh" 2>&1 | tee -a "${LOG_DIR}/master.log"
LEADS_EXIT=${PIPESTATUS[0]}
set -e

echo "=== Complete: chemie=${CHEMIE_EXIT}, leads=${LEADS_EXIT} ===" | tee -a "${LOG_DIR}/master.log"

exit $((CHEMIE_EXIT + LEADS_EXIT))
