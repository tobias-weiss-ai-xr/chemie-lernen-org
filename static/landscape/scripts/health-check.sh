#!/bin/bash
# SPDX-FileCopyrightText: 2026 openDesk Edu Contributors
# SPDX-License-Identifier: Apache-2.0
# Health check script for landscape.opendesk-edu.org
#
# Monitors:
# - HTTPS endpoint availability
# - Asset loading (CSS, JS)
# - Service count consistency
# - Container health
# - Traefik routing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SITE_URL="https://landscape.opendesk-edu.org"
EXIT_CODE=0

check() {
    local name="$1"
    local result="$2"
    if [ "$result" = "0" ]; then
        echo -e "  ${GREEN}✓${NC} $name"
    else
        echo -e "  ${RED}✗${NC} $name"
        EXIT_CODE=1
    fi
}

info() {
    echo -e "  ${YELLOW}ℹ${NC} $1"
}

echo -e "${GREEN}=== landscape.opendesk-edu.org Health Check ===${NC}"
echo ""

# Test 1: HTTPS endpoint
echo "Testing HTTPS endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    check "HTTPS endpoint returns 200 OK" 0
else
    check "HTTPS endpoint (got: $HTTP_STATUS)" 1
fi

# Test 2: Page content
echo ""
echo "Testing page content..."
TITLE=$(curl -s "${SITE_URL}/" 2>/dev/null | grep -oP '<title>\K[^<]+' | head -1)
if [[ "$TITLE" == *"Landscape"* ]] && [[ "$TITLE" == *"openDesk"* ]]; then
    check "Page title is correct: $TITLE" 0
else
    check "Page title is incorrect: $TITLE" 1
fi

H1=$(curl -s "${SITE_URL}/" 2>/dev/null | grep -oP '<h1>\K[^<]+' | head -1)
if [[ "$H1" == *"Landscape"* ]]; then
    check "H1 heading is correct: $H1" 0
else
    check "H1 heading is incorrect: $H1" 1
fi

# Test 3: Assets
echo ""
echo "Testing assets..."
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/styles.css" 2>/dev/null || echo "000")
if [ "$CSS_STATUS" = "200" ]; then
    check "CSS asset accessible" 0
else
    check "CSS asset (got: $CSS_STATUS)" 1
fi

JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/script.js" 2>/dev/null || echo "000")
if [ "$JS_STATUS" = "200" ]; then
    check "JS asset accessible" 0
else
    check "JS asset (got: $JS_STATUS)" 1
fi

# Test 4: Data file
echo ""
echo "Testing data integrity..."
SCRIPT_CONTENT=$(curl -s "${SITE_URL}/script.js" 2>/dev/null)
SERVICE_COUNT=$(echo "$SCRIPT_CONTENT" | grep -c 'name: "' 2>/dev/null | head -1)
if [ -n "$SERVICE_COUNT" ] && [ "$SERVICE_COUNT" -ge "20" ]; then
    check "Service data loaded ($SERVICE_COUNT services found)" 0
else
    check "Service data insufficient (got: $SERVICE_COUNT)" 1
fi

# Test 5: Container health
echo ""
echo "Checking container health..."
if command -v docker &> /dev/null; then
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "hugo-chemie-lernen-org"; then
        CONTAINER_STATUS=$(docker inspect hugo-chemie-lernen-org --format "{{.State.Status}}" 2>/dev/null)
        if [ "$CONTAINER_STATUS" = "running" ]; then
            check "Hugo container is running" 0
        else
            check "Hugo container status: $CONTAINER_STATUS" 1
        fi
    else
        check "Hugo container not found" 1
    fi

    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^traefik$"; then
        TRAEFIK_STATUS=$(docker inspect traefik --format "{{.State.Status}}" 2>/dev/null)
        if [ "$TRAEFIK_STATUS" = "running" ]; then
            check "Traefik container is running" 0
        else
            check "Traefik container status: $TRAEFIK_STATUS" 1
        fi
    else
        check "Traefik container not found" 1
    fi
else
    info "Docker not available, skipping container checks"
fi

# Test 6: SSL certificate
echo ""
echo "Checking SSL certificate..."
SSL_EXPIRY=$(echo | openssl s_client -servername landscape.opendesk-edu.org -connect landscape.opendesk-edu.org:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$SSL_EXPIRY" ]; then
    info "SSL certificate expires: $SSL_EXPIRY"
    check "SSL certificate valid" 0
else
    check "SSL certificate check failed" 1
fi

# Summary
echo ""
echo "=================================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All health checks passed${NC}"
    echo ""
    echo "🌄 landscape.opendesk-edu.org is healthy and operational"
else
    echo -e "${RED}✗ Some health checks failed${NC}"
    echo ""
    echo "Please review the failed checks above and take corrective action."
fi
echo "=================================================="

exit $EXIT_CODE
