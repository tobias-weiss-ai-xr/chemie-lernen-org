#!/bin/bash
# Backup script for chemie-lernen.org Neo4j knowledge graph
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONTAINER_NAME="chemie-neo4j"
DATABASE_NAME="chemie"
NEO4J_PASSWORD="chemie"

BACKUP_DIR="${PROJECT_DIR}/backups/neo4j"
LOG_DIR="${PROJECT_DIR}/backups/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="chemie_knowledge_backup_${TIMESTAMP}.dump"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"

KEEP_DAILY=7
KEEP_WEEKLY=4
KEEP_MONTHLY=3

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

log() {
    local level="$1"; shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [${level}] $*" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    if ! docker info >/dev/null 2>&1; then
        log "ERROR" "Docker is not running"
        exit 1
    fi
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log "ERROR" "Container ${CONTAINER_NAME} is not running"
        exit 1
    fi
    log "SUCCESS" "Prerequisites OK"
}

create_backup() {
    local backup_path="${BACKUP_DIR}/${BACKUP_FILE}"
    log "INFO" "Creating backup: ${BACKUP_FILE}"

    docker exec "${CONTAINER_NAME}" mkdir -p /var/lib/neo4j/dumps 2>/dev/null || true

    log "INFO" "Stopping Neo4j service for backup..."
    docker exec "${CONTAINER_NAME}" neo4j stop 2>/dev/null || true
    sleep 10

    if docker exec "${CONTAINER_NAME}" neo4j-admin database dump "${DATABASE_NAME}" \
        --to-path=/var/lib/neo4j/dumps \
        --overwrite-destination=true 2>&1 | tee -a "$LOG_FILE"; then

        docker cp "${CONTAINER_NAME}:/var/lib/neo4j/dumps/${DATABASE_NAME}.dump" "$backup_path"
        docker exec "${CONTAINER_NAME}" rm -f "/var/lib/neo4j/dumps/${DATABASE_NAME}.dump"

        local size=$(du -sh "$backup_path" | cut -f1)
        log "SUCCESS" "Backup created: ${backup_path} (${size})"

        ln -sf "$BACKUP_FILE" "${BACKUP_DIR}/chemie_knowledge_latest.dump"
        local success=true
    else
        log "ERROR" "Backup failed"
        local success=false
    fi

    log "INFO" "Restarting Neo4j container..."
    docker restart "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    sleep 5

    if [[ "$success" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

verify_backup() {
    local backup_file="${BACKUP_DIR}/${BACKUP_FILE}"
    if [[ ! -s "$backup_file" ]]; then
        log "ERROR" "Backup file is empty or missing"
        return 1
    fi
    log "SUCCESS" "Backup verification passed"
}

cleanup_old_backups() {
    log "INFO" "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "chemie_knowledge_backup_*.dump" -mtime +${KEEP_DAILY} -delete 2>/dev/null || true
    log "SUCCESS" "Cleanup completed"
}

main() {
    log "INFO" "=== Neo4j Backup: ${CONTAINER_NAME}/${DATABASE_NAME} ==="
    check_prerequisites
    if create_backup && verify_backup; then
        cleanup_old_backups
        log "SUCCESS" "Backup process completed successfully"
        return 0
    else
        log "ERROR" "Backup process failed"
        return 1
    fi
}

main "$@"
