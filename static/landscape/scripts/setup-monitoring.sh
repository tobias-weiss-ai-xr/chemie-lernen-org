#!/bin/bash
# SPDX-FileCopyrightText: 2026 openDesk Edu Contributors
# SPDX-License-Identifier: Apache-2.0
# Setup script for automated monitoring and deployment
#
# This script:
# 1. Installs cron jobs for health checks
# 2. Sets up log rotation
# 3. Creates systemd service (optional)
# 4. Configures monitoring endpoints

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Setup Automated Monitoring ===${NC}"
echo ""

# Check if running as root for cron
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: Some operations require root access (cron installation)${NC}"
    echo "Run with sudo for full installation"
    echo ""
fi

# Create log directory
echo -e "${YELLOW}→ Creating log directory...${NC}"
mkdir -p /var/log/landscape
chmod 755 /var/log/landscape
echo -e "${GREEN}✓ Log directory created: /var/log/landscape${NC}"
echo ""

# Install cron job for health checks
echo -e "${YELLOW}→ Installing cron job for health checks...${NC}"

CRON_LINE="*/15 * * * * ${SCRIPT_DIR}/health-check.sh >> /var/log/landscape/health.log 2>&1"

# Check if cron already exists
if crontab -l 2>/dev/null | grep -q "landscape.opendesk-edu.org"; then
    echo "  Cron job already exists, skipping..."
else
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    echo -e "${GREEN}✓ Cron job installed (every 15 minutes)${NC}"
fi
echo ""

# Install cron job for auto-deployment check
echo -e "${YELLOW}→ Installing cron job for deployment sync...${NC}"

DEPLOY_CRON="0 */6 * * * cd ${SCRIPT_DIR}/../.. && git pull origin main 2>/dev/null && ${SCRIPT_DIR}/deploy-landscape.sh >> /var/log/landscape/deploy.log 2>&1"

if crontab -l 2>/dev/null | grep -q "deploy-landscape.sh"; then
    echo "  Deploy cron job already exists, skipping..."
else
    (crontab -l 2>/dev/null; echo "$DEPLOY_CRON") | crontab -
    echo -e "${GREEN}✓ Deploy cron job installed (every 6 hours)${NC}"
fi
echo ""

# Create logrotate config
echo -e "${YELLOW}→ Creating logrotate configuration...${NC}"

cat > /etc/logrotate.d/landscape <<EOF
/var/log/landscape/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        # Optional: trigger notification on rotation
    endscript
}
EOF

echo -e "${GREEN}✓ Logrotate config created${NC}"
echo ""

# Verify installation
echo -e "${YELLOW}→ Verifying installation...${NC}"
echo "Current crontab:"
crontab -l 2>/dev/null | grep -A 0 "landscape" || echo "  No landscape cron jobs found"
echo ""

# Test health check
echo -e "${YELLOW}→ Running test health check...${NC}"
${SCRIPT_DIR}/health-check.sh
echo ""

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Automated monitoring is now active:"
echo "  - Health checks: every 15 minutes"
echo "  - Auto-deployment: every 6 hours"
echo "  - Logs: /var/log/landscape/"
echo ""
echo "Useful commands:"
echo "  - View logs: tail -f /var/log/landscape/health.log"
echo "  - Manual check: ${SCRIPT_DIR}/health-check.sh"
echo "  - Manual deploy: ${SCRIPT_DIR}/deploy-landscape.sh"
echo "  - List cron jobs: crontab -l"
