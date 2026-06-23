(function () {
  window.__entityIndexLoaded = true;
  var app = document.getElementById('entity-app');
  var skeleton = document.getElementById('entity-skeleton');

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
  fetch('/api/kg-data', { signal: AbortSignal.timeout(15000) })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (d) {
      _data = d;
      skeleton.style.display = 'none';
      window.__initStarted = true;
      try {
        init(d);
        window.__initDone = true;
      } catch (e) {
        console.error('[entity-index] init() failed:', e);
        window.__initError = e.message || String(e);
        app.innerHTML =
          '<div class="empty-state" id="init-error"><div class="empty-state-icon">⚠️</div><p style="color:red;">init() FEHLER: <strong>' +
          escapeHtml(e.message || String(e)) +
          '</strong></p><p id="debug-info"></p></div>';
      }
    })
    .catch(function (err) {
      skeleton.style.display = 'none';
      app.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">📡</div><p>Wissensnetz konnte nicht geladen werden.</p><p><a href="/wissennetz/" style="color:#667eea;">Graph-Ansicht öffnen →</a></p></div>';
    });

  function init(data) {
    var entities = data.entities || [];
    var articles = data.articles || [];
    var curricula = data.curricula || [];

    var catLabels = {
      stoff: 'Stoff',
      konzept: 'Konzept',
      reaktion: 'Reaktion',
      methode: 'Methode',
      person: 'Person',
      quelle: 'Quelle',
      lehrplan: 'Lehrplan',
      explorer: 'Entdecken',
    };
    var catColors = {
      stoff: '#667eea',
      konzept: '#45b7d1',
      reaktion: '#4ecdc4',
      methode: '#f093fb',
      person: '#ff9a76',
      quelle: '#a8a8a8',
      lehrplan: '#9b59b6',
      explorer: '#e67e22',
    };

    var catCounts = {};
    entities.forEach(function (e) {
      var c = e.category || 'other';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    var activeFilter = 'all';
    var searchQuery = '';
    var currentPage = 1;
    var perPage = 24;
    var viewMode = 'grid';
    var sortMode = 'relations';

    function getSortValue(e, mode) {
      switch (mode) {
        case 'name':
          return e.name.toLowerCase();
        case 'relations':
          return -(e.relatedEntities || []).length;
        case 'articles':
          return -((e.articleCount && e.articleCount.low) || 0);
        case 'category':
          return e.category || '';
        default:
          return -(e.relatedEntities || []).length;
      }
    }

    function filteredAndSorted() {
      var f = entities.filter(function (e) {
        if (activeFilter !== 'all' && e.category !== activeFilter) return false;
        if (searchQuery) {
          var q = searchQuery.toLowerCase();
          return (
            e.name.toLowerCase().indexOf(q) !== -1 ||
            (e.relatedEntities || []).some(function (r) {
              return r.name.toLowerCase().indexOf(q) !== -1;
            })
          );
        }
        return true;
      });
      f.sort(function (a, b) {
        var va = getSortValue(a, sortMode);
        var vb = getSortValue(b, sortMode);
        if (typeof va === 'string') return va.localeCompare(vb);
        return va - vb;
      });
      return f;
    }

    function getTooltipHtml(e) {
      var h = '<strong>' + escapeHtml(e.name) + '</strong>';
      h +=
        '<br><span style="font-size:0.72rem;color:#9b59b6;">' +
        (catLabels[e.category] || e.category) +
        '</span>';

      if (e.category === 'lehrplan' && e.curriculumMeta) {
        var cm = e.curriculumMeta;
        h +=
          '<br><span style="font-size:0.78rem;">' +
          escapeHtml(cm.state_name || cm.state || '') +
          ', ' +
          escapeHtml(cm.school_type || '') +
          ' · Klasse ' +
          escapeHtml(cm.grade || '') +
          '</span>';
        h +=
          '<br><span style="font-size:0.78rem;">' + (cm.objective_count || 0) + ' Lernziele</span>';
      } else {
        var art = (e.articles || []).slice(0, 5);
        var total = (e.articleCount && e.articleCount.low) || e.articles.length;
        h +=
          '<br><span style="font-size:0.78rem;">' +
          (e.relatedEntities || []).length +
          ' verwandte Begriffe · ' +
          total +
          ' Artikel</span>';
        if (art.length > 0) {
          h +=
            '<hr style="margin:0.4rem 0;border:none;border-top:1px solid var(--border-color,#eee);">';
          h += '<div style="font-size:0.72rem;">';
          art.forEach(function (a) {
            h +=
              '<div style="padding:0.1rem 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">• ' +
              escapeHtml(a) +
              '</div>';
          });
          if (art.length < total)
            h += '<div style="color:#667eea;">+' + (total - art.length) + ' weitere</div>';
          h += '</div>';
        }
      }
      return h;
    }

    function _render() {
      window.__renderStarted = true;
      try {
        _renderImpl();
        window.__renderDone = true;
      } catch (e) {
        window.__renderError = e.message || String(e);
        console.error('[_render] ERROR:', e);
        app.innerHTML =
          '<div class="empty-state" id="render-error"><div class="empty-state-icon">⚠️</div><p style="color:red;">_render() FEHLER: <strong>' +
          escapeHtml(e.message || String(e)) +
          '</strong></p></div>';
      }
    }
    function _renderImpl() {
      var filtered = filteredAndSorted();
      var totalPages = Math.ceil(filtered.length / perPage);
      if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
      var start = (currentPage - 1) * perPage;
      var pageItems = filtered.slice(start, start + perPage);

      var toolbar = '<div class="entity-toolbar">';
      toolbar += '<div class="entity-toolbar-left">';
      toolbar +=
        '<input class="entity-search" type="text" placeholder="Begriff suchen..." id="entity-search" value="' +
        escapeHtml(searchQuery) +
        '">';
      toolbar += '</div>';
      toolbar += '<select class="entity-sort-select" id="entity-sort">';
      var sortOptions = [
        { v: 'relations', l: 'Nach Relevanz' },
        { v: 'name', l: 'A–Z' },
        { v: 'articles', l: 'Nach Artikelzahl' },
        { v: 'category', l: 'Nach Kategorie' },
      ];
      sortOptions.forEach(function (o) {
        toolbar +=
          '<option value="' +
          o.v +
          '"' +
          (sortMode === o.v ? ' selected' : '') +
          '>' +
          o.l +
          '</option>';
      });
      toolbar += '</select>';
      toolbar += '<div class="entity-view-controls">';
      toolbar +=
        '<button class="entity-view-btn' +
        (viewMode === 'grid' ? ' active' : '') +
        '" data-view="grid" title="Kachelansicht">▦</button>';
      toolbar +=
        '<button class="entity-view-btn' +
        (viewMode === 'cloud' ? ' active' : '') +
        '" data-view="cloud" title="Schlagwortwolke">☁</button>';
      toolbar += '</div>';
      toolbar += '</div>';

      var filters = '<div class="entity-filters">';
      filters +=
        '<button class="entity-filter-btn' +
        (activeFilter === 'all' ? ' active' : '') +
        '" data-cat="all">Alle <span class="entity-filter-count">' +
        entities.length +
        '</span></button>';
      Object.keys(catLabels).forEach(function (cat) {
        if (cat === 'explorer') {
          filters +=
            '<button class="entity-filter-btn' +
            (activeFilter === 'explorer' ? ' active' : '') +
            '" data-cat="explorer"' +
            ' style="' +
            (activeFilter === 'explorer'
              ? 'background:#e67e22;border-color:#e67e22;color:#fff'
              : '') +
            '">🔍 Entdecken</button>';
        } else if (catCounts[cat]) {
          filters +=
            '<button class="entity-filter-btn' +
            (activeFilter === cat ? ' active' : '') +
            '" data-cat="' +
            cat +
            '" style="' +
            (activeFilter === cat
              ? 'background:' + catColors[cat] + ';border-color:' + catColors[cat] + ';color:#fff'
              : '') +
            '">' +
            catLabels[cat] +
            ' <span class="entity-filter-count">' +
            catCounts[cat] +
            '</span></button>';
        }
      });
      filters += '</div>';

      var html = '<div class="entity-header">';
      html += '<h1>Wissensnetz</h1>';
      html += '<div class="entity-stats">';
      html += '<span><strong>' + entities.length + '</strong> Begriffe</span>';
      html += '<span><strong>' + articles.length + '</strong> Dokumente</span>';
      html += '<span>' + filtered.length + ' angezeigt</span>';
      html +=
        '<span><a href="/wissennetz/" class="entity-graph-top-link">Interaktiver Graph →</a></span>';
      html += '</div></div>';

      html += toolbar;
      html += filters;

      if (activeFilter === 'explorer') {
        html += _renderExplorer(curricula);
        html += '</div>';
        app.innerHTML = html;
        _attachExplorerEvents();
        _attachCommonEvents(totalPages);
        return;
      }

      if (viewMode === 'cloud') {
        html += '<div class="entity-tagcloud">';
        filtered.forEach(function (e) {
          var artCount = (e.articleCount && e.articleCount.low) || e.articles.length || 1;
          var size = Math.max(0.8, Math.min(2.5, 0.8 + artCount * 0.15));
          var slug = toSlug(e.name);
          html +=
            '<a href="/entity/' +
            slug +
            '/" class="entity-tagcloud-item" style="font-size:' +
            size +
            'rem;background:' +
            (catColors[e.category] || '#667eea') +
            '">' +
            escapeHtml(e.name) +
            '</a>';
        });
        html += '</div>';
      } else {
        html += '<div class="entity-grid">';
        if (pageItems.length === 0) {
          html +=
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Keine Begriffe gefunden.</p></div>';
        } else {
          pageItems.forEach(function (e) {
            var cat = e.category || 'other';
            var relatedCount = (e.relatedEntities || []).length;
            var _compCount = (e.components || []).length;
            var artCount = (e.articleCount && e.articleCount.low) || e.articles.length || 0;
            var slug = toSlug(e.name);
            var isCurriculum = cat === 'lehrplan';
            html +=
              '<div class="entity-card' +
              (isCurriculum ? ' entity-card-curriculum' : '') +
              '" data-cat="' +
              cat +
              '" data-slug="' +
              slug +
              '" data-tooltip="' +
              escapeHtml(getTooltipHtml(e)) +
              '">';
            html +=
              '<div class="entity-card-name"><a href="/entity/' +
              slug +
              '/">' +
              escapeHtml(e.name) +
              '</a></div>';
            html +=
              '<span class="entity-card-cat">' + escapeHtml(catLabels[cat] || cat) + '</span>';

            if (isCurriculum && e.curriculumMeta) {
              var cm = e.curriculumMeta;
              html +=
                '<div class="entity-card-curriculum-meta">' +
                escapeHtml(cm.state_name || cm.state || '') +
                ', ' +
                escapeHtml(cm.school_type || '') +
                ' · Klasse ' +
                escapeHtml(cm.grade || '') +
                '</div>';
              html +=
                '<div class="entity-card-meta">' + (cm.objective_count || 0) + ' Lernziele</div>';
            } else {
              html +=
                '<div class="entity-card-meta">' +
                relatedCount +
                ' verwandte Begriffe · ' +
                artCount +
                ' Artikel</div>';
            }

            if (e.components && e.components.length > 0) {
              html +=
                '<div class="entity-card-components"><strong>Besteht aus:</strong> ' +
                e.components.slice(0, 5).map(escapeHtml).join(', ') +
                (e.components.length > 5 ? ' +' + (e.components.length - 5) : '') +
                '</div>';
            }
            if (e.relatedEntities && e.relatedEntities.length > 0 && !isCurriculum) {
              html += '<div class="entity-card-related">';
              e.relatedEntities.slice(0, 6).forEach(function (r) {
                html += '<span class="entity-related-tag">' + escapeHtml(r.name) + '</span>';
              });
              if (e.relatedEntities.length > 6)
                html +=
                  '<span class="entity-related-tag">+' + (e.relatedEntities.length - 6) + '</span>';
              html += '</div>';
            }
            html += '</div>';
          });
        }
        html += '</div>';
      }

      if (totalPages > 1) {
        html += '<div class="entity-pagination">';
        html +=
          '<button class="entity-page-btn" data-page="' +
          (currentPage - 1) +
          '"' +
          (currentPage <= 1 ? ' disabled' : '') +
          '>‹</button>';
        var startPage = Math.max(1, currentPage - 3);
        var endPage = Math.min(totalPages, currentPage + 3);
        for (var p = startPage; p <= endPage; p++) {
          html +=
            '<button class="entity-page-btn' +
            (p === currentPage ? ' active' : '') +
            '" data-page="' +
            p +
            '">' +
            p +
            '</button>';
        }
        html +=
          '<button class="entity-page-btn" data-page="' +
          (currentPage + 1) +
          '"' +
          (currentPage >= totalPages ? ' disabled' : '') +
          '>›</button>';
        html += '</div>';
      }

      app.innerHTML = html;
      _attachCommonEvents(totalPages);

      var tooltipEl = null;
      app.addEventListener('mouseover', function (ev) {
        var card = ev.target.closest('.entity-card');
        if (!card) return;
        var tip = card.getAttribute('data-tooltip');
        if (!tip) return;
        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.className = 'entity-tooltip';
          document.body.appendChild(tooltipEl);
        }
        tooltipEl.innerHTML = tip;
        tooltipEl.style.display = 'block';
      });

      app.addEventListener('mousemove', function (ev) {
        if (!tooltipEl) return;
        var x = ev.clientX + 12;
        var y = ev.clientY + 12;
        var tw = tooltipEl.offsetWidth;
        var th = tooltipEl.offsetHeight;
        if (x + tw > window.innerWidth - 10) x = ev.clientX - tw - 12;
        if (y + th > window.innerHeight - 10) y = ev.clientY - th - 12;
        tooltipEl.style.left = x + 'px';
        tooltipEl.style.top = y + 'px';
      });

      app.addEventListener('mouseout', function (ev) {
        var card = ev.target.closest('.entity-card');
        if (!card) return;
        if (tooltipEl) tooltipEl.style.display = 'none';
      });
    }

    // ── Explorer view ────────────────────────────────────────────

    // Build a set of topic names referenced by didaktik entities
    var _kmkTopicMap = {};
    entities.forEach(function (e) {
      if (e.category === 'didaktik' && e.relatedEntities) {
        e.relatedEntities.forEach(function (r) {
          var rn = typeof r === 'string' ? r : r.name;
          _kmkTopicMap[rn.toLowerCase()] = true;
        });
      }
    });

    function _renderExplorer(curricula) {
      var html = '<div class="entity-explorer">';

      var stMap = {};
      var scMap = {};
      var grMap = {};
      curricula.forEach(function (c) {
        var cm = c.curriculumMeta || {};
        if (cm.state) stMap[cm.state] = (stMap[cm.state] || 0) + 1;
        if (cm.school_type) scMap[cm.school_type] = (scMap[cm.school_type] || 0) + 1;
        if (cm.grade) {
          var g = cm.grade;
          grMap[g] = (grMap[g] || 0) + 1;
        }
      });
      var states = Object.keys(stMap).sort();
      var schoolTypes = Object.keys(scMap).sort();
      var grades = Object.keys(grMap).sort(function (a, b) {
        // Sort by numeric first grade
        var na = parseInt(a);
        var nb = parseInt(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });

      html += '<div class="explorer-controls">';
      html +=
        '<input type="text" id="explorer-search" placeholder="Lehrplan-Topic suchen..." class="explorer-search-input">';
      html +=
        '<div id="explorer-autocomplete" class="explorer-autocomplete" style="display:none;"></div>';
      html += '<label>Bundesland: <select id="explorer-state"><option value="">Alle</option>';
      states.forEach(function (s) {
        html += '<option value="' + s + '">' + s + ' (' + stMap[s] + ')</option>';
      });
      html += '</select></label>';
      html += '<label>Schulform: <select id="explorer-school"><option value="">Alle</option>';
      schoolTypes.forEach(function (st) {
        html +=
          '<option value="' +
          escapeHtml(st) +
          '">' +
          escapeHtml(st) +
          ' (' +
          scMap[st] +
          ')</option>';
      });
      html += '</select></label>';
      html += '<label>Klasse: <select id="explorer-grade"><option value="">Alle</option>';
      grades.forEach(function (g) {
        html +=
          '<option value="' +
          escapeHtml(g) +
          '">Klasse ' +
          escapeHtml(g) +
          ' (' +
          grMap[g] +
          ')</option>';
      });
      html += '</select></label>';
      html += '<button id="explorer-compare-btn" class="explorer-compare-btn">Vergleichen</button>';
      html += '</div>';

      html += '<div class="entity-grid" id="explorer-results">';
      curricula.forEach(function (c) {
        var cm = c.curriculumMeta || {};
        var cat = c.category || 'lehrplan';
        var slug = toSlug(c.name);
        var hasKmk = _kmkTopicMap[c.name.toLowerCase()] ? true : false;
        html +=
          '<div class="entity-card entity-card-curriculum' +
          (hasKmk ? ' entity-card-has-kmk' : '') +
          '" data-cat="' +
          cat +
          '" data-state="' +
          (cm.state || '') +
          '" data-school="' +
          escapeHtml(cm.school_type || '') +
          '" data-grade="' +
          escapeHtml(cm.grade || '') +
          '" data-topic="' +
          escapeHtml(c.name.toLowerCase()) +
          '">';
        html +=
          '<div class="entity-card-name"><a href="/entity/' +
          slug +
          '/">' +
          escapeHtml(c.name) +
          '</a></div>';
        html += '<div class="entity-card-cat">' + escapeHtml(catLabels[cat] || cat) + '</div>';
        if (hasKmk) {
          html += '<span class="kmk-badge" title="Erfüllt KMK-Bildungsstandard">KMK ✓</span>';
        }
        html +=
          '<div class="entity-card-curriculum-meta">' +
          (cm.state ? cm.state + ', ' : '') +
          escapeHtml(cm.school_type || '') +
          ' · Klasse ' +
          escapeHtml(cm.grade || '') +
          '</div>';
        html += '<div class="entity-card-meta">' + (cm.objective_count || 0) + ' Lernziele</div>';
        html += '</div>';
      });
      html += '</div></div>';

      // Comparison section (hidden by default)
      html +=
        '<div id="explorer-compare-section" class="explorer-compare-section" style="display:none;">';
      html += '<h3>Ländervergleich</h3>';
      html +=
        '<input type="text" id="explorer-compare-search" placeholder="Topic zum Vergleichen eingeben..." class="explorer-search-input">';
      html += '<div id="explorer-compare-results"></div>';
      html += '</div>';

      return html;
    }

    function _attachExplorerEvents() {
      var stateSel = document.getElementById('explorer-state');
      var schoolSel = document.getElementById('explorer-school');
      var gradeSel = document.getElementById('explorer-grade');
      var searchInput = document.getElementById('explorer-search');
      var autocomplete = document.getElementById('explorer-autocomplete');
      var compareBtn = document.getElementById('explorer-compare-btn');
      var compareSection = document.getElementById('explorer-compare-section');
      var compareSearch = document.getElementById('explorer-compare-search');
      var compareResults = document.getElementById('explorer-compare-results');

      if (!stateSel || !schoolSel) return;

      // Get unique topic names from fallback curricula
      var topicNames = [];
      try {
        var cd = window.__curriculaData || curricula;
        cd.forEach(function (c) {
          if (topicNames.indexOf(c.name) === -1) topicNames.push(c.name);
        });
      } catch (e) {}
      topicNames.sort();

      function filterExplorer() {
        var sv = stateSel.value;
        var scv = schoolSel.value;
        var gv = gradeSel ? gradeSel.value : '';
        var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        var cards = document.querySelectorAll('#explorer-results .entity-card');
        var visible = 0;
        cards.forEach(function (card) {
          var cs = card.getAttribute('data-state') || '';
          var csc = card.getAttribute('data-school') || '';
          var cg = card.getAttribute('data-grade') || '';
          var ct = card.getAttribute('data-topic') || '';
          var match = (!sv || cs === sv) && (!scv || csc === scv) && (!gv || cg === gv);
          if (match && q) match = ct.indexOf(q) !== -1;
          card.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        var noRes = document.getElementById('explorer-no-results');
        if (visible === 0) {
          if (!noRes) {
            noRes = document.createElement('div');
            noRes.id = 'explorer-no-results';
            noRes.className = 'empty-state';
            noRes.innerHTML = '<div class="empty-state-icon">🔍</div><p>Keine Themen gefunden.</p>';
            document.getElementById('explorer-results').after(noRes);
          }
          noRes.style.display = '';
        } else if (noRes) {
          noRes.style.display = 'none';
        }
      }

      // Search autocomplete
      if (searchInput && autocomplete) {
        searchInput.addEventListener('input', function () {
          var val = searchInput.value.toLowerCase().trim();
          if (val.length < 1) {
            autocomplete.style.display = 'none';
            filterExplorer();
            return;
          }
          var matches = topicNames
            .filter(function (n) {
              return n.toLowerCase().indexOf(val) !== -1;
            })
            .slice(0, 10);
          if (matches.length > 0) {
            autocomplete.innerHTML = '';
            matches.forEach(function (m) {
              var item = document.createElement('div');
              item.className = 'explorer-autocomplete-item';
              item.textContent = m;
              item.addEventListener('mousedown', function (ev) {
                ev.preventDefault();
                searchInput.value = m;
                autocomplete.style.display = 'none';
                filterExplorer();
              });
              autocomplete.appendChild(item);
            });
            autocomplete.style.display = 'block';
          } else {
            autocomplete.style.display = 'none';
          }
          filterExplorer();
        });
        document.addEventListener('click', function (ev) {
          if (ev.target !== searchInput) autocomplete.style.display = 'none';
        });
      }

      // Compare mode toggle
      if (compareBtn && compareSection) {
        compareBtn.addEventListener('click', function () {
          var visible = compareSection.style.display !== 'none';
          compareSection.style.display = visible ? 'none' : 'block';
          compareBtn.textContent = visible ? 'Vergleichen' : '× Schließen';
          compareBtn.classList.toggle('active', !visible);
        });
      }

      // Compare search
      if (compareSearch && compareResults) {
        var compareTimeout;
        compareSearch.addEventListener('input', function () {
          clearTimeout(compareTimeout);
          compareTimeout = setTimeout(function () {
            var q = compareSearch.value.trim();
            if (q.length < 2) {
              compareResults.innerHTML =
                '<div style="color:#888;padding:1rem;">Bitte mindestens 2 Zeichen eingeben.</div>';
              return;
            }
            fetch('/api/curricula/compare?name=' + encodeURIComponent(q))
              .then(function (r) {
                return r.json();
              })
              .then(function (d) {
                if (!d.count) {
                  compareResults.innerHTML =
                    '<div style="color:#888;padding:1rem;">Keine passenden Topics gefunden.</div>';
                  return;
                }
                var h = '<table class="explorer-compare-table"><thead><tr><th>Thema</th>';
                var stateKeys = Object.keys(d.results);
                stateKeys.forEach(function (sk) {
                  h += '<th>' + escapeHtml(sk) + '</th>';
                });
                h += '</tr></thead><tbody>';
                // Group by topic name
                var topicGroup = {};
                stateKeys.forEach(function (sk) {
                  d.results[sk].forEach(function (item) {
                    if (!topicGroup[item.name]) topicGroup[item.name] = [];
                    topicGroup[item.name].push(item);
                  });
                });
                Object.keys(topicGroup)
                  .sort()
                  .forEach(function (tn) {
                    h += '<tr><td><strong>' + escapeHtml(tn) + '</strong></td>';
                    stateKeys.forEach(function (sk) {
                      var match = null;
                      topicGroup[tn].forEach(function (item) {
                        if (item.state === sk) match = item;
                      });
                      if (match) {
                        h += '<td class="compare-cell-ok">';
                        h += escapeHtml(match.grade || '') + '<br>';
                        h +=
                          '<span class="compare-cell-detail">' +
                          escapeHtml(match.school_type || '') +
                          '</span><br>';
                        h +=
                          '<span class="compare-cell-detail">' +
                          (match.objective_count || 0) +
                          ' LZ</span>';
                        h += '</td>';
                      } else {
                        h += '<td class="compare-cell-none">—</td>';
                      }
                    });
                    h += '</tr>';
                  });
                h += '</tbody></table>';
                h +=
                  '<div style="margin-top:0.5rem;font-size:0.82rem;color:#888;">' +
                  d.count +
                  ' Treffer in ' +
                  stateKeys.length +
                  ' Bundesländern</div>';
                compareResults.innerHTML = h;
              })
              .catch(function () {
                compareResults.innerHTML =
                  '<div style="color:#c00;padding:1rem;">Fehler beim Laden der Vergleichsdaten.</div>';
              });
          }, 300);
        });
      }

      stateSel.addEventListener('change', filterExplorer);
      schoolSel.addEventListener('change', filterExplorer);
      if (gradeSel) gradeSel.addEventListener('change', filterExplorer);
    }

    function _attachCommonEvents(tp) {
      var es = document.getElementById('entity-search');
      if (es) {
        es.addEventListener('input', function (ev) {
          searchQuery = ev.target.value;
          currentPage = 1;
          _render();
        });
      }
      var esSort = document.getElementById('entity-sort');
      if (esSort) {
        esSort.addEventListener('change', function (ev) {
          sortMode = ev.target.value;
          currentPage = 1;
          _render();
        });
      }
      app.querySelectorAll('.entity-view-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          viewMode = this.getAttribute('data-view');
          currentPage = 1;
          _render();
        });
      });
      app.querySelectorAll('.entity-filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeFilter = this.getAttribute('data-cat');
          currentPage = 1;
          _render();
        });
      });
      app.querySelectorAll('.entity-page-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          var p = parseInt(btn.getAttribute('data-page'));
          if (p > 0 && p <= tp) {
            currentPage = p;
            _render();
          }
        });
      });
    }

    _render();
  }
})();
