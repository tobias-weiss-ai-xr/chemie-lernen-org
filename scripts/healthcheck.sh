#!/bin/bash
# Healthcheck for chemie-lernen.org
# Runs periodically via systemd timer, writes status JSON to public dir

set -euo pipefail

SITE_DIR="/opt/git/hugo-chemie-lernen-org"
PUBLIC_DIR="${SITE_DIR}/myhugoapp/public"
LOG_DIR="/home/weiss/logs"
OUTPUT="${PUBLIC_DIR}/health.json"
NOW=$(date -Iseconds)

# HTTP check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://chemie-lernen.org/ 2>/dev/null || echo "000")

# Last deploy
LAST_DEPLOY=""
DEPLOY_LOG="${LOG_DIR}/chemie-deploy.log"
if [ -f "$DEPLOY_LOG" ]; then
  LAST_DEPLOY=$(tail -1 "$DEPLOY_LOG" 2>/dev/null | cut -d' ' -f1-2 || echo "unknown")
fi

# Last pipeline run
LAST_PIPELINE=$(journalctl -u chemie-article-pipeline.service --since "7 days ago" --no-pager -o short-iso 2>/dev/null | tail -1 | cut -d' ' -f1-2 || echo "never")

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Memory
MEM_FREE=$(free -m | awk '/Mem:/ {print int($7/$2 * 100)}')

# Neo4j check (chemie-neo4j container)
NEO4J_OK="false"
if docker inspect chemie-neo4j >/dev/null 2>&1; then
  NEO4J_RESULT=$(docker exec chemie-neo4j cypher-shell -u neo4j -p chemie "RETURN 1" 2>/dev/null || echo "FAIL")
  [ "$NEO4J_RESULT" = "1" ] && NEO4J_OK="true"
fi

cat > "$OUTPUT" <<EOF
{
  "status": "$([ "$HTTP_STATUS" = "200" ] && echo "ok" || echo "degraded")",
  "timestamp": "$NOW",
  "checks": {
    "http": {"status": ${HTTP_STATUS}, "healthy": $([ "$HTTP_STATUS" = "200" ] && echo "true" || echo "false")},
    "disk": {"usage_pct": ${DISK_USAGE}, "healthy": $([ "$DISK_USAGE" -lt 90 ] && echo "true" || echo "false")},
    "memory": {"free_pct": ${MEM_FREE}, "healthy": $([ "$MEM_FREE" -gt 10 ] && echo "true" || echo "false")},
    "neo4j": {"status": ${NEO4J_OK}, "healthy": ${NEO4J_OK}}
  },
  "last_deploy": "${LAST_DEPLOY}",
  "last_pipeline": "${LAST_PIPELINE}"
}
EOF
echo "health.json written with status=$([ "$HTTP_STATUS" = "200" ] && echo ok || echo degraded)"
