(function () {
  window.__curriculaIndexLoaded = true;
  var app = document.getElementById('curricula-app');
  if (!app) return;
  var skeleton = document.getElementById('curricula-skeleton');

  function toSlug(name) {
    return name
      .toLowerCase()
      .replace(/[üÜ]/g, 'ue')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[äÄ]/g, 'ae')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var _data;
  fetch('/api/kg-data?lehrplan=true', { signal: AbortSignal.timeout(15000) })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (d) {
      _data = d;
      if (skeleton) skeleton.style.display = 'none';
      try {
        init(d);
      } catch (e) {
        console.error('[curricula-index] init() failed:', e);
        app.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p style="color:red;">Fehler beim Laden: <strong>' +
          escapeHtml(e.message || String(e)) +
          '</strong></p></div>';
      }
    })
    .catch(function (_err) {
      if (skeleton) skeleton.style.display = 'none';
      app.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">📡</div><p>Lehrplandaten konnten nicht geladen werden.</p></div>';
    });

  function init(data) {
    var entities = data.entities || [];
    var activeTab = 'explorer';
    var searchQuery = '';
    var currentPage = 1;
    var perPage = 24;
    var filterState = [];
    var filterSchool = [];
    var filterGrade = [];
    var compareTopicName = '';
    var compareResults = null;
    var expandedCompareRow = null;

    // Precompute KMK topic map from didaktik entities
    var kmkTopicMap = {};
    entities.forEach(function (e) {
      if (e.category === 'didaktik' && e.relatedEntities) {
        e.relatedEntities.forEach(function (r) {
          var n = typeof r === 'string' ? r : r.name;
          if (!kmkTopicMap[n]) kmkTopicMap[n] = [];
          kmkTopicMap[n].push(e.name);
        });
      }
    });

    // Collect unique filter values
    var states = {};
    var schools = {};
    var grades = {};
    entities.forEach(function (e) {
      var meta = e.curriculumMeta;
      if (meta) {
        if (meta.state) states[meta.state] = (states[meta.state] || 0) + 1;
        if (meta.school_type) schools[meta.school_type] = (schools[meta.school_type] || 0) + 1;
        if (meta.grade) {
          var parts = String(meta.grade).split('/');
          parts.forEach(function (g) {
            var gKey = g.trim();
            if (gKey) grades[gKey] = (grades[gKey] || 0) + 1;
          });
        }
      }
    });
    var stateKeys = Object.keys(states).sort();
    var schoolKeys = Object.keys(schools).sort();

    var gradeOrder = [
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '5-7',
      '8-10',
      '9-10',
      '11/12',
      '11',
      '12',
      '13',
    ];
    var gradeKeys = Object.keys(grades).sort(function (a, b) {
      var ai = gradeOrder.indexOf(a);
      var bi = gradeOrder.indexOf(b);
      if (ai === -1) ai = 99;
      if (bi === -1) bi = 99;
      return ai - bi;
    });

    function getFiltered() {
      return entities.filter(function (e) {
        if (e.category === 'didaktik') return false;
        var meta = e.curriculumMeta;
        if (!meta) return false;
        if (filterState.length && filterState.indexOf(meta.state) === -1) return false;
        if (filterSchool.length && filterSchool.indexOf(meta.school_type) === -1) return false;
        if (filterGrade.length) {
          var metaGrade = String(meta.grade);
          var match = filterGrade.some(function (g) {
            return metaGrade === g || metaGrade.indexOf(g) !== -1;
          });
          if (!match) return false;
        }
        if (searchQuery) {
          var q = searchQuery.toLowerCase();
          return (
            e.name.toLowerCase().indexOf(q) !== -1 ||
            (e.relatedEntities || []).some(function (r) {
              return (typeof r === 'string' ? r : r.name).toLowerCase().indexOf(q) !== -1;
            })
          );
        }
        return true;
      });
    }

    function _render() {
      if (activeTab === 'explorer') _renderExplorer();
      else if (activeTab === 'compare') _renderCompare();
      else _renderExplorer();
    }

    // ── Explorer Tab ──
    function _renderExplorer() {
      var filtered = getFiltered();
      var totalPages = Math.ceil(filtered.length / perPage);
      if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
      var start = (currentPage - 1) * perPage;
      var pageItems = filtered.slice(start, start + perPage);

      var html = '';

      // Header with tabs
      html += '<div class="curricula-header">';
      html += '<h1>Lehrpläne durchsuchen</h1>';
      html += '<div class="curricula-stats">';
      html +=
        '<span><strong>' +
        entities.filter(function (e) {
          return e.category !== 'didaktik';
        }).length +
        '</strong> Themen</span>';
      html += '<span><strong>' + stateKeys.length + '</strong> Bundesländer</span>';
      html += '<span>' + filtered.length + ' angezeigt</span>';
      html += '</div></div>';

      // Tab bar
      html += '<div class="curricula-tabs">';
      html += '<button class="curricula-tab active" data-tab="explorer">Durchsuchen</button>';
      html += '<button class="curricula-tab" data-tab="compare">Ländervergleich</button>';
      html += '</div>';

      // Filters
      html += '<div class="curricula-filters">';
      html += '<div class="curricula-filter-row">';
      html += '<label class="curricula-filter-label">Bundesland</label>';
      html +=
        '<select class="curricula-select curricula-multi" id="curricula-filter-state" multiple size="1" data-placeholder="Alle Bundesländer">';
      stateKeys.forEach(function (s) {
        html +=
          '<option value="' +
          s +
          '"' +
          (filterState.indexOf(s) !== -1 ? ' selected' : '') +
          '>' +
          escapeHtml(s) +
          ' (' +
          states[s] +
          ')</option>';
      });
      html += '</select>';
      html += '<label class="curricula-filter-label">Schulform</label>';
      html +=
        '<select class="curricula-select curricula-multi" id="curricula-filter-school" multiple size="1" data-placeholder="Alle Schulformen">';
      schoolKeys.forEach(function (s) {
        html +=
          '<option value="' +
          s +
          '"' +
          (filterSchool.indexOf(s) !== -1 ? ' selected' : '') +
          '>' +
          escapeHtml(s) +
          ' (' +
          schools[s] +
          ')</option>';
      });
      html += '</select>';
      html += '<label class="curricula-filter-label">Klasse</label>';
      html +=
        '<select class="curricula-select curricula-multi" id="curricula-filter-grade" multiple size="1" data-placeholder="Alle Klassen">';
      gradeKeys.forEach(function (g) {
        html +=
          '<option value="' +
          g +
          '"' +
          (filterGrade.indexOf(g) !== -1 ? ' selected' : '') +
          '>' +
          escapeHtml(g) +
          ' (' +
          grades[g] +
          ')</option>';
      });
      html += '</select>';
      html += '</div>';
      // Active filter badges
      var activeFilters = [];
      filterState.forEach(function (s) {
        activeFilters.push({ type: 'state', label: s });
      });
      filterSchool.forEach(function (s) {
        activeFilters.push({ type: 'school', label: s });
      });
      filterGrade.forEach(function (g) {
        activeFilters.push({ type: 'grade', label: 'Klasse ' + g });
      });
      if (activeFilters.length > 0) {
        html += '<div class="curricula-active-filters">';
        activeFilters.forEach(function (f) {
          html +=
            '<span class="curricula-active-filter" data-type="' +
            f.type +
            '" data-value="' +
            escapeHtml(f.label) +
            '">' +
            escapeHtml(f.label) +
            ' <span class="curricula-active-filter-x">&times;</span></span>';
        });
        html += '</div>';
      }
      html += '<div class="curricula-search-row">';
      html +=
        '<input class="curricula-search" type="text" placeholder="Thema suchen..." id="curricula-search" value="' +
        escapeHtml(searchQuery) +
        '">';
      html += '</div>';
      html += '</div>';

      // Cards
      html += '<div class="curricula-grid">';
      if (pageItems.length === 0) {
        html +=
          '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Keine Themen gefunden.</p></div>';
      } else {
        pageItems.forEach(function (e) {
          var meta = e.curriculumMeta;
          var kmkStandards = kmkTopicMap[e.name] || [];
          var slug = toSlug(e.name);
          var relCount = (e.relatedEntities || []).length;

          html += '<div class="curricula-card" data-slug="' + slug + '">';
          // Top bar (state color)
          html +=
            '<div class="curricula-card-bar" style="background:' +
            getStateColor(meta.state) +
            ';"></div>';
          html += '<div class="curricula-card-body">';
          html +=
            '<div class="curricula-card-name"><a href="/entity/' +
            slug +
            '/">' +
            escapeHtml(e.name) +
            '</a></div>';
          if (meta) {
            html += '<div class="curricula-card-meta">';
            html += '<span class="curricula-meta-state">' + escapeHtml(meta.state) + '</span>';
            html +=
              ' · <span class="curricula-meta-school">' + escapeHtml(meta.school_type) + '</span>';
            if (meta.grade)
              html += ' · Klasse <strong>' + escapeHtml(String(meta.grade)) + '</strong>';
            if (meta.objective_count)
              html += ' · <strong>' + meta.objective_count + '</strong> Lernziele';
            html += '</div>';
          }
          html += '<div class="curricula-card-relations">' + relCount + ' Verknüpfungen</div>';
          // KMK badges
          if (kmkStandards.length > 0) {
            html += '<div class="curricula-card-kmk">';
            kmkStandards.forEach(function (kmk) {
              var label = kmk.replace(/^kmk-/i, '').replace(/-/g, ' ');
              html +=
                '<span class="kmk-badge">✓ ' +
                escapeHtml(
                  label.replace(/\b\w/g, function (c) {
                    return c.toUpperCase();
                  })
                ) +
                '</span>';
            });
            html += '</div>';
          }
          html += '</div></div>';
        });
      }
      html += '</div>';

      // Pagination
      if (totalPages > 1) {
        html += '<div class="curricula-pagination">';
        html +=
          '<button class="curricula-page-btn" data-page="' +
          (currentPage - 1) +
          '"' +
          (currentPage <= 1 ? ' disabled' : '') +
          '>‹</button>';
        var startPage = Math.max(1, currentPage - 3);
        var endPage = Math.min(totalPages, currentPage + 3);
        for (var p = startPage; p <= endPage; p++) {
          html +=
            '<button class="curricula-page-btn' +
            (p === currentPage ? ' active' : '') +
            '" data-page="' +
            p +
            '">' +
            p +
            '</button>';
        }
        html +=
          '<button class="curricula-page-btn" data-page="' +
          (currentPage + 1) +
          '"' +
          (currentPage >= totalPages ? ' disabled' : '') +
          '>›</button>';
        html += '</div>';
      }

      app.innerHTML = html;
      _attachExplorerEvents();
    }

    function getStateColor(state) {
      var colors = {
        BY: '#0054a8',
        NW: '#009640',
        BW: '#e2001a',
        SN: '#1d8f46',
        NI: '#003d6b',
        HE: '#003366',
        TH: '#00563f',
        RP: '#003d7a',
        SH: '#005b9f',
        BB: '#d52027',
        BE: '#000000',
        MV: '#003d7a',
        ST: '#003366',
        HB: '#d52027',
        HH: '#e2001a',
        SL: '#0054a8',
      };
      return colors[state] || '#9b59b6';
    }

    function _attachExplorerEvents() {
      // Filter dropdowns
      var selState = document.getElementById('curricula-filter-state');
      var selSchool = document.getElementById('curricula-filter-school');
      var selGrade = document.getElementById('curricula-filter-grade');
      var searchInput = document.getElementById('curricula-search');

      function getMultiSelectValues(sel) {
        if (!sel) return [];
        var vals = [];
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].selected) vals.push(sel.options[i].value);
        }
        return vals;
      }

      function onFilterChange() {
        filterState = getMultiSelectValues(selState);
        filterSchool = getMultiSelectValues(selSchool);
        filterGrade = getMultiSelectValues(selGrade);
        currentPage = 1;
        _render();
      }

      if (selState) selState.addEventListener('change', onFilterChange);
      if (selSchool) selSchool.addEventListener('change', onFilterChange);
      if (selGrade) selGrade.addEventListener('change', onFilterChange);

      // Active filter badge click to remove
      app.addEventListener('click', function (ev) {
        var badge = ev.target.closest('.curricula-active-filter');
        if (!badge) return;
        var type = badge.getAttribute('data-type');
        var val = badge.getAttribute('data-value');
        if (type === 'state') {
          filterState = filterState.filter(function (v) {
            return v !== val;
          });
          if (selState) {
            for (var si = 0; si < selState.options.length; si++) {
              if (selState.options[si].value === val) selState.options[si].selected = false;
            }
          }
        } else if (type === 'school') {
          filterSchool = filterSchool.filter(function (v) {
            return v !== val;
          });
          if (selSchool) {
            for (var sci = 0; sci < selSchool.options.length; sci++) {
              if (selSchool.options[sci].value === val) selSchool.options[sci].selected = false;
            }
          }
        } else if (type === 'grade') {
          var gradeVal = val.replace('Klasse ', '');
          filterGrade = filterGrade.filter(function (v) {
            return v !== gradeVal;
          });
          if (selGrade) {
            for (var gi = 0; gi < selGrade.options.length; gi++) {
              if (selGrade.options[gi].value === gradeVal) selGrade.options[gi].selected = false;
            }
          }
        }
        currentPage = 1;
        _render();
      });
      if (searchInput) {
        searchInput.addEventListener('input', function (ev) {
          searchQuery = ev.target.value;
          currentPage = 1;
          _render();
        });
      }

      // Tab switching
      app.querySelectorAll('.curricula-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeTab = this.getAttribute('data-tab');
          currentPage = 1;
          _render();
        });
      });

      // Pagination
      app.querySelectorAll('.curricula-page-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          var p = parseInt(btn.getAttribute('data-page'));
          if (p > 0) {
            currentPage = p;
            _render();
          }
        });
      });
    }

    // ── Compare Tab ──
    function _renderCompare() {
      var html = '';
      html += '<div class="curricula-header">';
      html += '<h1>Ländervergleich</h1>';
      html +=
        '<p class="curricula-subtitle">Vergleiche ein Thema über alle Bundesländer hinweg.</p>';
      html += '</div>';

      html += '<div class="curricula-tabs">';
      html += '<button class="curricula-tab" data-tab="explorer">Durchsuchen</button>';
      html += '<button class="curricula-tab active" data-tab="compare">Ländervergleich</button>';
      html += '</div>';

      html += '<div class="compare-search">';
      html +=
        '<input class="curricula-search" type="text" placeholder="Thema eingeben (z.B. Redoxreaktionen)..." id="compare-search" value="' +
        escapeHtml(compareTopicName) +
        '">';
      html += '<button class="compare-btn" id="compare-go">Vergleichen</button>';
      html += '</div>';

      if (compareResults) {
        var stateNames = Object.keys(compareResults);
        if (stateNames.length > 0) {
          // Compute majority values for diff highlighting
          var allEntries = [];
          var schoolVotes = {},
            gradeVotes = {},
            objVotes = {};
          stateNames.forEach(function (st) {
            (compareResults[st] || []).forEach(function (e) {
              allEntries.push(e);
              schoolVotes[e.school_type || '-'] = (schoolVotes[e.school_type || '-'] || 0) + 1;
              gradeVotes[String(e.grade || '-')] = (gradeVotes[String(e.grade || '-')] || 0) + 1;
              objVotes[e.objective_count || 0] = (objVotes[e.objective_count || 0] || 0) + 1;
            });
          });
          var majoritySchool = Object.keys(schoolVotes).reduce(function (a, b) {
            return schoolVotes[a] > schoolVotes[b] ? a : b;
          });
          var majorityGrade = Object.keys(gradeVotes).reduce(function (a, b) {
            return gradeVotes[a] > gradeVotes[b] ? a : b;
          });
          var majorityObj = Object.keys(objVotes).reduce(function (a, b) {
            return objVotes[a] > objVotes[b] ? a : b;
          });

          html += '<div class="compare-results">';
          html += '<table class="compare-table">';
          html +=
            '<thead><tr><th>Bundesland</th><th>Schulform</th><th>Klasse</th><th>Lernziele</th><th>KMK</th><th></th></tr></thead>';
          html += '<tbody>';
          stateNames.forEach(function (st) {
            var entries = compareResults[st];
            if (!entries || entries.length === 0) return;
            entries.forEach(function (entry, idx) {
              var kmkStandards = kmkTopicMap[entry.name] || [];
              var isDiffSchool = (entry.school_type || '-') !== majoritySchool;
              var isDiffGrade = String(entry.grade || '-') !== majorityGrade;
              var isDiffObj = (entry.objective_count || 0) !== parseInt(majorityObj);
              var rowId = 'compare-row-' + toSlug(st) + '-' + idx;
              html += '<tr class="compare-row" id="' + rowId + '">';
              if (idx === 0) {
                html +=
                  '<td class="compare-state-cell" rowspan="' +
                  entries.length +
                  '"><strong>' +
                  escapeHtml(st) +
                  '</strong></td>';
              }
              html +=
                '<td' +
                (isDiffSchool ? ' class="diff-cell"' : '') +
                '>' +
                escapeHtml(entry.school_type || '-') +
                '</td>';
              html +=
                '<td' +
                (isDiffGrade ? ' class="diff-cell"' : '') +
                '>' +
                escapeHtml(String(entry.grade || '-')) +
                '</td>';
              html +=
                '<td class="compare-num' +
                (isDiffObj ? ' diff-cell' : '') +
                '">' +
                (entry.objective_count || 0) +
                '</td>';
              html += '<td>' + (kmkStandards.length > 0 ? '✓' : '') + '</td>';
              html +=
                '<td><button class="compare-expand-btn" data-row="' +
                rowId +
                '" data-name="' +
                escapeHtml(entry.name) +
                '" title="Details anzeigen">+</button></td>';
              html += '</tr>';
              // Expandable detail row
              var isExpanded = expandedCompareRow === rowId;
              if (isExpanded) {
                var relEntities = entry.relatedEntities || [];
                html +=
                  '<tr class="compare-detail-row"><td colspan="6"><div class="compare-detail">';
                html += '<strong>Verknüpfte Begriffe:</strong> ';
                if (relEntities.length > 0) {
                  relEntities.forEach(function (r) {
                    var rn = typeof r === 'string' ? r : r.name;
                    html += '<span class="compare-detail-tag">' + escapeHtml(rn) + '</span> ';
                  });
                } else {
                  html += '<em>keine</em>';
                }
                html += '</div></td></tr>';
              }
            });
          });
          html += '</tbody></table>';
          html += '</div>';
        } else {
          html +=
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Keine Ergebnisse für "' +
            escapeHtml(compareTopicName) +
            '" gefunden.</p></div>';
        }
      }

      app.innerHTML = html;
      _attachCompareEvents();
    }

    function _attachCompareEvents() {
      // Tab switching
      app.querySelectorAll('.curricula-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeTab = this.getAttribute('data-tab');
          currentPage = 1;
          _render();
        });
      });

      // Expandable detail rows
      app.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.compare-expand-btn');
        if (!btn) return;
        var rowId = btn.getAttribute('data-row');
        if (expandedCompareRow === rowId) {
          expandedCompareRow = null;
        } else {
          expandedCompareRow = rowId;
        }
        _render();
      });

      var searchInput = document.getElementById('compare-search');
      var goBtn = document.getElementById('compare-go');

      function doCompare() {
        var val = searchInput ? searchInput.value.trim() : '';
        if (!val) return;
        compareTopicName = val;
        // Search locally first for instant results
        var q = val.toLowerCase();
        var results = {};
        entities.forEach(function (e) {
          if (e.category === 'didaktik') return;
          var meta = e.curriculumMeta;
          if (!meta) return;
          if (e.name.toLowerCase().indexOf(q) !== -1) {
            if (!results[meta.state]) results[meta.state] = [];
            results[meta.state].push({
              name: e.name,
              state: meta.state,
              grade: meta.grade,
              school_type: meta.school_type,
              objective_count: meta.objective_count,
            });
          }
        });
        // Also try API for fallback
        fetch('/api/curricula/compare?name=' + encodeURIComponent(val))
          .then(function (r) {
            return r.json();
          })
          .then(function (apiData) {
            if (apiData.results && Object.keys(apiData.results).length > 0) {
              compareResults = apiData.results;
            } else {
              compareResults = results;
            }
            _render();
          })
          .catch(function () {
            compareResults = results;
            _render();
          });
      }

      if (goBtn) goBtn.addEventListener('click', doCompare);
      if (searchInput) {
        searchInput.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') doCompare();
        });
      }
    }

    _render();
  }
})();
