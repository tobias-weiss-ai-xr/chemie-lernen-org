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

    var states = ALL_STATES || [];
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

    return (
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
      });
    }
    var bar = document.getElementById('curricula-filter-bar');
    if (bar) bar.hidden = false;
  }

  // ── Tabs ─────────────────────────────────────────────────────────────

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
      renderGrid();
      wireTabs();
    });
  }

  ready(init);
})();
