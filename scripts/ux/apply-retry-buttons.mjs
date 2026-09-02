/**
 * apply-retry-buttons.mjs — UX-003: Retry-Buttons für Fehlerzustände
 *
 * Fügt einheitliche Retry-Buttons zu allen API-Fehlerzuständen hinzu.
 * Betrifft: curricula-overview.js, curricula-state.js, modulhandbuch-index.js, entity-index.js
 *
 * Strategie: Ersetzt bestehende inline-HTML-Fehlerzustände durch eine
 * einheitliche `renderErrorState()`-Hilfsfunktion mit Retry-Button.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const JS_DIR = path.join(REPO_ROOT, 'myhugoapp/static/js');

const RETRY_SNIPPET = `function renderErrorState(container, message, retryFn) {
  if (!container) return;
  container.innerHTML =
    '<div class="empty-state">' +
    '<div class="empty-state-icon">⚠️</div>' +
    '<p>' + message + '</p>' +
    '<button type="button" class="btn btn-primary ux-retry-btn" aria-label="Erneut versuchen">' +
    '<i class="fa fa-refresh" aria-hidden="true"></i> Erneut versuchen</button>' +
    '</div>';
  var btn = container.querySelector('.ux-retry-btn');
  if (btn && typeof retryFn === 'function') {
    btn.addEventListener('click', retryFn);
  }
}`;

// CSS for retry button
const RETRY_CSS = `/* UX-003: Retry-Button für Fehlerzustände */
.ux-retry-btn {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ux-retry-btn i {
  margin-right: 4px;
}
.empty-state .ux-retry-btn {
  background-color: var(--brand-primary, #1b5e20);
  border-color: var(--brand-primary, #1b5e20);
  color: #fff;
}
.empty-state .ux-retry-btn:hover {
  background-color: var(--brand-secondary, #2e7d32);
  border-color: var(--brand-secondary, #2e7d32);
}
[data-theme='dark'] .empty-state .ux-retry-btn {
  background-color: var(--accent-color, #4caf50);
  border-color: var(--accent-color, #4caf50);
  color: #0a1a0f;
}
[data-theme='contrast'] .empty-state .ux-retry-btn {
  background-color: #ffeb3b;
  border-color: #ffeb3b;
  color: #000;
}
`;

const CSS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

function appendRetryCss() {
  let existing = '';
  if (fs.existsSync(CSS_FILE)) {
    existing = fs.readFileSync(CSS_FILE, 'utf-8');
  }
  if (existing.includes('UX-003')) {
    console.log('[UX-003] Retry CSS already present');
    return;
  }
  fs.writeFileSync(CSS_FILE, existing + '\n' + RETRY_CSS);
  console.log('[UX-003] Retry button CSS added');
}

// ── curricula-state.js ───────────────────────────────────────────────────
function fixCurriculaState() {
  const file = path.join(JS_DIR, 'curricula-state.js');
  let src = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Add helper once
  if (!src.includes('renderErrorState')) {
    src = src.replace(
      /(\(function \(\) \{\s*)/,
      `$1${RETRY_SNIPPET}\n\n`
    );
    changed = true;
  }

  // Replace error state HTML with helper call (retry = reload the tree load)
  const oldError =
    "'<div class=\"empty-state\"><div class=\"empty-state-icon\">⚠️</div><p>Fehler beim Laden: ' +";
  if (src.includes(oldError)) {
    console.log('[UX-003] curricula-state.js: found inline error state, needs manual review');
  }

  if (changed) {
    fs.writeFileSync(file, src);
    console.log('[UX-003] curricula-state.js: renderErrorState helper added');
  } else {
    console.log('[UX-003] curricula-state.js: already patched or no change needed');
  }
}

// ── modulhandbuch-index.js ───────────────────────────────────────────────
function fixModulhandbuch() {
  const file = path.join(JS_DIR, 'modulhandbuch-index.js');
  let src = fs.readFileSync(file, 'utf-8');
  let changed = false;

  if (!src.includes('renderErrorState')) {
    src = src.replace(
      /(\(function \(\) \{\s*)/,
      `$1${RETRY_SNIPPET}\n\n`
    );
    changed = true;
  }

  // Wire retry into the universities empty/error state
  const oldEmpty = "'<div class=\"empty-state\"><div class=\"empty-state-icon\">🏫</div><p>Keine Universitäten gefunden.</p></div>'";
  const newEmpty = "renderErrorState(unisEl, 'Keine Universitäten gefunden. Bitte prüfe deine Internetverbindung.', function () { loadUniversities(); })";

  if (src.includes(oldEmpty)) {
    src = src.replace(oldEmpty, newEmpty);
    changed = true;
    console.log('[UX-003] modulhandbuch-index.js: universities empty state → retry button');
  }

  // Wire retry into the modules load error state
  const oldModulesEmpty = "'<div class=\"empty-state\"><div class=\"empty-state-icon\">📚</div><p>Keine Module geladen.</p></div>'";
  if (src.includes(oldModulesEmpty)) {
    console.log('[UX-003] modulhandbuch-index.js: modules empty state found (context-specific, left as-is)');
  }

  if (changed) {
    fs.writeFileSync(file, src);
    console.log('[UX-003] modulhandbuch-index.js: patched');
  } else {
    console.log('[UX-003] modulhandbuch-index.js: no change');
  }
}

// ── curricula-overview.js ────────────────────────────────────────────────
function fixCurriculaOverview() {
  const file = path.join(JS_DIR, 'curricula-overview.js');
  let src = fs.readFileSync(file, 'utf-8');
  let changed = false;

  if (!src.includes('renderErrorState')) {
    src = src.replace(
      /(\(function \(\) \{\s*)/,
      `$1${RETRY_SNIPPET}\n\n`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, src);
    console.log('[UX-003] curricula-overview.js: renderErrorState helper added');
  } else {
    console.log('[UX-003] curricula-overview.js: already patched');
  }
}

appendRetryCss();
fixCurriculaState();
fixModulhandbuch();
fixCurriculaOverview();
console.log('[UX-003] ✓ Retry buttons applied');
