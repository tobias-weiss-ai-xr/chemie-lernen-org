/**
 * entity-graph-cytoscape.js — Wissensnetz-Visualisierung mit Cytoscape.js.
 *
 * Ersetzt die d3-Force-Layout-Darstellung auf /entity/ (Übersichtsseite).
 * Gründe: Bei 200+ Knoten skaliert d3 das gesamte SVG herunter (Knoten
 * und Labels werden <4px klein → "alles auf einem Punkt"). Cytoscape
 * hält Labels in konstanter Bildschirmgröße (text-zoomable: false) und
 * bietet für Wissensnetze optimierte Layouts (concentric/cose).
 *
 * Öffentliche API (kompatibel zu D3EgoGraph auf /entity/):
 *   EntityGraph.createFullGraph(container, data, options) -> Promise
 *   EntityGraph.setCategoryFilter(cat|null)
 *   EntityGraph.setSearchFilter(query|null)
 *
 * Node-Format (aus entity-index.js erwartet):
 *   { id, label, type: 'entity'|'article'|'page', category, size,
 *     count, curriculumCount, description, related: [{label, slug}] }
 */

(function () {
  'use strict';

  var CAT_COLORS = {
    stoff: '#667eea',
    konzept: '#45b7d1',
    reaktion: '#4ecdc4',
    methode: '#f093fb',
    person: '#ff9a76',
    quelle: '#a8a8a8',
    page: '#95a5a6',
    article: '#bdc3c7',
    other: '#95a5a6',
  };

  var cy = null;
  var currentFilter = null;
  var currentSearch = null;

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9äöüß-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function buildElements(data) {
    var elements = [];
    var emap = {};
    var entities = data.entities || [];
    var articles = data.articles || [];

    // Artikel-Zähler pro Entity
    var artCounts = {};
    articles.forEach(function (a) {
      (a.entities || []).forEach(function (en) {
        artCounts[en] = (artCounts[en] || 0) + 1;
      });
    });

    entities.forEach(function (e) {
      var conns = (e.relatedEntities || []).length;
      var id = e.id || 'e-' + slugify(e.name);
      var node = {
        data: {
          id: id,
          label: e.name,
          type: 'entity',
          category: e.category || 'other',
          size: Math.max(
            10,
            Math.min(
              42,
              10 + conns * 0.6 + (artCounts[e.name] || 0) * 0.8 + (e.curriculumCount || 0) * 1.2
            )
          ),
          count: artCounts[e.name] || 0,
          curriculumCount: e.curriculumCount || 0,
          description: e.description || '',
          related: (e.relatedEntities || [])
            .filter(function (r) {
              return r && r.name;
            })
            .map(function (r) {
              return { label: r.name, slug: slugify(r.name) };
            }),
        },
      };
      elements.push(node);
      emap[e.name] = id;
    });

    // Entity–Entity-Kanten (dedupliziert)
    var seen = {};
    entities.forEach(function (e) {
      var srcId = emap[e.name];
      if (!srcId) return;
      (e.relatedEntities || []).forEach(function (ref) {
        if (!ref || !ref.name) return;
        var tgtId = emap[ref.name];
        if (!tgtId) return;
        var key = srcId < tgtId ? srcId + '|' + tgtId : tgtId + '|' + srcId;
        if (seen[key]) return;
        seen[key] = true;
        elements.push({ data: { id: 'l-' + key, source: srcId, target: tgtId, type: 'rel' } });
      });
    });

    // Artikel/Dokument-Knoten + Kanten zu Entities
    articles.forEach(function (a, idx) {
      var isPage = a.type === 'page';
      var id = a.id || 'a-' + idx + '-' + slugify(a.title || 'untitled');
      elements.push({
        data: {
          id: id,
          label: a.title,
          type: isPage ? 'page' : 'article',
          category: isPage ? 'page' : 'article',
          size: 6,
          count: 0,
          description: '',
          related: [],
          url: a.url,
        },
      });
      (a.entities || []).forEach(function (en) {
        var eid = emap[en];
        if (eid) {
          elements.push({
            data: { id: 'la-' + id + '-' + eid, source: eid, target: id, type: 'doc' },
          });
        }
      });
    });

    return elements;
  }

  function createFullGraph(container, data, options) {
    options = options || {};
    return new Promise(function (resolve) {
      if (typeof cytoscape === 'undefined') {
        container.innerHTML =
          '<p style="padding:1em;text-align:center;color:var(--text-muted,#888);">Graph-Bibliothek nicht geladen.</p>';
        resolve();
        return;
      }
      container.innerHTML = '';
      var elements = buildElements(data);
      var entities = (data.entities || []).length;
      var maxNodes = options.maxNodes || 0;

      // Nur die am stärksten vernetzten Entities für die Übersicht
      if (maxNodes > 0 && entities > maxNodes) {
        var topIds = {};
        (data.entities || [])
          .slice()
          .sort(function (a, b) {
            return (b.relatedEntities || []).length - (a.relatedEntities || []).length;
          })
          .slice(0, maxNodes)
          .forEach(function (e) {
            topIds[e.id || 'e-' + slugify(e.name)] = true;
          });
        elements = elements.filter(function (el) {
          if (el.data.type === 'entity') return topIds[el.data.id];
          if (el.data.source) {
            var s = topIds[el.data.source];
            var t = topIds[el.data.target];
            if (el.data.type === 'rel') return s && t;
            return s || t;
          }
          return true;
        });
      }

      // Cytoscape misst den Container automatisch (muss sichtbar sein).

      cy = cytoscape({
        container: container,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              'font-size': 11,
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': 140,
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.85,
              'text-background-padding': 3,
              'text-background-shape': 'roundrectangle',
              color: '#333',
              'text-zoomable': false,
              'background-color': function (ele) {
                return CAT_COLORS[ele.data('category')] || CAT_COLORS.other;
              },
              width: 'mapData(size, 6, 42, 14, 60)',
              height: 'mapData(size, 6, 42, 14, 60)',
              'border-width': 1,
              'border-color': '#ffffff',
              'border-opacity': 0.8,
            },
          },
          {
            selector: 'node[type = "article"], node[type = "page"]',
            style: {
              width: 8,
              height: 8,
              label: '',
              'background-color': '#bdc3c7',
              'text-zoomable': false,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': '#ccd1d9',
              'target-arrow-shape': 'none',
              'curve-style': 'bezier',
              opacity: 0.7,
            },
          },
          {
            selector: 'edge[type = "doc"]',
            style: {
              'line-color': '#d5dbe3',
              'line-style': 'dotted',
              width: 0.8,
              opacity: 0.5,
            },
          },
        ],
        layout: {
          name: 'concentric',
          concentric: function (node) {
            return node.connectedEdges().length;
          },
          levelWidth: function () {
            return 3;
          },
          minNodeSpacing: 24,
          padding: 40,
          animate: false,
          fit: true,
        },
        minZoom: 0.2,
        maxZoom: 3,
        wheelSensitivity: 0.25,
      });

      // Click → Details-Panel
      cy.on('tap', 'node', function (evt) {
        var n = evt.target;
        var d = n.data();
        if (typeof window.__showNodeDetails === 'function') {
          window.__showNodeDetails({
            label: d.label,
            category: d.category,
            count: d.count,
            description: d.description,
            related: d.related || [],
          });
        }
      });

      // Tap auf Hintergrund → Details schließen
      cy.on('tap', function (evt) {
        if (evt.target === cy) {
          var panel = document.getElementById('entity-node-details');
          if (panel) panel.style.display = 'none';
        }
      });

      applyFilters();

      resolve();
    });
  }

  function applyFilters() {
    if (!cy) return;
    cy.batch(function () {
      cy.elements().forEach(function (el) {
        var d = el.data();
        if (el.isEdge()) {
          var s = el.source().data('category');
          var t = el.target().data('category');
          var sType = el.source().data('type');
          var tType = el.target().data('type');
          var showSource = sType === 'entity' ? categoryVisible(s) : true;
          var showTarget = tType === 'entity' ? categoryVisible(t) : true;
          var ok = showSource && showTarget;
          if (currentSearch) {
            ok = ok && (matchesSearch(d, el.source()) || matchesSearch(d, el.target()));
          }
          el.style('display', ok ? 'element' : 'none');
        } else {
          var visible = el.data('type') !== 'entity' || categoryVisible(d.category);
          if (currentSearch && el.data('type') === 'entity') {
            visible = visible && matchesNodeSearch(el);
          }
          el.style('display', visible ? 'element' : 'none');
        }
      });
      if (cy.layout) {
        // Re-layout auf sichtbare Knoten, damit gefilterte Ansicht kompakt bleibt
        var visibleNodes = cy.nodes(':visible');
        if (visibleNodes.length > 0) {
          var layout = cy.layout({
            name: 'concentric',
            concentric: function (node) {
              return node.connectedEdges().length;
            },
            levelWidth: function () {
              return 3;
            },
            minNodeSpacing: 24,
            padding: 40,
            animate: false,
            fit: true,
          });
          layout.run();
        }
      }
    });
  }

  function categoryVisible(cat) {
    if (!currentFilter) return true;
    return cat === currentFilter;
  }

  function matchesNodeSearch(el) {
    var q = currentSearch || '';
    var d = el.data();
    return (
      (d.label || '').toLowerCase().indexOf(q) !== -1 ||
      (d.description || '').toLowerCase().indexOf(q) !== -1 ||
      (d.related || []).some(function (r) {
        return (r.label || '').toLowerCase().indexOf(q) !== -1;
      })
    );
  }

  function matchesSearch(edgeData, node) {
    return matchesNodeSearch(node);
  }

  function setCategoryFilter(cat) {
    currentFilter = cat || null;
    applyFilters();
  }

  function setSearchFilter(query) {
    currentSearch = query ? String(query).toLowerCase().trim() : null;
    applyFilters();
  }

  window.EntityGraph = {
    createFullGraph: createFullGraph,
    setCategoryFilter: setCategoryFilter,
    setSearchFilter: setSearchFilter,
  };

  // Rückwärtskompatibilität: entity-index.js ruft D3EgoGraph.* auf.
  // Wir bieten dieselben Funktionen unter EntityGraph UND D3EgoGraph an,
  // damit das Laden von d3-ego-graph.js auf /entity/ entfallen kann.
  if (!window.D3EgoGraph) {
    window.D3EgoGraph = window.EntityGraph;
  }
})();
