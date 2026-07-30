/* global lunr, loadD3AndEgoGraph */
(function () {
  window.__entityIndexLoaded = true;
  var app = document.getElementById('entity-app');
  var skeleton = document.getElementById('entity-skeleton');
  var graphContainer = document.getElementById('entity-graph-container');
  var graphLoading = document.getElementById('entity-graph-loading');
  var graphEl = document.getElementById('entity-graph');

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

  // Known non-chemistry entities to exclude from index
  var NON_CHEMISTRY = [
    'javascript',
    'github',
    'blockchain-technology',
    'flatpickr',
    'yelp-graph-query-language',
    'four-color-theorem',
    'euler-graph',
    'planar-graph',
    'yagni',
    'haiku',
    'sonnet',
    'opus',
    'caveman',
    'resource-allocation-in-operating-systems',
    'web-search-engine-crawlers',
    'computer-network-security',
    'dijkstras-algorithm',
    'vertex-cover',
    'acyclic-graph',
    'add-remove-edge',
    'add-remove-vertex',
    'adjacency-list',
    'adjacency-matrix',
  ];

  function isChemistryEntity(e) {
    var slug = toSlug(e.name || '');
    return NON_CHEMISTRY.indexOf(slug) === -1;
  }

  function isPremiumEntity(e) {
    var name = (e.name || '').toLowerCase();
    if (name.indexOf('molekül') >= 0 || name.indexOf('molekuel') >= 0) return true;
    if (name.indexOf('periodensystem') >= 0 || name.indexOf('periode') >= 0) return true;
    if (name.indexOf('titration') >= 0) return true;
    if (e.relatedEntities) {
      for (var i = 0; i < e.relatedEntities.length; i++) {
        var r = (e.relatedEntities[i].name || '').toLowerCase();
        if (r.indexOf('molekül') >= 0 || r.indexOf('molekuel') >= 0) return true;
        if (r.indexOf('periodensystem') >= 0 || r.indexOf('periode') >= 0) return true;
        if (r.indexOf('titration') >= 0) return true;
      }
    }
    return false;
  }

  var _data;
  var _searchIndex = null;
  var _lunrIndex = null;

  function loadSearchIndex() {
    return fetch('/search/entity-index.json', { signal: AbortSignal.timeout(5000) })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (data) {
        if (data && data.index && data.entities) {
          _searchIndex = data.entities;
          _lunrIndex = lunr.Index.load(data.index);
          console.log('[entity-index] Search index loaded:', data.entityCount, 'entities');
        }
        return data;
      })
      .catch(function (err) {
        console.warn('[entity-index] Search index not available:', err.message);
        return null;
      });
  }

  function fetchKgData() {
    return fetch('/api/kg-data?limit=500', { signal: AbortSignal.timeout(15000) }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  fetchKgData()
    .then(function (d) {
      _data = d;
      skeleton.style.display = 'none';
      window.__initStarted = true;

      var entityCount = (d.entities || []).length;
      var articleCount = (d.articles || []).length;

      if (entityCount === 0 && articleCount === 0) {
        app.innerHTML =
          '<div class="empty-state"><div class="empty-state-icon">🗄️</div>' +
          '<h2>Wissensnetz wird geladen</h2>' +
          '<p>Die Wissensdatenbank wird gerade aktualisiert. Bitte versuche es in wenigen Minuten erneut.</p>' +
          '<p><button onclick="location.reload()" style="background:#667eea;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-size:0.9rem;margin-top:8px;">🔄 Neu laden</button></p>' +
          '<p><a href="/entity/" style="color:#667eea;">Wissensnetz durchsuchen →</a></p></div>';
        return;
      }

      try {
        init(d);
        window.__initDone = true;
        renderGraph(d);
      } catch (e) {
        console.error('[entity-index] init() failed:', e);
        window.__initError = e.message || String(e);
        app.innerHTML =
          '<div class="empty-state" id="init-error"><div class="empty-state-icon">⚠️</div><p style="color:red;">init() FEHLER: <strong>' +
          escapeHtml(e.message || String(e)) +
          '</strong></p><p id="debug-info"></p></div>';
      }

      // Load search index in background (non-blocking for graph rendering)
      loadSearchIndex();
    })
    .catch(function (_err) {
      skeleton.style.display = 'none';
      if (graphContainer) graphContainer.style.display = 'none';
      app.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">📡</div><p>Wissensnetz konnte nicht geladen werden.</p>' +
        '<p><button onclick="location.reload()" style="background:#667eea;color:#fff;border:none;border-radius:6px;padding:8px 20px;cursor:pointer;font-size:0.9rem;margin-top:8px;">🔄 Erneut versuchen</button></p></div>';
    });

  function init(data) {
    var entities = data.entities || [];
    var articles = data.articles || [];

    var catLabels = {
      stoff: 'Stoff',
      konzept: 'Konzept',
      reaktion: 'Reaktion',
      methode: 'Methode',
      person: 'Person',
      quelle: 'Quelle',
    };
    var catColors = {
      stoff: '#667eea',
      konzept: '#45b7d1',
      reaktion: '#4ecdc4',
      methode: '#f093fb',
      person: '#ff9a76',
      quelle: '#a8a8a8',
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
    var lehrplanHighlight = false;
    var lehrplanEntities = new Set();
    var stateFilter = '';
    var stateLinkedNames = null;
    var _stateOptions = null;
    var _stateFilterLoading = false;

    function getSortValue(e, mode) {
      switch (mode) {
        case 'name':
          return e.name.toLowerCase();
        case 'relations':
          return -(e.relatedEntities || []).length;
        case 'articles':
          return -(Number(e.articleCount) || 0);
        case 'category':
          return e.category || '';
        default:
          return -(e.relatedEntities || []).length;
      }
    }

    function filteredAndSorted() {
      var f = entities;
      f = f.filter(isChemistryEntity);

      if (searchQuery && _lunrIndex && _searchIndex) {
        var lunrResults = _lunrIndex.search(searchQuery);
        var matchedIds = lunrResults.map(function (r) {
          return r.ref;
        });
        f = f.filter(function (e) {
          return matchedIds.indexOf(toSlug(e.name)) !== -1;
        });
      } else {
        f = f.filter(function (e) {
          if (activeFilter !== 'all' && e.category !== activeFilter) return false;
          if (stateFilter && stateLinkedNames) {
            if (!stateLinkedNames.has(e.name)) return false;
          }
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
      }

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
      var art = (e.articles || []).slice(0, 5);
      var total = Number(e.articleCount) || e.articles.length;
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
      return h;
    }

    function _applyLehrplanHighlight() {
      if (!lehrplanHighlight || lehrplanEntities.size === 0) {
        app.querySelectorAll('.entity-card').forEach(function (c) {
          c.classList.remove('lehrplan-linked', 'lehrplan-dimmed');
        });
        app.querySelectorAll('.entity-tagcloud-item').forEach(function (c) {
          c.classList.remove('lehrplan-linked', 'lehrplan-dimmed');
        });
        return;
      }
      app.querySelectorAll('.entity-card').forEach(function (c) {
        var slug = c.getAttribute('data-slug') || '';
        var name = (c.querySelector('.entity-card-name a') || {}).textContent || '';
        var isLinked = lehrplanEntities.has(name) || lehrplanEntities.has(slug);
        c.classList.toggle('lehrplan-linked', isLinked);
        c.classList.toggle('lehrplan-dimmed', !isLinked);
      });
      app.querySelectorAll('.entity-tagcloud-item').forEach(function (c) {
        var name = c.textContent.trim();
        var isLinked = lehrplanEntities.has(name);
        c.classList.toggle('lehrplan-linked', isLinked);
        c.classList.toggle('lehrplan-dimmed', !isLinked);
      });
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
    function _buildToolbarHtml() {
      var h = '<div class="entity-toolbar">';
      h += '<div class="entity-toolbar-left">';
      h +=
        '<input class="entity-search" type="text" placeholder="Begriff suchen..." id="entity-search" value="' +
        escapeHtml(searchQuery) +
        '">';
      h += '</div>';
      h +=
        '<select class="entity-state-select" id="entity-state-filter">' +
        '<option value="">' +
        (stateFilter ? '✅ ' + stateFilter : 'Alle Bundesländer') +
        '</option>' +
        '</select>';
      h += '<select class="entity-sort-select" id="entity-sort">';
      [
        { v: 'relations', l: 'Nach Relevanz' },
        { v: 'name', l: 'A–Z' },
        { v: 'articles', l: 'Nach Artikelzahl' },
        { v: 'category', l: 'Nach Kategorie' },
      ].forEach(function (o) {
        h +=
          '<option value="' +
          o.v +
          '"' +
          (sortMode === o.v ? ' selected' : '') +
          '>' +
          o.l +
          '</option>';
      });
      h += '</select>';
      h += '<div class="entity-view-controls">';
      h +=
        '<button class="entity-view-btn' +
        (viewMode === 'grid' ? ' active' : '') +
        '" data-view="grid" title="Kachelansicht">▦</button>';
      h +=
        '<button class="entity-view-btn' +
        (viewMode === 'cloud' ? ' active' : '') +
        '" data-view="cloud" title="Schlagwortwolke">☁</button>';
      h += '</div>';
      h +=
        '<button class="entity-lehrplan-toggle' +
        (lehrplanHighlight ? ' active' : '') +
        '" id="entity-lehrplan-toggle" title="Lehrplan-Bezug highlighten">📖</button>';
      h += '</div>';
      return h;
    }

    function _buildCatFilterBtn(cat) {
      if (!catCounts[cat]) return '';
      return (
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
        '</span></button>'
      );
    }

    function _buildFilterHtml() {
      var h = '<div class="entity-filters">';
      h +=
        '<button class="entity-filter-btn' +
        (activeFilter === 'all' ? ' active' : '') +
        '" data-cat="all">Alle <span class="entity-filter-count">' +
        entities.length +
        '</span></button>';
      Object.keys(catLabels).forEach(function (cat) {
        h += _buildCatFilterBtn(cat);
      });
      h += '</div>';
      return h;
    }

    function _buildCloudHtml(items) {
      var h = '<div class="entity-tagcloud">';
      items.forEach(function (e) {
        var artCount = Number(e.articleCount) || e.articles.length || 1;
        var size = Math.max(0.8, Math.min(2.5, 0.8 + artCount * 0.15));
        var slug = toSlug(e.name);
        h +=
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
      h += '</div>';
      return h;
    }

    function _buildEntityCardHtml(e) {
      var cat = e.category || 'other';
      var relatedCount = (e.relatedEntities || []).length;
      var artCount = Number(e.articleCount) || e.articles.length || 0;
      var slug = toSlug(e.name);
      var isPremium = isPremiumEntity(e);
      var h =
        '<div class="entity-card' +
        '" data-cat="' +
        cat +
        '" data-slug="' +
        slug +
        '" data-tooltip="' +
        escapeHtml(getTooltipHtml(e)) +
        '">';
      if (isPremium) {
        h += '<span class="premium-badge">Premium</span>';
      }
      h +=
        '<div class="entity-card-name"><a href="/entity/' +
        slug +
        '/">' +
        escapeHtml(e.name) +
        '</a></div>';
      h += '<span class="entity-card-cat">' + escapeHtml(catLabels[cat] || cat) + '</span>';
      h +=
        '<div class="entity-card-meta">' +
        relatedCount +
        ' verwandte Begriffe · ' +
        artCount +
        ' Artikel</div>';
      if (e.components && e.components.length > 0) {
        h +=
          '<div class="entity-card-components"><strong>Besteht aus:</strong> ' +
          e.components.slice(0, 5).map(escapeHtml).join(', ') +
          (e.components.length > 5 ? ' +' + (e.components.length - 5) : '') +
          '</div>';
      }
      if (e.relatedEntities && e.relatedEntities.length > 0) {
        h += '<div class="entity-card-related">';
        e.relatedEntities.slice(0, 6).forEach(function (r) {
          h += '<span class="entity-related-tag">' + escapeHtml(r.name) + '</span>';
        });
        if (e.relatedEntities.length > 6)
          h += '<span class="entity-related-tag">+' + (e.relatedEntities.length - 6) + '</span>';
        h += '</div>';
      }
      h += '</div>';
      return h;
    }

    function _buildPaginationHtml(totalPages, currentPage) {
      var html = '<div class="entity-pagination">';
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
      return html;
    }

    function _renderImpl() {
      var filtered = filteredAndSorted();
      var totalPages = Math.ceil(filtered.length / perPage);
      if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
      var start = (currentPage - 1) * perPage;
      var pageItems = filtered.slice(start, start + perPage);

      var html = '<div class="entity-header">';
      html += '<h1>Wissensnetz</h1>';
      html += '<div class="entity-stats">';
      html += '<span><strong>' + entities.length + '</strong> Begriffe</span>';
      html += '<span><strong>' + articles.length + '</strong> Dokumente</span>';
      if (_stateFilterLoading) {
        html += '<span class="entity-loading">🔄 Lade Lehrplandaten…</span>';
      } else if (stateFilter && filtered.length < entities.length) {
        html +=
          '<span><strong>' +
          filtered.length +
          '</strong> von ' +
          entities.length +
          ' Begriffen</span>';
      } else {
        html += '<span>' + filtered.length + ' angezeigt</span>';
      }
      html +=
        '<span><a href="/entity/" class="entity-graph-top-link">Wissensnetz durchsuchen →</a></span>';
      html += '</div></div>';

      html += _buildToolbarHtml();
      html += _buildFilterHtml();

      if (viewMode === 'cloud') {
        html += _buildCloudHtml(filtered);
      } else {
        html += '<div class="entity-grid">';
        if (pageItems.length === 0) {
          html +=
            '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Keine Begriffe gefunden.</p></div>';
        } else {
          pageItems.forEach(function (e) {
            html += _buildEntityCardHtml(e);
          });
        }
        html += '</div>';
      }

      if (totalPages > 1) {
        html += _buildPaginationHtml(totalPages, currentPage);
      }

      app.innerHTML = html;
      _attachCommonEvents(totalPages);
      _attachTooltipEvents(app);
      _applyLehrplanHighlight();
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
      var stateSelect = document.getElementById('entity-state-filter');
      if (stateSelect) {
        // Lazy-load state options on first focus
        stateSelect.addEventListener('focus', function loadOptions() {
          if (_stateOptions) return;
          stateSelect.removeEventListener('focus', loadOptions);
          stateSelect.options[0].text = 'Lade…';
          fetch('/api/curricula/states', { signal: AbortSignal.timeout(10000) })
            .then(function (r) {
              if (!r.ok) throw new Error(r.status);
              return r.json();
            })
            .then(function (d) {
              _stateOptions = d.states || [];
              // Rebuild options: keep placeholder, add states
              stateSelect.innerHTML = '<option value="">Alle Bundesländer</option>';
              _stateOptions.forEach(function (s) {
                var opt = document.createElement('option');
                opt.value = s.state;
                opt.textContent = s.stateName || s.state;
                if (s.state === stateFilter) opt.selected = true;
                stateSelect.appendChild(opt);
              });
            })
            .catch(function () {
              stateSelect.options[0].text = 'Alle Bundesländer';
            });
        });
        stateSelect.addEventListener('change', function (ev) {
          var val = ev.target.value;
          if (val === stateFilter) return;
          stateFilter = val;
          currentPage = 1;
          if (!stateFilter) {
            // Reset
            stateLinkedNames = null;
            _render();
            return;
          }
          // Show loading
          _stateFilterLoading = true;
          _render();
          // Fetch curriculum-linked entity names
          fetch('/api/curricula/linked-entities', { signal: AbortSignal.timeout(10000) })
            .then(function (r) {
              if (!r.ok) throw new Error(r.status);
              return r.json();
            })
            .then(function (d) {
              stateLinkedNames = new Set(d.names || []);
              _stateFilterLoading = false;
              _render();
            })
            .catch(function () {
              stateLinkedNames = null;
              _stateFilterLoading = false;
              stateFilter = '';
              stateSelect.value = '';
              _render();
            });
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
      var lpToggle = document.getElementById('entity-lehrplan-toggle');
      if (lpToggle) {
        lpToggle.addEventListener('click', function () {
          lehrplanHighlight = !lehrplanHighlight;
          lpToggle.classList.toggle('active', lehrplanHighlight);
          if (lehrplanHighlight && lehrplanEntities.size === 0) {
            lpToggle.innerHTML = '<span class="loading-dot"></span>';
            fetch('/api/curricula/linked-entities', { signal: AbortSignal.timeout(10000) })
              .then(function (r) {
                if (!r.ok) throw new Error(r.status);
                return r.json();
              })
              .then(function (d) {
                (d.names || []).forEach(function (n) {
                  lehrplanEntities.add(n);
                });
                lpToggle.textContent = '📖';
                _applyLehrplanHighlight();
              })
              .catch(function () {
                lehrplanHighlight = false;
                lpToggle.classList.remove('active');
                lpToggle.textContent = '📖';
              });
          } else if (!lehrplanHighlight) {
            _applyLehrplanHighlight();
          } else {
            _applyLehrplanHighlight();
          }
        });
      }
    }

    function _attachTooltipEvents(app) {
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

    _render();
  }

  function renderGraph(data) {
    if (!graphContainer || !graphEl) {
      console.warn('[entity-index] Graph container missing');
      if (graphContainer) graphContainer.style.display = 'none';
      return;
    }

    var entityCount = (data.entities || []).length;
    var articleCount = (data.articles || []).length;
    var linkCount = (data.links || []).length;
    var progressEl = document.getElementById('entity-graph-progress');
    if (progressEl) {
      progressEl.textContent =
        'Lade ' + entityCount + ' Begriffe und ' + articleCount + ' Artikel...';
    }

    updateStats(entityCount, articleCount, linkCount, entityCount);

    if (typeof loadD3AndEgoGraph === 'function') {
      loadD3AndEgoGraph()
        .then(function () {
          if (!globalThis.D3EgoGraph) {
            console.warn('[entity-index] D3EgoGraph not available after load');
            return;
          }
          try {
            globalThis.D3EgoGraph.createFullGraph(graphEl, data, {
              filterControls: null,
              showLegend: false,
              height: graphEl.offsetHeight || 600,
            });

            graphLoading.style.display = 'none';
            graphContainer.style.display = 'block';
            renderLegend(data);
            attachGraphFilters(data);
          } catch (e) {
            console.error('[entity-index] renderGraph failed:', e);
            if (graphLoading) {
              graphLoading.innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Graph konnte nicht visualisiert werden.</p></div>';
            }
          }
        })
        .catch(function (err) {
          console.warn('[entity-index] Failed to load D3:', err);
          if (graphLoading) {
            graphLoading.innerHTML =
              '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Graph-Bibliothek konnte nicht geladen werden.</p></div>';
          }
        });
    } else {
      console.warn('[entity-index] loadD3AndEgoGraph not available');
      if (graphLoading) graphLoading.style.display = 'none';
      if (graphContainer) graphContainer.style.display = 'block';
    }
  }

  function updateStats(entities, articles, links, visible) {
    var el = document.getElementById('stat-entities');
    if (el) el.textContent = entities;
    el = document.getElementById('stat-articles');
    if (el) el.textContent = articles;
    el = document.getElementById('stat-connections');
    if (el) el.textContent = links;
    el = document.getElementById('stat-visible');
    if (el) el.textContent = visible;
  }

  function renderLegend(data) {
    var legendEl = document.getElementById('entity-legend-items');
    if (!legendEl) return;

    var entities = data.entities || [];
    var catCounts = {};
    entities.forEach(function (e) {
      var c = e.category || 'other';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    var categories = [
      { cat: 'stoff', label: 'Stoffe', color: '#667eea' },
      { cat: 'konzept', label: 'Konzepte', color: '#45b7d1' },
      { cat: 'reaktion', label: 'Reaktionen', color: '#4ecdc4' },
      { cat: 'methode', label: 'Methoden', color: '#f093fb' },
      { cat: 'person', label: 'Personen', color: '#ff9a76' },
      { cat: 'quelle', label: 'Quellen', color: '#a8a8a8' },
    ];

    var html = '';
    categories.forEach(function (c) {
      var count = catCounts[c.cat] || 0;
      html +=
        '<div class="entity-legend-item">' +
        '<span class="entity-legend-color" style="background:' +
        c.color +
        '"></span>' +
        '<span>' +
        c.label +
        ' (' +
        count +
        ')</span>' +
        '</div>';
    });

    legendEl.innerHTML = html;
  }

  function attachGraphFilters(_data) {
    var savedFilter = localStorage.getItem('entityGraphCategoryFilter');
    var savedSearch = localStorage.getItem('entityGraphSearchFilter');

    var buttons = document.querySelectorAll('.entity-graph-control-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        var filter = btn.getAttribute('data-filter');
        localStorage.setItem('entityGraphCategoryFilter', filter);
        if (globalThis.D3EgoGraph && globalThis.D3EgoGraph.setCategoryFilter) {
          globalThis.D3EgoGraph.setCategoryFilter(filter === 'all' ? null : filter);
        }
      });
    });

    if (savedFilter && savedFilter !== 'all') {
      var activeBtn = document.querySelector(
        '.entity-graph-control-btn[data-filter="' + savedFilter + '"]'
      );
      if (activeBtn) {
        buttons.forEach(function (b) {
          b.classList.remove('active');
        });
        activeBtn.classList.add('active');
        if (globalThis.D3EgoGraph && globalThis.D3EgoGraph.setCategoryFilter) {
          globalThis.D3EgoGraph.setCategoryFilter(savedFilter);
        }
      }
    }

    var searchInput = document.getElementById('graph-search');
    if (searchInput) {
      if (savedSearch) {
        searchInput.value = savedSearch;
      }
      var searchTimeout;
      searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
          var query = searchInput.value.trim().toLowerCase();
          localStorage.setItem('entityGraphSearchFilter', query);
          if (globalThis.D3EgoGraph && globalThis.D3EgoGraph.setSearchFilter) {
            globalThis.D3EgoGraph.setSearchFilter(query || null);
          }
        }, 300);
      });
    }

    var detailsPanel = document.getElementById('entity-node-details');
    var detailsContent = document.getElementById('node-details-content');
    var closeBtn = document.getElementById('node-details-close');
    if (detailsPanel && closeBtn) {
      closeBtn.addEventListener('click', function () {
        detailsPanel.style.display = 'none';
      });
    }

    window.__showNodeDetails = function (node) {
      if (!detailsPanel || !detailsContent) return;
      var catLabels = {
        stoff: 'Stoff',
        konzept: 'Konzept',
        reaktion: 'Reaktion',
        methode: 'Methode',
        person: 'Person',
        quelle: 'Quelle',
      };
      var catColors = {
        stoff: '#667eea',
        konzept: '#45b7d1',
        reaktion: '#4ecdc4',
        methode: '#f093fb',
        person: '#ff9a76',
        quelle: '#a8a8a8',
      };
      var label = catLabels[node.category] || node.category;
      var color = catColors[node.category] || '#888';
      var html =
        '<span class="node-category-badge" style="background:' +
        color +
        ';color:#fff;">' +
        label +
        '</span>';
      html += '<h4>' + escapeHtml(node.label) + '</h4>';
      if (node.count) {
        html += '<p><strong>' + node.count + '</strong> Artikel</p>';
      }
      if (node.description) {
        html += '<p>' + escapeHtml(node.description) + '</p>';
      }
      if (node.related && node.related.length > 0) {
        html +=
          '<div class="node-connections"><h5>Verwandte Begriffe</h5><ul class="node-connection-list">';
        node.related.slice(0, 10).forEach(function (rel) {
          html +=
            '<li><a href="/entity/' +
            escapeHtml(rel.slug) +
            '/">' +
            escapeHtml(rel.label) +
            '</a></li>';
        });
        html += '</ul></div>';
      }
      detailsContent.innerHTML = html;
      detailsPanel.style.display = 'block';
    };
  }
})();
