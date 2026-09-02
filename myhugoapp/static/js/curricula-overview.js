/**
 * curricula-overview.js — "Übersicht" tab of the Lehrpläne page.
 *
 * Renders a card grid of all 16 Bundesländer from GET /api/curricula/list,
 * a summary stats bar, and an optional comparison feature (fetches
 * GET /api/curricula/by-state/:code for 2–3 selected states and shows a
 * topic overlap table). Tab switching to the "Erweitert" graph tab lazily
 * initialises curricula-index.js (exposed as window.curriculaGraphInit).
 *
 * Plain script (no modules) to match the rest of the curricula JS.
 */
(function () {
  'use strict';

  // UX-003: Einheitlicher Fehlerzustand mit Retry-Button
  function renderErrorState(container, message, retryFn) {
    if (!container) return;
    container.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-state-icon">⚠️</div>' +
      '<p>' +
      message +
      '</p>' +
      '<button type="button" class="btn btn-primary ux-retry-btn" aria-label="Erneut versuchen">' +
      '<i class="fa fa-refresh" aria-hidden="true"></i> Erneut versuchen</button>' +
      '</div>';
    var btn = container.querySelector('.ux-retry-btn');
    if (btn && typeof retryFn === 'function') {
      btn.addEventListener('click', retryFn);
    }
  }

  ('use strict');

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Mirror of curricula-state.js toSlug so comparison topics resolve to the
  // same /entity/<slug>/ concept pages the per-state view links to.
  function toSlug(name) {
    return String(name)
      .toLowerCase()
      .replace(/[üÜ]/g, 'ue')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[äÄ]/g, 'ae')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  var byStateCache = {};
  var graphInited = false;
  var selected = []; // state codes selected for comparison
  var ALL_STATES = []; // raw /api/curricula/list payload (for filtering)
  var filterSchool = '';
  var filterGrade = '';
  var sortBy = ''; // UXF-012: ''|'az'|'topics'|'objectives'

  var listFetchFailed = false; // UX-003: track fetch errors for retry UI

  function fetchList() {
    listFetchFailed = false;
    return fetch('/api/curricula/list', { signal: AbortSignal.timeout(10000) })
      .then(function (r) {
        if (!r.ok) {
          listFetchFailed = true;
          return { states: [], count: 0 };
        }
        return r.json();
      })
      .catch(function () {
        listFetchFailed = true;
        return { states: [], count: 0 };
      });
  }

  function fetchByState(code) {
    if (byStateCache[code]) return Promise.resolve(byStateCache[code]);
    return fetch('/api/curricula/by-state/' + encodeURIComponent(code), {
      signal: AbortSignal.timeout(15000),
    })
      .then(function (r) {
        return r.ok ? r.json() : { state: code, topics: [] };
      })
      .catch(function () {
        return { state: code, topics: [] };
      })
      .then(function (data) {
        byStateCache[code] = data;
        return data;
      });
  }

  function renderSummary(states, count) {
    var laender = states.length;
    var lehrplae = count || 0;
    var themen = 0;
    var lernziele = 0;
    states.forEach(function (st) {
      (st.curricula || []).forEach(function (c) {
        themen += Number(c.topicCount) || 0;
        lernziele += Number(c.objectiveCount) || 0;
      });
    });
    var el = document.getElementById('curricula-summary');
    if (!el) return;
    el.innerHTML =
      stat(laender, 'Bundesländer') +
      stat(lehrplae, 'Lehrpläne') +
      stat(themen, 'Themen') +
      stat(lernziele, 'Lernziele');
  }

  function stat(num, label) {
    return (
      '<div class="curricula-stat"><span class="curricula-stat-num">' +
      num +
      '</span><span class="curricula-stat-label">' +
      label +
      '</span></div>'
    );
  }

  function matchesFilter(c) {
    if (filterSchool && c.schoolType !== filterSchool) return false;
    if (filterGrade && String(c.grade) !== filterGrade) return false;
    return true;
  }

  function renderGrid() {
    var grid = document.getElementById('curricula-grid');
    if (!grid) return;
    var skeleton = document.getElementById('curricula-skeleton');
    if (skeleton) skeleton.remove();

    var states = (ALL_STATES || []).slice();
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
    if (!states.length) {
      if (listFetchFailed) {
        // UX-003: Ladefehler → Retry anbieten
        renderErrorState(grid, 'Lehrplandaten konnten nicht geladen werden.', function () {
          grid.innerHTML = '<div class="curricula-loading"><em>Lade Lehrpläne…</em></div>';
          fetchList().then(function (data) {
            ALL_STATES = (data && data.states) || [];
            renderSummary(ALL_STATES, data && data.count);
            buildFilterOptions();
            renderGrid();
          });
        });
      } else {
        grid.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">📭</div>' +
          '<p>Keine Lehrplandaten verfügbar.</p></div>';
      }
      updateFilterCount(0);
      return;
    }

    var html = '';
    var visible = 0;
    states.forEach(function (st) {
      var curricula = (st.curricula || []).filter(matchesFilter);
      if (!curricula.length) return; // filtered out for this state
      visible++;
      var curriculaCount = curricula.length;
      var topics = 0;
      var objectives = 0;
      var types = {};
      curricula.forEach(function (c) {
        topics += Number(c.topicCount) || 0;
        objectives += Number(c.objectiveCount) || 0;
        if (c.schoolType) types[c.schoolType] = true;
      });
      var typeTags = Object.keys(types)
        .map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + '</span>';
        })
        .join('');
      var stats = [
        curriculaCount + (curriculaCount === 1 ? ' Lehrplan' : ' Lehrpläne'),
        topics + ' Themen',
        objectives + ' Lernziele',
      ].join('<span class="sep">·</span>');

      html +=
        '<button class="curricula-state-card' +
        (topics === 0 ? ' zero-topics' : '') +
        '" data-state="' +
        escapeHtml(st.state) +
        '" data-state-name="' +
        escapeHtml(st.stateName || st.state) +
        '" type="button" aria-label="Lehrpläne ' +
        escapeHtml(st.stateName || st.state) +
        ' öffnen">' +
        '<div class="curricula-card-top">' +
        '<span class="curricula-card-name">' +
        escapeHtml(st.stateName || st.state) +
        '</span>' +
        '<span class="curricula-card-code">' +
        escapeHtml(st.state) +
        '</span>' +
        '</div>' +
        '<div class="curricula-card-stats">' +
        stats +
        '</div>' +
        (typeTags ? '<div class="curricula-card-tags">' + typeTags + '</div>' : '') +
        '<label class="curricula-card-compare">' +
        '<input type="checkbox" class="curricula-compare-cb" value="' +
        escapeHtml(st.state) +
        '"> vergleichen</label>' +
        '</button>';
    });
    if (!visible) {
      grid.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">🔍</div>' +
        '<p>Keine Lehrpläne für die gewählte Schulform / Klasse.</p></div>';
      updateFilterCount(0);
      return;
    }
    grid.innerHTML = html;
    updateFilterCount(visible);

    grid.querySelectorAll('.curricula-state-card').forEach(function (card) {
      card.addEventListener('click', function (ev) {
        // The compare checkbox lives inside the card; don't navigate when it
        // (or its label) is the click target.
        if (ev.target.closest('.curricula-card-compare')) return;
        var code = card.getAttribute('data-state');
        if (code) window.location.href = '/curricula/' + code + '/';
      });
    });
    grid.querySelectorAll('.curricula-compare-cb').forEach(function (cb) {
      cb.addEventListener('change', onCompareToggle);
    });
  }

  // ── Comparison feature ────────────────────────────────────────────────

  function onCompareToggle(ev) {
    var cb = ev.target;
    var code = cb.value;
    if (cb.checked) {
      if (selected.length >= 3) {
        // Drop the earliest selection to keep the cap at 3.
        var first = selected.shift();
        var old = document.querySelector('.curricula-compare-cb[value="' + first + '"]');
        if (old) {
          old.checked = false;
          var oldCard = old.closest('.curricula-state-card');
          if (oldCard) oldCard.classList.remove('selected');
        }
      }
      selected.push(code);
      cb.closest('.curricula-state-card').classList.add('selected');
    } else {
      selected = selected.filter(function (c) {
        return c !== code;
      });
      var card = cb.closest('.curricula-state-card');
      if (card) card.classList.remove('selected');
    }
    renderCompare();
    updateUrl();
  }

  function renderCompare() {
    var panel = document.getElementById('curricula-compare-panel');
    if (!panel) return;
    if (selected.length < 2) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    panel.hidden = false;
    panel.innerHTML = '<p class="curricula-compare-empty">Vergleich wird geladen…</p>';
    Promise.all(
      selected.map(function (code) {
        return fetchByState(code);
      })
    ).then(function (datas) {
      // Guard against selection change during fetch.
      var codes = datas.map(function (d) {
        return (d.state || '').toUpperCase();
      });
      if (codes.join('|') !== selected.join('|')) return;
      panel.innerHTML = buildCompareTable(datas);
      // UXF-011b: Entity-Links gegen Manifest auflösen
      if (window.CurriculaEntityLinks) {
        window.CurriculaEntityLinks.rewriteWhenReady(panel);
      }
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
          var csv = window.CurriculaUtils.buildCompareCsv(exportSets, allLabels, stateName);
          window.CurriculaUtils.downloadCsv(
            'lehrplan-vergleich-' +
              exportSets
                .map(function (s) {
                  return s.code;
                })
                .join('-')
                .toLowerCase() +
              '.csv',
            csv
          );
        });
      }
    });
  }

  function topicLabels(data) {
    var labels = (data.topics || []).map(function (t) {
      return (t.displayName || t.name || '').trim();
    });
    return labels.filter(Boolean);
  }

  function buildCompareTable(datas) {
    var sets = datas.map(function (d) {
      return { code: (d.state || '').toUpperCase(), labels: new Set(topicLabels(d)) };
    });
    var union = {};
    sets.forEach(function (s) {
      s.labels.forEach(function (l) {
        union[l] = true;
      });
    });
    var all = Object.keys(union).sort(function (a, b) {
      return a.localeCompare(b, 'de');
    });

    var common = 0;
    var onlyCounts = sets.map(function () {
      return 0;
    });
    all.forEach(function (label) {
      var present = sets.filter(function (s) {
        return s.labels.has(label);
      });
      if (present.length === sets.length) {
        common += 1;
      } else if (present.length === 1) {
        var idx = sets.indexOf(present[0]);
        onlyCounts[idx] += 1;
      }
    });

    var names = sets
      .map(function (s) {
        return stateName(s.code);
      })
      .join(' · ');
    var summaryParts = [common + ' gemeinsame Themen'];
    sets.forEach(function (s, i) {
      if (onlyCounts[i]) summaryParts.push(onlyCounts[i] + ' nur ' + stateName(s.code));
    });

    var head =
      '<th>Thema</th>' +
      sets
        .map(function (s) {
          return '<th>' + escapeHtml(stateName(s.code)) + '</th>';
        })
        .join('');
    var rows = all
      .map(function (label) {
        var cells = sets
          .map(function (s) {
            return s.labels.has(label) ? '<td class="yes">✓</td>' : '<td class="no">–</td>';
          })
          .join('');
        return (
          '<tr><td><a class="curricula-topic-link" href="/entity/' +
          toSlug(label) +
          '/">' +
          escapeHtml(label) +
          '</a></td>' +
          cells +
          '</tr>'
        );
      })
      .join('');

    // UXF-007: "Nur gemeinsame Themen"-Filter + CSV-Export
    var onlyCommon = window.curriculaCompareOnlyCommon === true;
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
            return s.labels.has(label) ? '<td class="yes">✓</td>' : '<td class="no">–</td>';
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
          // UXF-011b: Fallback = Suche; entity-links.js rewritet später
          '<tr><td><a class="curricula-topic-link" data-entity-name="' +
          escapeHtml(r.label) +
          '" href="/pages/suche/?q=' +
          encodeURIComponent(r.label) +
          '">' +
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
    );
  }

  // Lightweight code→name lookup for the compare heading (falls back to code).
  var NAME_MAP = {};
  function stateName(code) {
    return NAME_MAP[code] || code;
  }

  // ── Filter bar (school type + grade) ───────────────────────────────────

  function updateFilterCount(visible) {
    var el = document.getElementById('curricula-filter-count');
    if (!el) return;
    var total = (ALL_STATES || []).length;
    el.textContent =
      visible + ' von ' + total + ' Ländern' + (filterSchool || filterGrade ? ' (gefiltert)' : '');
  }

  function buildFilterOptions() {
    var schools = {};
    var grades = {};
    (ALL_STATES || []).forEach(function (st) {
      (st.curricula || []).forEach(function (c) {
        if (c.schoolType) schools[c.schoolType] = true;
        if (c.grade != null && c.grade !== '') grades[String(c.grade)] = true;
      });
    });
    var schoolSel = document.getElementById('curricula-filter-school');
    var gradeSel = document.getElementById('curricula-filter-grade');
    if (schoolSel) {
      Object.keys(schools)
        .sort()
        .forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          schoolSel.appendChild(opt);
        });
      schoolSel.addEventListener('change', function () {
        filterSchool = this.value;
        renderGrid();
        updateUrl();
      });
    }
    if (gradeSel) {
      Object.keys(grades)
        .sort(function (a, b) {
          return Number(a) - Number(b);
        })
        .forEach(function (g) {
          var opt = document.createElement('option');
          opt.value = g;
          opt.textContent = 'Klasse ' + g;
          gradeSel.appendChild(opt);
        });
      gradeSel.addEventListener('change', function () {
        filterGrade = this.value;
        renderGrid();
        updateUrl();
      });
    }
    // UXF-012: Sort-Select (Wrapper dynamisch in die Filterleiste)
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
    if (bar) bar.hidden = false;
  }

  // ── Tabs ─────────────────────────────────────────────────────────────

  // ── UXF-002: URL-State (Deep-Links) ───────────────────────────────

  function applyUrlState() {
    if (!window.CurriculaUtils) return;
    var us = window.CurriculaUtils.parseUrlState();
    // Filter VOR renderGrid() anwenden (Selects sind von buildFilterOptions gefüllt)
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
    // UXF-012: Sortierung aus URL (auch ohne Filterleiste wirksam)
    if (us.sort) sortBy = us.sort;
  }

  // UXF-002: Compare/Tab-State NACH renderGrid()+wireTabs() anwenden —
  // braucht die gerenderten Checkboxen.
  function applyUrlCompareState() {
    if (!window.CurriculaUtils) return;
    var us = window.CurriculaUtils.parseUrlState();
    if (us.tab === 'advanced') showTab('advanced');
    if (us.vergleich && us.vergleich.length >= 2) {
      selected = us.vergleich.slice(0, 3);
      var check = document.getElementById('curricula-compare-check');
      if (check && !check.checked) {
        check.checked = true;
        var grid = document.getElementById('curricula-grid');
        if (grid) grid.classList.add('compare-mode');
      }
      // Checkboxen in den Cards spiegeln
      selected.forEach(function (code) {
        var cb = document.querySelector('.curricula-compare-cb[value="' + code + '"]');
        if (cb) {
          cb.checked = true;
          var card = cb.closest('.curricula-state-card');
          if (card) card.classList.add('selected');
        }
      });
      renderCompare();
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
      sort: sortBy || null,
    });
    window.history.replaceState(null, '', url);
  }

  function showTab(which) {
    var overview = document.getElementById('tab-overview');
    var advanced = document.getElementById('tab-advanced');
    var btnO = document.getElementById('tab-btn-overview');
    var btnA = document.getElementById('tab-btn-advanced');
    var isAdvanced = which === 'advanced';

    if (overview) overview.hidden = isAdvanced;
    if (advanced) advanced.hidden = !isAdvanced;
    if (btnO) {
      btnO.classList.toggle('active', !isAdvanced);
      btnO.setAttribute('aria-selected', String(!isAdvanced));
    }
    if (btnA) {
      btnA.classList.toggle('active', isAdvanced);
      btnA.setAttribute('aria-selected', String(isAdvanced));
    }

    updateUrl();

    if (isAdvanced) {
      if (!graphInited) {
        graphInited = true;
        // Defer one frame so the panel has real dimensions before cytoscape
        // renders into it.
        requestAnimationFrame(function () {
          if (window.curriculaGraphInit) window.curriculaGraphInit();
        });
      } else if (window.curriculaGraphResize) {
        requestAnimationFrame(function () {
          window.curriculaGraphResize();
        });
      }
    }
  }

  function wireTabs() {
    var btnO = document.getElementById('tab-btn-overview');
    var btnA = document.getElementById('tab-btn-advanced');
    if (btnO)
      btnO.addEventListener('click', function () {
        showTab('overview');
      });
    if (btnA)
      btnA.addEventListener('click', function () {
        showTab('advanced');
      });

    var compareCheck = document.getElementById('curricula-compare-check');
    var grid = document.getElementById('curricula-grid');
    if (compareCheck && grid) {
      compareCheck.addEventListener('change', function () {
        grid.classList.toggle('compare-mode', compareCheck.checked);
        if (!compareCheck.checked) {
          selected = [];
          grid.querySelectorAll('.curricula-compare-cb').forEach(function (cb) {
            cb.checked = false;
          });
          grid.querySelectorAll('.curricula-state-card.selected').forEach(function (c) {
            c.classList.remove('selected');
          });
          var panel = document.getElementById('curricula-compare-panel');
          if (panel) {
            panel.hidden = true;
            panel.innerHTML = '';
          }
        }
      });
    }
  }

  function init() {
    var grid = document.getElementById('curricula-grid');
    if (!grid) return;
    fetchList().then(function (data) {
      var states = data.states || [];
      ALL_STATES = states;
      states.forEach(function (st) {
        NAME_MAP[(st.state || '').toUpperCase()] = st.stateName || st.state;
      });
      renderSummary(states, data.count);
      buildFilterOptions();
      // UXF-002: Filter vor renderGrid, Compare/Tab danach (braucht DOM)
      applyUrlState();
      renderGrid();
      wireTabs();
      applyUrlCompareState();
    });
  }

  ready(init);
})();
