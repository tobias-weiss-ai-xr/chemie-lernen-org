/**
 * apply-r4-compare.mjs — UXF-019: Vergleich „Link kopieren"
 *
 * Die Vergleichsauswahl ist bereits URL-kodiert (?tab=advanced&vergleich=BB,BY,
 * Runde 2) — aber niemand sieht das. Der Share-Button macht die Funktion
 * entdeckbar: kopiert die tiefverlinkte URL in die Zwischenablage
 * (Clipboard-API mit Prompt-Fallback), Button-Feedback „✓ Kopiert!".
 *
 * Datei: curricula-overview.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-overview.js');

function fail(anchor) {
  throw new Error(`[UXF-019] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-019')) {
  console.log('[UXF-019] bereits angewendet');
  process.exit(0);
}

// ── 1. Share-Button neben dem CSV-Button ─────────────────────────────
const a1 = `'<button type="button" class="btn btn-secondary curricula-compare-csv" id="curricula-compare-csv">' +
      '⬇ CSV-Export</button>' +`;
if (!src.includes(a1)) fail(a1);
src = src.replace(
  a1,
  a1 +
    `
      '<button type="button" class="btn btn-secondary" id="curricula-compare-share">' +
      '🔗 Link kopieren</button>' +`
);

// ── 2. Handler nach dem CSV-Handler ──────────────────────────────────
const a2 = `      var csvBtn = panel.querySelector('#curricula-compare-csv');
      if (csvBtn) {`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `      // UXF-019: Vergleichs-Auswahl als Link teilen
      var shareBtn = panel.querySelector('#curricula-compare-share');
      if (shareBtn) {
        shareBtn.addEventListener('click', function () {
          var base = window.location.href.split('#')[0].split('?')[0];
          var url = base + '?tab=advanced';
          if (selected.length) url += '&vergleich=' + selected.join(',');
          var restore = shareBtn.textContent;
          var done = function () {
            shareBtn.textContent = '✓ Kopiert!';
            setTimeout(function () {
              shareBtn.textContent = restore;
            }, 2000);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(done).catch(function () {
              window.prompt('Link zum Kopieren (Strg+C):', url);
            });
          } else {
            window.prompt('Link zum Kopieren (Strg+C):', url);
          }
        });
      }
      var csvBtn = panel.querySelector('#curricula-compare-csv');
      if (csvBtn) {`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-019] ✓ 2 Edits in curricula-overview.js');
