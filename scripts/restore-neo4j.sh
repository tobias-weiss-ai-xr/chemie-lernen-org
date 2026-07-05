#!/bin/bash
# Restore script for chemie-lernen.org Neo4j knowledge graphs
#
# Restores a Neo4j database from a neo4j-admin dump file.
# Usage:
#   ./scripts/restore-neo4j.sh --container chemie-neo4j --database chemie --dump /path/to/backup.dump
#   ./scripts/restore-neo4j.sh --container chemie-kg --database chemie --dump /path/to/backup.dump
#
# Safety: requires explicit --confirm flag to proceed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
    echo "Usage: $0 --container NAME --database NAME --dump PATH [--confirm]"
    echo ""
    echo "Required:"
    echo "  --container NAME   Docker container name (chemie-neo4j or chemie-kg)"
    echo "  --database  NAME   Neo4j database name within the container (usually 'chemie')"
    echo "  --dump      PATH   Path to the .dump file to restore from"
    echo ""
    echo "Safety:"
    echo "  --confirm          Actually run the restore (dry-run without this)"
    echo ""
    echo "Example:"
    echo "  $0 --container chemie-neo4j --database chemie \\"
    echo "    --dump backups/neo4j/chemie_knowledge_backup_20260705_120000.dump --confirm"
    exit 1
}

# Parse arguments
CONTAINER=""
DATABASE=""
DUMP_FILE=""
CONFIRM=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --container) CONTAINER="$2"; shift 2 ;;
        --database)  DATABASE="$2"; shift 2 ;;
        --dump)      DUMP_FILE="$2"; shift 2 ;;
        --confirm)   CONFIRM=true; shift ;;
        -h|--help)   usage ;;
        *)           echo "Unknown argument: $1"; usage ;;
    esac
done

if [[ -z "$CONTAINER" || -z "$DATABASE" || -z "$DUMP_FILE" ]]; then
    echo "ERROR: --container, --database, and --dump are required."
    usage
fi

# Resolve absolute dump path
DUMP_FILE="$(realpath "$DUMP_FILE" 2>/dev/null)" || {
    echo "ERROR: Dump file does not exist: $DUMP_FILE"
    exit 1
}
DUMP_BASENAME="$(basename "$DUMP_FILE")"

echo "=== Neo4j Restore ==="
echo "  Container: $CONTAINER"
echo "  Database:  $DATABASE"
echo "  Dump file: $DUMP_FILE"
echo ""

# Prerequisites check
echo "[1/5] Checking prerequisites..."
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running."
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "ERROR: Container ${CONTAINER} is not running."
    echo "  Start it first: docker start ${CONTAINER}"
    exit 1
fi

if [[ ! -s "$DUMP_FILE" ]]; then
    echo "ERROR: Dump file is empty or not readable: $DUMP_FILE"
    exit 1
fi
echo "  OK"

# Warn about what's happening
echo ""
echo "[2/5] Restore plan:"
echo "  Container:          $CONTAINER"
echo "  Target database:    $DATABASE"
echo "  Action:             Drop existing database, load from dump, restart"
echo "  Downtime:           ~30-60 seconds"
echo "  Data loss:          ALL current data in '$DATABASE' will be REPLACED"
echo ""

if [[ "$CONFIRM" != "true" ]]; then
    echo "⚠️  DRY RUN — no changes made."
    echo "   Re-run with --confirm to execute the restore."
    echo ""
    echo "   Verify the dump is from the correct backup:"
    ls -lh "$DUMP_FILE"
    echo ""
    echo "   To check what's in the dump (rough size):"
    echo "   strings \"$DUMP_FILE\" | head -20"
    exit 0
fi

echo "[3/5] Stopping Neo4j database for restore..."
# First stop Neo4j service inside container
docker exec "$CONTAINER" neo4j stop 2>/dev/null || true
sleep 5

echo "[4/5] Copying dump into container and loading..."
DUMP_IN_CONTAINER="/var/lib/neo4j/dumps/${DUMP_BASENAME}"
docker exec "$CONTAINER" mkdir -p /var/lib/neo4j/dumps 2>/dev/null || true
docker cp "$DUMP_FILE" "${CONTAINER}:${DUMP_IN_CONTAINER}"

# Drop the existing database and re-create from dump
# --overwrite-destination=true is NOT supported for load, so we remove first
echo "  Removing existing database..."
docker exec "$CONTAINER" rm -rf "/var/lib/neo4j/data/databases/${DATABASE}" 2>/dev/null || true
docker exec "$CONTAINER" rm -rf "/var/lib/neo4j/data/transactions/${DATABASE}" 2>/dev/null || true

echo "  Loading dump..."
if docker exec "$CONTAINER" neo4j-admin database load "${DATABASE}" \
    --from-path="${DUMP_IN_CONTAINER%"${DUMP_BASENAME}"}" \
    --overwrite-destination=true 2>&1; then
    echo "  Load successful."

    # Clean up dump from container
    docker exec "$CONTAINER" rm -f "$DUMP_IN_CONTAINER" 2>/dev/null || true
else
    echo "ERROR: Database load failed."
    echo "  The dump may be incompatible with this Neo4j version."
    echo "  Keeping dump in container for debugging: ${DUMP_IN_CONTAINER}"
fi

echo "[5/5] Restarting Neo4j container..."
docker restart "$CONTAINER" >/dev/null 2>&1 || true
echo "  Container restarted. Waiting for Neo4j to become available..."
sleep 10

echo ""
echo "=== Restore complete ==="
echo "  Container: $CONTAINER"
echo "  Database:  $DATABASE"
echo "  Source:    $DUMP_FILE"
echo ""
echo "Verify with:"
echo "  docker exec ${CONTAINER} cypher-shell -u neo4j -p YOUR_PASSWORD"
echo "  'MATCH (n) RETURN count(n) AS node_count;'"
