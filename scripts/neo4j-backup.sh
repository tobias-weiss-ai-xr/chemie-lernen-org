#!/bin/bash
# Idempotent daily backup script for BOTH chemie Neo4j containers
# Backs up: chemie-neo4j (legacy) and chemie-kg (live API knowledge graph)
# Both use database name 'chemie'
# Pattern: docker exec <container> neo4j-admin database dump chemie
# Rotation: keep last 7 daily backups
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Password from environment, default to 'chemie'
NEO4J_PASSWORD="${NEO4J_PASSWORD:-chemie}"

# Containers to back up
CONTAINERS=("chemie-neo4j" "chemie-kg")
DATABASE_NAME="chemie"

# Backup configuration
BASE_BACKUP_DIR="${PROJECT_DIR}/backups/neo4j"
LOG_DIR="${PROJECT_DIR}/backups/logs"
KEEP_DAILY=7

# Timestamp for this backup run
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIR}/neo4j-backup_${TIMESTAMP}.log"

# Ensure directories exist
mkdir -p "$BASE_BACKUP_DIR" "$LOG_DIR"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
    local level="$1"; shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [${level}] $*" | tee -a "$LOG_FILE"
}

# ---------------------------------------------------------------------------
# Check if a container is running
# ---------------------------------------------------------------------------
container_running() {
    local container="$1"
    docker ps --format '{{.Names}}' | grep -q "^${container}$"
}

# ---------------------------------------------------------------------------
# Create a backup for a single container
# Args: $1 = container name, $2 = backup filename (without path)
# ---------------------------------------------------------------------------
backup_container() {
    local container="$1"
    local backup_filename="$2"
    local backup_path="${BASE_BACKUP_DIR}/${backup_filename}"
    local container_backup_dir="/var/lib/neo4j/dumps"
    local db_dump="${container_backup_dir}/${DATABASE_NAME}.dump"

    log "INFO" "Backing up container: ${container}"

    if ! container_running "$container"; then
        log "WARNING" "Container ${container} is not running — skipping"
        return 1
    fi

    # Ensure dumps directory exists inside container
    docker exec "$container" mkdir -p "$container_backup_dir" 2>/dev/null || true

    # Stop Neo4j service for consistent dump
    log "INFO" "Stopping Neo4j service in ${container} for backup..."
    docker exec "$container" neo4j stop 2>/dev/null || true
    sleep 5

    # Run neo4j-admin database dump
    log "INFO" "Running neo4j-admin database dump for ${container}/${DATABASE_NAME}..."
    if docker exec "$container" neo4j-admin database dump "$DATABASE_NAME" \
        --to-path="$container_backup_dir" \
        --overwrite-destination=true 2>&1 | tee -a "$LOG_FILE"; then

        # Copy the dump file from container to host
        docker cp "${container}:${db_dump}" "$backup_path"
        docker exec "$container" rm -f "$db_dump"

        # Verify the backup file exists and is not empty
        if [[ -s "$backup_path" ]]; then
            local size
            size=$(du -sh "$backup_path" | cut -f1)
            log "SUCCESS" "Backup created: ${backup_path} (${size})"
            return 0
        else
            log "ERROR" "Backup file is empty or missing: ${backup_path}"
            return 1
        fi
    else
        log "ERROR" "neo4j-admin dump failed for ${container}/${DATABASE_NAME}"
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Verify a backup file exists and is valid
# ---------------------------------------------------------------------------
verify_backup() {
    local backup_path="$1"
    if [[ ! -f "$backup_path" ]]; then
        log "ERROR" "Backup file does not exist: ${backup_path}"
        return 1
    fi
    if [[ ! -s "$backup_path" ]]; then
        log "ERROR" "Backup file is empty: ${backup_path}"
        return 1
    fi
    # Basic sanity check: a .dump file should be a non-zero size archive
    # We check it's at least 1KB (arbitrary but reasonable minimum for a Neo4j dump)
    local file_size
    file_size=$(stat -c%s "$backup_path" 2>/dev/null || echo "0")
    if [[ "$file_size" -lt 1024 ]]; then
        log "ERROR" "Backup file is suspiciously small (${file_size} bytes): ${backup_path}"
        return 1
    fi
    log "SUCCESS" "Backup verified: ${backup_path}"
    return 0
}

# ---------------------------------------------------------------------------
# Rotate old backups - keep only last KEEP_DAILY
# ---------------------------------------------------------------------------
rotate_backups() {
    log "INFO" "Rotating backups (keeping last ${KEEP_DAILY} daily)..."
    for container in "${CONTAINERS[@]}"; do
        local pattern="${container}-${DATABASE_NAME}-*.dump"
        # Find and delete backups older than KEEP_DAILY days
        find "$BASE_BACKUP_DIR" -name "$pattern" -mtime "+${KEEP_DAILY}" -delete 2>/dev/null || true
        log "INFO" "Rotated backups for ${container}"
    done
    log "SUCCESS" "Backup rotation complete"
}

# ---------------------------------------------------------------------------
# Restart Neo4j services after backup
# ---------------------------------------------------------------------------
restart_containers() {
    log "INFO" "Restarting Neo4j containers..."
    for container in "${CONTAINERS[@]}"; do
        if container_running "$container"; then
            docker restart "$container" >/dev/null 2>&1 || true
            log "INFO" "Restarted container: ${container}"
        else
            log "WARNING" "Container ${container} was not running — cannot restart"
        fi
    done
    log "SUCCESS" "Containers restarted"
    sleep 5
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    log "INFO" "=== Neo4j Backup: Both containers (chemie-neo4j, chemie-kg) ==="
    log "INFO" "NEO4J_PASSWORD source: ${NEO4J_PASSWORD:+env}${NEO4J_PASSWORD:-default}"

    local overall_success=true

    # Backup each container
    for container in "${CONTAINERS[@]}"; do
        local backup_filename="${container}-${DATABASE_NAME}-${TIMESTAMP}.dump"
        local backup_path="${BASE_BACKUP_DIR}/${backup_filename}"

        if backup_container "$container" "$backup_filename"; then
            if ! verify_backup "$backup_path"; then
                overall_success=false
            fi
        else
            overall_success=false
        fi
    done

    # Rotate old backups
    rotate_backups

    # Restart containers after all backups are done
    restart_containers

    if [[ "$overall_success" == "true" ]]; then
        log "SUCCESS" "All Neo4j backups completed successfully"
        # Create latest symlinks for each container
        for container in "${CONTAINERS[@]}"; do
            local latest_dump
            latest_dump=$(find "$BASE_BACKUP_DIR" -name "${container}-${DATABASE_NAME}-*.dump" -type f -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)
            if [[ -n "$latest_dump" ]]; then
                ln -sf "$(basename "$latest_dump")" "${BASE_BACKUP_DIR}/${container}-${DATABASE_NAME}-latest.dump"
                log "INFO" "Updated latest symlink: ${container}-${DATABASE_NAME}-latest.dump"
            fi
        done
        return 0
    else
        log "ERROR" "One or more Neo4j backups failed"
        return 1
    fi
}

main "$@"
