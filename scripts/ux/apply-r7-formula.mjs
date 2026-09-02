/**
 * apply-r7-formula.mjs — UXF-029: formatFormula XSS-Fix (DOM-XSS bestätigt)
 *
 * formatFormula() schrieb die ROHE User-Eingabe (nur Ziffern → <sub>)
 * direkt in innerHTML. parseFormula(validElements) validiert nur GEFUNDEENE
 * Element-Symbole — unbekannte Zeichen (<img>, <script>, ") werden vom
 * Regex still ignoriert und laufen komplett durch:
 *
 *   Input:  <img src=x onerror=alert(1)>
 *   Output: <img src=x onerror=alert(<sub>1</sub>)>   ← in innerHTML!
 *
 * Betroffen (alle via window.ChemistryUtils.formatFormula bzw. lokale
 * Kopie): molare-masse-rechner.js, loeslichkeitsprodukt-rechner.js,
 * reaktionsgleichungen-ausgleichen.js (eigene Kopie!).
 *
 * Fix: HTML zuerst escapen, DANN <sub> setzen. Legitime Formeln (Element-
 * symbole, Ziffern, Klammern, ·×*) bleiben unverändert.
 *
 * Dateien: static/js/utils/chemistry-utils.js +
 *          static/js/reaktionsgleichungen-ausgleichen.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const UTILS = path.join(REPO_ROOT, 'myhugoapp/static/js/utils/chemistry-utils.js');
const REAKTION = path.join(REPO_ROOT, 'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js');

function fail(anchor) {
  throw new Error(`[UXF-029] Anker nicht gefunden: "${anchor}"`);
}

// ── 1. chemistry-utils.js (zentrale Funktion) ────────────────────────
{
  let src = fs.readFileSync(UTILS, 'utf-8');
  if (src.includes('UXF-029')) {
    console.log('[UXF-029] chemistry-utils.js bereits gepatcht');
  } else {
    const a1 = `function formatFormula(formula) {
  return formula.replace(/(\\d+)/g, '<sub>$1</sub>');
}`;
    if (!src.includes(a1)) fail(a1);
    src = src.replace(
      a1,
      `function formatFormula(formula) {
  // UXF-029: Eingabe escapen, bevor <sub>-Markup ergänzt wird. parseFormula
  // validiert nur gefundene Element-Symbole — unbekannte Zeichen (z. B.
  // "<img ...>") liefen zuvor roh ins innerHTML (DOM-XSS).
  const safe = String(formula)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return safe.replace(/(\\d+)/g, '<sub>$1</sub>');
}`
    );
    fs.writeFileSync(UTILS, src);
    console.log('[UXF-029] ✓ chemistry-utils.js: formatFormula escaped');
  }
}

// ── 2. reaktionsgleichungen-ausgleichen.js (lokale Kopie) ────────────
{
  let src = fs.readFileSync(REAKTION, 'utf-8');
  if (src.includes('UXF-029')) {
    console.log('[UXF-029] reaktionsgleichungen-ausgleichen.js bereits gepatcht');
  } else {
    const a2 = `function formatFormula(formula) {
  return formula.replace(/(\\d+)/g, '<sub>$1</sub>');
}`;
    if (!src.includes(a2)) fail(a2);
    src = src.replace(
      a2,
      `function formatFormula(formula) {
  // UXF-029: escapen vor <sub> (rohe User-Eingabe ging ins innerHTML)
  const safe = String(formula)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return safe.replace(/(\\d+)/g, '<sub>$1</sub>');
}`
    );
    fs.writeFileSync(REAKTION, src);
    console.log('[UXF-029] ✓ reaktionsgleichungen-ausgleichen.js: lokale Kopie escaped');
  }
}

console.log('[r7-formula] ✓ abgeschlossen');
