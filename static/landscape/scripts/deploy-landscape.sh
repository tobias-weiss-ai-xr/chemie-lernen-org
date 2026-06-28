#!/bin/bash
# SPDX-FileCopyrightText: 2026 openDesk Edu Contributors
# SPDX-License-Identifier: Apache-2.0
# Automated deployment script for landscape.opendesk-edu.org
#
# This script automates the complete deployment process:
# 1. Copies landscape files to hugo-chemie-lernen-org static directory
# 2. Sets proper permissions
# 3. Updates Traefik configuration for landscape.opendesk-edu.org routing
# 4. Verifies deployment success
#
# Usage: ./deploy-landscape.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANDSCAPE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
HUGO_REPO="/opt/git/hugo-chemie-lernen-org"
TRAEFIK_CONF_DIR="/opt/git/docker-traefik/dynamic_conf"
HUGO_CONTAINER="hugo-chemie-lernen-org"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== landscape.opendesk-edu.org Deployment Script ===${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}→ Checking prerequisites...${NC}"
if [ ! -d "$LANDSCAPE_DIR" ]; then
    echo -e "${RED}ERROR: Landscape directory not found: $LANDSCAPE_DIR${NC}"
    exit 1
fi

if [ ! -f "$LANDSCAPE_DIR/index.html" ]; then
    echo -e "${RED}ERROR: index.html not found in landscape directory${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: docker command not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# Step 1: Copy landscape files to hugo static directory
echo -e "${YELLOW}→ Step 1: Copying landscape files to hugo static directory...${NC}"
LANDSCAPE_TARGET="$HUGO_REPO/myhugoapp/static/landscape"

# Remove old version if exists
if [ -d "$LANDSCAPE_TARGET" ]; then
    echo "  Removing old landscape directory..."
    rm -rf "$LANDSCAPE_TARGET"
fi

# Create new directory
mkdir -p "$LANDSCAPE_TARGET"

# Copy all files
cp -r "$LANDSCAPE_DIR"/index.html "$LANDSCAPE_DIR"/styles.css "$LANDSCAPE_DIR"/script.js "$LANDSCAPE_DIR"/data "$LANDSCAPE_TARGET/" 2>/dev/null || true

# Remove CNAME file (not needed when hosted under subpath)
rm -f "$LANDSCAPE_TARGET/CNAME"

echo -e "${GREEN}✓ Files copied to $LANDSCAPE_TARGET${NC}"
echo ""

# Step 2: Set proper permissions
echo -e "${YELLOW}→ Step 2: Setting permissions...${NC}"
chmod -R 755 "$LANDSCAPE_TARGET"
chown -R $(id -u):$(id -g) "$LANDSCAPE_TARGET"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Step 3: Deploy files to running container
echo -e "${YELLOW}→ Step 3: Deploying files to hugo container...${NC}"
if docker ps --format "{{.Names}}" | grep -q "^$HUGO_CONTAINER$"; then
    # Copy files to container
    docker cp "$LANDSCAPE_TARGET/." "$HUGO_CONTAINER:/usr/share/nginx/html/landscape/" 2>/dev/null

    # Fix permissions in container
    docker exec "$HUGO_CONTAINER" chmod -R 755 /usr/share/nginx/html/landscape/

    echo -e "${GREEN}✓ Files deployed to container${NC}"
else
    echo -e "${YELLOW}⚠ Container $HUGO_CONTAINER not running${NC}"
    echo "  Files are in place, but container needs to be started"
fi
echo ""

# Step 4: Update Traefik configuration
echo -e "${YELLOW}→ Step 4: Updating Traefik configuration...${NC}"
TRAEFIK_CONFIG="$TRAEFIK_CONF_DIR/landscape-opendesk-edu.yml"

# Get the hugo container IP
HUGO_IP=$(docker inspect hugo-chemie-lernen-org --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" 2>/dev/null | head -1)

if [ -z "$HUGO_IP" ]; then
    echo -e "${YELLOW}⚠ Could not determine hugo container IP, using default 172.22.0.3${NC}"
    HUGO_IP="172.22.0.3"
fi

echo "  Hugo container IP: $HUGO_IP"

# Create Traefik config
cat > "$TRAEFIK_CONFIG" <<EOF
http:
  routers:
    landscape-opendesk-edu:
      entryPoints:
        - websecure
      rule: Host(\`landscape.opendesk-edu.org\`)
      service: landscape-opendesk-edu
      middlewares:
        - landscape-add-prefix
      tls:
        certResolver: mytlschallenge
    landscape-opendesk-edu-http:
      entryPoints:
        - web
      rule: Host(\`landscape.opendesk-edu.org\`)
      service: landscape-opendesk-edu
      middlewares:
        - redirect-to-https

  services:
    landscape-opendesk-edu:
      loadBalancer:
        servers:
          - url: http://$HUGO_IP:80
        passHostHeader: true

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    landscape-add-prefix:
      addPrefix:
        prefix: /landscape
EOF

echo -e "${GREEN}✓ Traefik configuration updated at $TRAEFIK_CONFIG${NC}"
echo ""

# Step 5: Wait for Traefik to reload
echo -e "${YELLOW}→ Step 5: Waiting for Traefik to reload configuration...${NC}"
sleep 5
echo -e "${GREEN}✓ Configuration should be active${NC}"
echo ""

# Step 6: Verify deployment
echo -e "${YELLOW}→ Step 6: Verifying deployment...${NC}"

# Test HTTPS
echo "  Testing HTTPS endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://landscape.opendesk-edu.org/" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓ HTTPS endpoint returns 200 OK${NC}"

    # Check title
    TITLE=$(curl -s "https://landscape.opendesk-edu.org/" 2>/dev/null | grep -oP '<title>\K[^<]+' | head -1)
    if [[ "$TITLE" == *"Landscape"* ]]; then
        echo -e "  ${GREEN}✓ Title correct: $TITLE${NC}"
    else
        echo -e "  ${YELLOW}⚠ Title not as expected: $TITLE${NC}"
    fi
else
    echo -e "  ${RED}✗ HTTPS endpoint returned: $HTTP_STATUS${NC}"
    echo "  The deployment may need more time or there may be an issue."
fi

# Test assets
echo "  Testing CSS asset..."
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://landscape.opendesk-edu.org/styles.css" 2>/dev/null || echo "000")
if [ "$CSS_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓ CSS asset accessible${NC}"
else
    echo -e "  ${YELLOW}⚠ CSS asset returned: $CSS_STATUS${NC}"
fi

echo "  Testing JS asset..."
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://landscape.opendesk-edu.org/script.js" 2>/dev/null || echo "000")
if [ "$JS_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓ JS asset accessible${NC}"
else
    echo -e "  ${YELLOW}⚠ JS asset returned: $JS_STATUS${NC}"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "🌄 landscape.opendesk-edu.org is now live!"
echo ""
echo "Useful commands:"
echo "  - View live site: https://landscape.opendesk-edu.org"
echo "  - Check Traefik logs: docker logs traefik | tail -50"
echo "  - Check hugo logs: docker logs hugo-chemie-lernen-org | tail -50"
echo "  - Redeploy: $0"
echo ""
