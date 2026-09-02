/**
 * apply-r4-mh.mjs — UXF-018: Modulhandbuch Modul-Deep-Link
 *
 *   /modulhandbuch/?uni=CALTECH&modul=Ch1  → öffnet Uni + Modul-Detail
 *
 *   - uni-Param NICHT mehr uppercasing (Round-3-API ist case-insensitive;
 *     toUpperCase ergab hässliche Echos wie 'ALBERT-LUDWIGS-FREIB')
 *   - URL wird bei Uni-/Modul-Wechsel per replaceState synchronisiert
 *   - Modul-Deep-Link wird nach dem Uni-Load aufgelöst (pendingModule)
 *
 * Datei: modulhandbuch-index.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/modulhandbuch-index.js');

function fail(anchor) {
  throw new Error(`[UXF-018] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-018')) {
  console.log('[UXF-018] bereits angewendet');
  process.exit(0);
}

// ── 1. URL-Sync-Helfer (nach moduleFilter-Variablen) ────────────────
const a1 = `  var moduleFilterQ = ''; // UXF-013: Client-Filter für Modul-Listen
  var moduleFilterTimer = null;`;
if (!src.includes(a1)) fail(a1);
src = src.replace(
  a1,
  a1 + `

  // UXF-018: URL-State für Universität + Modul (?uni=X&modul=CODE)
  var pendingModule = null; // Modul-Deep-Link, wartet auf den Uni-Load
  function updateMhUrl() {
    try {
      var params = new URLSearchParams();
      if (selectedUni) params.set('uni', selectedUni);
      if (
        moduleDetail &&
        moduleDetail.module &&
        moduleDetail.module.code
      ) {
        params.set('modul', moduleDetail.module.code);
      }
      var qs = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
    } catch (e) {
      /* noop */
    }
  }`
);

// ── 2. loadUni: URL sync + pendingModule auflösen ───────────────────
const a2 = `        .then(function (d) {
          modulesCache[code] = d;
          render();
        })`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `        .then(function (d) {
          modulesCache[code] = d;
          render();
          updateMhUrl(); // UXF-018
          // UXF-018: wartenden Modul-Deep-Link auflösen
          if (pendingModule) {
            var pm = pendingModule;
            pendingModule = null;
            loadModule(code, pm);
          }
        })`
);

// ── 3. loadModule: URL sync ──────────────────────────────────────────
const a3 = `      .then(function (d) {
        moduleDetail = d;
        render();
      })`;
if (!src.includes(a3)) fail(a3);
src = src.replace(
  a3,
  `      .then(function (d) {
        moduleDetail = d;
        render();
        updateMhUrl(); // UXF-018
      })`
);

// ── 4. showModules (Back): URL sync ─────────────────────────────────
{
  const anchor4 = `  function showModules(code) {
    selectedUni = code;
    moduleDetail = null;
    loadUni(code);
  }`;
  if (!src.includes(anchor4)) fail('showModules-Funktion');
  src = src.replace(
    anchor4,
    `  function showModules(code) {
    selectedUni = code;
    moduleDetail = null;
    updateMhUrl(); // UXF-018
    loadUni(code);
  }`
  );
}

// ── 5. Deep-Link: uni ohne toUpperCase + modul-Param ────────────────
const a4 = `  // Deep-link support: /modulhandbuch/?uni=CAM opens that university directly.
  var uniParam = new URLSearchParams(location.search).get('uni');

  function applyDeepLink() {
    if (uniParam && !selectedUni) {
      loadUni(uniParam.toUpperCase());
    }
  }`;
if (!src.includes(a4)) fail(a4);
src = src.replace(
  a4,
  `  // Deep-link support: /modulhandbuch/?uni=CAM opens that university directly.
  // UXF-018: ?uni=X&modul=CODE öffnet zusätzlich das Modul-Detail.
  var deepParams = new URLSearchParams(location.search);
  var uniParam = deepParams.get('uni');
  var modulParam = deepParams.get('modul');

  function applyDeepLink() {
    if (uniParam && !selectedUni) {
      // KEIN toUpperCase mehr — API matcht case-insensitive (UXF-009),
      // und die Original-Schreibweise ist die korrekte Echo-Basis.
      if (modulParam) pendingModule = modulParam.trim();
      loadUni(uniParam.trim());
    }
  }`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-018] ✓ 5 Edits in modulhandbuch-index.js');
