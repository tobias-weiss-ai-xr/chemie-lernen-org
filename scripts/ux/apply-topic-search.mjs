/**
 * apply-topic-search.mjs — UXF-001: Themen-Suche über alle Bundesländer
 *
 * 1. curricula-index.html: Suchbox in den Übersicht-Tab einfügen
 * 2. curricula-index.html: Script-Tags im js-Block (seiten-spezifisch)
 * 3. ux-enhancements.css: Styles für Suchbox/Ergebnisliste
 *
 * Idempotent: prüft Marker vor jedem Insert, wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const LAYOUT = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/curricula-index.html');
const CSS = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

const SEARCH_HTML = `
    <!-- UXF-001: Themen-Suche über alle Bundesländer -->
    <div class="curricula-topic-search" id="curricula-topic-search-wrap">
      <input type="search" id="curricula-topic-search" class="curricula-topic-search-input"
        placeholder="Themen durchsuchen — z. B. „Säure-Base“, „Redox“ …"
        aria-label="Lehrplan-Themen über alle Bundesländer durchsuchen"
        autocomplete="off" />
      <div id="curricula-topic-results" class="curricula-topic-results" aria-live="polite"></div>
    </div>
`;

const CSS_BLOCK = `/* UXF-001: Themen-Suche über alle Bundesländer */
.curricula-topic-search { margin: 1rem 0 1.5rem; position: relative; }
.curricula-topic-search-input {
  width: 100%; max-width: 560px;
  padding: 12px 16px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 10px;
  font-size: 1rem;
  background: var(--bg-card, #fff);
  color: var(--text-primary, #333);
}
.curricula-topic-search-input:focus-visible {
  outline: 3px solid var(--accent-color, #1b5e20);
  outline-offset: 1px;
}
.curricula-topic-results { margin-top: 0.75rem; }
.cts-status { color: var(--text-muted, #777); padding: 0.5rem 0; }
.cts-status.cts-error { color: #c62828; }
.cts-meta {
  font-size: 0.8rem; color: var(--text-muted, #888);
  margin-bottom: 0.4rem;
}
.cts-list { list-style: none; margin: 0; padding: 0; }
.cts-item {
  border: 1px solid var(--border-color, #eee);
  border-radius: 8px;
  margin-bottom: 6px;
  background: var(--bg-card, #fff);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.cts-item.active,
.cts-item:hover {
  border-color: var(--accent-color, #1b5e20);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.cts-item a {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; padding: 10px 14px;
  color: var(--text-primary, #333); text-decoration: none; flex-wrap: wrap;
}
.cts-title { flex: 1; min-width: 200px; font-weight: 500; }
.cts-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.cts-badge {
  font-size: 0.72rem; padding: 2px 8px; border-radius: 999px;
  background: var(--bg-surface, #f0ede4);
  color: var(--text-muted, #666);
  white-space: nowrap;
}
.cts-badge.cts-state {
  background: var(--brand-primary, #1b5e20);
  color: #fff; font-weight: 600;
}
.cts-badge.cts-obj { background: #e8f5e9; color: #2e7d32; }
[data-theme='dark'] .cts-badge { background: var(--bg-tertiary, #123d25); color: #a5d6a7; }
[data-theme='dark'] .cts-badge.cts-state { background: var(--accent-color, #4caf50); color: #0a1a0f; }
[data-theme='dark'] .cts-badge.cts-obj { background: #1b3d22; color: #a5d6a7; }
[data-theme='contrast'] .cts-badge { background: #333; color: #fff; }
[data-theme='contrast'] .cts-badge.cts-state { background: #ffeb3b; color: #000; }
`;

function fail(task, anchor) {
  throw new Error(`[${task}] Anker nicht gefunden: "${anchor}" — manuell einfügen!`);
}

// ── 1. Layout: Suchbox in Übersicht-Tab (nach summary) ──────────────
function patchLayout() {
  let src = fs.readFileSync(LAYOUT, 'utf-8');
  if (src.includes('curricula-topic-search-wrap')) {
    console.log('[UXF-001] Layout: Suchbox bereits vorhanden');
    return;
  }
  const anchor = '<div class="curricula-summary" id="curricula-summary" aria-live="polite"></div>';
  if (!src.includes(anchor)) fail('UXF-001', anchor);
  src = src.replace(anchor, anchor + '\n' + SEARCH_HTML);
  fs.writeFileSync(LAYOUT, src);
  console.log('[UXF-001] ✓ Suchbox in curricula-index.html eingefügt');
}

// ── 2. Layout: Script-Tags im js-Block (seiten-spezifisch) ──────────
function patchScripts() {
  let src = fs.readFileSync(LAYOUT, 'utf-8');
  if (src.includes('curricula-topic-search.js')) {
    console.log('[UXF-001] Scripts bereits im js-Block');
    return;
  }
  const anchor = '<script src="{{ "/js/curricula-overview.js" | relURL }}?v=1"></script>';
  if (!src.includes(anchor)) fail('UXF-001', anchor);
  const insert =
    '<script src="{{ "/js/utils/curricula-utils.js" | relURL }}"></script>\n' +
    anchor +
    '\n<script src="{{ "/js/curricula-topic-search.js" | relURL }}?v=1"></script>';
  src = src.replace(anchor, insert);
  fs.writeFileSync(LAYOUT, src);
  console.log('[UXF-001] ✓ Script-Tags im js-Block der Curricula-Seite');
}

// ── 3. CSS ───────────────────────────────────────────────────────────
function patchCss() {
  let src = fs.existsSync(CSS) ? fs.readFileSync(CSS, 'utf-8') : '';
  if (src.includes('UXF-001')) {
    console.log('[UXF-001] CSS bereits vorhanden');
    return;
  }
  fs.writeFileSync(CSS, src + '\n' + CSS_BLOCK);
  console.log('[UXF-001] ✓ CSS hinzugefügt');
}

patchLayout();
patchScripts();
patchCss();
console.log('[UXF-001] ✓ Themen-Suche angewendet');
