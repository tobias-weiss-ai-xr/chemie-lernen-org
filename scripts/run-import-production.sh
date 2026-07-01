#!/usr/bin/env bash
# run-import-production.sh
#
# Importiert Modulhandbuch-Daten in Neo4j auf dem Produktionsserver.
# Läuft als one-shot Docker-Container auf dem traefik-web Netzwerk,
# damit er den chemie-neo4j Container erreicht.
#
# Usage:
#   ./scripts/run-import-production.sh              # Standard-Import
#   ./scripts/run-import-production.sh --dry-run     # Nur Prüfung
#   ./scripts/run-import-production.sh --file ../data/modulhandbuch/tum.json  # Einzelfile

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

NEO4J_URI="${NEO4J_URI:-bolt://chemie-neo4j:7687}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-chemie_knowledge_2024}"
NETWORK="${NETWORK:-traefik-web}"

echo "=== Modulhandbuch Neo4j Import (Production) ==="
echo "  Neo4j URI: $NEO4J_URI"
echo "  Network:   $NETWORK"
echo "  Dry-Run:   ${DRY_RUN:-false}"
echo ""

docker run --rm \
  --network "$NETWORK" \
  -e "NEO4J_URI=$NEO4J_URI" \
  -e "NEO4J_PASSWORD=$NEO4J_PASSWORD" \
  -e "NEO4J_USER=neo4j" \
  -e "NEO4J_DATABASE=chemie" \
  -v "$PROJECT_DIR:/workspace" \
  -w "/workspace" \
  node:22-alpine \
  node scripts/import-modulhandbuch.mjs "$@"

echo ""
echo "=== Import abgeschlossen ==="
