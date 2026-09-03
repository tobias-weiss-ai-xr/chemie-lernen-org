#!/usr/bin/env bash
# ─── Chemie-Lernen systemd installer ──────────────────────────────────
# Installs and enables the systemd units for the chemie-lernen stack:
# 4 services + the daily article-pipeline timer (RSS -> LLM -> Hugo -> KG).
# Idempotent — safe to run multiple times.
#
# Usage:
#   sudo ./deploy/install-systemd.sh
#
# To remove:
#   sudo systemctl disable --now chemie-nginx chemie-chat-api chemie-neo4j chemie-monitoring
#   sudo systemctl disable --now chemie-article-pipeline.timer
#   sudo rm /etc/systemd/system/chemie-*.service /etc/systemd/system/chemie-*.timer
#   sudo systemctl daemon-reload
# ────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_DIR="${SCRIPT_DIR}/systemd"
SYSTEMD_DIR="/etc/systemd/system"
SERVICES=(chemie-nginx chemie-chat-api chemie-neo4j chemie-monitoring)
# Article pipeline: oneshot service triggered by its .timer (not a daemon)
TIMERS=(chemie-article-pipeline)
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

for tmr in "${TIMERS[@]}"; do
    for ext in service timer; do
        if [[ ! -f "${UNIT_DIR}/${tmr}.${ext}" ]]; then
            echo "ERROR: Missing unit file: ${UNIT_DIR}/${tmr}.${ext}" >&2
            exit 1
        fi
    done
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

# ── Install timer unit files ──────────────────────────────────────────

echo ">>> Installing timer unit files..."
for tmr in "${TIMERS[@]}"; do
    for ext in service timer; do
        src="${UNIT_DIR}/${tmr}.${ext}"
        dst="${SYSTEMD_DIR}/${tmr}.${ext}"

        if [[ -f "${dst}" ]]; then
            if diff -q "${src}" "${dst}" >/dev/null 2>&1; then
                echo "  ✔ ${tmr}.${ext} — already up to date"
                continue
            fi
            echo "  ~ ${tmr}.${ext} — updating (changed)"
        else
            echo "  + ${tmr}.${ext} — installing"
        fi

        cp "${src}" "${dst}"
        chmod 644 "${dst}"
    done
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

# ── Enable and start timers ───────────────────────────────────────────

echo
echo ">>> Enabling and starting timers..."
for tmr in "${TIMERS[@]}"; do
    echo "  ▶ ${tmr}.timer"

    if systemctl is-enabled "${tmr}.timer" >/dev/null 2>&1; then
        echo "    enabled (already)"
    else
        systemctl enable "${tmr}.timer"
        echo "    enabled ✓"
    fi

    if systemctl is-active "${tmr}.timer" >/dev/null 2>&1; then
        echo "    active (already)"
    else
        systemctl start "${tmr}.timer" || echo "    WARNING: start failed — check 'journalctl -u ${tmr}'" >&2
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
