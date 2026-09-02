/**
 * apply-r6-api.mjs — UXF-026: API limit/offset-Clamping
 *
 * Bug: /api/curricula/topics?limit=-1 ergab LIMIT -1 (Neo4j-Fehler → leere
 * Fallback-Antwort), ?offset=-5 analog SKIP -5 → 0 Topics statt 200.
 * parseInt('-1') ist truthy, || -Fallback greift nicht bei Negativwerten.
 *
 * Fix: limit auf [1, 1000], offset auf [0, ∞) clampen — an BEIDEN Stellen
 * (topics + objectives-Route, identischer Code).
 *
 * Datei: api/routes/curricula.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'api/routes/curricula.js');

function fail(anchor) {
  throw new Error(`[UXF-026] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-026')) {
  console.log('[UXF-026] bereits angewendet');
  process.exit(0);
}

const broken =
  '  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);\n' +
  '  const offset = parseInt(req.query.offset) || 0;';
const fixed =
  '  // UXF-026: Negativ-/Unsinn-Werte clampen (LIMIT -1 / SKIP -5 war\n' +
  '  // ein Neo4j-Fehler → leere Fallback-Antwort statt 200 Topics)\n' +
  '  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);\n' +
  '  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);';

const occurrences = src.split(broken).length - 1;
if (occurrences !== 2) fail(`limit/offset-Block (gefunden: ${occurrences}, erwartet: 2)`);

src = src.split(broken).join(fixed);
fs.writeFileSync(FILE, src);
console.log('[UXF-026] ✓ 2 Stellen geclampt (topics + objectives)');
