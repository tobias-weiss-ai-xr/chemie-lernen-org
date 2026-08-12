#!/bin/bash
# vendor-core.sh — pulls the proprietary chemie-core lib into the public
# repo tree so the API can build and tests can run.
#
# The private repo (github.com/tobias-weiss-ai-xr/chemie-core) mirrors the
# relative paths of the core files inside this repo (api/prompts/...,
# api/services/..., scripts/...). This script clones it to .core/ (gitignored)
# and copies the files into place. It is idempotent and offline-friendly:
# if the clone already exists it does a fast pull; if the network is down it
# uses the cached copy.
#
# Usage:  scripts/vendor-core.sh
# Env:
#   CORE_REPO_URL     override (default: git@github.com:tobias-weiss-ai-xr/chemie-core.git)
#   CORE_SSH_KEY      path to the deploy key (default: ~/.ssh/chemie_core_deploy)
#   SKIP_CORE_PULL    set → use cached copy only (no network)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

CORE_REPO_URL="${CORE_REPO_URL:-git@github.com:tobias-weiss-ai-xr/chemie-core.git}"
CORE_SSH_KEY="${CORE_SSH_KEY:-${HOME}/.ssh/chemie_core_deploy}"
CACHE_DIR="${PROJECT_DIR}/.core"

if [[ "${SKIP_CORE_PULL:-}" == "1" ]]; then
    echo "[vendor-core] SKIP_CORE_PULL=1 — using cached core at ${CACHE_DIR}"
elif [[ -d "${CACHE_DIR}/.git" ]]; then
    echo "[vendor-core] pulling core updates..."
    GIT_SSH_COMMAND="ssh -i ${CORE_SSH_KEY} -o StrictHostKeyChecking=no" \
        git -C "${CACHE_DIR}" pull --ff-only -q || echo "[vendor-core] pull failed — using cached copy"
else
    echo "[vendor-core] cloning core repo..."
    rm -rf "${CACHE_DIR}"
    GIT_SSH_COMMAND="ssh -i ${CORE_SSH_KEY} -o StrictHostKeyChecking=no" \
        git clone -q "${CORE_REPO_URL}" "${CACHE_DIR}"
fi

if [[ ! -d "${CACHE_DIR}" ]]; then
    echo "[vendor-core] ERROR: no core available (network down and no cache)" >&2
    exit 1
fi

echo "[vendor-core] copying core files into tree..."
# Copy only the api/ and scripts/ subtrees (the core repo mirrors relative
# paths for these). Never overwrite top-level files that exist in both repos
# (README.md, .gitignore, etc.).
cd "${CACHE_DIR}"
git ls-files -z | while IFS= read -r -d '' f; do
    case "${f}" in
        api/*|scripts/*) ;;
        *) continue ;;
    esac
    dest="${PROJECT_DIR}/${f}"
    mkdir -p "$(dirname "${dest}")"
    cp "${CACHE_DIR}/${f}" "${dest}"
done

echo "[vendor-core] done — $(git -C "${CACHE_DIR}" ls-files 'api/*' 'scripts/*' | wc -l) files vendored."
