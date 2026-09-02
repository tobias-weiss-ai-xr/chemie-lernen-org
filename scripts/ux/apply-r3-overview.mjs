/**
 * apply-r3-overview.mjs — UXF-012 + UXF-011b: curricula-overview.js
 *
 * UXF-012: Sortierung der Bundesland-Cards (A–Z / Meiste Themen / Meiste
 *   Lernziele) als Select in der Filterleiste, synchronisiert mit URL-State
 *   (?sort=az|topics|objectives — parseUrlState/buildUrl in curricula-utils.js
 *   wurden bereits erweitert).
 * UXF-011b: Vergleichstabellen-Links → data-entity-name + Search-Fallback
 *   statt 404-Entity-Links (+ rewriteWhenReady nach dem Rendern).
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-overview.js');

function fail(anchor) {
  throw new Error(`[UXF-012] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-012')) {
  console.log('[UXF-012] bereits angewendet');
  process.exit(0);
}

// ── 1. sortBy-State-Variable ─────────────────────────────────────────
const a1 = `  var filterSchool = '';
  var filterGrade = '';`;
if (!src.includes(a1)) fail(a1);
src = src.replace(a1, `  var filterSchool = '';
  var filterGrade = '';
  var sortBy = ''; // UXF-012: ''|'az'|'topics'|'objectives'`);

// ── 2. renderGrid: sortieren vor dem Rendern ─────────────────────────
const a2 = `    var states = ALL_STATES || [];
    if (!states.length) {`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `    var states = (ALL_STATES || []).slice();
    // UXF-012: Sortierung — Metriken unter dem AKTUELLEN Filter vorberechnen
    if (sortBy && sortBy !== 'az') {
      var metrics = {};
      states.forEach(function (st) {
        var cur = (st.curricula || []).filter(matchesFilter);
        var t = 0;
        var o = 0;
        cur.forEach(function (c) {
          t += Number(c.topicCount) || 0;
          o += Number(c.objectiveCount) || 0;
        });
        metrics[st.state] = { topics: t, objectives: o };
      });
      var dir = sortBy === 'topics' ? 'topics' : 'objectives';
      states.sort(function (a, b) {
        return (metrics[b.state][dir] || 0) - (metrics[a.state][dir] || 0);
      });
    }
    if (!states.length) {`
);

// ── 3. Sort-Select in buildFilterOptions ─────────────────────────────
const a3 = `    var bar = document.getElementById('curricula-filter-bar');
    if (bar) bar.hidden = false;`;
if (!src.includes(a3)) fail(a3);
src = src.replace(
  a3,
  `    // UXF-012: Sort-Select (Wrapper dynamisch in die Filterleiste)
    var sortWrap = document.getElementById('curricula-sort-wrap');
    var barEl = document.getElementById('curricula-filter-bar');
    if (!sortWrap && barEl) {
      sortWrap = document.createElement('span');
      sortWrap.id = 'curricula-sort-wrap';
      var countEl = document.getElementById('curricula-filter-count');
      if (countEl && countEl.parentNode === barEl) barEl.insertBefore(sortWrap, countEl);
      else barEl.appendChild(sortWrap);
    }
    if (sortWrap && !sortWrap.querySelector('select')) {
      var sortLabel = document.createElement('label');
      sortLabel.className = 'curricula-filter-field';
      var labelText = document.createTextNode('Sortierung: ');
      sortLabel.appendChild(labelText);
      var sortSel = document.createElement('select');
      sortSel.id = 'curricula-sort';
      sortSel.setAttribute('aria-label', 'Sortierung der Bundesländer');
      [
        ['', 'A–Z'],
        ['topics', 'Meiste Themen'],
        ['objectives', 'Meiste Lernziele'],
      ].forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt[0];
        o.textContent = opt[1];
        sortSel.appendChild(o);
      });
      sortSel.value = sortBy;
      sortSel.addEventListener('change', function () {
        sortBy = this.value;
        renderGrid();
        updateUrl();
      });
      sortLabel.appendChild(sortSel);
      sortWrap.appendChild(sortLabel);
    }
    var bar = document.getElementById('curricula-filter-bar');
    if (bar) bar.hidden = false;`
);

// ── 4. applyUrlState: sort lesen ─────────────────────────────────────
const a4 = `    if (us.klasse) {
      filterGrade = us.klasse;
      var gradeSel = document.getElementById('curricula-filter-grade');
      if (gradeSel) gradeSel.value = us.klasse;
    }
  }`;
if (!src.includes(a4)) fail(a4);
src = src.replace(
  a4,
  `    if (us.klasse) {
      filterGrade = us.klasse;
      var gradeSel = document.getElementById('curricula-filter-grade');
      if (gradeSel) gradeSel.value = us.klasse;
    }
    // UXF-012: Sortierung aus URL (auch ohne Filterleiste wirksam)
    if (us.sort) sortBy = us.sort;
  }`
);

// ── 5. updateUrl: sort schreiben ─────────────────────────────────────
const a5 = `      vergleich: compareCheck && compareCheck.checked ? selected : [],
    });`;
if (!src.includes(a5)) fail(a5);
src = src.replace(
  a5,
  `      vergleich: compareCheck && compareCheck.checked ? selected : [],
      sort: sortBy || null,
    });`
);

// ── 6. UXF-011b: Compare-Tabellen-Links mit Search-Fallback ─────────
const a6 = `          '<tr><td><a class="curricula-topic-link" href="/entity/' +
          toSlug(r.label) +
          '/">' +
          escapeHtml(r.label) +
          '</a></td>' +`;
if (!src.includes(a6)) fail(a6);
src = src.replace(
  a6,
  `          // UXF-011b: Fallback = Suche; entity-links.js rewritet später
          '<tr><td><a class="curricula-topic-link" data-entity-name="' +
          escapeHtml(r.label) +
          '" href="/pages/suche/?q=' +
          encodeURIComponent(r.label) +
          '">' +
          escapeHtml(r.label) +
          '</a></td>' +`
);

// ── 7. renderCompare: Links nach dem Rendern rewriten ────────────────
const a7 = `      if (codes.join('|') !== selected.join('|')) return;
      panel.innerHTML = buildCompareTable(datas);`;
if (!src.includes(a7)) fail(a7);
src = src.replace(
  a7,
  `      if (codes.join('|') !== selected.join('|')) return;
      panel.innerHTML = buildCompareTable(datas);
      // UXF-011b: Entity-Links gegen Manifest auflösen
      if (window.CurriculaEntityLinks) {
        window.CurriculaEntityLinks.rewriteWhenReady(panel);
      }`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-012+011b] ✓ 7 Edits in curricula-overview.js');
