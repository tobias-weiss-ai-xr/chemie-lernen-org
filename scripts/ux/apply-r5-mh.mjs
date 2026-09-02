/**
 * apply-r5-mh.mjs — UXF-024: Modul-Liste sortieren (A–Z / ECTS)
 *
 * Die Modul-Liste je Universität ist nur alphabetisch (nach Name) sortiert.
 * Neu: Sortier-Select über der Liste — „A–Z" / „ECTS absteigend". Die
 * Sortierung wirkt auf die gefilterte Liste (UXF-013) innerhalb der
 * Abschluss-Gruppen und bleibt sitzungspersistent (var).
 *
 * Datei: static/js/modulhandbuch-index.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/modulhandbuch-index.js');

function fail(anchor) {
  throw new Error(`[UXF-024] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-024')) {
  console.log('[UXF-024] bereits angewendet');
  process.exit(0);
}

// ── 1. Sort-State ────────────────────────────────────────────────────
const a1 = `  var moduleFilterQ = ''; // UXF-013: Client-Filter für Modul-Listen
  var moduleFilterTimer = null;`;
if (!src.includes(a1)) fail(a1);
src = src.replace(a1, a1 + `
  var moduleSortBy = 'az'; // UXF-024: 'az' | 'ects'`);

// ── 2. Sort anwenden + Select-UI in der Modul-Liste ─────────────────
const a2 = `        var shown = data.modules.filter(matchesFilter);
        var sumEcts = function (list) {`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `        var shown = data.modules.filter(matchesFilter);
        // UXF-024: Sortierung (innerhalb der Abschluss-Gruppen wirksam)
        if (moduleSortBy === 'ects') {
          shown = shown.slice().sort(function (a, b) {
            return (Number(b.ects) || 0) - (Number(a.ects) || 0);
          });
        }
        var sumEcts = function (list) {`
);

// ── 3. Select ins Filter-HTML (neben Zähler) ─────────────────────────
const a3 = `          '<span class="mh-module-stats" role="status">' +
          shown.length +
          ' von ' +
          data.modules.length +
          ' Modulen · Σ ' +
          sumEcts(shown) +
          ' / ' +
          sumEcts(data.modules) +
          ' ECTS</span>' +
          '</div>';`;
if (!src.includes(a3)) fail(a3);
src = src.replace(
  a3,
  `          '<label class="mh-module-sort" style="font-size:0.85rem;">Sortieren: ' +
          '<select id="mh-module-sort" style="margin-left:4px; padding:4px 6px;" aria-label="Modul-Liste sortieren">' +
          '<option value="az"' + (moduleSortBy === 'az' ? ' selected' : '') + '>A–Z</option>' +
          '<option value="ects"' + (moduleSortBy === 'ects' ? ' selected' : '') + '>ECTS absteigend</option>' +
          '</select></label>' +
          '<span class="mh-module-stats" role="status">' +
          shown.length +
          ' von ' +
          data.modules.length +
          ' Modulen · Σ ' +
          sumEcts(shown) +
          ' / ' +
          sumEcts(data.modules) +
          ' ECTS</span>' +
          '</div>';`
);

// ── 4. Change-Handler (neben dem Filter-Input von UXF-013) ──────────
const a4 = `    // UXF-013: Modul-Filter (debounced Re-Render)
    var moduleFilterInput = document.getElementById('mh-module-filter-input');`;
if (!src.includes(a4)) fail(a4);
src = src.replace(
  a4,
  `    // UXF-024: Modul-Sortierung
    var moduleSortSel = document.getElementById('mh-module-sort');
    if (moduleSortSel) {
      moduleSortSel.addEventListener('change', function () {
        moduleSortBy = this.value;
        render();
      });
    }

    // UXF-013: Modul-Filter (debounced Re-Render)
    var moduleFilterInput = document.getElementById('mh-module-filter-input');`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-024] ✓ 4 Edits in modulhandbuch-index.js');
