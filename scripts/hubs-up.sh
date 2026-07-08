#!/usr/bin/env bash
# Local-dev start script for the hubs.chemie-lernen.org stack.
# Requires: docker, docker-compose, mutagen, mutagen-compose, root (for .env)
#
# Usage:
#   sudo ./scripts/hubs-up.sh           # start (idempotent rebuild)
#   sudo ./scripts/hubs-up.sh status    # show container status
#   sudo ./scripts/hubs-up.sh stop      # stop containers (keeps volumes)
#   sudo ./scripts/hubs-up.sh reset     # stop + remove all volumes
#   sudo ./scripts/hubs-up.sh logs      # tail logs via mutagen observe

set -euo pipefail

HUBS_DIR="${HUBS_DIR:-/opt/containers/hubs-compose}"
HOSTNAME="hubs.chemie-lernen.org"

action="${1:-up}"

ensure_hosts_entry() {
  if ! grep -q "${HOSTNAME}" /etc/hosts; then
    echo "127.0.0.1 ${HOSTNAME} hubs-proxy.local" >> /etc/hosts
    echo "Added ${HOSTNAME} to /etc/hosts"
  else
    echo "/etc/hosts already has ${HOSTNAME}"
  fi
}

ensure_env() {
  if [[ ! -f "${HUBS_DIR}/.env" ]]; then
    local ip="${PRIVATE_NETWORK_IP:-192.168.1.1}"
    printf "PRIVATE_NETWORK_IP=%s\n" "${ip}" > "${HUBS_DIR}/.env"
    echo "Wrote ${HUBS_DIR}/.env with PRIVATE_NETWORK_IP=${ip}"
  fi
}

case "${action}" in
  up)
    ensure_hosts_entry
    ensure_env
    cd "${HUBS_DIR}"
    mutagen daemon start || true
    PRIVATE_NETWORK_IP="${PRIVATE_NETWORK_IP:-192.168.1.1}" \
      mutagen-compose -f "${HUBS_DIR}/docker-compose.yml" up --build --detach
    echo ""
    echo "Stack started. Endpoints:"
    echo "  https://${HOSTNAME}        (hubs-client, port 443 via haproxy)"
    echo "  https://${HOSTNAME}:8989   (hubs-admin)"
    echo "  https://${HOSTNAME}:4000   (reticulum API)"
    echo "  https://${HOSTNAME}:9090   (spoke asset editor)"
    echo "  https://${HOSTNAME}:6006   (hubs-storybook)"
    echo ""
    echo "First build of hubs-client takes 5-15 min. Tail with:"
    echo "  sudo ./scripts/hubs-up.sh logs"
    ;;
  status)
    cd "${HUBS_DIR}"
    docker compose ps
    ;;
  stop)
    cd "${HUBS_DIR}"
    mutagen-compose -f "${HUBS_DIR}/docker-compose.yml" down
    ;;
  reset)
    cd "${HUBS_DIR}"
    mutagen-compose -f "${HUBS_DIR}/docker-compose.yml" down --volumes --remove-orphans
    ;;
  logs)
    cd "${HUBS_DIR}"
    exec ./bin/observe
    ;;
  *)
    echo "Usage: $0 {up|status|stop|reset|logs}" >&2
    exit 1
    ;;
esac
