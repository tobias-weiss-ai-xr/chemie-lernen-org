/**
 * D3EgoGraph — Shared force-directed graph renderer for the
 * chemie-lernen.org knowledge graph.
 *
 * Exposes a global `D3EgoGraph` object. No ES modules — loaded as a
 * classic <script> before D3 v7 (window.d3) is available.
 *
 * Public API:
 *   D3EgoGraph.createEgoGraph(container, data, options)
 *     — small focused graph centered on one entity
 *
 *   D3EgoGraph.createFullGraph(container, data, options)
 *     — full Wissensnetz graph with zoom/pan/filter chips
 *
 *   D3EgoGraph.colorize(category) → hex string
 *     — read the canonical color for a category (for non-graph UI)
 *
 * Both create methods:
 *   - Add role=img, aria-label, <title>, <desc> to the SVG
 *   - Add a visually-hidden <ul> fallback for screen readers
 *   - Skip d3.transition() if prefers-reduced-motion: reduce
 *   - Use a ResizeObserver to keep the graph centered
 *   - Click on an entity node navigates to /entity/{slug}/
 *   - Click on an article node opens the article URL
 *   - Dark-mode aware: SVG text/strokes use CSS custom properties
 *
 * D3 v7 is expected on `window.d3`; we lazy-load the local vendor file
 * if it isn't there yet.
 */
(function (global) {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────
  var CAT_COLORS = {
    stoff: '#667eea',
    konzept: '#45b7d1',
    reaktion: '#4ecdc4',
    methode: '#f093fb',
    person: '#ff9a76',
    quelle: '#a8a8a8',
    lehrplan: '#9b59b6',
    didaktik: '#2e7d32',
    lernziel: '#17a2b8',
  };

  var CAT_LABELS = {
    stoff: 'Stoff',
    konzept: 'Konzept',
    reaktion: 'Reaktion',
    methode: 'Methode',
    person: 'Person',
    quelle: 'Quelle',
    lehrplan: 'Lehrplan',
    didaktik: 'KMK-Standard',
    lernziel: 'Lernziel',
  };

  // Default D3 source — used if window.d3 is undefined when init runs
  var D3_SRC = '/js/vendor/d3.v7.min.js';

  // ── Utilities ────────────────────────────────────────────────────
  function colorize(cat) {
    return CAT_COLORS[cat] || '#888';
  }

  function labelize(cat) {
    return CAT_LABELS[cat] || cat;
  }

  function slugify(name) {
    return String(name)
      .toLowerCase()
      .replace(/[üÜ]/g, 'ue')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[äÄ]/g, 'ae')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function prefersReducedMotion() {
    return Boolean(
      global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  // D3 transition stub that respects reduced motion
  function safeTransition(selection) {
    if (prefersReducedMotion()) {
      // No-op: caller should set attributes directly
      return {
        duration: function () {
          return this;
        },
        attr: function () {
          return this;
        },
        style: function () {
          return this;
        },
        end: function () {
          return this;
        },
      };
    }
    return selection.transition().duration(200);
  }

  // Lazy D3 loader — resolves when window.d3 is available
  function ensureD3() {
    if (global.d3) {
      return Promise.resolve(global.d3);
    }
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = D3_SRC;
      s.onload = function () {
        if (global.d3) {
          resolve(global.d3);
        } else {
          reject(new Error('D3 loaded but window.d3 missing'));
        }
      };
      s.onerror = function () {
        reject(new Error('Failed to load D3 from ' + D3_SRC));
      };
      document.head.appendChild(s);
    });
  }

  // ── A11y: visually-hidden fallback list ─────────────────────────
  function buildFallbackList(nodes) {
    var ul = document.createElement('ul');
    ul.className = 'd3-ego-fallback sr-only';
    ul.setAttribute('aria-label', 'Alle Knoten im Wissensgraph (Textalternative)');
    nodes.forEach(function (n) {
      var li = document.createElement('li');
      if (n.isCenter) {
        li.textContent = n.label + ' (Zentraler Knoten)';
      } else if (n.isArticle) {
        li.textContent = 'Artikel: ' + n.label;
      } else {
        li.textContent = labelize(n.category) + ': ' + n.label;
      }
      ul.appendChild(li);
    });
    return ul;
  }

  // ── Node builders ────────────────────────────────────────────────
  function buildEgoNodes(data, entity) {
    var nodes = [];
    var emap = {};
    var allEntities = data.entities || [];
    var allArticles = data.articles || [];

    var centerId = 'ego-center';
    nodes.push({
      id: centerId,
      label: entity.name || entity.label,
      category: entity.category || 'konzept',
      size: 18,
      isCenter: true,
    });
    emap[entity.name] = centerId;

    var refs = entity.relatedEntities || [];
    for (var i = 0; i < refs.length; i++) {
      var ref = refs[i];
      var rName = typeof ref === 'string' ? ref : ref.name;
      if (emap[rName]) {
        continue;
      }
      var rCat = '';
      for (var j = 0; j < allEntities.length; j++) {
        if (allEntities[j].name === rName) {
          rCat = allEntities[j].category || '';
          break;
        }
      }
      var rId = 'ego-r' + i;
      nodes.push({
        id: rId,
        label: rName,
        category: rCat || 'konzept',
        size: 10,
        isCenter: false,
      });
      emap[rName] = rId;
    }

    var articleIds = entity.articles || [];
    var matched = allArticles.filter(function (a) {
      return (
        articleIds.indexOf(a.title) !== -1 || (a.entities && a.entities.indexOf(entity.name) !== -1)
      );
    });
    for (var k = 0; k < Math.min(matched.length, 8); k++) {
      nodes.push({
        id: 'ego-a' + k,
        label: matched[k].title,
        size: 5,
        isArticle: true,
        url: matched[k].url || '',
      });
    }

    return {
      nodes: nodes,
      links: nodes
        .filter(function (n) {
          return n.id !== centerId;
        })
        .map(function (n) {
          return {
            source: centerId,
            target: n.id,
            type: n.isArticle ? 'article' : 'related',
          };
        }),
    };
  }

  function buildFullNodes(data) {
    var nodes = [];
    var links = [];
    var emap = {};
    var entities = data.entities || [];
    var articles = data.articles || [];

    entities.forEach(function (e) {
      var conns = (e.relatedEntities || []).length;
      var n = {
        id: e.id || 'e-' + slugify(e.name),
        label: e.name,
        type: 'entity',
        category: e.category,
        size: Math.max(6, Math.min(25, Math.sqrt(conns + 1) * 5 + (e.articleCount || 0) * 2)),
        count: e.articleCount || 0,
        components: e.components || [],
      };
      nodes.push(n);
      emap[e.name] = n;
    });

    articles.forEach(function (a) {
      var isPage = a.type === 'page';
      var n = {
        id: a.id || 'a-' + slugify(a.title),
        label: a.title,
        type: isPage ? 'page' : 'article',
        size: isPage ? 4 : 3,
        url: a.url,
      };
      nodes.push(n);
      (a.entities || []).forEach(function (en) {
        var e = emap[en];
        if (e) {
          links.push({ source: e.id, target: n.id, type: 'entity-article' });
        }
      });
    });

    var compLinks = [];
    entities.forEach(function (e) {
      if (e.components) {
        e.components.forEach(function (comp) {
          var c = emap[comp];
          if (c) {
            compLinks.push({ source: e.id, target: c.id, type: 'composition' });
          }
        });
      }
    });
    links = links.concat(compLinks);

    return { nodes: nodes, links: links };
  }

  // ── Ego graph ────────────────────────────────────────────────────
  function createEgoGraph(container, data, options) {
    options = options || {};
    var entity = options.entity;
    if (!entity) {
      container.innerHTML =
        '<p style="padding:1em;text-align:center;color:var(--text-muted,#888);">Kein Entity übergeben.</p>';
      return Promise.resolve();
    }

    return ensureD3().then(function (d3) {
      // Clear container
      container.innerHTML = '';
      container.style.position = 'relative';

      // Build nodes
      var built = buildEgoNodes(data, entity);
      var nodes = built.nodes;
      var links = built.links;

      // Set up SVG with a11y
      var w = container.clientWidth || 280;
      var h = container.clientHeight || 280;

      var svg = d3
        .select(container)
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('role', 'img')
        .attr('aria-label', 'Wissensgraph für ' + entity.name)
        .attr('tabindex', '0');

      // SVG <title> and <desc> for screen readers
      svg.append('title').text('Wissensgraph: ' + entity.name);
      svg
        .append('desc')
        .text('Vernetzung von ' + entity.name + ' mit ' + links.length + ' verknüpften Knoten');

      var g = svg.append('g');

      var tooltip = d3
        .select(container)
        .append('div')
        .style('position', 'absolute')
        .style('display', 'none')
        .style('padding', '6px 10px')
        .style('background', 'var(--bg-card, #fff)')
        .style('border', '1px solid var(--border-color, #ddd)')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('color', 'var(--text-graph, #333)')
        .style('pointer-events', 'none')
        .style('z-index', '10')
        .style('box-shadow', '0 2px 6px rgba(0,0,0,0.15)');

      // Links
      var link = g
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', function (d) {
          return d.type === 'article' ? '#ccc' : '#ddd';
        })
        .attr('stroke-width', function (d) {
          return d.type === 'article' ? 0.5 : 1;
        })
        .attr('stroke-opacity', 0.5);

      // Nodes
      var node = g
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', function (d) {
          return d.size;
        })
        .attr('fill', function (d) {
          if (d.isArticle) return '#bbb';
          if (d.isCenter) return '#9b59b6';
          return colorize(d.category);
        })
        .attr('stroke', function (d) {
          return d.isCenter ? '#fff' : 'none';
        })
        .attr('stroke-width', function (d) {
          return d.isCenter ? 3 : 0;
        })
        .attr('tabindex', '0')
        .attr('role', 'button')
        .attr('aria-label', function (d) {
          if (d.isArticle) return 'Artikel: ' + d.label;
          if (d.isCenter) return 'Zentral: ' + d.label;
          return labelize(d.category) + ': ' + d.label;
        })
        .style('cursor', function (d) {
          return d.url || d.isCenter === false ? 'pointer' : 'default';
        })
        .on('click', function (ev, d) {
          if (d.url) {
            global.location.href = d.url;
          } else if (d.isCenter) {
            // Clicking center is a no-op
            return;
          } else {
            // Navigate to entity detail
            global.location.href = '/entity/' + slugify(d.label) + '/';
          }
        })
        .on('keydown', function (ev, d) {
          // Space/Enter activates the node
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            d3.select(this).dispatch('click');
          }
        })
        .on('mouseover', function (ev, d) {
          safeTransition(d3.select(this)).attr('r', d.size * 1.3);
          node.style('opacity', function (n) {
            if (n.id === d.id) return 1;
            for (var i = 0; i < links.length; i++) {
              var l = links[i];
              if (
                (l.source === d.id && l.target === n.id) ||
                (l.target === d.id && l.source === n.id)
              ) {
                return 1;
              }
            }
            return 0.2;
          });
          var catLabel = d.isArticle ? 'Artikel' : d.isCenter ? 'Zentral' : labelize(d.category);
          tooltip
            .style('display', 'block')
            .html(
              '<strong>' +
                esc(d.label) +
                '</strong><br>' +
                '<span style="color:' +
                (d.isCenter ? '#9b59b6' : d.isArticle ? '#bbb' : colorize(d.category)) +
                '">● </span>' +
                catLabel
            );
          var rect = container.getBoundingClientRect();
          tooltip
            .style('left', ev.clientX - rect.left + 12 + 'px')
            .style('top', ev.clientY - rect.top - 10 + 'px');
        })
        .on('mouseout', function (ev, d) {
          d3.select(this).attr('r', d.size);
          node.style('opacity', 0.85);
          tooltip.style('display', 'none');
        });

      // Labels (entity nodes only)
      g.selectAll('text')
        .data(
          nodes.filter(function (d) {
            return !d.isArticle;
          })
        )
        .enter()
        .append('text')
        .text(function (d) {
          return d.label.length > 15 ? d.label.slice(0, 14) + '…' : d.label;
        })
        .attr('font-size', function (d) {
          return d.isCenter ? '12px' : '9px';
        })
        .attr('font-weight', function (d) {
          return d.isCenter ? '700' : '400';
        })
        .attr('dx', function (d) {
          return d.size + 3;
        })
        .attr('dy', 3)
        .attr('fill', 'var(--text-graph, #555)')
        .style('pointer-events', 'all')
        .style('cursor', 'pointer')
        .on('mouseover', function (ev, d) {
          var catLabel = d.isCenter ? 'Zentral' : labelize(d.category);
          tooltip
            .style('display', 'block')
            .html(
              '<strong>' +
                esc(d.label) +
                '</strong><br>' +
                '<span style="color:' +
                (d.isCenter ? '#9b59b6' : colorize(d.category)) +
                '">● </span>' +
                catLabel
            );
          var rect = container.getBoundingClientRect();
          tooltip
            .style('left', ev.clientX - rect.left + 12 + 'px')
            .style('top', ev.clientY - rect.top - 10 + 'px');
        })
        .on('mouseout', function () {
          tooltip.style('display', 'none');
        });

      // Force simulation
      var sim = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3
            .forceLink(links)
            .id(function (d) {
              return d.id;
            })
            .distance(function (d) {
              return d.type === 'article' ? 80 : 60;
            })
        )
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(w / 2, h / 2))
        .force(
          'collision',
          d3.forceCollide().radius(function (d) {
            return d.size + 5;
          })
        )
        .alphaDecay(0.05)
        .on('tick', function () {
          link
            .attr('x1', function (d) {
              return d.source.x;
            })
            .attr('y1', function (d) {
              return d.source.y;
            })
            .attr('x2', function (d) {
              return d.target.x;
            })
            .attr('y2', function (d) {
              return d.target.y;
            });
          node
            .attr('cx', function (d) {
              return d.x;
            })
            .attr('cy', function (d) {
              return d.y;
            });
          g.selectAll('text')
            .attr('x', function (d) {
              return d.x;
            })
            .attr('y', function (d) {
              return d.y;
            });
        });

      if (prefersReducedMotion()) {
        sim.alpha(0).stop();
      }

      // A11y: visually-hidden fallback <ul>
      var fallback = buildFallbackList(nodes);
      container.appendChild(fallback);

      // ResizeObserver: re-center on container resize
      if (typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(function () {
          var nw = container.clientWidth || 280;
          var nh = container.clientHeight || 280;
          svg.attr('width', nw).attr('height', nh);
          sim.force('center', d3.forceCenter(nw / 2, nh / 2));
          sim.alpha(0.3).restart();
          if (prefersReducedMotion()) {
            sim.stop();
          }
        });
        ro.observe(container);
      }
    });
  }

  // ── Full graph (Wissensnetz) ─────────────────────────────────────
  function createFullGraph(container, data, options) {
    options = options || {};
    var filterControls = options.filterControls || null;
    var showLegend = options.showLegend !== false;

    return ensureD3().then(function (d3) {
      container.innerHTML = '';
      container.style.position = 'relative';

      var built = buildFullNodes(data);
      var nodes = built.nodes;
      var links = built.links;

      var w = container.clientWidth || 800;
      var h = options.height || 700;

      var svg = d3
        .select(container)
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('role', 'img')
        .attr(
          'aria-label',
          'Wissensnetz — vollständiger Graph mit ' +
            nodes.length +
            ' Knoten und ' +
            links.length +
            ' Kanten'
        )
        .attr('tabindex', '0');

      svg.append('title').text('Wissensnetz');
      svg
        .append('desc')
        .text(
          'Interaktiver Graph: ' +
            nodes.length +
            ' Knoten (Begriffe und Artikel), ' +
            links.length +
            ' Verbindungen. Zoom mit Mausrad, verschieben per Drag.'
        );

      // Zoom/pan
      var zoom = d3
        .zoom()
        .scaleExtent([0.1, 8])
        .on('zoom', function (ev) {
          g.attr('transform', ev.transform);
        });
      svg.call(zoom).style('cursor', 'grab');

      var g = svg.append('g');

      // Filter chip state
      var activeCategories = {
        stoff: true,
        konzept: true,
        reaktion: true,
        methode: true,
        person: true,
        quelle: true,
        lehrplan: true,
        didaktik: true,
        lernziel: true,
      };
      var showArticles = true;

      if (filterControls) {
        buildFilterChips(filterControls, function (state) {
          activeCategories = state.categories;
          showArticles = state.showArticles;
          updateVisibility();
        });
      }

      function updateVisibility() {
        node.style('display', function (d) {
          if (d.type === 'page' || d.type === 'article') {
            return showArticles ? null : 'none';
          }
          return activeCategories[d.category] !== false ? null : 'none';
        });
        link.style('display', function (d) {
          var sId = typeof d.source === 'object' ? d.source.id : d.source;
          var tId = typeof d.target === 'object' ? d.target.id : d.target;
          var src = nodes.find(function (n) {
            return n.id === sId;
          });
          var tgt = nodes.find(function (n) {
            return n.id === tId;
          });
          if (!src || !tgt) return 'none';
          if (src.type === 'page' || src.type === 'article') {
            return showArticles ? null : 'none';
          }
          if (tgt.type === 'page' || tgt.type === 'article') {
            return showArticles ? null : 'none';
          }
          if (
            activeCategories[src.category] !== false &&
            activeCategories[tgt.category] !== false
          ) {
            return null;
          }
          return 'none';
        });
      }

      // Legend
      if (showLegend) {
        var legend = svg
          .append('g')
          .attr('transform', 'translate(10,10)')
          .style('font-size', '11px')
          .style('pointer-events', 'none');
        var li = 0;
        // Build legend from all defined categories
        var legendItems = [];
        Object.keys(CAT_COLORS).forEach(function (cat) {
          legendItems.push({ label: CAT_LABELS[cat] || cat, color: CAT_COLORS[cat], cat: cat });
        });
        legendItems.forEach(function (item) {
          legend
            .append('circle')
            .attr('cx', 6)
            .attr('cy', 6 + li * 18)
            .attr('r', 5)
            .attr('fill', item.color);
          legend
            .append('text')
            .attr('x', 16)
            .attr('y', 10 + li * 18)
            .text(item.label)
            .attr('fill', 'var(--text-graph, #555)');
          li++;
        });
        legend
          .append('line')
          .attr('x1', 0)
          .attr('y1', 6 + li * 18)
          .attr('x2', 12)
          .attr('y2', 6 + li * 18)
          .attr('stroke', '#e74c3c')
          .attr('stroke-dasharray', '3,2');
        legend
          .append('text')
          .attr('x', 16)
          .attr('y', 10 + li * 18)
          .text('Besteht aus')
          .attr('fill', 'var(--text-graph, #555)');
        li++;
        legend
          .append('circle')
          .attr('cx', 6)
          .attr('cy', 6 + li * 18)
          .attr('r', 3)
          .attr('fill', '#999');
        legend
          .append('text')
          .attr('x', 16)
          .attr('y', 10 + li * 18)
          .text('Artikel')
          .attr('fill', 'var(--text-graph, #555)');
        li++;
        legend
          .append('rect')
          .attr('x', 2)
          .attr('y', 2 + li * 18)
          .attr('width', 8)
          .attr('height', 8)
          .attr('fill', '#2ecc71')
          .attr('rx', 1);
        legend
          .append('text')
          .attr('x', 16)
          .attr('y', 10 + li * 18)
          .text('Grundlage')
          .attr('fill', 'var(--text-graph, #555)');
        if (data.source) {
          li++;
          legend
            .append('text')
            .attr('x', 0)
            .attr('y', 18 + li * 18)
            .text(
              (data.source || '') +
                ' | ' +
                (data.entities ? data.entities.length : 0) +
                ' Begriffe | ' +
                (data.articles ? data.articles.length : 0) +
                ' Dokumente'
            )
            .attr('fill', 'var(--text-muted, #999)')
            .style('font-size', '10px');
        }
      }

      // Links
      var link = g
        .append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', function (d) {
          return d.type === 'composition' ? '#e74c3c' : '#ccc';
        })
        .attr('stroke-width', function (d) {
          return d.type === 'composition' ? 1.5 : 0.8;
        })
        .attr('stroke-dasharray', function (d) {
          return d.type === 'composition' ? '4,2' : null;
        })
        .attr('stroke-opacity', function (d) {
          return d.type === 'composition' ? 0.7 : 0.4;
        });

      // Nodes
      var node = g
        .append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', function (d) {
          return d.size || 4;
        })
        .attr('fill', function (d) {
          if (d.type === 'page') return '#2ecc71';
          if (d.type === 'article') return '#999';
          return colorize(d.category);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('tabindex', '0')
        .attr('role', 'button')
        .attr('aria-label', function (d) {
          if (d.type === 'entity') {
            return labelize(d.category) + ': ' + d.label + ' (' + (d.count || 0) + ' Dok.)';
          }
          if (d.type === 'page') return 'Seite: ' + d.label;
          return 'Artikel: ' + d.label;
        })
        .style('cursor', 'pointer')
        .style('opacity', 0.85);

      var tooltip = d3
        .select(container)
        .append('div')
        .style('position', 'absolute')
        .style('display', 'none')
        .style('padding', '6px 10px')
        .style('background', 'var(--bg-card, #fff)')
        .style('border', '1px solid var(--border-color, #ddd)')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('color', 'var(--text-graph, #333)')
        .style('pointer-events', 'none')
        .style('z-index', '10')
        .style('box-shadow', '0 2px 6px rgba(0,0,0,0.15)');

      node
        .on('mouseover', function (ev, d) {
          d3.select(this)
            .attr('r', (d.size || 4) * 1.3)
            .style('opacity', 1);
          var connected = {};
          links.forEach(function (l) {
            var s = typeof l.source === 'object' ? l.source.id : l.source;
            var t = typeof l.target === 'object' ? l.target.id : l.target;
            if (s === d.id) connected[t] = true;
            if (t === d.id) connected[s] = true;
          });
          node.style('opacity', function (n) {
            return connected[n.id] ? 1 : 0.2;
          });
          link.style('stroke-opacity', function (l) {
            var s = typeof l.source === 'object' ? l.source.id : l.source;
            var t = typeof l.target === 'object' ? l.target.id : l.target;
            return s === d.id || t === d.id ? 0.8 : 0.1;
          });
          var connCount = Object.keys(connected).length;
          var catLabel =
            d.type === 'entity' ? labelize(d.category) : d.type === 'page' ? 'Seite' : 'Artikel';
          tooltip
            .style('display', 'block')
            .html(
              '<strong>' +
                esc(d.label) +
                '</strong><br>' +
                '<span style="color:' +
                colorize(d.category || '') +
                '">● </span>' +
                catLabel +
                ' &middot; ' +
                connCount +
                ' Verbindung' +
                (connCount !== 1 ? 'en' : '')
            );
          var rect = container.getBoundingClientRect();
          tooltip
            .style('left', ev.clientX - rect.left + 12 + 'px')
            .style('top', ev.clientY - rect.top - 10 + 'px');
        })
        .on('mouseout', function (ev, d) {
          d3.select(this)
            .attr('r', d.size || 4)
            .style('opacity', 0.85);
          node.style('opacity', 0.85);
          link.style('stroke-opacity', function (d) {
            return d.type === 'composition' ? 0.7 : 0.4;
          });
          tooltip.style('display', 'none');
        })
        .on('click', function (ev, d) {
          if (d.type === 'entity') {
            global.location.href = '/entity/' + slugify(d.label) + '/';
          } else if (d.url) {
            global.open(d.url, '_blank');
          }
        })
        .on('keydown', function (ev, d) {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            d3.select(this).dispatch('click');
          }
        });

      // Labels (all entity nodes)
      var labels = g
        .append('g')
        .selectAll('text')
        .data(
          nodes.filter(function (d) {
            return d.type === 'entity';
          })
        )
        .enter()
        .append('text')
        .text(function (d) {
          return d.label;
        })
        .attr('font-size', function (d) {
          return d.size >= 8 ? '10px' : '8px';
        })
        .attr('dx', function (d) {
          return d.size + 3;
        })
        .attr('dy', 3)
        .attr('fill', 'var(--text-graph, #444)')
        .style('opacity', function (d) {
          return d.size >= 8 ? 1 : 0.6;
        })
        .style('pointer-events', 'none')
        .style('text-shadow', '0 0 3px var(--bg-body, #fafafa), 0 0 3px var(--bg-body, #fafafa)');

      // Force simulation
      var sim = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3
            .forceLink(links)
            .id(function (d) {
              return d.id;
            })
            .distance(function (d) {
              return d.type === 'composition' ? 60 : 100;
            })
            .strength(0.3)
        )
        .force('charge', d3.forceManyBody().strength(-150))
        .force('center', d3.forceCenter(w / 2, h / 2))
        .force(
          'collision',
          d3.forceCollide().radius(function (d) {
            return (d.size || 4) + 3;
          })
        )
        .force('x', d3.forceX(w / 2).strength(0.01))
        .force('y', d3.forceY(h / 2).strength(0.01))
        .alphaDecay(0.02)
        .on('tick', function () {
          link
            .attr('x1', function (d) {
              return isNaN(d.source.x) ? 0 : d.source.x;
            })
            .attr('y1', function (d) {
              return isNaN(d.source.y) ? 0 : d.source.y;
            })
            .attr('x2', function (d) {
              return isNaN(d.target.x) ? 0 : d.target.x;
            })
            .attr('y2', function (d) {
              return isNaN(d.target.y) ? 0 : d.target.y;
            });
          node
            .attr('cx', function (d) {
              return isNaN(d.x) ? 0 : d.x;
            })
            .attr('cy', function (d) {
              return d.y;
            });
          labels
            .attr('x', function (d) {
              return isNaN(d.x) ? 0 : d.x;
            })
            .attr('y', function (d) {
              return d.y;
            });
        });

      if (prefersReducedMotion()) {
        sim.alpha(0).stop();
      }

      // A11y: visually-hidden fallback <ul>
      var fallback = document.createElement('ul');
      fallback.className = 'd3-ego-fallback sr-only';
      fallback.setAttribute('aria-label', 'Wissensnetz Knotenliste');
      nodes.forEach(function (n) {
        var li = document.createElement('li');
        if (n.type === 'entity') {
          li.textContent =
            labelize(n.category) + ': ' + n.label + ' (' + (n.count || 0) + ' Artikel)';
        } else if (n.type === 'page') {
          li.textContent = 'Seite: ' + n.label;
        } else {
          li.textContent = 'Artikel: ' + n.label;
        }
        fallback.appendChild(li);
      });
      container.appendChild(fallback);

      // ResizeObserver
      if (typeof ResizeObserver !== 'undefined') {
        var ro2 = new ResizeObserver(function () {
          var nw = container.clientWidth || w;
          svg.attr('width', nw);
          sim.force('center', d3.forceCenter(nw / 2, h / 2));
          sim.force('x', d3.forceX(nw / 2).strength(0.01));
          sim.alpha(0.3).restart();
          if (prefersReducedMotion()) {
            sim.stop();
          }
        });
        ro2.observe(container);
      }
    });
  }

  function buildFilterChips(container, onChange) {
    var state = {
      categories: {
        stoff: true,
        konzept: true,
        reaktion: true,
        methode: true,
        person: true,
        quelle: true,
        lehrplan: true,
        didaktik: true,
        lernziel: true,
      },
      showArticles: true,
    };
    Object.keys(state.categories).forEach(function (cat) {
      var chip = document.createElement('span');
      chip.className = 'kg-filter-chip active';
      chip.dataset.cat = cat;
      chip.style.color = colorize(cat);
      chip.style.borderColor = colorize(cat);
      chip.innerHTML =
        '<span class="kg-dot" style="background:' + colorize(cat) + '"></span>' + labelize(cat);
      chip.addEventListener('click', function () {
        state.categories[cat] = !state.categories[cat];
        if (state.categories[cat]) {
          chip.classList.add('active');
          chip.style.color = colorize(cat);
          chip.style.borderColor = colorize(cat);
        } else {
          chip.classList.remove('active');
          chip.style.color = '#999';
          chip.style.borderColor = '#ddd';
        }
        onChange(state);
      });
      container.appendChild(chip);
    });
    var pageChip = document.createElement('span');
    pageChip.className = 'kg-filter-chip active';
    pageChip.style.color = '#2ecc71';
    pageChip.style.borderColor = '#2ecc71';
    pageChip.innerHTML = '<span class="kg-dot" style="background:#2ecc71"></span>Artikel';
    pageChip.addEventListener('click', function () {
      state.showArticles = !state.showArticles;
      if (state.showArticles) {
        pageChip.classList.add('active');
        pageChip.style.color = '#2ecc71';
        pageChip.style.borderColor = '#2ecc71';
      } else {
        pageChip.classList.remove('active');
        pageChip.style.color = '#999';
        pageChip.style.borderColor = '#ddd';
      }
      onChange(state);
    });
    container.appendChild(pageChip);
  }

  // ── Public API ───────────────────────────────────────────────────
  global.D3EgoGraph = {
    createEgoGraph: createEgoGraph,
    createFullGraph: createFullGraph,
    colorize: colorize,
    labelize: labelize,
    slugify: slugify,
    CAT_COLORS: CAT_COLORS,
    CAT_LABELS: CAT_LABELS,
  };
})(window);
