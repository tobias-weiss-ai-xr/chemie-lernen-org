#!/bin/bash
# Healthcheck for chemie-lernen.org
# Runs periodically via systemd timer, writes status JSON to a host dir
# that is bind-mounted into the nginx container (served at /health/health.json).
# NOTE: do NOT write into myhugoapp/public/ — that dir is baked into the
# GHCR image at build time and is NOT mounted into the running container,
# so files there are never served (bug fixed 2026-09-04).

set -euo pipefail

LOG_DIR="/home/weiss/logs"
OUTPUT_DIR="/home/weiss/health"
OUTPUT="${OUTPUT_DIR}/health.json"
mkdir -p "$OUTPUT_DIR"
NOW=$(date -Iseconds)

# Static site check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://chemie-lernen.org/ 2>/dev/null || echo "000")

# API check (chemie-chat-api behind Traefik)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://chemie-lernen.org/api/health 2>/dev/null || echo "000")

# Last deploy = creation time of the running site container (the deploy
# workflow recreates it on every push to main)
LAST_DEPLOY=$(docker inspect -f '{{.Created}}' hugo-chemie-lernen-org 2>/dev/null || echo "unknown")

# Last pipeline run
LAST_PIPELINE=$(journalctl -u chemie-article-pipeline.service --since "7 days ago" --no-pager -o short-iso 2>/dev/null | tail -1 | cut -d' ' -f1-2 || echo "never")

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Memory
MEM_FREE=$(free -m | awk '/Mem:/ {print int($7/$2 * 100)}')

# Neo4j check (chemie-neo4j container) — password comes from the server
# .env (deploy syncs it), NOT hardcoded (the real password differs)
NEO4J_OK="false"
NEO4J_PW=$(grep -E '^NEO4J_PASSWORD=' /opt/git/hugo-chemie-lernen-org/.env 2>/dev/null | head -1 | cut -d= -f2- | tr -d "\"'" || echo "")
if docker inspect chemie-neo4j >/dev/null 2>&1 && [ -n "$NEO4J_PW" ]; then
  NEO4J_RESULT=$(docker exec chemie-neo4j cypher-shell -u neo4j -p "$NEO4J_PW" "RETURN 1" 2>/dev/null || echo "FAIL")
  [ "$NEO4J_RESULT" = "1" ] && NEO4J_OK="true"
fi

SITE_OK=$([ "$HTTP_STATUS" = "200" ] && echo "true" || echo "false")
API_OK=$([ "$API_STATUS" = "200" ] && echo "true" || echo "false")
OVERALL="degraded"
if [ "$SITE_OK" = "true" ] && [ "$API_OK" = "true" ]; then OVERALL="ok"; fi

cat > "$OUTPUT" <<EOF
{
  "status": "${OVERALL}",
  "timestamp": "$NOW",
  "checks": {
    "http": {"status": ${HTTP_STATUS}, "healthy": ${SITE_OK}},
    "api": {"status": ${API_STATUS}, "healthy": ${API_OK}},
    "disk": {"usage_pct": ${DISK_USAGE}, "healthy": $([ "$DISK_USAGE" -lt 90 ] && echo "true" || echo "false")},
    "memory": {"free_pct": ${MEM_FREE}, "healthy": $([ "$MEM_FREE" -gt 10 ] && echo "true" || echo "false")},
    "neo4j": {"status": ${NEO4J_OK}, "healthy": ${NEO4J_OK}}
  },
  "last_deploy": "${LAST_DEPLOY}",
  "last_pipeline": "${LAST_PIPELINE}"
}
EOF
echo "health.json written with status=${OVERALL}"
