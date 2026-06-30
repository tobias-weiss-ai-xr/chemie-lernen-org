/* global fetch */
(function () {
  'use strict';

  var API_BASE = '/api';
  var U_ENDPOINT = API_BASE + '/modulhandbuch/universities';
  var COMPARE_ENDPOINT = API_BASE + '/studienvergleich/compare';

  var u1Select = document.getElementById('sv-u1');
  var u2Select = document.getElementById('sv-u2');
  var levelSelect = document.getElementById('sv-level');
  var topicInput = document.getElementById('sv-topic');
  var compareBtn = document.getElementById('sv-compare-btn');
  var swapBtn = document.getElementById('sv-swap-btn');
  var resultsDiv = document.getElementById('sv-results');

  var universities = [];

  function init() {
    if (!u1Select || !u2Select || !compareBtn || !resultsDiv) return;

    fetchUniversities();
    compareBtn.addEventListener('click', doCompare);

    if (swapBtn) {
      swapBtn.addEventListener('click', swapUniversities);
    }

    // Enable button when both selects have values
    u1Select.addEventListener('change', checkReady);
    u2Select.addEventListener('change', checkReady);
  }

  function fetchUniversities() {
    showLoading('Lade Universitäten');
    fetch(U_ENDPOINT)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        universities = data.universities || [];
        populateSelects();
        hideLoading();
      })
      .catch(function (err) {
        console.error('[studienvergleich] fetch universities failed:', err);
        resultsDiv.innerHTML =
          '<div class="sv-error">Fehler beim Laden der Universitäten. ' +
          'Bitte versuche es später erneut.</div>';
      });
  }

  function populateSelects() {
    var html = '<option value="">— Bitte wählen —</option>';
    universities.forEach(function (u) {
      html +=
        '<option value="' +
        escapeHtml(u.shortCode) +
        '">' +
        escapeHtml(u.name) +
        ' (' +
        escapeHtml(u.shortCode) +
        ')</option>';
    });
    u1Select.innerHTML = html;
    u2Select.innerHTML = html;
  }

  function checkReady() {
    compareBtn.disabled = !u1Select.value || !u2Select.value;
  }

  function doCompare() {
    var u1 = u1Select.value;
    var u2 = u2Select.value;
    if (!u1 || !u2) return;

    var url = COMPARE_ENDPOINT + '?u1=' + encodeURIComponent(u1) + '&u2=' + encodeURIComponent(u2);
    if (levelSelect.value) {
      url += '&level=' + encodeURIComponent(levelSelect.value);
    }
    if (topicInput.value.trim()) {
      url += '&topic=' + encodeURIComponent(topicInput.value.trim());
    }

    showLoading('Vergleiche Studiengänge');
    compareBtn.disabled = true;

    fetch(url)
      .then(function (r) {
        if (!r.ok)
          return r.json().then(function (e) {
            throw new Error(e.error || 'HTTP ' + r.status);
          });
        return r.json();
      })
      .then(function (data) {
        renderResults(data);
        compareBtn.disabled = false;
      })
      .catch(function (err) {
        console.error('[studienvergleich] compare failed:', err);
        resultsDiv.innerHTML =
          '<div class="sv-error">Vergleich fehlgeschlagen: ' + escapeHtml(err.message) + '</div>';
        compareBtn.disabled = false;
      });
  }

  function renderResults(data) {
    var html = '';

    // Stats bar
    var stats = data.stats || {};
    html += '<div class="sv-stats">';
    html += statBox(getUniName(data.university1), stats.total1 || 0, 'Module');
    html += statBox(getUniName(data.university2), stats.total2 || 0, 'Module');
    html += statBox('Gemeinsam', stats.common || 0, 'Themen');
    html += statBox('Nur ' + getUniName(data.university1), stats.unique1 || 0, 'Module');
    html += statBox('Nur ' + getUniName(data.university2), stats.unique2 || 0, 'Module');
    html += '</div>';

    var matrix = data.matrix || {};
    var u1Name = getUniName(data.university1);
    var u2Name = getUniName(data.university2);

    // Common topics
    if (matrix.commonTopics && matrix.commonTopics.length) {
      html += '<div class="sv-section-title">Gemeinsame Themenbereiche</div>';
      html += '<div class="sv-table-wrap"><table class="sv-table">';
      html +=
        '<thead><tr><th>Thema</th><th>' +
        escapeHtml(u1Name) +
        '</th><th>' +
        escapeHtml(u2Name) +
        '</th></tr></thead><tbody>';
      // Deduplicate: group common topics by partner module code
      var seen = {};
      var deduped = [];
      matrix.commonTopics.forEach(function (c) {
        var key = c.module2 ? c.module2.code : c.topic;
        if (seen[key]) {
          seen[key].count++;
          seen[key].extraModules.push(c.module1);
        } else {
          seen[key] = {
            topic: c.topic,
            matchScore: c.matchScore,
            module1: c.module1,
            module2: c.module2,
            count: 1,
            extraModules: [],
          };
          deduped.push(seen[key]);
        }
      });

      deduped.forEach(function (c) {
        html += '<tr class="sv-matched">';
        html +=
          '<td>' +
          escapeHtml(c.topic) +
          (c.count > 1 ? ' <span class="sv-tag sv-tag-count">×' + c.count + '</span>' : '') +
          ' ' +
          qualityBadge(c.matchScore) +
          '</td>';
        html += moduleCell(c.module1);
        html += moduleCell(c.module2);
        if (c.extraModules.length > 0) {
          html += '</tr><tr class="sv-matched sv-extra"><td></td><td colspan="2">';
          html += '<small class="sv-dedup-note">+ ' + c.count + ' weitere: ';
          c.extraModules.forEach(function (m, idx) {
            if (idx > 0) html += ', ';
            html +=
              '<a href="' +
              escapeHtml(m.url || '#') +
              '" target="_blank" rel="noopener">' +
              escapeHtml(m.name) +
              '</a>';
          });
          html += '</small></td>';
        }
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }

    // Unique to university 1
    if (matrix.unique1 && matrix.unique1.length) {
      html += '<div class="sv-section-title">Nur ' + escapeHtml(u1Name) + '</div>';
      html += '<div class="sv-table-wrap"><table class="sv-table">';
      html +=
        '<thead><tr><th>Modulcode</th><th>Modulname</th><th>ECTS</th><th>Niveau</th></tr></thead><tbody>';
      matrix.unique1.forEach(function (m) {
        html += '<tr class="sv-unique1">';
        html += '<td><span class="sv-tag sv-tag-u1">' + escapeHtml(m.code || '—') + '</span></td>';
        html +=
          '<td><a href="' +
          escapeHtml(m.url || '#') +
          '" target="_blank" rel="noopener">' +
          escapeHtml(m.name) +
          '</a></td>';
        html += '<td class="sv-ects ' + ectsClass(m.ects) + '">' + formatEcts(m.ects) + '</td>';
        html += '<td>' + escapeHtml(m.level || '') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }

    // Unique to university 2
    if (matrix.unique2 && matrix.unique2.length) {
      html += '<div class="sv-section-title">Nur ' + escapeHtml(u2Name) + '</div>';
      html += '<div class="sv-table-wrap"><table class="sv-table">';
      html +=
        '<thead><tr><th>Modulcode</th><th>Modulname</th><th>ECTS</th><th>Niveau</th></tr></thead><tbody>';
      matrix.unique2.forEach(function (m) {
        html += '<tr class="sv-unique2">';
        html += '<td><span class="sv-tag sv-tag-u2">' + escapeHtml(m.code || '—') + '</span></td>';
        html +=
          '<td><a href="' +
          escapeHtml(m.url || '#') +
          '" target="_blank" rel="noopener">' +
          escapeHtml(m.name) +
          '</a></td>';
        html += '<td class="sv-ects ' + ectsClass(m.ects) + '">' + formatEcts(m.ects) + '</td>';
        html += '<td>' + escapeHtml(m.level || '') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }

    // All modules per university (collapsible detail)
    if (data.universities) {
      html += '<div class="sv-section-title">Alle Module (beide Universitäten)</div>';
      html += '<div class="sv-table-wrap"><table class="sv-table">';
      html +=
        '<thead><tr><th>Universität</th><th>Modulcode</th><th>Modulname</th><th>ECTS</th><th>Niveau</th></tr></thead><tbody>';
      Object.keys(data.universities).forEach(function (univ) {
        data.universities[univ].forEach(function (m) {
          html += '<tr>';
          html += '<td><strong>' + escapeHtml(getUniName(univ)) + '</strong></td>';
          html += '<td>' + escapeHtml(m.code || '—') + '</td>';
          html += '<td>' + escapeHtml(m.name) + '</td>';
          html += '<td class="sv-ects ' + ectsClass(m.ects) + '">' + formatEcts(m.ects) + '</td>';
          html += '<td>' + escapeHtml(m.level || '') + '</td>';
          html += '</tr>';
        });
      });
      html += '</tbody></table></div>';
    }

    if (!matrix.commonTopics && !matrix.unique1 && !matrix.unique2) {
      html += '<div class="sv-empty">Keine Vergleichsdaten gefunden.</div>';
    }

    resultsDiv.innerHTML = html;
  }

  /* ── helpers ───────────────────────────────────── */

  function qualityBadge(score) {
    var cls, label;
    if (score >= 999) {
      cls = 'sv-tag-exakt';
      label = 'Exakt';
    } else if (score >= 4) {
      cls = 'sv-tag-gut';
      label = 'Gut';
    } else if (score >= 2) {
      cls = 'sv-tag-mittel';
      label = 'Mittel';
    } else {
      cls = 'sv-tag-schwach';
      label = 'Schwach';
    }
    return '<span class="sv-tag ' + cls + '">' + label + '</span>';
  }

  function swapUniversities() {
    var tmp = u1Select.value;
    u1Select.value = u2Select.value;
    u2Select.value = tmp;
    if (u1Select.value && u2Select.value) {
      doCompare();
    }
  }

  function getUniName(code) {
    for (var i = 0; i < universities.length; i++) {
      if (universities[i].shortCode === code) return universities[i].name;
    }
    return code || '—';
  }

  function moduleCell(mod) {
    if (!mod) {
      return '<td class="sv-missing">—</td>';
    }
    var extra = '';
    if (mod.ects !== null && mod.ects !== undefined) {
      extra +=
        ' &middot; <span class="sv-ects ' +
        ectsClass(mod.ects) +
        '">' +
        formatEcts(mod.ects) +
        ' ECTS</span>';
    }
    return (
      '<td><a href="' +
      escapeHtml(mod.url || '#') +
      '" target="_blank" rel="noopener">' +
      escapeHtml(mod.name) +
      '</a><br><small>' +
      escapeHtml(mod.code || '') +
      extra +
      '</small></td>'
    );
  }

  function formatEcts(v) {
    if (v === null || v === undefined) return '—';
    return Number(v).toFixed(1);
  }

  function ectsClass(v) {
    if (v === null || v === undefined) return 'sv-ects-low';
    if (v >= 8) return 'sv-ects-high';
    if (v >= 4) return 'sv-ects-mid';
    return 'sv-ects-low';
  }

  function statBox(label, value, unit) {
    return (
      '<div class="sv-stat">' +
      '<span class="sv-stat-value">' +
      value +
      '</span>' +
      '<span class="sv-stat-label">' +
      escapeHtml(label) +
      ' ' +
      unit +
      '</span>' +
      '</div>'
    );
  }

  function showLoading(msg) {
    resultsDiv.innerHTML = '<div class="sv-loading">' + escapeHtml(msg) + '</div>';
  }

  function hideLoading() {
    if (resultsDiv.querySelector('.sv-loading')) {
      resultsDiv.innerHTML = '';
    }
  }

  function escapeHtml(s) {
    if (typeof s !== 'string') return String(s || '');
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
