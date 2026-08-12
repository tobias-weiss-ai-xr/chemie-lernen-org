#!/bin/bash
# backup-graph-git.sh — nightly chunked graph backup to the dedicated
# git repository (chemie-graph-backup). Runs the Neo4j export, commits
# all changed chunks and pushes to the remote. No LFS needed: files are
# chunked below safe git sizes by export-graph-backup.mjs.
#
# Usage:  scripts/backup-graph-git.sh
# Env:
#   GRAPH_BACKUP_REPO  path to the backup git repo (default ../graph-backup-repo)
#   GRAPH_BACKUP_REMOTE remote name to push (default origin; empty = no push)
#   SKIP_PUSH  set → commit locally only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_DIR}/backups/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/backup_graph_git_$(date +%Y%m%d_%H%M%S).log"

REPO="${GRAPH_BACKUP_REPO:-${PROJECT_DIR}/graph-backup-repo}"
REMOTE="${GRAPH_BACKUP_REMOTE:-origin}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $*" | tee -a "$LOG_FILE"
}

log "=== Graph git backup ==="

# 1. Export (staging dir inside the repo so git tracks it)
STAGE="${REPO}/data"
mkdir -p "$REPO" "$STAGE"
if [[ ! -d "${REPO}/.git" ]]; then
    log "Initializing backup repo at ${REPO}"
    git -C "$REPO" init -q
    git -C "$REPO" config user.email "backup@chemie-lernen.org"
    git -C "$REPO" config user.name "chemie-graph-backup"
    printf 'data/\n*.tmp\n' > "${REPO}/.gitignore"
fi

log "Exporting graph chunks..."
# chemie-kg is the site's graph DB. Host port 7688 = chemie-kg (7687 = the
# central chemie-neo4j incl. code-analysis noise — NOT what this backup
# covers). Override any ambient NEO4J_URI from ~/.bashrc.
export NEO4J_URI="${GRAPH_BACKUP_NEO4J_URI:-bolt://localhost:7688}"
export NEO4J_DATABASE="${GRAPH_BACKUP_NEO4J_DATABASE:-chemie}"
node "${SCRIPT_DIR}/export-graph-backup.mjs" "$STAGE" 2>&1 | tee -a "$LOG_FILE"
EXPORT_EXIT=${PIPESTATUS[0]}
if [[ "$EXPORT_EXIT" -ne 0 ]]; then
    log "ERROR: export failed (exit=${EXPORT_EXIT})"
    exit "$EXPORT_EXIT"
fi

# 2. Commit
log "Committing..."
cd "$REPO"
git add -A
if git diff --cached --quiet; then
    log "No changes — nothing to commit."
else
    git commit -q -m "graph backup $(date -u '+%Y-%m-%dT%H:%M:%SZ')" || {
        log "ERROR: commit failed"
        exit 1
    }
    log "Committed."
fi

# 3. Push
if [[ -n "$REMOTE" && "${SKIP_PUSH:-}" != "1" ]]; then
    if git remote get-url "$REMOTE" >/dev/null 2>&1; then
        log "Pushing to ${REMOTE}..."
        git push "$REMOTE" HEAD 2>&1 | tee -a "$LOG_FILE"
        log "Pushed."
    else
        log "WARNING: remote '${REMOTE}' not configured — skipping push."
    fi
fi

log "=== Graph git backup complete ==="
