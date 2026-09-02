/**
 * apply-r3-state-filter.mjs — UXF-010 + UXF-011a: curricula-state.js
 *
 * UXF-010: Live-Text-Filter für Themen (bei RP: 936 Themen der Hebel!)
 *   - Filter-Input über den Schulform-Gruppen (debounced 150ms)
 *   - blendet nicht-treffende Topic-Cards aus, dann leere Klassen- und
 *     Schulform-Gruppen; Trefferzähler; Escape leert
 *   - bei aktivem Filter werden Gruppen aufgeklappt (ohne localStorage zu
 *     ändern); beim Leeren wird der gespeicherte Collapse-Zustand restored
 * UXF-011a: Topic-Links → data-entity-name + Search-Fallback statt
 *   404-Entity-Links; nach dem Rendern rewritet entity-links.js die hrefs.
 *
 * Design-Note: Der Filter-Input-Handler wird nach jedem Render neu gebunden
 * (in _render, nach _attachEvents) — robust gegen Prettier-Reformatierung
 * des großen Delegation-Blocks in _attachEvents.
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-state.js');

function fail(anchor) {
  throw new Error(`[UXF-010] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-010')) {
  console.log('[UXF-010] bereits angewendet');
  process.exit(0);
}

// ── 1. State-Variablen + Filter-Logik vor den Collapsible-Helfern ──
const anchorHelpers = `  // ── UXF-004: Collapsible Schulform-Gruppen (localStorage) ──`;
if (!src.includes(anchorHelpers)) fail(anchorHelpers);
src = src.replace(
  anchorHelpers,
  `  // ── UXF-010: Live-Text-Filter für Themen ──────────────────────────
  var topicFilterQ = '';
  var filterDebounceTimer = null;

  function searchHref(name) {
    return '/pages/suche/?q=' + encodeURIComponent(name || '');
  }

  function applyTopicFilter() {
    var app = document.getElementById('curricula-state-app');
    if (!app) return;
    var q = topicFilterQ.toLowerCase();
    var cards = app.querySelectorAll('.state-topic-card');
    var visible = 0;
    cards.forEach(function (card) {
      var text = card.getAttribute('data-search') || '';
      var show = !q || text.indexOf(q) !== -1;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    // Leere Klassen- und Schulform-Gruppen ausblenden
    app.querySelectorAll('.grade-group').forEach(function (gg) {
      var any = gg.querySelector('.state-topic-card:not([style*="display: none"])');
      gg.style.display = any ? '' : 'none';
    });
    app.querySelectorAll('.school-type-group').forEach(function (sg) {
      var any = sg.querySelector('.grade-group:not([style*="display: none"])');
      sg.style.display = any ? '' : 'none';
      // Bei aktivem Filter: Gruppen aufklappen (ohne localStorage zu ändern)
      var toggle = sg.querySelector('.school-type-toggle');
      if (toggle && q) {
        toggle.classList.remove('collapsed');
        toggle.setAttribute('aria-expanded', 'true');
        var icon = toggle.querySelector('.school-toggle-icon');
        if (icon) icon.textContent = '▾';
      }
    });
    var counter = document.getElementById('state-topic-count');
    if (counter) {
      if (q) {
        counter.textContent = visible + ' von ' + cards.length + ' Themen sichtbar';
        counter.style.display = '';
      } else {
        counter.style.display = 'none';
      }
    }
  }

  function restoreCollapseState() {
    // Nach dem Leeren des Filters: gespeicherten Zustand anwenden
    var app = document.getElementById('curricula-state-app');
    if (!app) return;
    var collapsedSet = _collapsedSet();
    app.querySelectorAll('.school-type-group').forEach(function (sg) {
      var toggle = sg.querySelector('.school-type-toggle');
      var school = toggle ? toggle.getAttribute('data-school') : null;
      var isCollapsed = school ? !!collapsedSet[school] : false;
      if (toggle) {
        toggle.classList.toggle('collapsed', isCollapsed);
        toggle.setAttribute('aria-expanded', String(!isCollapsed));
        var icon = toggle.querySelector('.school-toggle-icon');
        if (icon) icon.textContent = isCollapsed ? '▸' : '▾';
      }
      sg.querySelectorAll('.school-group-content').forEach(function (content) {
        content.style.display = isCollapsed ? 'none' : '';
      });
      sg.style.display = '';
    });
    app.querySelectorAll('.grade-group').forEach(function (gg) {
      gg.style.display = '';
    });
  }

  function bindTopicFilterInput() {
    var filterInput = document.getElementById('state-topic-filter-input');
    if (!filterInput) return;
    filterInput.addEventListener('input', function () {
      clearTimeout(filterDebounceTimer);
      var val = this.value;
      filterDebounceTimer = setTimeout(function () {
        topicFilterQ = val.trim();
        if (topicFilterQ) applyTopicFilter();
        else restoreCollapseState();
      }, 150);
    });
    filterInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        topicFilterQ = '';
        restoreCollapseState();
      }
    });
  }

` + anchorHelpers
);

// ── 2. Filter-UI in _render (vor der Sprungnavigation) ──
const anchorFilterUi = `      // UXF-008: Sprungnavigation zu Schulform-Gruppen
      if (schoolOrder.length > 1) {`;
if (!src.includes(anchorFilterUi)) fail(anchorFilterUi);
src = src.replace(
  anchorFilterUi,
  `      // UXF-010: Filter-UI über den Gruppen
      html +=
        '<div class="state-topic-filter">' +
        '<input type="search" id="state-topic-filter-input" class="state-topic-filter-input" ' +
        'placeholder="Themen filtern — z. B. „Säure“ …" aria-label="Themen nach Stichwort filtern" ' +
        'autocomplete="off" value="' + escapeHtml(topicFilterQ) + '" />' +
        '<span class="state-topic-count" id="state-topic-count" role="status" style="display:none;"></span>' +
        '</div>';

` + anchorFilterUi
);

// ── 3. data-search-Attribut an Topic-Cards ──
const anchorCard = `html += '<div class="state-topic-card">';`;
if (!src.includes(anchorCard)) fail(anchorCard);
src = src.replace(
  anchorCard,
  `html +=
              '<div class="state-topic-card" data-search="' +
              escapeHtml(String(topic.title || topic.slug || '').toLowerCase()) +
              '">';`
);

// ── 4. UXF-011a: Topic-Link mit Search-Fallback + data-entity-name ──
const anchorLink = `entityHref(topic.title || topic.slug) +`;
if (!src.includes(anchorLink)) fail(anchorLink);
src = src.replace(
  anchorLink,
  `// UXF-011a: Fallback = Suche (Entity-Seite existiert oft nicht);
              // entity-links.js rewritet existierende /entity/-Links später.
              searchHref(topic.title || topic.slug) +
              '" data-entity-name="' +
              escapeHtml(topic.title || topic.slug) +
              '" data-fallback="1' +
              '"">'`
);

// ── 5. Nach dem Rendern: Rewrite + Filter binden + anwenden ──
const anchorEvents = `    app.innerHTML = html;
    _attachEvents();
  }`;
if (!src.includes(anchorEvents)) fail(anchorEvents);
src = src.replace(
  anchorEvents,
  `    app.innerHTML = html;
    _attachEvents();
    // UXF-011a: Entity-Links auflösen (Manifest → /entity/, sonst Suche bleibt)
    if (window.CurriculaEntityLinks && app.querySelector('a[data-entity-name]')) {
      window.CurriculaEntityLinks.rewriteWhenReady(app);
    }
    // UXF-010: Filter-Input binden + gespeicherten Filter anwenden
    bindTopicFilterInput();
    if (topicFilterQ) applyTopicFilter();
  }`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-010+011a] ✓ 5 Edits in curricula-state.js');
