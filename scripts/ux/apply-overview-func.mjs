/**
 * apply-overview-func.mjs — UXF-002 + UXF-007: curricula-overview.js
 *
 * UXF-002 URL-State: Tab/Schulform/Klasse/Vergleich aus URL lesen (init)
 *   und bei Änderung via history.replaceState spiegeln (deep-linkable).
 * UXF-007 Compare: "Nur gemeinsame Themen"-Filter + CSV-Export-Button
 *   in der Vergleichstabelle.
 *
 * Idempotent via Marker-Check. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/curricula-overview.js');

function fail(anchor) {
  throw new Error(`[UXF-overview] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
let applied = 0;

// ═══ UXF-002: URL-State beim Init lesen + bei Änderungen schreiben ═══
if (!src.includes('UXF-002')) {
  // a) Init: URL-State anwenden (nach wireTabs() registrieren).
  const initAnchor = `      renderSummary(states, data.count);
      buildFilterOptions();
      renderGrid();
      wireTabs();`;
  if (!src.includes(initAnchor)) fail(initAnchor);
  const initReplacement = `      renderSummary(states, data.count);
      buildFilterOptions();
      // UXF-002: Deep-Link-State aus URL anwenden (?tab=&schulform=&klasse=#vergleich=)
      applyUrlState();
      renderGrid();
      wireTabs();`;
  src = src.replace(initAnchor, initReplacement);

  // b) applyUrlState + updateUrl vor showTab einfügen.
  const showTabAnchor = '  function showTab(which) {';
  if (!src.includes(showTabAnchor)) fail(showTabAnchor);
  const urlStateFns = `  // ── UXF-002: URL-State (Deep-Links) ───────────────────────────────

  function applyUrlState() {
    if (!window.CurriculaUtils) return;
    var us = window.CurriculaUtils.parseUrlState();
    if (us.tab === 'advanced') showTab('advanced');
    if (us.schulform) {
      filterSchool = us.schulform;
      var schoolSel = document.getElementById('curricula-filter-school');
      if (schoolSel) schoolSel.value = us.schulform;
    }
    if (us.klasse) {
      filterGrade = us.klasse;
      var gradeSel = document.getElementById('curricula-filter-grade');
      if (gradeSel) gradeSel.value = us.klasse;
    }
    if (us.vergleich && us.vergleich.length >= 2) {
      selected = us.vergleich.slice(0, 3);
      var check = document.getElementById('curricula-compare-check');
      if (check && !check.checked) {
        check.checked = true;
        var grid = document.getElementById('curricula-grid');
        if (grid) grid.classList.add('compare-mode');
      }
    }
  }

  function updateUrl() {
    if (!window.CurriculaUtils || !window.history || !window.history.replaceState) return;
    var compareCheck = document.getElementById('curricula-compare-check');
    var tab = document.getElementById('tab-advanced');
    var isAdvanced = tab && !tab.hidden;
    var url = window.CurriculaUtils.buildUrl({
      tab: isAdvanced ? 'advanced' : null,
      schulform: filterSchool || null,
      klasse: filterGrade || null,
      vergleich: compareCheck && compareCheck.checked ? selected : [],
    });
    window.history.replaceState(null, '', url);
  }

`;
  src = src.replace(showTabAnchor, urlStateFns + showTabAnchor);

  // c) updateUrl() bei State-Änderungen aufrufen: Filter-Changes, showTab,
  //    Compare-Toggle.
  const filterChangeA = `      schoolSel.addEventListener('change', function () {
        filterSchool = this.value;
        renderGrid();
      });`;
  if (!src.includes(filterChangeA)) fail(filterChangeA);
  src = src.replace(filterChangeA, `      schoolSel.addEventListener('change', function () {
        filterSchool = this.value;
        renderGrid();
        updateUrl();
      });`);

  const filterChangeB = `      gradeSel.addEventListener('change', function () {
        filterGrade = this.value;
        renderGrid();
      });`;
  if (!src.includes(filterChangeB)) fail(filterChangeB);
  src = src.replace(filterChangeB, `      gradeSel.addEventListener('change', function () {
        filterGrade = this.value;
        renderGrid();
        updateUrl();
      });`);

  const showTabEnd = `    if (isAdvanced) {
      if (!graphInited) {`;
  if (!src.includes(showTabEnd)) fail(showTabEnd);
  src = src.replace(showTabEnd, `    updateUrl();

    if (isAdvanced) {
      if (!graphInited) {`);

  const compareToggleEnd = `    renderCompare();
  }`;
  if (!src.includes(compareToggleEnd)) fail(compareToggleEnd);
  src = src.replace(compareToggleEnd, `    renderCompare();
    updateUrl();
  }`);

  applied++;
  console.log('[UXF-002] ✓ URL-State in curricula-overview.js');
} else {
  console.log('[UXF-002] bereits angewendet');
}

// ═══ UXF-007: Nur-gemeinsame-Filter + CSV-Export ═══
if (!src.includes('UXF-007')) {
  // buildCompareTable: Toolbar (Checkbox + Button) vor <h3> einfügen und
  // tbody-Rows per Filter rendern.
  const returnAnchor = `    return (
      '<h3>Vergleich: ' +
      escapeHtml(names) +
      '</h3>' +
      '<div class="curricula-compare-summary">' +
      summaryParts.join(' · ') +
      '</div>' +
      '<table class="curricula-compare-table"><thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table>'
    );`;
  if (!src.includes(returnAnchor)) fail(returnAnchor);
  const newReturn = `    // UXF-007: "Nur gemeinsame Themen"-Filter + CSV-Export
    var onlyCommon =
      window.curriculaCompareOnlyCommon === true;
    var visibleRows = onlyCommon
      ? all.filter(function (label) {
          return sets.every(function (s) {
            return s.labels.has(label);
          });
        })
      : all;
    var rowsFiltered = all
      .map(function (label) {
        var present = sets.filter(function (s) {
          return s.labels.has(label);
        });
        var cells = sets
          .map(function (s) {
            return s.labels.has(label)
              ? '<td class="yes">✓</td>'
              : '<td class="no">–</td>';
          })
          .join('');
        return { label: label, cells: cells, present: present.length };
      })
      .filter(function (r) {
        return !onlyCommon || r.present === sets.length;
      });
    var rowsHtml = rowsFiltered
      .map(function (r) {
        return (
          '<tr><td><a class="curricula-topic-link" href="/entity/' +
          toSlug(r.label) +
          '/">' +
          escapeHtml(r.label) +
          '</a></td>' +
          r.cells +
          '</tr>'
        );
      })
      .join('');

    var toolbar =
      '<div class="curricula-compare-toolbar">' +
      '<label class="curricula-compare-only-common">' +
      '<input type="checkbox" id="curricula-compare-only-common"' +
      (onlyCommon ? ' checked' : '') +
      ' /> Nur gemeinsame Themen (' +
      common +
      ')</label>' +
      '<button type="button" class="btn btn-secondary curricula-compare-csv" id="curricula-compare-csv">' +
      '⬇ CSV-Export</button>' +
      '<span class="curricula-compare-visible">' +
      rowsFiltered.length +
      ' von ' +
      all.length +
      ' Themen</span>' +
      '</div>';

    return (
      '<h3>Vergleich: ' +
      escapeHtml(names) +
      '</h3>' +
      '<div class="curricula-compare-summary">' +
      summaryParts.join(' · ') +
      '</div>' +
      toolbar +
      '<table class="curricula-compare-table"><thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      rowsHtml +
      '</tbody></table>'
    );`;
  src = src.replace(returnAnchor, newReturn);

  // buildCompareTable erneut aufrufen, wenn der nur-gemeinsame-Filter sich
  // ändert; CSV-Button verdrahten — nach panel.innerHTML = … in renderCompare.
  const renderCompareAnchor = `      if (codes.join('|') !== selected.join('|')) return;
      panel.innerHTML = buildCompareTable(datas);
    });`;
  if (!src.includes(renderCompareAnchor)) fail(renderCompareAnchor);
  src = src.replace(
    renderCompareAnchor,
    `      if (codes.join('|') !== selected.join('|')) return;
      panel.innerHTML = buildCompareTable(datas);
      // UXF-007: Toolbar verdrahten
      var onlyCommonCb = panel.querySelector('#curricula-compare-only-common');
      if (onlyCommonCb) {
        onlyCommonCb.addEventListener('change', function () {
          window.curriculaCompareOnlyCommon = this.checked;
          renderCompare();
        });
      }
      var csvBtn = panel.querySelector('#curricula-compare-csv');
      if (csvBtn) {
        csvBtn.addEventListener('click', function () {
          if (!window.CurriculaUtils) return;
          var exportSets = datas.map(function (d) {
            return { code: (d.state || '').toUpperCase(), labels: topicLabels(d) };
          });
          var union = {};
          exportSets.forEach(function (s) {
            s.labels.forEach(function (l) {
              union[l] = true;
            });
          });
          var allLabels = Object.keys(union).sort(function (a, b) {
            return a.localeCompare(b, 'de');
          });
          var csv = window.CurriculaUtils.buildCompareCsv(
            exportSets,
            allLabels,
            stateName
          );
          window.CurriculaUtils.downloadCsv(
            'lehrplan-vergleich-' + exportSets.map(function (s) { return s.code; }).join('-').toLowerCase() + '.csv',
            csv
          );
        });
      }
    });`
  );

  applied++;
  console.log('[UXF-007] ✓ Compare-Filter + CSV-Export in curricula-overview.js');
} else {
  console.log('[UXF-007] bereits angewendet');
}

if (applied > 0 || src.length > 0) {
  fs.writeFileSync(FILE, src);
}
console.log('[UXF-overview] ✓ abgeschlossen');
