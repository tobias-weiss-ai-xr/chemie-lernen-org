#!/bin/bash
# Daily backup for BOTH dedicated Neo4j instances (chemie-neo4j + chemie-kg)
# Uses neo4j-admin database dump (Neo4j 5.x syntax)
# Extended 2026-09-11: previously only chemie-kg; chemie-neo4j (the larger,
# primary KG used by graphwiz/taskfleet + the chemie Documents) was NOT backed up.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups/chemie-kg"
LOG_DIR="${PROJECT_DIR}/backups/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/backup_chemie_kg_${TIMESTAMP}.log"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

log() {
    local level="$1"; shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [${level}] $*" | tee -a "$LOG_FILE"
}

backup_instance() {
    local CONTAINER_NAME="$1"
    local DATABASE_NAME="$2"
    local PREFIX="$3"        # kurz-Name für Datei/Symlink, z.B. chemie-neo4j / chemie-kg

    log "INFO" "=== Backup: ${CONTAINER_NAME}/${DATABASE_NAME} (${PREFIX}) ==="

    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log "ERROR" "Container ${CONTAINER_NAME} is not running — skip"
        return 0
    fi

    BACKUP_FILE="${PREFIX}-${TIMESTAMP}.dump"

    # Stop database for consistent dump, then restart
    log "INFO" "Stopping Neo4j database for backup..."
    docker exec "${CONTAINER_NAME}" neo4j stop 2>/dev/null || true
    sleep 5

    log "INFO" "Running neo4j-admin database dump..."
    if docker exec "${CONTAINER_NAME}" mkdir -p /var/lib/neo4j/dumps && \
       docker exec "${CONTAINER_NAME}" neo4j-admin database dump "${DATABASE_NAME}" \
           --to-path=/var/lib/neo4j/dumps \
           --overwrite-destination=true 2>&1 | tee -a "$LOG_FILE"; then

        docker cp "${CONTAINER_NAME}:/var/lib/neo4j/dumps/${DATABASE_NAME}.dump" "${BACKUP_DIR}/${BACKUP_FILE}"
        docker exec "${CONTAINER_NAME}" rm -f "/var/lib/neo4j/dumps/${DATABASE_NAME}.dump"

        local_size=$(du -sh "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
        log "SUCCESS" "Backup: ${BACKUP_DIR}/${BACKUP_FILE} (${local_size})"

        ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/${PREFIX}-latest.dump"
    else
        log "ERROR" "Backup failed for ${CONTAINER_NAME}"
        docker restart "${CONTAINER_NAME}" >/dev/null 2>&1 || true
        return 1
    fi

    log "INFO" "Restarting Neo4j database..."
    docker restart "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    sleep 5
    log "INFO" "Neo4j database restarted"
    return 0
}

# 1) Die große, primäre Instanz (Documents, Code-Analysis, Curriculum)
backup_instance chemie-neo4j chemie chemie-neo4j
# 2) Die Chat-spezifische Instanz
backup_instance chemie-kg chemie chemie-kg

# Cleanup old backups
log "INFO" "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.dump" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
log "SUCCESS" "Done"
