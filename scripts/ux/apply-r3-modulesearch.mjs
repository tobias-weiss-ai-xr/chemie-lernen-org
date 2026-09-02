/**
 * apply-r3-modulesearch.mjs — UXF-013: Modulhandbuch Modul-Filter + ECTS-Summe
 *
 * In der Universitäts-Ansicht (Modul-Liste, gruppiert nach Abschluss):
 *   - Live-Text-Filter (Code + Name, debounced, Re-Render)
 *   - Trefferzähler + Gesamt-ECTS (ungefiltert und gefiltert)
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/modulhandbuch-index.js');

function fail(anchor) {
  throw new Error(`[UXF-013] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-013')) {
  console.log('[UXF-013] bereits angewendet');
  process.exit(0);
}

// ── 1. State-Variable ────────────────────────────────────────────────
const a1 = `  var selectedUni = null;
  var modulesCache = {};`;
if (!src.includes(a1)) fail(a1);
src = src.replace(a1, `  var selectedUni = null;
  var moduleFilterQ = ''; // UXF-013: Client-Filter für Modul-Listen
  var moduleFilterTimer = null;
  var modulesCache = {};`);

// ── 2. Filter zurücksetzen beim Wechsel der Universität ─────────────
const a2 = `  function loadUni(code) {
    selectedUni = code;
    moduleDetail = null;`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `  function loadUni(code) {
    selectedUni = code;
    moduleFilterQ = ''; // UXF-013: Filter pro Universität neu
    moduleDetail = null;`
);

// ── 3. Modul-Liste: gefiltertes Rendering + ECTS-Summen ─────────────
const a3 = `        var byDegree = {};
        data.modules.forEach(function (m) {
          var deg = m.degree || 'Allgemein';
          if (!byDegree[deg]) byDegree[deg] = [];
          byDegree[deg].push(m);
        });`;
if (!src.includes(a3)) fail(a3);
src = src.replace(
  a3,
  `        // UXF-013: Client-Filter + ECTS-Summen
        var q = moduleFilterQ.toLowerCase();
        var matchesFilter = function (m) {
          if (!q) return true;
          return (
            String(m.code || '').toLowerCase().indexOf(q) !== -1 ||
            String(m.name || '').toLowerCase().indexOf(q) !== -1
          );
        };
        var shown = data.modules.filter(matchesFilter);
        var sumEcts = function (list) {
          var s = 0;
          list.forEach(function (m) {
            s += Number(m.ects) || 0;
          });
          return s;
        };
        html +=
          '<div class="mh-module-filter">' +
          '<input type="search" id="mh-module-filter-input" class="mh-search" ' +
          'placeholder="Module filtern — Code oder Name …" aria-label="Module nach Code oder Name filtern" ' +
          'autocomplete="off" value="' +
          escapeHtml(moduleFilterQ) +
          '" />' +
          '<span class="mh-module-stats" role="status">' +
          shown.length +
          ' von ' +
          data.modules.length +
          ' Modulen · Σ ' +
          sumEcts(shown) +
          ' / ' +
          sumEcts(data.modules) +
          ' ECTS</span>' +
          '</div>';
        var byDegree = {};
        shown.forEach(function (m) {
          var deg = m.degree || 'Allgemein';
          if (!byDegree[deg]) byDegree[deg] = [];
          byDegree[deg].push(m);
        });`
);

// ── 4. Input-Handler in attachEvents ─────────────────────────────────
const a4 = `    // Search
    var searchInput = document.getElementById('mh-search-input');`;
if (!src.includes(a4)) fail(a4);
src = src.replace(
  a4,
  `    // UXF-013: Modul-Filter (debounced Re-Render)
    var moduleFilterInput = document.getElementById('mh-module-filter-input');
    if (moduleFilterInput) {
      moduleFilterInput.addEventListener('input', function () {
        clearTimeout(moduleFilterTimer);
        var val = this.value;
        moduleFilterTimer = setTimeout(function () {
          moduleFilterQ = val.trim();
          render();
        }, 150);
      });
      moduleFilterInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          this.value = '';
          moduleFilterQ = '';
          render();
        }
      });
    }

    // Search
    var searchInput = document.getElementById('mh-search-input');`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-013] ✓ 4 Edits in modulhandbuch-index.js');
