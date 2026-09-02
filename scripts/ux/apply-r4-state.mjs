/**
 * apply-r4-state.mjs — UXF-016 + UXF-017: State-Seiten
 *
 * UXF-016: Themen-Filter in der URL persistieren (?thema=saeure) →
 *   teilbare gefilterte Ansichten; Restore beim Laden (vor dem ersten
 *   Render, dadurch wendet der bestehende Render-Pfad den Filter an);
 *   replaceState bei jeder Filter-Änderung (kein History-Spam).
 * UXF-017: „Lehrplan drucken" — Button im Layout, beforeprint/afterprint
 *   (Filter temporär aus, alle Gruppen aufklappen, „+N Lernziele" klicken),
 *   Print-CSS blendet Chrome/Interaktion aus.
 *
 * Dateien: curricula-state.js + curricula-state.html + ux-enhancements.css
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const JS = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-state.js');
const LAYOUT = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/curricula-state.html');
const CSS = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

function fail(task, anchor) {
  throw new Error(`[${task}] Anker nicht gefunden: "${anchor}"`);
}

// ── 1. curricula-state.js ────────────────────────────────────────────
{
  let src = fs.readFileSync(JS, 'utf-8');
  if (src.includes('UXF-016')) {
    console.log('[UXF-016/017] JS bereits angewendet');
  } else {
    // 1a. updateUrlFilter + Druck-Handler an updateUrlFilter-Stelle —
    // Einfügung nach searchHref (stabiler Anker aus Runde 3)
    const a1 = `  function searchHref(name) {
    return '/pages/suche/?q=' + encodeURIComponent(name || '');
  }`;
    if (!src.includes(a1)) fail('UXF-016', a1);
    src = src.replace(
      a1,
      a1 + `

  // UXF-016: Filter-Zustand in die URL schreiben (?thema=…) — teilbar
  function updateUrlFilter() {
    try {
      var qs = topicFilterQ ? '?thema=' + encodeURIComponent(topicFilterQ) : '';
      window.history.replaceState(null, '', window.location.pathname + qs);
    } catch (e) {
      /* noop */
    }
  }

  // UXF-017: Drucken — vor dem Druck alles sichtbar machen, danach zurück
  var printSaved = null;
  window.addEventListener('beforeprint', function () {
    var app = document.getElementById('curricula-state-app');
    if (!app || !app.querySelector('.state-topic-card')) return;
    printSaved = { q: topicFilterQ, collapsed: {} };
    app.querySelectorAll('.school-type-toggle').forEach(function (t) {
      var school = t.getAttribute('data-school');
      if (school) printSaved.collapsed[school] = t.classList.contains('collapsed');
    });
    topicFilterQ = '';
    applyTopicFilter();
    app.querySelectorAll('.school-type-toggle').forEach(function (t) {
      t.classList.remove('collapsed');
      t.setAttribute('aria-expanded', 'true');
      var icon = t.querySelector('.school-toggle-icon');
      if (icon) icon.textContent = '▾';
    });
    app.querySelectorAll('.school-group-content').forEach(function (c) {
      c.style.display = '';
    });
    // „+N Lernziele" aufklappen (reuse der bestehenden Expand-Logik)
    app.querySelectorAll('.objective-more-btn').forEach(function (b) {
      b.click();
    });
    var filterInput = document.getElementById('state-topic-filter-input');
    if (filterInput) filterInput.value = '';
  });
  window.addEventListener('afterprint', function () {
    if (!printSaved) return;
    topicFilterQ = printSaved.q;
    try {
      localStorage.setItem(
        'curriculaStateCollapsed',
        JSON.stringify(printSaved.collapsed)
      );
    } catch (e) {
      /* noop */
    }
    applyTopicFilter();
    restoreCollapseState();
    var filterInput = document.getElementById('state-topic-filter-input');
    if (filterInput) filterInput.value = topicFilterQ;
    printSaved = null;
  });`
    );

    // 1b. Debounce-Commit → URL sync (im Input-Handler von Runde 3)
    const a2 = `      filterDebounceTimer = setTimeout(function () {
        topicFilterQ = val.trim();
        if (topicFilterQ) applyTopicFilter();
        else restoreCollapseState();
      }, 150);`;
    if (!src.includes(a2)) fail('UXF-016', a2);
    src = src.replace(
      a2,
      `        filterDebounceTimer = setTimeout(function () {
        topicFilterQ = val.trim();
        if (topicFilterQ) applyTopicFilter();
        else restoreCollapseState();
        updateUrlFilter(); // UXF-016
      }, 150);`
    );

    // 1c. Escape-Clear → URL sync
    const a3 = `    filterInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        topicFilterQ = '';
        restoreCollapseState();
      }
    });`;
    if (!src.includes(a3)) fail('UXF-016', a3);
    src = src.replace(
      a3,
      `      filterInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        topicFilterQ = '';
        restoreCollapseState();
        updateUrlFilter(); // UXF-016
      }
    });`
    );

    // 1d. Init: ?thema= lesen (vor loadTree — Render-Pfad wendet an)
    const a4 = `  var urlState = (window.location.pathname || '').match(/\\/curricula\\/([a-z]{2})\\/?$/);
  if (urlState) {
    loadTree(urlState[1]);`;
    if (!src.includes(a4)) fail('UXF-016', a4);
    src = src.replace(
      a4,
      `  var urlState = (window.location.pathname || '').match(/\\/curricula\\/([a-z]{2})\\/?$/);
  // UXF-016: Filter aus geteilter URL übernehmen (?thema=…) — der Render-
  // Pfad (bindTopicFilterInput + applyTopicFilter) wendet ihn an.
  try {
    var urlFilterQ = new URLSearchParams(window.location.search).get('thema');
    if (urlFilterQ) topicFilterQ = urlFilterQ.trim();
  } catch (e) {
    /* noop */
  }
  if (urlState) {
    loadTree(urlState[1]);`
    );

    // 1e. Drucken-Button verdrahten (nach loadStates(); stabiler Anker)
    const a5 = `  loadStates();`;
    if (!src.includes(a5)) fail('UXF-017', a5);
    src = src.replace(
      a5,
      `  loadStates();

  // UXF-017: Druck-Button
  var printBtn = document.getElementById('state-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }`
    );

    fs.writeFileSync(JS, src);
    console.log('[UXF-016/017] ✓ 5 Edits in curricula-state.js');
  }
}

// ── 2. Layout: Druck-Button ──────────────────────────────────────────
{
  let src = fs.readFileSync(LAYOUT, 'utf-8');
  if (src.includes('state-print-btn')) {
    console.log('[UXF-017] Layout bereits gepatcht');
  } else {
    const a = `  <div class="row">
    <div class="col-md-12">
      <div id="curricula-state-app" aria-live="polite">`;
    if (!src.includes(a)) fail('UXF-017', a);
    src = src.replace(
      a,
      `  <div class="row">
    <div class="col-md-12 no-print-header-actions">
      <button type="button" id="state-print-btn" class="btn btn-secondary btn-sm">
        <i class="fa fa-print" aria-hidden="true"></i> Lehrplan drucken
      </button>
    </div>
  </div>
  <div class="row">
    <div class="col-md-12">
      <div id="curricula-state-app" aria-live="polite">`
    );
    fs.writeFileSync(LAYOUT, src);
    console.log('[UXF-017] ✓ Druck-Button in curricula-state.html');
  }
}

// ── 3. Print-CSS ─────────────────────────────────────────────────────
{
  let src = fs.existsSync(CSS) ? fs.readFileSync(CSS, 'utf-8') : '';
  if (src.includes('UXF-017')) {
    console.log('[UXF-017] CSS bereits vorhanden');
  } else {
    const block = `/* UXF-017: Druckansicht State-Lehrplan (Lehrer-Use-Case) */
@media print {
  header.navbar,
  footer,
  nav,
  .state-topic-filter,
  #state-print-btn,
  .objective-more-btn,
  .cts-more {
    display: none !important;
  }
  body {
    background: #fff !important;
    color: #000 !important;
  }
  .state-topic-card {
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
  .school-type-group {
    break-inside: avoid-page;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
}
`;
    fs.writeFileSync(CSS, src + '\n' + block);
    console.log('[UXF-017] ✓ Print-CSS ergänzt');
  }
}

console.log('[r4-state] ✓ abgeschlossen');
