/**
 * curricula-index.js — Graph visualization of the Lehrplan + Modulhandbuch
 * knowledge graph (replaces the old tabbed list/compare UI).
 *
 * Renders nodes fetched from GET /api/curricula/graph with cytoscape:
 *   universities, modules, curricula, topics, subtopics, learning
 *   objectives, entities, content pages.
 *
 * Controls: scope switcher (Alle / Universitäten / Lehrpläne), state
 * and university selects, search highlight, node-click detail panel.
 */
(function () {
  'use strict';

  var app = document.getElementById('curricula-app');
  if (!app) return;
  var skeleton = document.getElementById('curricula-skeleton');

  var CYTOSCAPE_SRC = '/js/vendor/cytoscape.min.js';

  var NODE_COLORS = {
    university: '#9C27B0',
    module: '#2196F3',
    curriculum: '#4CAF50',
    topic: '#8BC34A',
    subtopic: '#FF9800',
    objective: '#F44336',
    entity: '#E91E63',
    page: '#795548',
  };

  var NODE_LABELS = {
    university: 'Universität',
    module: 'Modul',
    curriculum: 'Lehrplan',
    topic: 'Thema',
    subtopic: 'Teilthema',
    objective: 'Lernziel',
    entity: 'Konzept',
    page: 'Inhalt',
  };

  var state = {
    scope: 'curriculum',
    university: '',
    state: '',
    curriculum: '',
    q: '',
    cy: null,
    allNodes: [],
    allEdges: [],
    focusNodeId: null,
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadCytoscape() {
    if (window.cytoscape) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = CYTOSCAPE_SRC;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function fetchGraph() {
    var qs = new URLSearchParams();
    qs.set('scope', state.scope);
    if (state.university) qs.set('university', state.university);
    if (state.state) qs.set('state', state.state);
    if (state.curriculum) qs.set('curriculum', state.curriculum);
    qs.set('limit', '800');
    if (state.q) qs.set('q', state.q);
    return fetch('/api/curricula/graph?' + qs.toString(), {
      signal: AbortSignal.timeout(20000),
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function buildElements(data) {
    var elements = [];
    var seen = {};
    (data.nodes || []).forEach(function (n) {
      if (seen[n.id]) return;
      seen[n.id] = true;
      elements.push({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          meta: n.meta || {},
        },
      });
    });
    var seenE = {};
    (data.edges || []).forEach(function (e) {
      var key = e.source + '|' + e.target + '|' + e.type;
      if (seenE[key]) return;
      seenE[key] = true;
      elements.push({
        data: { id: 'e-' + key, source: e.source, target: e.target, type: e.type },
      });
    });
    return elements;
  }

  function metaRows(meta) {
    var rows = [];
    var add = function (k, v) {
      if (v != null && v !== '') rows.push([k, v]);
    };
    add('Stadt', meta.city);
    add('Land', meta.country);
    if (meta.website)
      add(
        'Web',
        '<a href="' +
          escapeHtml(meta.website) +
          '" rel="noopener">' +
          escapeHtml(meta.website) +
          '</a>'
      );
    add('Kürzel', meta.shortCode);
    add('Abschluss', meta.degree);
    add('Level', meta.level);
    if (meta.ects != null) add('ECTS', meta.ects);
    add('Sprache', meta.language);
    if (meta.url)
      add('Seite', '<a href="' + escapeHtml(meta.url) + '">' + escapeHtml(meta.url) + '</a>');
    add('Schulform', meta.schoolType);
    add('Kategorie', meta.kategorie);
    add('Bundesland', meta.state);
    add('Klasse', meta.grade);
    return rows;
  }

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

  function detailLinks(node, meta) {
    var links = [];
    var type = node.data('type');
    if (type === 'entity' || type === 'topic' || type === 'subtopic' || type === 'objective') {
      links.push('<a href="/entity/' + toSlug(node.data('label')) + '/">Konzept-Seite öffnen</a>');
    }
    if (type === 'university' && meta.shortCode) {
      links.push(
        '<a href="/modulhandbuch/?uni=' +
          encodeURIComponent(meta.shortCode) +
          '">Modulhandbuch öffnen</a>'
      );
    }
    return links;
  }

  function detailHtml(node) {
    var meta = node.data('meta') || {};
    var type = node.data('type');
    var typeLabel = NODE_LABELS[type] || type;
    var html = '<div class="curricula-detail-type">' + escapeHtml(typeLabel) + '</div>';
    html += '<h3>' + escapeHtml(node.data('label')) + '</h3>';
    metaRows(meta).forEach(function (r) {
      html +=
        '<div class="curricula-detail-row"><span class="curricula-detail-k">' +
        escapeHtml(r[0]) +
        '</span><span class="curricula-detail-v">' +
        r[1] +
        '</span></div>';
    });
    var links = detailLinks(node, meta);
    if (links.length) {
      html += '<div class="curricula-detail-links">' + links.join(' · ') + '</div>';
    }
    return html;
  }

  function renderDetail(node) {
    var panel = document.getElementById('curricula-node-details');
    var content = document.getElementById('curricula-details-content');
    if (!node) {
      if (panel) panel.style.display = 'none';
      return;
    }
    if (content) content.innerHTML = detailHtml(node);
    if (panel) panel.style.display = 'block';
  }

  function renderGraph(data) {
    var container = document.getElementById('curricula-graph');
    if (!container) return;
    container.innerHTML = '';

    state.allNodes = data.nodes || [];
    state.allEdges = data.edges || [];

    var elements = buildElements(data);
    if (!elements.length) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">🔍</div>' +
        '<p>Keine Knoten gefunden' +
        (state.q ? ' für „' + escapeHtml(state.q) + '"' : '') +
        '.</p></div>';
      return;
    }

    var degree = {};
    elements.forEach(function (el) {
      if (el.data.source) {
        degree[el.data.source] = (degree[el.data.source] || 0) + 1;
        degree[el.data.target] = (degree[el.data.target] || 0) + 1;
      }
    });

    state.cy = cytoscape({
      container: container,
      elements: elements,
      wheelSensitivity: 0.2,
      layout: state.curriculum
        ? {
            name: 'breadthfirst',
            directed: false,
            circle: false,
            roots: ['cur:' + state.curriculum],
            padding: 30,
            spacingFactor: 1.1,
            animate: false,
          }
        : { name: 'cose', animate: false, padding: 40, nodeRepulsion: 9000 },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-size': 10,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': 120,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
            'text-background-padding': 2,
            'text-background-shape': 'roundrectangle',
            'text-zoomable': false,
            color: '#333',
            width: 'mapData(degree, 0, 40, 14, 48)',
            height: 'mapData(degree, 0, 40, 14, 48)',
            'border-width': 1,
            'border-color': '#fff',
            'border-opacity': 0.8,
            'background-color': '#95a5a6',
          },
        },
        {
          selector: 'node[type = "university"]',
          style: { 'background-color': NODE_COLORS.university },
        },
        {
          selector: 'node[type = "module"]',
          style: { 'background-color': NODE_COLORS.module },
        },
        {
          selector: 'node[type = "curriculum"]',
          style: { 'background-color': NODE_COLORS.curriculum },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#2c3e50',
            'border-opacity': 1,
          },
        },
        {
          selector: 'node[type = "topic"]',
          style: { 'background-color': NODE_COLORS.topic },
        },
        {
          selector: 'node[type = "subtopic"]',
          style: { 'background-color': NODE_COLORS.subtopic },
        },
        {
          selector: 'node[type = "objective"]',
          style: {
            'background-color': NODE_COLORS.objective,
            'font-size': 8,
            'text-max-width': 90,
            width: 10,
            height: 10,
          },
        },
        {
          selector: 'node[type = "entity"]',
          style: { 'background-color': NODE_COLORS.entity },
        },
        {
          selector: 'node[type = "page"]',
          style: { 'background-color': NODE_COLORS.page, width: 10, height: 10 },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': '#ccd1d9',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#ccd1d9',
            'curve-style': 'bezier',
            opacity: 0.65,
            'arrow-scale': 0.7,
          },
        },
        {
          selector: 'edge[type = "HAS_LEARNING_OBJECTIVE"]',
          style: { 'line-style': 'dotted', opacity: 0.45 },
        },
      ],
    });

    var searchQuery = (state.q || '').toLowerCase();
    if (searchQuery) applySearchHighlight(searchQuery);
    else resetHighlight();

    state.cy.on('tap', 'node', function (evt) {
      renderDetail(evt.target);
    });
    state.cy.on('tap', function (evt) {
      if (evt.target === state.cy) renderDetail(null);
    });

    if (state.focusNodeId) {
      var fn = state.cy.getElementById(state.focusNodeId);
      if (fn && fn.length) {
        fn.select();
        if (state.curriculum) {
          state.cy.fit(undefined, 40);
        } else {
          state.cy.animate({ center: { eles: fn }, zoom: 1.25 }, { duration: 350 });
        }
        renderDetail(fn);
      }
      state.focusNodeId = null;
    }
  }

  function resetHighlight() {
    if (!state.cy) return;
    state.cy.elements().forEach(function (el) {
      el.style('opacity', 1);
    });
  }

  function applySearchHighlight(q) {
    if (!state.cy) return;
    var matches = state.cy.nodes().filter(function (n) {
      return (n.data('label') || '').toLowerCase().indexOf(q) !== -1;
    });
    if (!matches.length) {
      resetHighlight();
      return;
    }
    var matchIds = {};
    matches.forEach(function (m) {
      matchIds[m.id()] = true;
    });
    state.cy.elements().forEach(function (el) {
      var isMatch = el.isNode() ? matchIds[el.id()] : false;
      var linked = el.isEdge() && (matchIds[el.data('source')] || matchIds[el.data('target')]);
      el.style('opacity', isMatch || linked ? 1 : 0.12);
    });
  }

  // ── Controls ────────────────────────────────────────────────────────

  function loadMeta() {
    // Populate state + university selects from a cheap metadata fetch.
    return Promise.all([
      fetch('/api/curricula/states', { signal: AbortSignal.timeout(10000) }).then(function (r) {
        return r.ok ? r.json() : { states: [] };
      }),
      fetch('/api/modulhandbuch/universities', {
        signal: AbortSignal.timeout(10000),
      }).then(function (r) {
        return r.ok ? r.json() : { universities: [] };
      }),
    ]);
  }

  function populateSelects(meta) {
    var stateSel = document.getElementById('curricula-state-select');
    var uniSel = document.getElementById('curricula-uni-select');
    if (stateSel) {
      (meta[0].states || []).forEach(function (s) {
        var opt = document.createElement('option');
        opt.value = s.state;
        opt.textContent = s.stateName || s.state;
        stateSel.appendChild(opt);
      });
    }
    if (uniSel) {
      (meta[1].universities || []).forEach(function (u) {
        var opt = document.createElement('option');
        opt.value = u.shortCode;
        opt.textContent = u.name + (u.city ? ' (' + u.city + ')' : '');
        uniSel.appendChild(opt);
      });
    }
  }

  function wireControls() {
    var scopeBtns = document.querySelectorAll('.curricula-scope-btn');
    scopeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.scope = this.getAttribute('data-scope');
        state.curriculum = '';
        scopeBtns.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        reload();
      });
    });
    var stateSel = document.getElementById('curricula-state-select');
    if (stateSel) {
      stateSel.addEventListener('change', function () {
        state.state = this.value;
        state.curriculum = '';
        reload();
      });
    }
    var uniSel = document.getElementById('curricula-uni-select');
    if (uniSel) {
      uniSel.addEventListener('change', function () {
        state.university = this.value;
        reload();
      });
    }
    var search = document.getElementById('curricula-search');
    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        var val = this.value.trim();
        t = setTimeout(function () {
          state.q = val;
          if (state.cy) {
            if (val) applySearchHighlight(val.toLowerCase());
            else resetHighlight();
          }
          // Also re-fetch with q for server-side filtering when scoped.
          reload();
        }, 350);
      });
    }
    var closeBtn = document.getElementById('curricula-details-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        renderDetail(null);
      });
    }
    var fitBtn = document.getElementById('curricula-fit');
    if (fitBtn) {
      fitBtn.addEventListener('click', function () {
        if (state.cy) state.cy.fit(undefined, 40);
      });
    }
  }

  function showLoading() {
    var el = document.getElementById('curricula-graph');
    if (el) {
      el.innerHTML =
        '<div class="curricula-loading" role="status">Graphen-Daten werden geladen…</div>';
    }
  }

  function reload() {
    showLoading();
    fetchGraph()
      .then(renderGraph)
      .catch(function (err) {
        var el = document.getElementById('curricula-graph');
        if (el) {
          el.innerHTML =
            '<div class="empty-state"><div class="empty-state-icon">📡</div>' +
            '<p>Graphen-Daten konnten nicht geladen werden' +
            (err && err.message ? ' (' + escapeHtml(err.message) + ')' : '') +
            '.</p></div>';
        }
      });
  }

  // ── Init ────────────────────────────────────────────────────────────

  var initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    // Move the toolbar template (rendered inside the advanced tab) into the
    // app container so controls live with the graph.
    var tpl = document.getElementById('curricula-toolbar-template');
    if (tpl && app) {
      while (tpl.firstChild) {
        app.appendChild(tpl.firstChild);
      }
      tpl.remove();
    }
    wireControls();
    if (skeleton) skeleton.style.display = 'none';
    loadMeta()
      .then(function (meta) {
        populateSelects(meta);
      })
      .catch(function () {
        /* meta is optional */
      });
    loadCytoscape()
      .then(reload)
      .catch(function () {
        var el = document.getElementById('curricula-graph');
        if (el) {
          el.innerHTML =
            '<div class="empty-state"><div class="empty-state-icon">⚠️</div>' +
            '<p>Graph-Bibliothek konnte nicht geladen werden.</p></div>';
        }
      });
  }

  // Exposed for the tab controller in curricula-overview.js, which lazily
  // initialises the graph only when the "Erweitert" tab becomes visible
  // (rendering cytoscape into a hidden container yields a 0-sized canvas).
  window.curriculaGraphInit = init;
  window.curriculaGraphResize = function () {
    if (state.cy) {
      state.cy.resize();
      state.cy.fit(undefined, 40);
    }
  };
})();
