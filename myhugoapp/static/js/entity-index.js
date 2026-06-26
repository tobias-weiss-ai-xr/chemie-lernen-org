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
    .catch(function (_err) {
      skeleton.style.display = 'none';
      app.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">📡</div><p>Wissensnetz konnte nicht geladen werden.</p><p><a href="/wissennetz/" style="color:#667eea;">Graph-Ansicht öffnen →</a></p></div>';
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
    function _buildToolbarHtml() {
      var h = '<div class="entity-toolbar">';
      h += '<div class="entity-toolbar-left">';
      h +=
        '<input class="entity-search" type="text" placeholder="Begriff suchen..." id="entity-search" value="' +
        escapeHtml(searchQuery) +
        '">';
      h += '</div>';
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
        var artCount = (e.articleCount && e.articleCount.low) || e.articles.length || 1;
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
      var artCount = (e.articleCount && e.articleCount.low) || e.articles.length || 0;
      var slug = toSlug(e.name);
      var h =
        '<div class="entity-card' +
        '" data-cat="' +
        cat +
        '" data-slug="' +
        slug +
        '" data-tooltip="' +
        escapeHtml(getTooltipHtml(e)) +
        '">';
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
      html += '<span>' + filtered.length + ' angezeigt</span>';
      html +=
        '<span><a href="/wissennetz/" class="entity-graph-top-link">Interaktiver Graph →</a></span>';
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
})();
