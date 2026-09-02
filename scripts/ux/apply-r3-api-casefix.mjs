/**
 * apply-r3-api-casefix.mjs — UXF-009: Modulhandbuch-API Case-Insensitivity
 *
 * BUG: shortCode wurde mit .toUpperCase() normalisiert, aber die Codes in
 * Neo4j sind mixed-case ('albert-ludwigs-freib', 'lmu_münchen' vs 'CALTECH',
 * 'FU_BERLIN'). Ergebnis: ~15 der 25 Universitäten lieferten 404!
 * Die Modul-Detail-Route hatte das inverse Problem (.toLowerCase() bricht
 * 'CALTECH').
 *
 * FIX: toLower()-Vergleich im Cypher statt JS-Normalisierung.
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'api/routes/modulhandbuch.js');

function fail(anchor) {
  throw new Error(`[UXF-009] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');

if (src.includes('UXF-009')) {
  console.log('[UXF-009] bereits angewendet');
  process.exit(0);
}

// ── 1. University-Route: JS-Normalisierung entfernen ────────────────
const a1 = `router.get('/api/modulhandbuch/university/:shortCode', async (req, res) => {
  const shortCode = req.params.shortCode.toUpperCase().trim();`;
if (!src.includes(a1)) fail(a1);
src = src.replace(
  a1,
  `router.get('/api/modulhandbuch/university/:shortCode', async (req, res) => {
  // UXF-009: KEIN toUpperCase — Codes sind mixed-case ('albert-ludwigs-freib'
  // vs 'CALTECH'). Vergleich case-insensitive im Cypher (unten).
  const shortCode = req.params.shortCode.trim();`
);

// ── 2. University-Route: Cypher auf toLower umstellen ───────────────
const a2 = `      \`MATCH (u:University {short_code: $code})
       OPTIONAL MATCH (u)-[:OFFERS_DEGREE]->(d:Degree)
       OPTIONAL MATCH (m:UniversityModule {university: $code})
       RETURN u, collect(DISTINCT d{.*}) AS degrees,
              collect(DISTINCT m{.*}) AS modules\`,`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `      // UXF-009: toLower statt exakter Property-Match (mixed-case Codes)
      \`MATCH (u:University)
       WHERE toLower(u.short_code) = toLower($code)
       OPTIONAL MATCH (u)-[:OFFERS_DEGREE]->(d:Degree)
       OPTIONAL MATCH (m:UniversityModule)
       WHERE toLower(m.university) = toLower($code)
       RETURN u, collect(DISTINCT d{.*}) AS degrees,
              collect(DISTINCT m{.*}) AS modules\`,`
);

// ── 3. Modul-Detail-Route: toLowerCase entfernen ────────────────────
const a3 = `  const univCode = req.params.univCode.toLowerCase().trim();`;
if (!src.includes(a3)) fail(a3);
src = src.replace(
  a3,
  `  // UXF-009: KEIN toLowerCase — bricht Uppercase-Codes ('CALTECH', 'FU_BERLIN')
  const univCode = req.params.univCode.trim();`
);

// ── 4. Modul-Detail-Route: Cypher auf toLower umstellen ─────────────
const a4 = `      \`MATCH (m:UniversityModule {module_code: $code, university: $univ})
       OPTIONAL MATCH (m)-[:CARRIES]->(e:ECTS)
       OPTIONAL MATCH (m)-[:PART_OF]->(d:Degree)
       OPTIONAL MATCH (off:ModuleOffering {module_code: $code, university: $univ})-[:TAUGHT_BY]->(l:Lecturer)`;
if (!src.includes(a4)) fail(a4);
src = src.replace(
  a4,
  `      // UXF-009: toLower statt exakter Property-Match
      \`MATCH (m:UniversityModule)
       WHERE m.module_code = $code AND toLower(m.university) = toLower($univ)
       OPTIONAL MATCH (m)-[:CARRIES]->(e:ECTS)
       OPTIONAL MATCH (m)-[:PART_OF]->(d:Degree)
       OPTIONAL MATCH (off:ModuleOffering)
       WHERE off.module_code = $code AND toLower(off.university) = toLower($univ)
       OPTIONAL MATCH (off)-[:TAUGHT_BY]->(l:Lecturer)`
);

// ── 5. Studienvergleich-Route: toUpperCase entfernen ────────────────
const a5 = `  const u1 = (req.query.u1 || '').trim().toUpperCase();
  const u2 = (req.query.u2 || '').trim().toUpperCase();
  const levelFilter = (req.query.level || '').trim().toUpperCase();`;
if (!src.includes(a5)) fail(a5);
src = src.replace(
  a5,
  `  // UXF-009: KEIN toUpperCase — mixed-case Codes ('albert-ludwigs-freib'
  // vs 'CALTECH'); Vergleich case-insensitive im Cypher (unten).
  const u1 = (req.query.u1 || '').trim();
  const u2 = (req.query.u2 || '').trim();
  const levelFilter = (req.query.level || '').trim();`
);

// ── 6. Studienvergleich-Route: Cypher auf toLower umstellen ─────────
const a6 = `    const baseCypher = \`
      MATCH (m:UniversityModule {university: $univ})
      \${levelFilter ? 'WHERE toUpper(m.level) = toUpper($level)' : ''}`;
if (!src.includes(a6)) fail(a6);
src = src.replace(
  a6,
  `    const baseCypher = \`
      MATCH (m:UniversityModule)
      WHERE toLower(m.university) = toLower($univ)
      \${levelFilter ? 'AND toUpper(m.level) = toUpper($level)' : ''}`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-009] ✓ 6 Stellen gefixt (3× JS-Normalisierung, 3× Cypher)');
