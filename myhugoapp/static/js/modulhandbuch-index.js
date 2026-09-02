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

  var app = document.getElementById('mh-app');
  if (!app) return;

  var universities = [];
  var selectedUni = null;
  var moduleFilterQ = ''; // UXF-013: Client-Filter für Modul-Listen
  var moduleFilterTimer = null;

  // UXF-018: URL-State für Universität + Modul (?uni=X&modul=CODE)
  var pendingModule = null; // Modul-Deep-Link, wartet auf den Uni-Load
  function updateMhUrl() {
    try {
      var params = new URLSearchParams();
      if (selectedUni) params.set('uni', selectedUni);
      if (moduleDetail && moduleDetail.module && moduleDetail.module.code) {
        params.set('modul', moduleDetail.module.code);
      }
      var qs = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
    } catch (e) {
      /* noop */
    }
  }
  var modulesCache = {};
  var moduleDetail = null;
  var searchQ = '';
  var searchResults = null;
  var loading = true;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function load() {
    fetch('/api/modulhandbuch/universities', { signal: AbortSignal.timeout(10000) })
      .then(function (r) {
        if (!r.ok) {
          throw new Error(r.status);
        }
        return r.json();
      })
      .then(function (d) {
        universities = (d.universities || []).sort(function (a, b) {
          return a.name < b.name ? -1 : 1;
        });
        loading = false;
        render();
      })
      .catch(function () {
        loading = false;
        render();
      });
  }

  function loadUni(code) {
    selectedUni = code;
    moduleFilterQ = ''; // UXF-013: Filter pro Universität neu
    moduleDetail = null;
    if (code && !modulesCache[code]) {
      fetch('/api/modulhandbuch/university/' + encodeURIComponent(code), {
        signal: AbortSignal.timeout(10000),
      })
        .then(function (r) {
          if (!r.ok) {
            throw new Error(r.status);
          }
          return r.json();
        })
        .then(function (d) {
          modulesCache[code] = d;
          render();
          updateMhUrl(); // UXF-018
          // UXF-018: wartenden Modul-Deep-Link auflösen
          if (pendingModule) {
            var pm = pendingModule;
            pendingModule = null;
            loadModule(code, pm);
          }
        })
        .catch(function () {
          render();
        });
    } else {
      render();
    }
  }

  function loadModule(univCode, moduleCode) {
    fetch(
      '/api/modulhandbuch/module/' +
        encodeURIComponent(univCode) +
        '/' +
        encodeURIComponent(moduleCode.replace(/\//g, '%2F')),
      { signal: AbortSignal.timeout(10000) }
    )
      .then(function (r) {
        if (!r.ok) {
          throw new Error(r.status);
        }
        return r.json();
      })
      .then(function (d) {
        moduleDetail = d;
        render();
        updateMhUrl(); // UXF-018
      })
      .catch(function () {
        moduleDetail = null;
        render();
      });
  }

  function doSearch() {
    var q = searchQ.trim();
    if (!q) {
      searchResults = null;
      render();
      return;
    }
    fetch('/api/modulhandbuch/search?q=' + encodeURIComponent(q) + '&limit=30', {
      signal: AbortSignal.timeout(10000),
    })
      .then(function (r) {
        if (!r.ok) {
          throw new Error(r.status);
        }
        return r.json();
      })
      .then(function (d) {
        searchResults = d;
        render();
      })
      .catch(function () {
        searchResults = { modules: [], total: 0 };
        render();
      });
  }

  // ── View switcher ──
  function showUniList() {
    selectedUni = null;
    moduleDetail = null;
    searchResults = null;
    render();
  }
  function showModules(code) {
    selectedUni = code;
    moduleDetail = null;
    updateMhUrl(); // UXF-018
    loadUni(code);
  }

  function render() {
    var html = '';

    // Header with nav
    html +=
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">';
    if (moduleDetail) {
      html +=
        '<h2 style="margin:0;font-size:1.3rem;">' + escapeHtml(moduleDetail.module.name) + '</h2>';
      if (selectedUni) {
        html +=
          '<a href="#" class="mh-back" data-action="back-modules" style="font-size:0.85rem;">← Zurück zu Modulen</a>';
      }
    } else if (selectedUni) {
      var uniName = selectedUni;
      universities.forEach(function (u) {
        if (u.shortCode === selectedUni) uniName = u.name;
      });
      html += '<h2 style="margin:0;font-size:1.3rem;">' + escapeHtml(uniName) + '</h2>';
      html +=
        '<a href="#" class="mh-back" data-action="back-list" style="font-size:0.85rem;">← Alle Universitäten</a>';
    } else {
      html += '<h2 style="margin:0;font-size:1.3rem;">Universitäten</h2>';
      html +=
        '<input class="mh-search" type="text" id="mh-search-input" placeholder="Module durchsuchen..." value="' +
        escapeHtml(searchQ) +
        '">';
    }
    html += '</div>';

    if (!moduleDetail && !selectedUni && !searchResults) {
      // University list
      if (loading) {
        html += '<div class="curricula-loading"><em>Lade Universitäten…</em></div>';
        app.innerHTML = html;
        attachEvents();
        return;
      }
      if (universities.length === 0) {
        renderErrorState(
          app,
          'Keine Universitäten gefunden. Bitte prüfe deine Internetverbindung.',
          function () {
            loading = true;
            render();
            load();
          }
        );
        return;
      }
      universities.forEach(function (u) {
        var flag =
          u.country === 'DE' ? '🇩🇪' : u.country === 'US' ? '🇺🇸' : u.country === 'CH' ? '🇨🇭' : '🌍';
        html +=
          '<div class="mh-card" data-action="show-uni" data-code="' +
          escapeHtml(u.shortCode) +
          '">';
        html += '<h3>' + flag + ' ' + escapeHtml(u.name) + '</h3>';
        var metaParts = [];
        if (u.city) metaParts.push(escapeHtml(u.city));
        if (u.country) metaParts.push(escapeHtml(u.country));
        if (u.moduleCount) {
          metaParts.push(u.moduleCount + (u.moduleCount === 1 ? ' Modul' : ' Module'));
        }
        html += '<div class="mh-meta">' + metaParts.join(' · ') + '</div>';
        html += '</div>';
      });
    } else if (searchResults) {
      // Search results
      if (searchResults.modules && searchResults.modules.length > 0) {
        html +=
          '<p style="color:var(--text-muted,#888);font-size:0.88rem;"><strong>' +
          searchResults.total +
          '</strong> Module gefunden für "' +
          escapeHtml(searchQ) +
          '"</p>';
        searchResults.modules.forEach(function (m) {
          html +=
            '<div class="mh-card" data-action="show-uni" data-code="' +
            escapeHtml(m.university) +
            '">';
          html +=
            '<h3><span class="code">' +
            escapeHtml(m.code) +
            '</span> ' +
            escapeHtml(m.name) +
            '</h3>';
          html +=
            '<div class="mh-meta">' +
            escapeHtml(m.university) +
            ' · ' +
            (m.ects || '?') +
            ' ECTS · ' +
            (m.level || '?') +
            '</div>';
          html += '</div>';
        });
      } else {
        html +=
          '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Keine Module gefunden für "' +
          escapeHtml(searchQ) +
          '".</p></div>';
      }
    } else if (moduleDetail) {
      // Module detail view
      var m = moduleDetail.module;
      html += '<div class="mh-detail">';
      html += '<dt>Code</dt><dd><code>' + escapeHtml(m.code) + '</code></dd>';
      html += '<dt>ECTS</dt><dd>' + (m.ects || '-') + '</dd>';
      html += '<dt>Level</dt><dd>' + escapeHtml(m.level || '-') + '</dd>';
      html += '<dt>Sprache</dt><dd>' + escapeHtml(m.language || '-') + '</dd>';
      html += '<dt>Arbeitsaufwand</dt><dd>' + (m.workloadHours || '-') + ' h</dd>';
      if (m.semesterOffered) {
        html += '<dt>Semester</dt><dd>' + escapeHtml(m.semesterOffered.join(', ')) + '</dd>';
      }
      if (m.url) {
        html +=
          '<dt>URL</dt><dd><a href="' +
          escapeHtml(m.url) +
          '" target="_blank" rel="noopener">' +
          escapeHtml(m.url) +
          '</a></dd>';
      }
      html += '</div>';

      if (m.learningOutcomes && m.learningOutcomes.length > 0) {
        html += '<h4 style="margin:1rem 0 0.5rem;">Lernergebnisse</h4><ul>';
        m.learningOutcomes.forEach(function (lo) {
          html += '<li style="font-size:0.85rem;">' + escapeHtml(lo) + '</li>';
        });
        html += '</ul>';
      }
      if (m.content && m.content.length > 0) {
        html += '<h4 style="margin:1rem 0 0.5rem;">Inhalte</h4><ul>';
        m.content.forEach(function (c) {
          html += '<li style="font-size:0.85rem;">' + escapeHtml(c) + '</li>';
        });
        html += '</ul>';
      }

      var detail = moduleDetail;
      if (detail.ects && detail.ects.credits) {
        html += '<h4 style="margin:1rem 0 0.5rem;">ECTS</h4>';
        html +=
          '<p style="font-size:0.85rem;">' +
          detail.ects.credits +
          ' Credits (' +
          (detail.ects.workloadHours || '?') +
          ' h)</p>';
      }
      if (detail.offerings && detail.offerings.length > 0) {
        html += '<h4 style="margin:1rem 0 0.5rem;">Angebote</h4>';
        detail.offerings.forEach(function (o) {
          html +=
            '<div class="mh-module">' +
            (o.semester || '?') +
            ' ' +
            (o.year || '') +
            (o.lecturer ? ' — ' + escapeHtml(o.lecturer) : '') +
            '</div>';
        });
      }
    } else {
      // Module list for a university
      var data = modulesCache[selectedUni];
      if (data && data.modules && data.modules.length > 0) {
        // UXF-013: Client-Filter + ECTS-Summen
        var q = moduleFilterQ.toLowerCase();
        var matchesFilter = function (m) {
          if (!q) return true;
          return (
            String(m.code || '')
              .toLowerCase()
              .indexOf(q) !== -1 ||
            String(m.name || '')
              .toLowerCase()
              .indexOf(q) !== -1
          );
        };
        var shown = data.modules.filter(matchesFilter);
        var sumEcts = function (list) {
          var s = 0;
          list.forEach(function (m) {
            s += Number(m.ects) || 0;
          });
          return s;
        };
        html +=
          '<div class="mh-module-filter">' +
          '<input type="search" id="mh-module-filter-input" class="mh-search" ' +
          'placeholder="Module filtern — Code oder Name …" aria-label="Module nach Code oder Name filtern" ' +
          'autocomplete="off" value="' +
          escapeHtml(moduleFilterQ) +
          '" />' +
          '<span class="mh-module-stats" role="status">' +
          shown.length +
          ' von ' +
          data.modules.length +
          ' Modulen · Σ ' +
          sumEcts(shown) +
          ' / ' +
          sumEcts(data.modules) +
          ' ECTS</span>' +
          '</div>';
        var byDegree = {};
        shown.forEach(function (m) {
          var deg = m.degree || 'Allgemein';
          if (!byDegree[deg]) byDegree[deg] = [];
          byDegree[deg].push(m);
        });
        Object.keys(byDegree)
          .sort()
          .forEach(function (deg) {
            html +=
              '<h4 style="font-size:0.95rem;margin:1rem 0 0.3rem;color:var(--text-muted,#888);">' +
              escapeHtml(deg) +
              '</h4>';
            byDegree[deg].forEach(function (m) {
              html +=
                '<div class="mh-card" data-action="show-module" data-univ="' +
                escapeHtml(data.university.shortCode) +
                '" data-code="' +
                escapeHtml(m.code) +
                '">';
              html +=
                '<h3><span class="code">' +
                escapeHtml(m.code) +
                '</span> ' +
                escapeHtml(m.name) +
                '</h3>';
              html +=
                '<div class="mh-meta">' +
                (m.ects || '?') +
                ' ECTS · ' +
                (m.level || '?') +
                '</div>';
              html += '</div>';
            });
          });
      } else {
        html +=
          '<div class="empty-state"><div class="empty-state-icon">📚</div><p>Keine Module geladen.</p></div>';
      }
    }

    app.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    // Card clicks
    app.addEventListener('click', function (ev) {
      var card = ev.target.closest('[data-action]');
      if (!card) return;
      var action = card.getAttribute('data-action');
      if (action === 'show-uni') {
        showModules(card.getAttribute('data-code'));
        ev.preventDefault();
      } else if (action === 'show-module') {
        loadModule(card.getAttribute('data-univ'), card.getAttribute('data-code'));
        ev.preventDefault();
      }
    });

    // Back links
    app.querySelectorAll('.mh-back').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        var a = this.getAttribute('data-action');
        if (a === 'back-list') showUniList();
        else if (a === 'back-modules') {
          moduleDetail = null;
          render();
        }
      });
    });

    // UXF-013: Modul-Filter (debounced Re-Render)
    var moduleFilterInput = document.getElementById('mh-module-filter-input');
    if (moduleFilterInput) {
      moduleFilterInput.addEventListener('input', function () {
        clearTimeout(moduleFilterTimer);
        var val = this.value;
        moduleFilterTimer = setTimeout(function () {
          moduleFilterQ = val.trim();
          render();
        }, 150);
      });
      moduleFilterInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          this.value = '';
          moduleFilterQ = '';
          render();
        }
      });
    }

    // Search
    var searchInput = document.getElementById('mh-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQ = this.value;
        if (searchQ.length >= 2) doSearch();
        else {
          searchResults = null;
          if (!searchQ) render();
        }
      });
    }
  }

  // Deep-link support: /modulhandbuch/?uni=CAM opens that university directly.
  // UXF-018: ?uni=X&modul=CODE öffnet zusätzlich das Modul-Detail.
  var deepParams = new URLSearchParams(location.search);
  var uniParam = deepParams.get('uni');
  var modulParam = deepParams.get('modul');

  function applyDeepLink() {
    if (uniParam && !selectedUni) {
      // KEIN toUpperCase mehr — API matcht case-insensitive (UXF-009),
      // und die Original-Schreibweise ist die korrekte Echo-Basis.
      if (modulParam) pendingModule = modulParam.trim();
      loadUni(uniParam.trim());
    }
  }

  load();
  applyDeepLink();
})();
