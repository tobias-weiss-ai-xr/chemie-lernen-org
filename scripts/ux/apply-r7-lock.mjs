/**
 * apply-r7-lock.mjs — R7-LOCK: bun.lock reparieren
 *
 * Commit 8462cc01 (bad merge) hinterließ 20 committe Stash-Konfliktblöcke
 * ("<<<<<<< Updated upstream / ======= / >>>>>>> Stashed changes") in
 * bun.lock — jede use machte die Datei unparsebar.
 *
 * Auflösung: Upstream-Seite behalten (entspricht dem aktuellen package.json
 * auf main; die Stashed-Seite war ein älterer Dep-Satz).
 *
 * Warum nicht `bun install` zur Regeneration? bun 1.4.0 kann file:*.tgz-
 * Dependencies (@graphwiz/*) nicht auflösen — es greift trotz korrektem
 * file:-Pfad in die Registry (404). CI nutzt npm (package-lock.json).
 *
 * Idempotent: ohne Marker ist nichts zu tun; validiert JSONC + Kern-_deps.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const LOCK = path.join(REPO_ROOT, 'bun.lock');

let src = fs.readFileSync(LOCK, 'utf-8');
const markerCount = (src.match(/<<<<<<< Updated upstream/g) || []).length;

if (markerCount === 0) {
  console.log('[R7-LOCK] keine Konfliktmarker — bereits repariert');
} else {
  src = src.replace(
    /<<<<<<< Updated upstream\n([\s\S]*?)=======\n[\s\S]*?>>>>>>> Stashed changes\n/g,
    '$1'
  );
  const left = (src.match(/<<<<<<<|>>>>>>>|^=======/gm) || []).length;
  if (left > 0) throw new Error(`[R7-LOCK] ${left} Marker-Reste nach Auflösung`);
  fs.writeFileSync(LOCK, src);
  console.log(`[R7-LOCK] ✓ ${markerCount} Konfliktblöcke aufgelöst (Upstream-Seite)`);
}

// Validierung: bun.lock ist JSONC → trailing commas tolerant strippen
// (spawnSync ohne Shell — JSON.stringify in node -e via Shell zerstört \n)
import { spawnSync } from 'node:child_process';
const check = `
const fs = require('fs');
let src = fs.readFileSync(${JSON.stringify(LOCK)}, 'utf8');
src = src.replace(/,(\\s*[}\\]])/g, '$1');
const d = JSON.parse(src);
const pkgs = Object.keys(d.packages || {});
const needed = ['@graphwiz/core', 'neo4j-driver', 'redis', 'express'];
const missing = needed.filter((n) => !pkgs.some((p) => p.startsWith(n)));
if (missing.length) { console.error('FEHLEN:', missing); process.exit(1); }
console.log('JSONC-valid,', pkgs.length, 'packages,', needed.length, 'Kern-deps vorhanden');
`;
const res = spawnSync(process.execPath, ['-e', check], { encoding: 'utf-8' });
if (res.stdout) process.stdout.write(res.stdout);
if (res.status !== 0) {
  process.stderr.write(res.stderr || '');
  throw new Error('[R7-LOCK] Validierung fehlgeschlagen');
}
console.log('[R7-LOCK] ✓ abgeschlossen');
