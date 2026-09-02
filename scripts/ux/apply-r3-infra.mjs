/**
 * apply-r3-infra.mjs — UXF-011c + UXF-014: Infrastruktur für Runde 3
 *
 * 1. Layouts: <script> für utils/entity-links.js (curricula-state.html +
 *    curricula-index.html)
 * 2. CI-Workflow: Step "Generate entity slug manifest" nach generate-entity-pages
 * 3. curricula-topic-search.js: „Mehr laden"-Pagination (UXF-014)
 * 4. CSS: Modul-Filter + Themen-Filter Styles
 *
 * Die neuen Dateien utils/entity-links.js, entity-slugs.json (generiert) und
 * scripts/generate-entity-slug-manifest.mjs sind direkt versioniert — dieses
 * Skript prüft nur ihre Existenz (Fail-fast) und patcht die vier Dateien oben.
 *
 * Jede Sektion ist einzeln idempotent (Marker-Check vor dem Schreiben).
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const STATE_LAYOUT = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/curricula-state.html');
const INDEX_LAYOUT = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/curricula-index.html');
const WORKFLOW = path.join(REPO_ROOT, '.github/workflows/deploy.yml');
const TOPIC_SEARCH = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-topic-search.js');
const CSS = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

function fail(task, anchor) {
  throw new Error(`[${task}] Anker nicht gefunden: "${anchor}"`);
}

// ── 0. Neue Dateien vorhanden? (Fail-fast) ───────────────────────────
for (const f of [
  'myhugoapp/static/js/utils/entity-links.js',
  'scripts/generate-entity-slug-manifest.mjs',
]) {
  if (!fs.existsSync(path.join(REPO_ROOT, f))) {
    throw new Error(`[UXF-011c] Versionierte Datei fehlt: ${f}`);
  }
}
if (!fs.existsSync(path.join(REPO_ROOT, 'myhugoapp/static/js/entity-slugs.json'))) {
  console.warn('[UXF-011c] entity-slugs.json fehlt — wird beim CI-Build generiert');
}

// ── 1a. curricula-state.html: entity-links.js laden ──────────────────
{
  let src = fs.readFileSync(STATE_LAYOUT, 'utf-8');
  if (!src.includes('utils/entity-links.js')) {
    const anchor = '<script src="/js/utils/slugs.js"></script>';
    if (!src.includes(anchor)) fail('UXF-011c', anchor);
    src = src.replace(anchor, anchor + '\n<script src="/js/utils/entity-links.js"></script>');
    fs.writeFileSync(STATE_LAYOUT, src);
    console.log('[UXF-011c] ✓ entity-links.js in curricula-state.html');
  } else {
    console.log('[UXF-011c] state.html bereits gepatcht');
  }
}

// ── 1b. curricula-index.html: entity-links.js laden ──────────────────
{
  let src = fs.readFileSync(INDEX_LAYOUT, 'utf-8');
  if (!src.includes('utils/entity-links.js')) {
    const anchor = '<script src="{{ "/js/utils/curricula-utils.js" | relURL }}"></script>';
    if (!src.includes(anchor)) fail('UXF-011c', anchor);
    src = src.replace(
      anchor,
      anchor + '\n<script src="{{ "/js/utils/entity-links.js" | relURL }}"></script>'
    );
    fs.writeFileSync(INDEX_LAYOUT, src);
    console.log('[UXF-011c] ✓ entity-links.js in curricula-index.html');
  } else {
    console.log('[UXF-011c] index.html bereits gepatcht');
  }
}

// ── 2. CI-Workflow: Manifest-Generator-Step ──────────────────────────
{
  let src = fs.readFileSync(WORKFLOW, 'utf-8');
  if (!src.includes('generate-entity-slug-manifest')) {
    const anchor = `      - name: Generate entity pages from KG data
        run: node scripts/generate-entity-pages.mjs`;
    if (!src.includes(anchor)) fail('UXF-011c', anchor);
    src = src.replace(
      anchor,
      anchor + `

      - name: "Generate entity slug manifest (UXF-011: 404-sichere Topic-Links)"
        run: node scripts/generate-entity-slug-manifest.mjs`
    );
    fs.writeFileSync(WORKFLOW, src);
    console.log('[UXF-011c] ✓ CI-Workflow-Step ergänzt');
  } else {
    console.log('[UXF-011c] Workflow bereits gepatcht');
  }
}

// ── 3. curricula-topic-search.js: „Mehr laden" (UXF-014) ────────────
{
  let src = fs.readFileSync(TOPIC_SEARCH, 'utf-8');
  if (!src.includes('UXF-014')) {
    // a) Tracking-Variablen
    const a1 = '  var activeIndex = -1;';
    if (!src.includes(a1)) fail('UXF-014', a1);
    src = src.replace(a1, `  var activeIndex = -1;
  var currentQuery = '';
  var currentTotal = 0; // UXF-014: für „Mehr laden"`);

    // b) run(): offset-Parameter (Anker = aktuelle Prettier-Formatierung)
    const a2 = `  function run(q) {
    if (q.length < MIN_CHARS) {
      clear();
      return;
    }
    renderLoading();
    var token = ++currentToken;
    fetch('/api/curricula/topics?search=' + encodeURIComponent(q) + '&limit=' + LIMIT, {
      signal: AbortSignal.timeout(10000),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (token !== currentToken) return; // veraltet
        renderResults(d.topics || [], q);
      })
      .catch(function () {
        if (token !== currentToken) return;
        renderError(true);
      });
  }`;
    if (!src.includes(a2)) fail('UXF-014', 'run()-Funktion');
    src = src.replace(
      a2,
      `  function run(q, offset) {
    if (q.length < MIN_CHARS) {
      clear();
      return;
    }
    // UXF-014: offset für „Mehr laden"-Pagination
    offset = offset || 0;
    currentQuery = q;
    if (offset === 0) renderLoading();
    var token = ++currentToken;
    fetch(
      '/api/curricula/topics?search=' +
        encodeURIComponent(q) +
        '&limit=' +
        LIMIT +
        '&offset=' +
        offset,
      {
        signal: AbortSignal.timeout(10000),
      }
    )
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (token !== currentToken) return; // veraltet
        currentTotal = d.total || 0;
        renderResults(d.topics || [], q, offset > 0);
      })
      .catch(function () {
        if (token !== currentToken) return;
        if (offset === 0) renderError(true);
      });
  }`
    );

    // c) renderResults: append-Modus
    const a3 = `  function renderResults(topics, q) {
    if (!topics.length) {
      renderEmpty(q);
      return;
    }`;
    if (!src.includes(a3)) fail('UXF-014', 'renderResults-Signatur');
    src = src.replace(a3, `  function renderResults(topics, q, append) {
    if (!topics.length && !append) {
      renderEmpty(q);
      return;
    }`);

    const a4 = `    var html =
      '<div class="cts-meta" role="status">' +
      topics.length +
      (topics.length >= LIMIT ? '+' : '') +
      ' Treffer</div>';
    html += '<ul class="cts-list" role="listbox" aria-label="Themen-Treffer">';
    topics.forEach(function (t) {`;
    if (!src.includes(a4)) fail('UXF-014', 'cts-meta-Block');
    src = src.replace(
      a4,
      `    // UXF-014: bei append nur Items bauen (Meta/Liste stehen schon)
    var loaded = resultsEl.querySelectorAll('.cts-item').length;
    var shownTotal = loaded + topics.length;
    if (append) return buildMoreButton(shownTotal);
    var html =
      '<div class="cts-meta" role="status">' +
      shownTotal +
      (currentTotal > shownTotal ? ' von ' + currentTotal : '') +
      ' Treffer</div>';
    html += '<ul class="cts-list" role="listbox" aria-label="Themen-Treffer">';
    topics.forEach(function (t) {`
    );

    // d) Listen-Ende: „Mehr laden"-Button anhängen
    const a5 = `    html += '</ul>';
    resultsEl.innerHTML = html;
    reset();`;
    if (!src.includes(a5)) fail('UXF-014', 'Listen-Ende');
    src = src.replace(
      a5,
      `    html += '</ul>';
    html += buildMoreButton(shownTotal);
    resultsEl.innerHTML = html;
    reset();`
    );

    // e) buildMoreButton-Helfer vor renderResults einfügen
    const a5b = `  function renderResults(topics, q, append) {`;
    if (!src.includes(a5b)) fail('UXF-014', 'renderResults (Helfer-Anker)');
    src = src.replace(
      a5b,
      `  // UXF-014: „Mehr laden"-Button, wenn noch Treffer übrig sind
  function buildMoreButton(shownTotal) {
    if (currentTotal > shownTotal) {
      return (
        '<button type="button" class="btn btn-secondary cts-more" id="cts-more-btn">' +
        'Mehr laden (' +
        (currentTotal - shownTotal) +
        ' weitere)</button>'
      );
    }
    return '';
  }

  function renderResults(topics, q, append) {`
    );

    // f) Click-Delegation für „Mehr laden"
    const a6 = `  input.addEventListener('input', function () {`;
    if (!src.includes(a6)) fail('UXF-014', 'input-Handler');
    src = src.replace(
      a6,
      `  // UXF-014: „Mehr laden"
  resultsEl.addEventListener('click', function (ev) {
    if (ev.target && ev.target.id === 'cts-more-btn') {
      ev.target.disabled = true;
      ev.target.textContent = 'Lade…';
      run(currentQuery, resultsEl.querySelectorAll('.cts-item').length);
    }
  });

  input.addEventListener('input', function () {`
    );

    // g) clear() auch Totals zurücksetzen
    const a7 = `  function clear() {
    resultsEl.innerHTML = '';
    reset();
  }`;
    if (!src.includes(a7)) fail('UXF-014', 'clear()');
    src = src.replace(a7, `  function clear() {
    resultsEl.innerHTML = '';
    currentTotal = 0;
    currentQuery = '';
    reset();
  }`);

    fs.writeFileSync(TOPIC_SEARCH, src);
    console.log('[UXF-014] ✓ „Mehr laden"-Pagination in curricula-topic-search.js');
  } else {
    console.log('[UXF-014] bereits angewendet');
  }
}

// ── 4. CSS für Runde-3-Elemente ──────────────────────────────────────
{
  let src = fs.existsSync(CSS) ? fs.readFileSync(CSS, 'utf-8') : '';
  if (!src.includes('UXF-010')) {
    const block = `/* UXF-010/013: Live-Filter (State-Seite + Modulhandbuch) */
.state-topic-filter,
.mh-module-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 1rem;
}
.state-topic-filter-input,
.mh-module-filter .mh-search {
  flex: 1;
  min-width: 220px;
  max-width: 420px;
  padding: 10px 14px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 10px;
  font-size: 0.95rem;
  background: var(--bg-card, #fff);
  color: var(--text-primary, #333);
}
.state-topic-filter-input:focus-visible,
.mh-module-filter .mh-search:focus-visible {
  outline: 3px solid var(--accent-color, #1b5e20);
  outline-offset: 1px;
}
.state-topic-count,
.mh-module-stats {
  font-size: 0.82rem;
  color: var(--text-muted, #777);
  white-space: nowrap;
}
.cts-more {
  margin: 0.75rem auto 0;
  display: block;
}
`;
    fs.writeFileSync(CSS, src + '\n' + block);
    console.log('[UXF-010/013] ✓ CSS ergänzt');
  } else {
    console.log('[UXF-010/013] CSS bereits vorhanden');
  }
}

console.log('[r3-infra] ✓ abgeschlossen');
