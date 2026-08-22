#!/usr/bin/env node
/**
 * backup-db.js — Off-site backup via restic
 *
 * Pushes local backups from PROJECT_DIR/backups/ to a remote restic
 * repository for off-site disaster recovery.
 *
 * Required environment variables:
 *   RESTIC_REPOSITORY  — restic repository URL (e.g. s3:https://...)
 *   RESTIC_PASSWORD    — restic repository password
 *
 * Optional environment variables:
 *   RESTIC_HOST        — hostname tag (default: os.hostname())
 *
 * Usage:
 *   node scripts/backup-db.js
 *
 * Exit codes:
 *   0 — success
 *   1 — configuration error (missing env vars)
 *   2 — restic command failure (backup, forget, or check)
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const BACKUPS_DIR = path.join(PROJECT_DIR, 'backups');

function log(level, message) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`${ts} [${level}] ${message}`);
}

function runRestic(args, label) {
  const cmd = 'restic ' + args;
  log('INFO', 'Running: ' + (label || cmd));
  try {
    execSync(cmd, { stdio: 'inherit', cwd: PROJECT_DIR });
    log('SUCCESS', (label || cmd) + ' completed');
    return true;
  } catch (err) {
    log('ERROR', (label || cmd) + ' failed (exit code: ' + err.status + ')');
    return false;
  }
}

function checkResticAvailable() {
  try {
    execSync('restic version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const repository = process.env.RESTIC_REPOSITORY;
  const password = process.env.RESTIC_PASSWORD;
  const host = process.env.RESTIC_HOST || os.hostname();

  if (!repository) {
    log('ERROR', 'RESTIC_REPOSITORY environment variable is not set');
    process.exit(1);
  }
  if (!password) {
    log('ERROR', 'RESTIC_PASSWORD environment variable is not set');
    process.exit(1);
  }

  if (!checkResticAvailable()) {
    log('ERROR', 'restic is not installed or not in PATH');
    process.exit(1);
  }

  log('INFO', '=== Off-site restic backup start ===');
  log('INFO', 'Repository: ' + repository);
  log('INFO', 'Host: ' + host);
  log('INFO', 'Backups dir: ' + BACKUPS_DIR);

  // Step 1: Backup the backups directory to the restic repository
  if (!runRestic('--verbose backup "' + BACKUPS_DIR + '" --host "' + host + '"', 'restic backup')) {
    process.exit(2);
  }

  // Step 2: Apply retention policy (daily/weekly/monthly), then prune
  if (
    !runRestic(
      'forget --keep-daily 7 --keep-weekly 4 --keep-monthly 3 --prune',
      'restic forget (retention)'
    )
  ) {
    process.exit(2);
  }

  // Step 3: Verify repository integrity
  if (!runRestic('check', 'restic check (integrity)')) {
    process.exit(2);
  }

  log('SUCCESS', '=== Off-site restic backup complete ===');
}

main();
