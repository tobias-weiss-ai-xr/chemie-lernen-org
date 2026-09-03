/**
 * apply-r8-api-params.mjs — UXF-034: Express-Array-Param-Crash (500)
 *
 * Express macht `?state=a&state=b` zu `req.query.state = ['a','b']`.
 * Alle Stellen mit `(req.query.x || '').trim()` / `.toLowerCase()` /
 * `.toUpperCase()` werfen dann TypeError → Express-500, obwohl der
 * Client nichts kaputtes geschickt hat (legales URL-Format).
 *
 * Fix: qs()-Helfer in jeder betroffenen Route-Datei — nimmt bei Arrays
 * das erste Element, koerziert alles andere zu String (inkl. null → '').
 * Alle `(req.query.x || '')`-Muster gehen auf qs() um.
 *
 * Dateien:
 *   api/routes/curricula.js      (11 Stellen)
 *   api/routes/modulhandbuch.js  (5 Stellen)
 *   api/routes/content.js        (2 Stellen)
 *   api/routes/kg-data.js        (1 Stelle)
 *   api/routes/learning-paths.js (1 Stelle)
 *
 * Idempotent via Marker. Wirft bei fehlendem Anker oder zu wenigen
 * Ersetzungen.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

const HELPER = `// UXF-034: Query-Params koerzieren — Express macht ?x=a&x=b zu Arrays,
// .trim()/.toLowerCase() auf Arrays wirft TypeError (500). qs() nimmt bei
// Arrays das erste Element und koerziert alles zu String (null → '').
function qs(v) {
  if (Array.isArray(v)) return v.length ? String(v[0]) : '';
  return v == null ? '' : String(v);
}

`;

const FILES = [
  { rel: 'api/routes/curricula.js', min: 11 },
  { rel: 'api/routes/modulhandbuch.js', min: 5 },
  { rel: 'api/routes/content.js', min: 2 },
  { rel: 'api/routes/kg-data.js', min: 1 },
  { rel: 'api/routes/learning-paths.js', min: 1 },
];

const ROUTER_ANCHOR = 'const router = Router();';
const PATTERN = /\(req\.query\.(\w+) \|\| ''\)/g;

for (const { rel, min } of FILES) {
  const file = path.join(REPO_ROOT, rel);
  let src = fs.readFileSync(file, 'utf-8');

  if (src.includes('UXF-034')) {
    console.log(`[UXF-034] ${rel} bereits gepatcht`);
    continue;
  }

  // 1. Helfer vor der Router-Deklaration einfügen
  if (!src.includes(ROUTER_ANCHOR)) throw new Error(`[UXF-034] Router-Anker fehlt in ${rel}`);
  src = src.replace(ROUTER_ANCHOR, HELPER + ROUTER_ANCHOR);

  // 2. Alle (req.query.x || '')-Muster umschreiben
  let count = 0;
  src = src.replace(PATTERN, (m, name) => {
    count += 1;
    return `(qs(req.query.${name}))`;
  });
  if (count < min) {
    throw new Error(`[UXF-034] ${rel}: nur ${count} Ersetzungen (erwartet ≥ ${min})`);
  }

  fs.writeFileSync(file, src);
  execFileSync('node', ['--check', file], { stdio: 'pipe' });
  console.log(`[UXF-034] ✓ ${rel}: ${count} Stellen gehärtet`);
}

console.log('[r8-api-params] ✓ abgeschlossen');
