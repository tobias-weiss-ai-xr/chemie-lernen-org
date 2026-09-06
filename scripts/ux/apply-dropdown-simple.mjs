/**
 * UXF-043: Bundesland-Auswahl als Dropdown (statt Card-Grid)
 * Pure HTML-Lösung - kein JS-Patching nötig.
 * onchange navigiert direkt zur State-Seite.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const REPO = process.cwd();
const FILE = resolve(REPO, 'myhugoapp/layouts/_default/curricula-index.html');
const DRY = process.argv.includes('--dry-run');

function main() {
  let html = readFileSync(FILE, 'utf-8');

  // --- CSS hinzufügen ---
  const css = `
/* UXF-043 Dropdown */
.curricula-grid.bundesland-dropdown { max-width: 420px; }
.bundesland-dropdown label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
.bundesland-dropdown select {
  width: 100%; padding: 0.75rem 1.1rem; border: 2px solid var(--border-color,#e0e0e0);
  border-radius: 10px; font-size: 1.05rem; background: var(--bg-input,#fff);
  cursor: pointer; transition: border-color 0.2s;
}
.bundesland-dropdown select:hover { border-color: #9b59b6; }
.bundesland-dropdown select:focus {
  outline: none; border-color: #9b59b6;
  box-shadow: 0 0 0 4px rgba(155,89,182,.12);
}
`;

  const styleClose = html.lastIndexOf('</style>');
  html = html.slice(0, styleClose) + css + html.slice(styleClose);

  // --- Grid durch Dropdown ersetzen ---
  const oldGrid = `<div id="curricula-grid" class="curricula-grid" aria-label="Bundesländer-Lehrpläne" aria-live="polite" aria-relevant="additions removals">
      <div class="curricula-skeleton" id="curricula-skeleton" aria-label="Lade Lehrpläne…">
        <div class="curricula-skeleton-card"></div>
        <div class="curricula-skeleton-card"></div>
        <div class="curricula-skeleton-card"></div>
        <div class="curricula-skeleton-card"></div>
        <div class="curricula-skeleton-card"></div>
        <div class="curricula-skeleton-card"></div>
      </div>
    </div>`;

  const newDropdown = `<div id="curricula-grid" class="curricula-grid bundesland-dropdown" aria-label="Bundesländer-Lehrpläne">
      <label for="state-select">Bundesland auswählen:</label>
      <select id="state-select" onchange="if(this.value)location.href='/curricula/'+this.value+'/'" aria-label="Bundesland Lehrplan auswählen">
        <option value="" selected disabled>-- Bundesland auswählen --</option>
        <option value="bw">Baden-Württemberg</option>
        <option value="be">Berlin</option>
        <option value="bb">Brandenburg</option>
        <option value="by">Bayern</option>
        <option value="hb">Bremen</option>
        <option value="hh">Hamburg</option>
        <option value="he">Hessen</option>
        <option value="mv">Mecklenburg-Vorpommern</option>
        <option value="ni">Niedersachsen</option>
        <option value="nw">Nordrhein-Westfalen</option>
        <option value="rp">Rheinland-Pfalz</option>
        <option value="sl">Saarland</option>
        <option value="sn">Sachsen</option>
        <option value="st">Sachsen-Anhalt</option>
        <option value="sh">Schleswig-Holstein</option>
        <option value="th">Thüringen</option>
      </select>
    </div>`;

  if (!html.includes('id="state-select"')) {
    html = html.replace(oldGrid, newDropdown);
  }

  if (!DRY) writeFileSync(FILE, html, 'utf-8');
  console.log('[apply-dropdown-simple] ✅ HTML-CSS + Dropdown');
}

main();
