---
title: "Wissensnetz Graph"
description: "Interaktive Visualisierung der Wissensverbindungen zwischen Fachbegriffen und Artikeln"
date: 2026-06-11
weight: 10
---

<style>
.entity-graph-container {
  margin-top: 20px;
  margin-bottom: 40px;
}
#knowledge-graph {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.graph-controls {
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.graph-controls .form-select,
.graph-controls .form-range {
  font-size: 0.875rem;
}
.graph-controls .btn {
  font-size: 0.875rem;
  margin-left: 5px;
}
@media (max-width: 768px) {
  #knowledge-graph {
    height: 500px !important;
  }
  #knowledge-graph svg {
    height: 500px !important;
  }
  .graph-controls .col-md-4 {
    margin-bottom: 10px;
  }
}
</style>

<script src="https://cdn.jsdelivr.net/npm/neo4j-driver@5.15.0/lib/browser/neo4j-browser.min.js"></script>

<div class="entity-graph-container">
  <div class="row">
    <div class="col-md-12">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a href="/">Start</a></li>
          <li class="breadcrumb-item active" aria-current="page">Wissensnetz Graph</li>
        </ol>
      </nav>

      <h1>Wissensnetz-Graph</h1>
      <p class="lead">Interaktive Visualisierung der Verbindungen zwischen Fachbegriffen und Artikeln.</p>
      <p class="text-muted">
        Entitäten: <span style="color:#667eea;">● Stoff</span> 
        <span style="color:#f093fb;">● Methode</span> 
        <span style="color:#4ecdc4;">● Reaktion</span> 
        <span style="color:#45b7d1;">● Konzept</span> 
        |
        Artikel: <span style="color:#f093fb;">● Artikel</span>
      </p>
    </div>
  </div>

  <div class="row">
    <div class="col-md-12">
      <!-- Graph controls -->
      <div class="graph-controls" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
        <div class="row">
          <div class="col-md-4">
            <label class="form-label">Filter:</label>
            <select id="node-filter" class="form-select form-select-sm">
              <option value="all">Alle Knoten</option>
              <option value="entities">Nur Fachbegriffe</option>
              <option value="articles">Nur Artikel</option>
            </select>
          </div>
          <div class="col-md-4">
            <button id="reset-graph" class="btn btn-sm btn-outline-primary">Zurücksetzen</button>
            <button id="center-graph" class="btn btn-sm btn-outline-secondary">Zentrieren</button>
          </div>
          <div class="col-md-4">
            <div id="graph-loading" style="display: none;">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <small>Lade Wissensnetzdaten...</small>
            </div>
            <div id="graph-status" style="display: block;">
              <small class="text-muted">Daten geladen: 0 Entitäten, 0 Artikel</small>
            </div>
          </div>
        </div>
      </div>
      
      <div id="knowledge-graph" style="width:100%; height:600px; border:1px solid #ddd; border-radius:8px; background:#fafafa;">
        <div class="d-flex align-items-center justify-content-center h-100">
          <div class="text-center">
            <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5>Lade Wissensnetz...</h5>
            <p class="text-muted">Verbinde mit der Wissensdatenbank...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
// Utility function to escape HTML and prevent XSS attacks
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Load data from secure API endpoint with fallback
async function loadKnowledgeGraphData() {
  const startTime = performance.now();
  
try {
    // Show loading state
    updateStatus('connecting', 'Verbinde mit Wissensdatenbank...');
    
    // Try to load data from secure API endpoint
    const response = await fetch('/api/kg-data', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    updateStatus('loading', 'Lade Entitäten...');
    
    // Map API response to expected format
    const entities = data.entities.map(function(e, i) {
      return {
        id: e.id || 'e' + i,
        name: e.name,
        category: e.category || 'konzept',
        articles: [],
        relatedEntities: (e.relatedEntities || []).map(function(name) { return { name: name, weight: 1 }; }),
        articleCount: e.articleCount || 0
      };
    });
    
    updateStatus('loading', 'Lade Artikel...');
    const articles = data.articles.map(function(a, i) {
      return {
        id: a.id || 'a' + i,
        title: a.title,
        url: a.url,
        entities: a.entities,
        date: a.date
      };
    });

    console.log(`[kg-data] Loaded from API: ${entities.length} entities, ${articles.length} articles in ${data.loadTime || 'unknown'}s`);
    
    const endTime = performance.now();
    const loadTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`Loaded from Neo4j: ${articles.length} articles, ${entities.length} entities in ${loadTime}s`);
    updateStatus('complete', `${entities.length} Entitäten, ${articles.length} Artikel geladen`);
    
    return { articles, entities };
    
  } catch (error) {
    console.log('Neo4j connection failed, using optimized local data:', error.message);
    
    // Optimized fallback data with more entities
    const localData = {
      articles: [
        { "id": "a0", "title": "Energetische Baupläne diversifizieren Proteinfunktion", "url": "https://chemie-lernen.org/posts/2026-06-08-energetische-bauplaene-diversifizieren-proteinfunktion-bei-konservierter-faltung/", "entities": ["allosterie", "ligandenempfindlichkeit", "transportproteine"], "date": "2026-06-08T02:43:40+02:00" },
        { "id": "a1", "title": "Neuer Kristall erzeugt magnetische Skyrmionen-Strukturen", "url": "https://chemie-lernen.org/posts/2026-06-08-neuer-kristall-erzeugt-magnetische-skyrmionen-strukturen/", "entities": ["kristallstruktur", "magnetische ordnung", "datenspeicherung"], "date": "2026-06-08T02:43:06+02:00" },
        { "id": "a2", "title": "Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse", "url": "https://chemie-lernen.org/posts/2026-06-07-magnetfeld-verdreifacht-ammoniakausbeute-bei-elektrokatalyse/", "entities": ["ammoniak", "elektrokatalyse", "cobaltferrit"], "date": "2026-06-07T02:44:22+02:00" },
        { "id": "a3", "title": "Neue Kristallsaatkerne steigern Perowskit-Solarzellen auf 23 % Effizienz", "url": "https://chemie-lernen.org/posts/2026-06-08-neue-kristallsaatkerne-steigern-perowskit-solarzellen-auf-23-effizienz/", "entities": ["perowskit-solarzellen", "kristallisation", "materialwissenschaft"], "date": "2026-06-08T02:42:34+02:00" },
        { "id": "a4", "title": "50 Jahre Rätsel: Proteine verlieren Hydrathülle durch Säure", "url": "https://chemie-lernen.org/posts/2026-06-05-50-jahre-raetsel-proteine-verlieren-hydrathuelle-durch-saeure/", "entities": ["hydrathülle", "proteine", "ph-wert"], "date": "2026-06-05T02:42:39+02:00" },
        { "id": "a5", "title": "Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion", "url": "https://chemie-lernen.org/posts/2026-06-08-ki-findet-neue-katalysatoren/", "entities": ["katalysatoren", "wasserstoffproduktion", "ki"], "date": "2026-06-08T02:45:00+02:00" },
        { "id": "a6", "title": "Quantencomputer berechnen Molekülstrukturen in Rekordzeit", "url": "https://chemie-lernen.org/posts/2026-06-08-quantencomputer-molekuel/", "entities": ["quantencomputer", "molekülstrukturen", "berechnungen"], "date": "2026-06-08T02:46:00+02:00" },
        { "id": "a7", "title": "Neue Legierung macht Motoren 30% effizienter", "url": "https://chemie-lernen.org/posts/2026-06-08-neue-legierung-motoren/", "entities": ["legierung", "motoren", "effizienz"], "date": "2026-06-08T02:47:00+02:00" },
        { "id": "a8", "title": "Solarzellen aus organischem Material erreichen 18% Wirkungsgrad", "url": "https://chemie-lernen.org/posts/2026-06-08-solarzellen-organisch/", "entities": ["solarzellen", "organische materialien", "wirkungsgrad"], "date": "2026-06-08T02:48:00+02:00" },
        { "id": "a9", "title": "Wissenschaftler entdecken neue Art chemischer Bindung", "url": "https://chemie-lernen.org/posts/2026-06-08-neue-bindung/", "entities": ["chemische bindung", "molekülphysik", "neuentdeckung"], "date": "2026-06-08T02:49:00+02:00" }
      ],
      entities: [
        { "id": "e0", "name": "allosterie", "category": "konzept", "articles": ["Energetische Baupläne diversifizieren Proteinfunktion"], "relatedEntities": ["ligandenempfindlichkeit"], "articleCount": 1 },
        { "id": "e1", "name": "kristallstruktur", "category": "konzept", "articles": ["Neuer Kristall erzeugt magnetische Skyrmionen-Strukturen"], "relatedEntities": ["magnetische ordnung"], "articleCount": 1 },
        { "id": "e2", "name": "ammoniak", "category": "stoff", "articles": ["Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse"], "relatedEntities": ["elektrokatalyse"], "articleCount": 1 },
        { "id": "e3", "name": "elektrokatalyse", "category": "reaktion", "articles": ["Magnetfeld verdreifacht Ammoniakausbeute bei Elektrokatalyse"], "relatedEntities": ["ammoniak"], "articleCount": 1 },
        { "id": "e4", "name": "perowskit-solarzellen", "category": "stoff", "articles": ["Neue Kristallsaatkerne steigern Perowskit-Solarzellen auf 23 % Effizienz"], "relatedEntities": ["materialwissenschaft"], "articleCount": 1 },
        { "id": "e5", "name": "hydrathülle", "category": "konzept", "articles": ["50 Jahre Rätsel: Proteine verlieren Hydrathülle durch Säure"], "relatedEntities": ["proteine"], "articleCount": 1 },
        { "id": "e6", "name": "katalysatoren", "category": "stoff", "articles": ["Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion"], "relatedEntities": ["wasserstoffproduktion"], "articleCount": 1 },
        { "id": "e7", "name": "wasserstoffproduktion", "category": "reaktion", "articles": ["Künstliche Intelligenz findet neue Katalysatoren für Wasserstoffproduktion"], "relatedEntities": ["katalysatoren"], "articleCount": 1 },
        { "id": "e8", "name": "quantencomputer", "category": "methode", "articles": ["Quantencomputer berechnen Molekülstrukturen in Rekordzeit"], "relatedEntities": ["berechnungen"], "articleCount": 1 },
        { "id": "e9", "name": "molekülstrukturen", "category": "konzept", "articles": ["Quantencomputer berechnen Molekülstrukturen in Rekordzeit"], "relatedEntities": ["berechnungen"], "articleCount": 1 },
        { "id": "e10", "name": "legierung", "category": "stoff", "articles": ["Neue Legierung macht Motoren 30% effizienter"], "relatedEntities": ["effizienz"], "articleCount": 1 },
        { "id": "e11", "name": "motoren", "category": "methode", "articles": ["Neue Legierung macht Motoren 30% effizienter"], "relatedEntities": ["legierung"], "articleCount": 1 },
        { "id": "e12", "name": "solarzellen", "category": "stoff", "articles": ["Solarzellen aus organischem Material erreichen 18% Wirkungsgrad"], "relatedEntities": ["wirkungsgrad"], "articleCount": 1 },
        { "id": "e13", "name": "organische materialien", "category": "stoff", "articles": ["Solarzellen aus organischem Material erreichen 18% Wirkungsgrad"], "relatedEntities": ["solarzellen"], "articleCount": 1 },
        { "id": "e14", "name": "wirkungsgrad", "category": "konzept", "articles": ["Solarzellen aus organischem Material erreichen 18% Wirkungsgrad"], "relatedEntities": ["solarzellen"], "articleCount": 1 },
        { "id": "e15", "name": "chemische bindung", "category": "konzept", "articles": ["Wissenschaftler entdecken neue Art chemischer Bindung"], "relatedEntities": ["molekülphysik"], "articleCount": 1 },
        { "id": "e16", "name": "molekülphysik", "category": "konzept", "articles": ["Wissenschaftler entdecken neue Art chemischer Bindung"], "relatedEntities": ["chemische bindung"], "articleCount": 1 },
        { "id": "e17", "name": "neuentdeckung", "category": "konzept", "articles": ["Wissenschaftler entdecken neue Art chemischer Bindung"], "relatedEntities": ["chemische bindung"], "articleCount": 1 }
      ]
    };
    
    const endTime = performance.now();
    const loadTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`Using fallback local data: ${localData.articles.length} articles, ${localData.entities.length} entities in ${loadTime}s`);
    updateStatus('complete', `${localData.entities.length} Entitäten, ${localData.articles.length} Artikel geladen (Fallback)`);
    
    return localData;
  }
}

// Status update function for better user feedback
function updateStatus(stage, message) {
  const loadingEl = document.getElementById('graph-loading');
  const statusEl = document.getElementById('graph-status');
  
  if (stage === 'connecting' || stage === 'loading' || stage === 'processing') {
    loadingEl.style.display = 'block';
    statusEl.style.display = 'none';
  } else {
    loadingEl.style.display = 'none';
    statusEl.style.display = 'block';
  }
  
  if (message) {
    statusEl.innerHTML = `<small class="text-${stage === 'complete' ? 'success' : 'info'}">${message}</small>`;
  }
}
</script>

<script>
// Global variables for knowledge graph
var nodes = [];
var links = [];
var simulation;
var svg, g;
var width, height;

// Initialize knowledge graph
loadKnowledgeGraphData().then(function(data) {
  if (!data) return;
  
  width = document.getElementById('knowledge-graph').clientWidth;
  height = 600;
  
  // Performance monitoring
  var renderStartTime = performance.now();
  console.log('Starting knowledge graph rendering...');

  // Build nodes and links with optimization for large datasets
  var entityMap = new Map();
  var articleMap = new Map();
  
  // Create entity nodes first
  data.entities.forEach(function(e) {
    var size = Math.max(8, Math.min(30, (e.articleCount || 0) * 4 + 10));
    var n = { 
      id: e.id, 
      label: e.name, 
      type: 'entity', 
      category: e.category,
      size: size, 
      count: e.articleCount || 0,
      url: null,
      alpha: 1,
      alphaTarget: 1
    };
    nodes.push(n);
    entityMap.set(e.name, n);
  });

  // Create article nodes and links efficiently
  data.articles.forEach(function(a) {
    var n = { 
      id: a.id, 
      label: a.title, 
      type: 'article', 
      size: 5, 
      url: a.url,
      alpha: 1,
      alphaTarget: 1
    };
    nodes.push(n);
    articleMap.set(a.id, n);
    
    // Link articles to entities they mention (optimized)
    a.entities.forEach(function(entityName) {
      var entity = entityMap.get(entityName);
      if (entity) {
        links.push({ 
          source: entity.id, 
          target: n.id, 
          type: 'entity-article',
          weight: 1
        });
      }
    });
  });

  console.log(`Created ${nodes.length} nodes and ${links.length} links`);

  // Initialize the graph
  initializeGraph();
  
  // Setup enhanced search functionality
  setupSearchFunctionality();
  
  // Setup interactive controls
  setupInteractiveControls();
  
  // Setup export functionality
  setupExportFunctionality();
  
  // Setup entity navigation
  setupEntityNavigation();
  
  // Setup accessibility features
  setupAccessibilityFeatures();
  
  // Performance statistics
  var renderEndTime = performance.now();
  console.log(`Graph rendering completed in ${((renderEndTime - renderStartTime) / 1000).toFixed(2)}s`);
});

function initializeGraph() {
  try {
    // Hide loading indicator
    document.getElementById('graph-loading').style.display = 'none';
    
    // Update status
    var entityCount = nodes.filter(function(n) { return n.type === 'entity'; }).length;
    var articleCount = nodes.filter(function(n) { return n.type === 'article'; }).length;
    document.getElementById('graph-status').innerHTML = 
      '<small class="text-muted">Daten geladen: ' + entityCount + ' Entitäten, ' + articleCount + ' Artikel</small>';
    
    // Clear the loading message
    var graphContainer = document.getElementById('knowledge-graph');
    graphContainer.innerHTML = '';
  
  // Create SVG
  svg = d3.select('#knowledge-graph')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('cursor', 'grab');

  g = svg.append('g');
  
  // Zoom and pan
  svg.call(d3.zoom()
    .scaleExtent([0.1, 8])
    .on('zoom', function(event) {
      g.attr('transform', event.transform);
    })
    .on('start', function() { svg.style('cursor', 'grabbing'); })
    .on('end', function() { svg.style('cursor', 'grab'); })
  );

  // Links
  var link = g.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke', function(d) { return d.type === 'entity-entity' ? '#aaa' : '#ccc'; })
    .attr('stroke-width', function(d) { return d.type === 'entity-entity' ? 1.5 : 1; })
    .attr('stroke-dasharray', function(d) { return d.type === 'entity-entity' ? '4,3' : ''; })
    .attr('stroke-opacity', function(d) { return d.type === 'entity-entity' ? 0.4 : 0.6; });

  // Color scheme for entity categories
  var categoryColors = {
    'stoff': '#667eea',      // Blue for substances
    'methode': '#f093fb',   // Pink for methods  
    'reaktion': '#4ecdc4',  // Teal for reactions
    'konzept': '#45b7d1',   // Light blue for concepts
    'person': '#96ceb4',    // Green for people
    'default': '#667eea'    // Default blue
  };

  // Nodes
  var node = g.append('g')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', function(d) { return d.size; })
    .attr('fill', function(d) { 
      return d.type === 'entity' ? (categoryColors[d.category] || categoryColors.default) : '#f093fb';
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .style('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', function(d) { return d.size * 1.2; })
        .style('opacity', 1);
      
      var html = '<strong>' + d.label + '</strong>';
      if (d.type === 'entity') {
        var categoryName = d.category || 'konzept';
        var categoryLabels = {
          'stoff': 'Stoff',
          'methode': 'Methode', 
          'reaktion': 'Reaktion',
          'konzept': 'Konzept',
          'person': 'Person',
          'default': 'Kategorie'
        };
        html += '<br><small>' + categoryLabels[categoryName] + ' · ' + (d.count || 0) + ' Artikel</small>';
      } else {
        html += '<br><small>Artikel</small>';
      }
      
      var tooltip = d3.select('#knowledge-graph')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'visible')
        .style('background', '#fff')
        .style('border', '1px solid #ddd')
        .style('border-radius', '6px')
        .style('padding', '8px 12px')
        .style('font-size', '13px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
        .style('pointer-events', 'none')
        .style('max-width', '300px')
        .html(html)
        .style('left', (event.offsetX + 15) + 'px')
        .style('top', (event.offsetY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', function(d) { return d.size; })
        .style('opacity', 0.8);
      d3.select('#knowledge-graph').selectAll('div').remove();
    })
    .on('click', function(event, d) {
      if (d.type === 'article' && d.url) {
        window.open(d.url, '_blank');
      }
    });

  // Labels
  var labels = g.append('g')
    .selectAll('text')
    .data(nodes)
    .enter().append('text')
    .text(function(d) { return d.type === 'entity' ? d.label : ''; })
    .attr('font-size', '11px')
    .attr('dx', function(d) { return d.size + 4; })
    .attr('dy', 4)
    .attr('fill', '#555')
    .style('pointer-events', 'none');

  // Optimized force simulation for larger datasets
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(function(d) { return d.id; })
      .distance(function(d) {
        return d.type === 'entity-article' ? 80 : 100; // Increased distance for clarity
      })
      .strength(function(d) {
        return d.type === 'entity-article' ? 0.8 : 1.0; // Stronger entity-entity relationships
      }))
    .force('charge', d3.forceManyBody()
      .strength(function(d) {
        return d.type === 'entity' ? -300 : -100; // Stronger repulsion for entities
      })
      .theta(0.8)) // Optimize for large clusters
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide()
      .radius(function(d) {
        return d.size + 2; // Add small buffer
      }))
    // Manual clustering by category instead of d3.forceCluster (not available in d3.v7)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('x', d3.forceX().x(function(d) {
        if (d.type === 'entity') {
          var positions = {
            'stoff': width/4,
            'methode': width/2,
            'reaktion': 3*width/4,
            'konzept': width/2
          };
          return positions[d.category] || positions.default;
        }
        return width/2; // Articles center
      }))
      .force('y', d3.forceY().y(function(d) {
        if (d.type === 'entity') {
          var yPositions = {
            'stoff': height/4,
            'methode': height/2,
            'reaktion': 3*height/4,
            'konzept': height/2
          };
          return yPositions[d.category] || height/2;
        }
        return height/2; // Articles center
      }))
    .alphaDecay(0.02) // Slower convergence for better layout
    .velocityDecay(0.4) // Damping for stability
    .on('tick', function() {
      // Throttle tick events for performance
      if (simulation.alpha() > 0.1) {
        link
          .attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });

        node
          .attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; });

        labels
          .attr('x', function(d) { return d.x; })
          .attr('y', function(d) { return d.y; });
      }
    })
    .on('end', function() {
      console.log('Force simulation converged');
      // Final positioning optimization
      nodes.forEach(function(d) {
        d.fx = null; // Release fixed positions
        d.fy = null;
      });
    });

  // Filter functionality
  d3.select('#node-filter').on('change', function() {
    var filter = this.value;
    node.style('display', function(d) {
      if (filter === 'all') return null;
      if (filter === 'entities') return d.type === 'entity' ? null : 'none';
      if (filter === 'articles') return d.type === 'article' ? null : 'none';
      return null;
    });
    
    link.style('display', function(d) {
      if (filter === 'all') return null;
      if (filter === 'entities') {
        return d.source.type === 'entity' && d.target.type === 'entity' ? null : 'none';
      }
      if (filter === 'articles') {
        return d.source.type === 'article' && d.target.type === 'article' ? null : 'none';
      }
      return null;
    });
  });

  // Control buttons
  d3.select('#reset-graph').on('click', function() {
    svg.transition().duration(750).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  });

  d3.select('#center-graph').on('click', function() {
    svg.transition().duration(750).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  });

  // Responsive handling
  window.addEventListener('resize', function() {
    var newWidth = document.getElementById('knowledge-graph').clientWidth;
    svg.attr('width', newWidth);
    simulation.force('center', d3.forceCenter(newWidth / 2, height / 2));
    simulation.alpha(0.3).restart();
  });
  
  console.log('Graph initialization completed successfully');
  } catch (error) {
    console.error('Error during graph initialization:', error);
    document.getElementById('graph-status').innerHTML = 
      '<small class="text-danger">Fehler beim Laden des Graphen: ' + error.message + '</small>';
    document.getElementById('knowledge-graph').innerHTML = 
      '<div class="text-center p-4"><p class="text-danger">Der Graph konnte nicht geladen werden. Bitte laden Sie die Seite neu.</p></div>';
  }
}

// Enhanced features: Search functionality
function setupSearchFunctionality() {
  var searchInput = document.createElement('div');
  searchInput.innerHTML = `
    <div style="position: absolute; top: 10px; left: 10px; z-index: 1000; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="display: flex; gap: 10px; align-items: center;">
        <input type="text" id="graph-search" placeholder="Suche nach Entitäten oder Artikeln..." 
               style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; width: 250px; font-size: 14px;">
        <button id="clear-search" title="Clear search" style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">✖</button>
      </div>
      <div id="search-results" style="margin-top: 8px; max-height: 150px; overflow-y: auto;"></div>
    </div>
  `;
  document.getElementById('knowledge-graph').appendChild(searchInput);

  var searchResults = document.getElementById('search-results');
  var searchInputEl = document.getElementById('graph-search');
  var clearBtn = document.getElementById('clear-search');

  searchInputEl.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    var query = e.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
      searchResults.innerHTML = '';
      resetHighlight();
      return;
    }

    searchTimeout = setTimeout(function() {
      var results = nodes.filter(function(node) {
        return node.label.toLowerCase().includes(query);
      });

      displaySearchResults(results, query);
      highlightSearchResults(results);
    }, 300);
  });

  clearBtn.addEventListener('click', function() {
    searchInputEl.value = '';
    searchResults.innerHTML = '';
    resetHighlight();
  });

  function displaySearchResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = `<div style="padding: 8px; color: #666; font-size: 14px;">Keine Ergebnisse für "${escapeHtml(query)}"</div>`;
      return;
    }

    var html = results.slice(0, 10).map(function(node, i) {
      var info = node.type === 'entity' 
        ? ` (${categoryLabels[node.category] || 'Kategorie'}, ${node.count || 0} Artikel)`
        : ` (Artikel)`;
      return `<div style="padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 13px; color: #333;"
               onmouseover="this.style.background='#f0f0f0'" 
               onmouseout="this.style.background='transparent'"
               onclick="focusNode('${escapeHtml(node.id)}')">
               ${escapeHtml(node.label)}${escapeHtml(info)}
             </div>`;
    }).join('');

    searchResults.innerHTML = html;
  }

  function highlightSearchResults(results) {
    // Clear existing highlights
    d3.selectAll('circle')
      .style('opacity', function(d) {
        var highlighted = results.some(function(r) { return r.id === d.id; });
        return highlighted ? 1 : 0.3;
      })
      .style('stroke-width', function(d) {
        var highlighted = results.some(function(r) { return r.id === d.id; });
        return highlighted ? 3 : 1.5;
      });

    d3.selectAll('line')
      .style('opacity', function(d) {
        var sourceHighlighted = results.some(function(r) { return r.id === d.source.id; });
        var targetHighlighted = results.some(function(r) { return r.id === d.target.id; });
        return (sourceHighlighted && targetHighlighted) ? 0.8 : 0.2;
      });

    // Highlight connected nodes too
    d3.selectAll('circle')
      .style('stroke', function(d) {
        if (results.some(function(r) { return r.id === d.id; })) {
          return '#ff6b6b';
        } else if (isConnectedToHighlighted(d)) {
          return '#ffa726';
        }
        return '#fff';
      });
  }

  function isConnectedToHighlighted(node) {
    return links.some(function(link) {
      return (link.source.id === node.id && results.some(function(r) { return r.id === link.target.id; })) ||
             (link.target.id === node.id && results.some(function(r) { return r.id === link.source.id; }));
    });
  }

  function resetHighlight() {
    d3.selectAll('circle')
      .style('opacity', 0.8)
      .style('stroke-width', 1.5)
      .style('stroke', '#fff');

    d3.selectAll('line')
      .style('opacity', 0.6);
  }

  // Make focusNode available globally
  window.focusNode = function(nodeId) {
    var node = nodes.find(function(n) { return n.id === nodeId; });
    if (node) {
      var scale = 1.5;
      var translate = [width / 2 - node.x * scale, height / 2 - node.y * scale];
      
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
  };
}

// Enhanced features: Export functionality
function setupExportFunctionality() {
  var exportContainer = document.createElement('div');
  exportContainer.innerHTML = `
    <div style="position: absolute; bottom: 10px; left: 10px; z-index: 1000; background: white; padding: 12px; 
                border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">Export:</div>
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <button id="export-svg" style="padding: 6px 10px; background: #f8f9fa; border: 1px solid #ddd; 
                border-radius: 6px; cursor: pointer; font-size: 11px; width: 100%;">
          📄 Export as SVG
        </button>
        <button id="export-json" style="padding: 6px 10px; background: #f8f9fa; border: 1px solid #ddd; 
                border-radius: 6px; cursor: pointer; font-size: 11px; width: 100%;">
          📊 Export as JSON
        </button>
        <button id="export-png" style="padding: 6px 10px; background: #f8f9fa; border: 1px solid #ddd; 
                border-radius: 6px; cursor: pointer; font-size: 11px; width: 100%;">
          🖼️ Export as PNG
        </button>
      </div>
    </div>
  `;
  document.getElementById('knowledge-graph').appendChild(exportContainer);

  // Export as SVG
  document.getElementById('export-svg').addEventListener('click', function() {
    exportSVG();
  });

  // Export as JSON
  document.getElementById('export-json').addEventListener('click', function() {
    exportJSON();
  });

  // Export as PNG
  document.getElementById('export-png').addEventListener('click', function() {
    exportPNG();
  });

  function exportSVG() {
    var svgElement = document.querySelector('#knowledge-graph svg');
    if (!svgElement) return;

    // Create a clean copy for export
    var svgClone = svgElement.cloneNode(true);
    
    // Remove controls and temporary elements
    var controls = svgClone.querySelectorAll('.zoom-controls, .search-controls, .export-controls');
    controls.forEach(function(el) { el.remove(); });
    
    // Convert to SVG string
    var svgString = new XMLSerializer().serializeToString(svgClone);
    var blob = new Blob([svgString], { type: 'image/svg+xml' });
    var url = URL.createObjectURL(blob);
    
    // Download
    var a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-graph-${Date.now()}.svg`;
    a.click();
    
    URL.revokeObjectURL(url);
    alert('SVG exported successfully!');
  }

  function exportJSON() {
    var exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        nodeCount: nodes.length,
        linkCount: links.length,
        entityCount: nodes.filter(function(n) { return n.type === 'entity'; }).length,
        articleCount: nodes.filter(function(n) { return n.type === 'article'; }).length
      },
      nodes: nodes.map(function(n) {
        return {
          id: n.id,
          label: n.label,
          type: n.type,
          category: n.category,
          size: n.size,
          count: n.count,
          url: n.url
        };
      }),
      links: links.map(function(l) {
        return {
          source: l.source.id || l.source,
          target: l.target.id || l.target,
          type: l.type
        };
      })
    };

    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    
    var a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-graph-data-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    alert('JSON data exported successfully!');
  }

  function exportPNG() {
    var svgElement = document.querySelector('#knowledge-graph svg');
    if (!svgElement) return;

    // Create canvas for PNG conversion
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    
    // Set canvas size
    canvas.width = svgElement.clientWidth;
    canvas.height = svgElement.clientHeight;
    
    img.onload = function() {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Convert to PNG and download
      canvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = `knowledge-graph-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        alert('PNG exported successfully!');
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgElement.outerHTML)));
  }
}

// Interactive features: Node expansion and category filtering
function setupInteractiveControls() {
  var controlsContainer = document.createElement('div');
  controlsContainer.innerHTML = `
    <div style="position: absolute; top: 10px; right: 10px; z-index: 1000; background: white; padding: 12px; 
                border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 10px;">
        <label style="font-size: 12px; font-weight: bold; display: block; margin-bottom: 5px;">Kategorie Filter:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
          <button class="category-btn active" data-category="all" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; 
                  background: #f8f9fa; cursor: pointer; font-size: 11px;">Alle</button>
          <button class="category-btn" data-category="stoff" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; 
                  background: #f8f9fa; cursor: pointer; font-size: 11px; border-left: 3px solid #667eea;">Stoff</button>
          <button class="category-btn" data-category="reaktion" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; 
                  background: #f8f9fa; cursor: pointer; font-size: 11px; border-left: 3px solid #4ecdc4;">Reaktion</button>
          <button class="category-btn" data-category="methode" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; 
                  background: #f8f9fa; cursor: pointer; font-size: 11px; border-left: 3px solid #f093fb;">Methode</button>
          <button class="category-btn" data-category="konzept" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; 
                  background: #f8f9fa; cursor: pointer; font-size: 11px; border-left: 3px solid #45b7d1;">Konzept</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('knowledge-graph').appendChild(controlsContainer[0]);

  // Category filtering
  var categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      categoryButtons.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      filterByCategory(this.dataset.category);
    });
  });

  function filterByCategory(category) {
    var entitiesToShow = category === 'all' ? nodes.filter(function(n) { return n.type === 'entity'; }) :
                       nodes.filter(function(n) { return n.type === 'entity' && n.category === category; });
    
    d3.selectAll('circle')
      .style('opacity', function(d) {
        var show = entitiesToShow.some(function(e) { return e.id === d.id; });
        return show ? 1 : 0.1;
      });

    d3.selectAll('line')
      .style('opacity', function(d) {
        var sourceVisible = entitiesToShow.some(function(e) { return e.id === d.source.id; });
        var targetVisible = d.target.type === 'article' ? true : entitiesToShow.some(function(e) { return e.id === d.target.id; });
        return (sourceVisible && targetVisible) ? 0.6 : 0.1;
      });
  }
}

// Integration with entity detail pages and navigation
function setupEntityNavigation() {
  // Add click handlers to entity nodes for navigation
  d3.selectAll('circle')
    .filter(function(d) { return d.type === 'entity'; })
    .on('dblclick', function(event, d) {
      if (d.url) {
        window.open(d.url, '_blank');
      } else {
        // Try to construct entity URL based on name
        var entityName = encodeURIComponent(d.label);
        var entityUrl = `/entity/${entityName}`;
        window.open(entityUrl, '_blank');
      }
    });
}

// Accessibility features: Keyboard navigation and screen reader support
function setupAccessibilityFeatures() {
  var focusedElement = null;
  
  // Add keyboard navigation
  document.addEventListener('keydown', function(event) {
    switch(event.key) {
      case 'Tab':
        event.preventDefault();
        navigateWithTab();
        break;
      case 'ArrowRight':
      case 'ArrowLeft':
        event.preventDefault();
        navigateWithArrows(event.key);
        break;
      case 'Escape':
        closeAllMenus();
        break;
      case ' ':
      case 'Enter':
        if (focusedElement) {
          event.preventDefault();
          focusedElement.click();
        }
        break;
    }
  });

  // Add ARIA labels and roles
  d3.selectAll('circle')
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-label', function(d) {
      var role = d.type === 'entity' ? 'Entität' : 'Artikel';
      var desc = d.type === 'entity' 
        ? `${role}: ${d.label}, Kategorie: ${d.category}, ${d.count || 0} Artikel`
        : `${role}: ${d.label}`;
      return desc;
    })
    .attr('aria-describedby', function(d) {
      return `desc-${d.id}`;
    });

  d3.selectAll('line')
    .attr('role', 'link')
    .attr('aria-label', function(d) {
      var source = d.source.label || d.source;
      var target = d.target.label || d.target;
      return `Verbindung zwischen ${source} und ${target}`;
    });

  function navigateWithTab() {
    var elements = d3.selectAll('circle, text').nodes();
    var currentIndex = focusedElement ? elements.indexOf(focusedElement) : -1;
    
    if (event.shiftKey) {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
    } else {
      currentIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
    }
    
    focusedElement = elements[currentIndex];
    focusedElement.focus();
  }

  function navigateWithArrows(direction) {
    // Navigate between related nodes
    if (!focusedElement || !focusedElement.__data__) return;
    
    var current = focusedElement.__data__;
    var relatedLinks = links.filter(function(l) { return l.source.id === current.id || l.target.id === current.id; });
    
    if (relatedLinks.length > 0) {
      var next = relatedLinks[0][direction === 'ArrowRight' ? 'target' : 'source'];
      var nextElement = d3.selectAll('circle').filter(function(d) { return d.id === next.id; }).node();
      if (nextElement) {
        focusedElement = nextElement;
        nextElement.focus();
      }
    }
  }

  function closeAllMenus() {
    var menus = document.querySelectorAll('div[style*="position: fixed"]');
    menus.forEach(function(menu) {
      if (menu.parentNode) menu.parentNode.removeChild(menu);
    });
  }
}

// Helper function for category labels
var categoryLabels = {
  'stoff': 'Stoff',
  'methode': 'Methode', 
  'reaktion': 'Reaktion',
  'konzept': 'Konzept',
  'person': 'Person',
  'default': 'Kategorie'
};
</script>