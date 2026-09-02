/**
 * apply-state-func.mjs — UXF-003 + 004 + 008: curricula-state.js
 *
 * UXF-003: "+N"-Chip wird klickbarer Button → zeigt ALLE Lernziele des Themas.
 * UXF-004: Schulform-Gruppen einklappbar (Zustand in localStorage).
 * UXF-008: Sprungnavigation (Anchor-Chips) zu Schulform-Gruppen am Seitenanfang.
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-state.js');

function fail(anchor) {
  throw new Error(`[UXF-state] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
let applied = 0;

// ═══ UXF-003 + 004 + 008 ═══
if (!src.includes('UXF-004')) {
  // ── (1) Collapsible-Zustand + Helfer vor _render einfügen ──
  const renderAnchor = '  function _render() {';
  if (!src.includes(renderAnchor)) fail(renderAnchor);
  const helpers = `  // ── UXF-004: Collapsible Schulform-Gruppen (localStorage) ──
  var COLLAPSE_KEY = 'curriculaStateCollapsed';
  function _collapsedSet() {
    try {
      return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
  function _saveCollapsed(set) {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(set));
    } catch (e) { /* private mode */ }
  }

  function _render() {`;
  src = src.replace(renderAnchor, helpers);
  applied++;

  // ── (2) UXF-008: Sprungnavigation vor den Schulform-Gruppen ──
  const groupAnchor = `      schoolOrder.forEach(function (school) {
        html += '<div class="school-type-group">';
        html += '<h2>' + escapeHtml(school) + '</h2>';`;
  if (!src.includes(groupAnchor)) fail(groupAnchor);
  const jumpNav = `      // UXF-008: Sprungnavigation zu Schulform-Gruppen
      if (schoolOrder.length > 1) {
        html += '<nav class="curricula-jump-nav" aria-label="Springe zu Schulform">';
        schoolOrder.forEach(function (school) {
          html +=
            '<a class="curricula-jump-chip" href="#school-' +
            encodeURIComponent(toSlug(school)) +
            '">' +
            escapeHtml(school) +
            ' (' +
            Object.keys(grouped[school]).reduce(function (sum, g) {
              return sum + grouped[school][g].length;
            }, 0) +
            ')</a>';
        });
        html += '</nav>';
      }

      schoolOrder.forEach(function (school) {
        var isCollapsed = !!_collapsedSet()[school];
        html += '<div class="school-type-group" id="school-' + encodeURIComponent(toSlug(school)) + '">';
        // UXF-004: Schulform-Überschrift als Einklapp-Button
        var schoolTopicCount = Object.keys(grouped[school]).reduce(function (sum, g) {
          return sum + grouped[school][g].length;
        }, 0);
        html +=
          '<button type="button" class="school-type-toggle' +
          (isCollapsed ? ' collapsed' : '') +
          '" aria-expanded="' +
          (!isCollapsed) +
          '" data-school="' + escapeHtml(school) + '">' +
          '<span class="school-toggle-icon" aria-hidden="true">' + (isCollapsed ? '▸' : '▾') + '</span> ' +
          escapeHtml(school) +
          ' <span class="school-topic-count">(' + schoolTopicCount + ' Themen)</span>' +
          '</button>';`;
  src = src.replace(groupAnchor, jumpNav);
  applied++;

  // ── (3) UXF-004: grade-group collapsible-container Klasse ──
  const gradeAnchor = `        var gradeKeys = Object.keys(grouped[school]).sort();
        gradeKeys.forEach(function (grade) {
          html += '<div class="grade-group">';`;
  if (!src.includes(gradeAnchor)) fail(gradeAnchor);
  src = src.replace(
    gradeAnchor,
    `        var gradeKeys = Object.keys(grouped[school]).sort();
        gradeKeys.forEach(function (grade) {
          html += '<div class="grade-group school-group-content"' + (isCollapsed ? ' style="display:none;"' : '') + '>';`
  );
  applied++;

  // ── (4) UXF-003: "+N"-Chip zum Ausklapp-Button machen ──
  const chipAnchor = `              if (topic.objectives.length > 8) {
                html +=
                  '<span class="objective-chip" style="background:#eee;color:#666;">+' +
                  (topic.objectives.length - 8) +
                  '</span>';
              }`;
  if (!src.includes(chipAnchor)) fail(chipAnchor);
  src = src.replace(
    chipAnchor,
    `              // UXF-003: "+N" → klickbarer Button zeigt alle Lernziele
              if (topic.objectives.length > 8) {
                html +=
                  '<button type="button" class="objective-more-btn" data-topic="' +
                  escapeHtml(topic.slug) +
                  '" aria-label="Alle ' +
                  topic.objectives.length +
                  ' Lernziele anzeigen">+' +
                  (topic.objectives.length - 8) +
                  ' weitere Lernziele</button>';
              }`
  );
  applied++;

  // ── (5) Events: Toggle-Button + mehr-Lernziele via Delegation ──
  const eventsAnchor = `    // Delegated so freshly rendered toggle buttons work without rebinding
    app.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('.kg-graph-toggle') : null;
      if (btn) toggleTopicGraph(btn);
      // UX-003: Retry-Button für Fehlerzustände
      var retry = ev.target && ev.target.closest ? ev.target.closest('.ux-retry-btn') : null;
      if (retry) loadTree(retry.getAttribute('data-retry-state') || selectedState);
    });`;
  if (!src.includes(eventsAnchor)) fail(eventsAnchor);
  src = src.replace(
    eventsAnchor,
    `    // Delegated so freshly rendered toggle buttons work without rebinding
    app.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('.kg-graph-toggle') : null;
      if (btn) toggleTopicGraph(btn);
      // UX-003: Retry-Button für Fehlerzustände
      var retry = ev.target && ev.target.closest ? ev.target.closest('.ux-retry-btn') : null;
      if (retry) loadTree(retry.getAttribute('data-retry-state') || selectedState);
      // UXF-004: Schulform-Gruppe ein-/ausklappen
      var schoolBtn = ev.target && ev.target.closest ? ev.target.closest('.school-type-toggle') : null;
      if (schoolBtn) {
        var school = schoolBtn.getAttribute('data-school');
        var group = schoolBtn.parentNode;
        var content = group.querySelector('.school-group-content');
        var collapsedSet = _collapsedSet();
        var nowCollapsed = !schoolBtn.classList.contains('collapsed');
        schoolBtn.classList.toggle('collapsed', nowCollapsed);
        schoolBtn.setAttribute('aria-expanded', String(!nowCollapsed));
        var icon = schoolBtn.querySelector('.school-toggle-icon');
        if (icon) icon.textContent = nowCollapsed ? '▸' : '▾';
        if (content) content.style.display = nowCollapsed ? 'none' : '';
        if (school) {
          if (nowCollapsed) collapsedSet[school] = true;
          else delete collapsedSet[school];
          _saveCollapsed(collapsedSet);
        }
      }
      // UXF-003: Alle Lernziele eines Themas anzeigen
      var moreBtn = ev.target && ev.target.closest ? ev.target.closest('.objective-more-btn') : null;
      if (moreBtn) {
        var slug = moreBtn.getAttribute('data-topic');
        var topic = (treeData.topics || []).filter(function (t) {
          return t.slug === slug;
        })[0];
        if (topic && topic.objectives) {
          var container = moreBtn.parentNode;
          moreBtn.remove();
          topic.objectives.slice(8).forEach(function (obj) {
            var objText = typeof obj === 'string' ? obj : obj.text || obj.name;
            var chip = document.createElement('span');
            chip.className = 'objective-chip';
            chip.title = objText;
            chip.innerHTML = highlightOperators(escapeHtml(objText));
            container.appendChild(chip);
          });
        }
      }
    });`
  );
  applied++;

  console.log('[UXF-003/004/008] ✓ ' + applied + ' Änderungen in curricula-state.js');
} else {
  console.log('[UXF-state] bereits angewendet');
}

fs.writeFileSync(FILE, src);
console.log('[UXF-state] ✓ abgeschlossen');
