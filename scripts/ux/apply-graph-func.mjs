/**
 * apply-graph-func.mjs — UXF-005 + UXF-006: curricula-index.js (Cytoscape-Graph)
 *
 * UXF-005: Legende interaktiv — Klick auf Legende-Item hebt alle Knoten
 *          dieses Typs hervor (andere abblenden), zweiter Klick setzt zurück.
 * UXF-006: Graph-Suche — Tippen macht nur client-seitiges Highlighting;
 *          server-seitiger Reload nur noch bei Enter (Performance).
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-index.js');
const LAYOUT = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/curricula-index.html');
const CSS = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

function fail(anchor) {
  throw new Error(`[UXF-graph] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');

// ═══ UXF-006: Suche — Highlight live, Reload nur bei Enter ═══
if (!src.includes('UXF-006')) {
  const searchAnchor = `    var search = document.getElementById('curricula-search');
    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        var val = this.value.trim();
        t = setTimeout(function () {
          state.q = val;
          if (state.cy) {
            if (val) applySearchHighlight(val.toLowerCase());
            else resetHighlight();
          }
          // Also re-fetch with q for server-side filtering when scoped.
          reload();
        }, 350);
      });
    }`;
  if (!src.includes(searchAnchor)) fail(searchAnchor);
  src = src.replace(
    searchAnchor,
    `    var search = document.getElementById('curricula-search');
    if (search) {
      var t;
      // UXF-006: Tippen → nur client-seitiges Highlighting (kein Reload).
      search.addEventListener('input', function () {
        clearTimeout(t);
        var val = this.value.trim();
        t = setTimeout(function () {
          if (state.cy) {
            if (val) applySearchHighlight(val.toLowerCase());
            else if (!state.activeTypeFilter) resetHighlight();
          }
        }, 200);
      });
      // UXF-006: Enter → server-seitige Suche (Re-Fetch mit q).
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          state.q = this.value.trim();
          reload();
        }
      });
    }`
  );
  console.log('[UXF-006] ✓ Graph-Suche: Reload nur bei Enter');
} else {
  console.log('[UXF-006] bereits angewendet');
}

// ═══ UXF-005: Legende interaktiv ═══
if (!src.includes('UXF-005')) {
  // a) Zustand + Highlight-Funktion einfügen (vor resetHighlight).
  const anchor = `  function resetHighlight() {
    if (!state.cy) return;
    state.cy.elements().forEach(function (el) {
      el.style('opacity', 1);
    });
  }`;
  if (!src.includes(anchor)) fail(anchor);
  src = src.replace(
    anchor,
    `  function resetHighlight() {
    if (!state.cy) return;
    state.cy.elements().forEach(function (el) {
      el.style('opacity', 1);
    });
  }

  // ── UXF-005: Legende interaktiv — Knotentyp hervorheben ──────────
  // state.activeTypeFilter: string|null (Typ-Name oder null = alles sichtbar)
  state.activeTypeFilter = null;

  function applyTypeHighlight(type) {
    if (!state.cy) return;
    state.activeTypeFilter = type;
    state.cy.elements().forEach(function (el) {
      var isType = el.isNode() && el.data('type') === type;
      var linked =
        el.isEdge() &&
        (state.cy.getElementById(el.data('source')).data('type') === type ||
          state.cy.getElementById(el.data('target')).data('type') === type);
      el.style('opacity', isType || linked ? 1 : 0.08);
    });
    document
      .querySelectorAll('.curricula-legend-item')
      .forEach(function (item) {
        item.classList.toggle(
          'active',
          item.getAttribute('data-type') === type
        );
      });
  }

  function clearTypeHighlight() {
    state.activeTypeFilter = null;
    resetHighlight();
    document
      .querySelectorAll('.curricula-legend-item')
      .forEach(function (item) {
        item.classList.remove('active');
      });
  }

  function wireLegend() {
    document.querySelectorAll('.curricula-legend-item').forEach(function (item) {
      var type = item.getAttribute('data-type');
      if (!type) return;
      item.classList.add('curricula-legend-btn');
      item.addEventListener('click', function () {
        if (state.activeTypeFilter === type) clearTypeHighlight();
        else applyTypeHighlight(type);
      });
    });
    var resetBtn = document.getElementById('curricula-legend-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', clearTypeHighlight);
    }
  }`
  );

  // b) wireLegend() nach dem Graph-Render aufrufen (in renderGraph, nach
  //    dem search-Highlight-Block).
  const afterRender = `    var searchQuery = (state.q || '').toLowerCase();
    if (searchQuery) applySearchHighlight(searchQuery);
    else resetHighlight();`;
  if (!src.includes(afterRender)) fail(afterRender);
  src = src.replace(
    afterRender,
    `    var searchQuery = (state.q || '').toLowerCase();
    if (searchQuery) applySearchHighlight(searchQuery);
    else if (state.activeTypeFilter) applyTypeHighlight(state.activeTypeFilter);
    else resetHighlight();
    // UXF-005: Legende nach jedem Render verdrahten (wird per Template eingefügt)
    wireLegend();`
  );

  // c) applySearchHighlight: Typ-Filter mit Such-Highlight kombinieren.
  const oldHighlightEnd = `    state.cy.elements().forEach(function (el) {
      var isMatch = el.isNode() ? matchIds[el.id()] : false;
      var linked = el.isEdge() && (matchIds[el.data('source')] || matchIds[el.data('target')]);
      el.style('opacity', isMatch || linked ? 1 : 0.12);
    });
  }`;
  if (!src.includes(oldHighlightEnd)) fail(oldHighlightEnd);
  src = src.replace(
    oldHighlightEnd,
    `    var typeFilter = state.activeTypeFilter || null;
    state.cy.elements().forEach(function (el) {
      var isMatch = el.isNode() ? matchIds[el.id()] : false;
      var linked = el.isEdge() && (matchIds[el.data('source')] || matchIds[el.data('target')]);
      var typeOk = !typeFilter || (el.isNode() && el.data('type') === typeFilter);
      el.style('opacity', (isMatch || linked) && typeOk ? 1 : 0.08);
    });
  }`
  );
  console.log('[UXF-005] ✓ Legende interaktiv (curricula-index.js)');
} else {
  console.log('[UXF-005] bereits angewendet');
}

fs.writeFileSync(FILE, src);

// ═══ Layout: Legende-Items mit data-type + Reset-Button ═══
let layout = fs.readFileSync(LAYOUT, 'utf-8');
if (!layout.includes('data-type=')) {
  const legendAnchor = '<div class="curricula-legend" aria-label="Legende">';
  if (!layout.includes(legendAnchor)) fail(legendAnchor);
  // Aus NODE_LABELS + NODE_COLORS die Items generieren: Wir ersetzen die
  // statischen Items durch daten-getriebene mit data-type.
  const legendRegex = /<div class="curricula-legend" aria-label="Legende">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/;
  const m = layout.match(legendRegex);
  if (!m) fail('curricula-legend Block');
  // Items parsen: <span class="curricula-legend-item"><span ...style="background:#XXX"></span>Label</span>
  const itemRegex =
    /<span class="curricula-legend-item"><span class="curricula-legend-dot" style="background:(#[0-9A-Fa-f]{6})"><\/span>([^<]+)<\/span>/g;
  let items = '';
  let im;
  while ((im = itemRegex.exec(m[1])) !== null) {
    const label = im[2].trim();
    const typeMap = {
      Universität: 'university',
      Modul: 'module',
      Lehrplan: 'curriculum',
      Thema: 'topic',
      Teilthema: 'subtopic',
      Lernziel: 'objective',
      Konzept: 'entity',
      Inhalt: 'page',
    };
    const type = typeMap[label];
    if (!type) continue;
    items +=
      '<button type="button" class="curricula-legend-item" data-type="' +
      type +
      '" aria-pressed="false"><span class="curricula-legend-dot" style="background:' +
      im[1] +
      '"></span>' +
      label +
      '</button>';
  }
  if (!items) fail('Legende-Items');
  const newLegend =
    legendAnchor +
    '\n          ' +
    items +
    '\n          <button type="button" class="curricula-legend-item curricula-legend-reset" id="curricula-legend-reset">✕ Filter zurücksetzen</button>';
  layout = layout.replace(legendAnchor, newLegend);
  fs.writeFileSync(LAYOUT, layout);
  console.log('[UXF-005] ✓ Legende-Buttons im Layout');
} else {
  console.log('[UXF-005] Layout-Legende bereits daten-getrieben');
}

// ═══ CSS für Legende-Buttons ═══
const CSS_BLOCK = `/* UXF-005: Interaktive Graph-Legende */
.curricula-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.82rem;
  color: var(--text-primary, #444);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.curricula-legend-item:hover {
  background: var(--bg-surface, #f0ede4);
  border-color: var(--border-color, #ddd);
}
.curricula-legend-item.active {
  background: var(--bg-surface, #e8f5e9);
  border-color: var(--accent-color, #1b5e20);
  font-weight: 600;
}
.curricula-legend-item:focus-visible {
  outline: 3px solid var(--accent-color, #1b5e20);
  outline-offset: 1px;
}
.curricula-legend-reset { color: #c62828; font-size: 0.78rem; }
.curricula-legend-reset.active { background: #fdecea; }
[data-theme='dark'] .curricula-legend-item { color: var(--text-primary, #c8e6c9); }
[data-theme='dark'] .curricula-legend-item.active {
  background: var(--bg-tertiary, #123d25);
  border-color: var(--accent-color, #4caf50);
}
[data-theme='contrast'] .curricula-legend-item { color: #fff; }
[data-theme='contrast'] .curricula-legend-item.active {
  background: #333;
  border-color: #ffeb3b;
}

/* UXF-003/004/008: State-Seite — Ausklappen + Sprungnavi */
.curricula-jump-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 1.25rem;
}
.curricula-jump-chip {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--bg-surface, #f0ede4);
  border: 1px solid var(--border-color, #ddd);
  color: var(--text-primary, #333);
  text-decoration: none;
  font-size: 0.85rem;
}
.curricula-jump-chip:hover {
  border-color: var(--accent-color, #1b5e20);
  background: #e8f5e9;
}
.school-type-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: left;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  padding: 10px 14px;
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary, #333);
  cursor: pointer;
}
.school-type-toggle:hover { border-color: var(--accent-color, #1b5e20); }
.school-type-toggle .school-topic-count {
  font-weight: 400;
  font-size: 0.82rem;
  color: var(--text-muted, #888);
}
.school-type-toggle:focus-visible {
  outline: 3px solid var(--accent-color, #1b5e20);
  outline-offset: 1px;
}
.objective-more-btn {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  background: #eee;
  color: #555;
  border: 1px dashed #bbb;
  font-size: 0.78rem;
  cursor: pointer;
}
.objective-more-btn:hover { background: #e0e0e0; color: #222; }

/* UXF-007: Vergleichs-Toolbar */
.curricula-compare-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin: 0.75rem 0;
}
.curricula-compare-only-common {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}
.curricula-compare-visible {
  font-size: 0.8rem;
  color: var(--text-muted, #888);
}
.curricula-compare-csv { font-size: 0.85rem; }
`;

let css = fs.existsSync(CSS) ? fs.readFileSync(CSS, 'utf-8') : '';
if (!css.includes('UXF-005')) {
  fs.writeFileSync(CSS, css + '\n' + CSS_BLOCK);
  console.log('[UXF-graph] ✓ CSS hinzugefügt');
}

console.log('[UXF-graph] ✓ abgeschlossen');
