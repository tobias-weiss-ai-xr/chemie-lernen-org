#!/usr/bin/env bash
# ─── Chemie-Lernen systemd installer ──────────────────────────────────
# Installs and enables the 4 systemd service units for the chemie-lernen
# stack. Idempotent — safe to run multiple times.
#
# Usage:
#   sudo ./deploy/install-systemd.sh
#
# To remove:
#   sudo systemctl disable --now chemie-nginx chemie-chat-api chemie-neo4j chemie-monitoring
#   sudo rm /etc/systemd/system/chemie-*.service
#   sudo systemctl daemon-reload
# ────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_DIR="${SCRIPT_DIR}/systemd"
SYSTEMD_DIR="/etc/systemd/system"
SERVICES=(chemie-nginx chemie-chat-api chemie-neo4j chemie-monitoring)
INSTALL_FLAG="/etc/systemd/system/.chemie-installed"
COMPOSE_DIR="/opt/chemie-lernen-org"

# ── Pre-flight checks ──────────────────────────────────────────────────

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: Must be run as root (sudo)." >&2
    exit 1
fi

if [[ ! -d "${UNIT_DIR}" ]]; then
    echo "ERROR: Systemd unit directory not found: ${UNIT_DIR}" >&2
    exit 1
fi

if [[ ! -f "${COMPOSE_DIR}/docker-compose.yml" ]]; then
    echo "WARNING: Expected docker-compose.yml at ${COMPOSE_DIR} not found."
    echo "  The services will reference this path. Create a symlink if needed:" >&2
    echo "    ln -s $(pwd) ${COMPOSE_DIR}" >&2
fi

for svc in "${SERVICES[@]}"; do
    if [[ ! -f "${UNIT_DIR}/${svc}.service" ]]; then
        echo "ERROR: Missing unit file: ${UNIT_DIR}/${svc}.service" >&2
        exit 1
    fi
done

# ── Install unit files ─────────────────────────────────────────────────

echo ">>> Installing systemd unit files..."
for svc in "${SERVICES[@]}"; do
    src="${UNIT_DIR}/${svc}.service"
    dst="${SYSTEMD_DIR}/${svc}.service"

    if [[ -f "${dst}" ]]; then
        if diff -q "${src}" "${dst}" >/dev/null 2>&1; then
            echo "  ✔ ${svc}.service — already up to date"
            continue
        fi
        echo "  ~ ${svc}.service — updating (changed)"
    else
        echo "  + ${svc}.service — installing"
    fi

    cp "${src}" "${dst}"
    chmod 644 "${dst}"
done

# ── Reload systemd ─────────────────────────────────────────────────────

echo
echo ">>> Reloading systemd daemon..."
systemctl daemon-reload

# ── Enable and start services ──────────────────────────────────────────

echo
echo ">>> Enabling and starting services..."
for svc in "${SERVICES[@]}"; do
    echo "  ▶ ${svc}"

    if systemctl is-enabled "${svc}" >/dev/null 2>&1; then
        echo "    enabled (already)"
    else
        systemctl enable "${svc}"
        echo "    enabled ✓"
    fi

    if systemctl is-active "${svc}" >/dev/null 2>&1; then
        echo "    active (already)"
    else
        systemctl start "${svc}" || echo "    WARNING: start failed — check 'journalctl -u ${svc}'" >&2
        echo "    started ✓"
    fi
done

# ── Status summary ─────────────────────────────────────────────────────

echo
echo ">>> Status:"
systemctl status --no-pager "${SERVICES[@]}" 2>&1 || true

# ── Mark installed ─────────────────────────────────────────────────────

touch "${INSTALL_FLAG}"
echo
echo "✔ Install complete. ${#SERVICES[@]} services deployed."
echo "  Manage individually:  sudo systemctl {start,stop,restart,status} chemie-<name>"
echo "  View logs:            journalctl -u chemie-<name> -f"
