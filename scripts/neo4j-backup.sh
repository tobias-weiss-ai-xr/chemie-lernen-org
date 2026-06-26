#!/bin/bash
# Neo4j daily backup script for chemie-lernen.org
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/git/hugo-chemie-lernen-org/backups/neo4j}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${CONTAINER_NAME:-chemie-neo4j}"
DATABASE="${DATABASE:-chemie}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DATABASE}-${DATE}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Neo4j backup..." | tee -a "${LOG_FILE}"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[ERROR] Container ${CONTAINER_NAME} is not running." | tee -a "${LOG_FILE}"
    exit 1
fi

# Run neo4j-admin dump
if docker exec "${CONTAINER_NAME}" neo4j-admin dump --database="${DATABASE}" --to="/backups/$(basename ${BACKUP_FILE})"; then
    # Copy from container volume to host
    docker cp "${CONTAINER_NAME}:/backups/$(basename ${BACKUP_FILE})" "${BACKUP_FILE}"
    echo "[OK] Backup written: ${BACKUP_FILE}" | tee -a "${LOG_FILE}"
else
    echo "[ERROR] Backup failed." | tee -a "${LOG_FILE}"
    echo "[HINT] Ensure neo4j-admin is available and database ${DATABASE} exists." | tee -a "${LOG_FILE}"
    exit 1
fi

# Cleanup old backups (>RETENTION_DAYS)
find "${BACKUP_DIR}" -name "${DATABASE}-*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "${DATABASE}-*.dump" -mtime +${RETENTION_DAYS} -exec rm -f {} \;

echo "[OK] Retention: keeping backups from last ${RETENTION_DAYS} days." | tee -a "${LOG_FILE}"
echo "[DONE] ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))" | tee -a "${LOG_FILE}"
