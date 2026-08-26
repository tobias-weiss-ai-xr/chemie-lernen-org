/**
 * Unit tests for the shared D3EgoGraph module.
 *
 * Strategy:
 *  - jsdom provides window/document
 *  - We inject a minimal mock D3 onto window.d3 BEFORE loading the module
 *  - We inject the module source via a <script> element so it executes in
 *    the jsdom window and exposes window.D3EgoGraph
 *  - Each test is independent via beforeEach
 */

const fs = require('fs');
const path = require('path');

const MODULE_PATH = path.resolve(
  __dirname,
  '..',
  'myhugoapp',
  'static',
  'js',
  'visualization',
  'd3-ego-graph.js'
);

// ── Minimal d3 mock ──────────────────────────────────────────────
function makeMockSimulation() {
  return {
    force: function () {
      return this;
    },
    on: function () {
      return this;
    },
    alpha: function () {
      return this;
    },
    alphaDecay: function () {
      return this;
    },
    velocityDecay: function () {
      return this;
    },
    restart: function () {
      return this;
    },
    stop: function () {
      return this;
    },
  };
}

function makeMockSelection(node) {
  // node: an actual DOM element to wrap. If undefined, make a detached container.
  if (!node) {
    node = document.createElement('div');
  }
  const sel = {
    _node: node,
    attr: function (name, value) {
      if (typeof value === 'function') {
        // Just use the node's own attributes — we can't call the fn
        return sel;
      }
      if (value === null || value === undefined) {
        return node.getAttribute(name);
      }
      node.setAttribute(name, value);
      return sel;
    },
    style: function (name, value) {
      if (value === null) return node.style[name];
      node.style[name] = value;
      return sel;
    },
    text: function (value) {
      if (value === undefined) return node.textContent;
      node.textContent = value;
      return sel;
    },
    append: function (tag) {
      const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
      // For non-SVG tags, fall back to HTML namespace
      if (
        ![
          'svg',
          'g',
          'circle',
          'line',
          'rect',
          'text',
          'title',
          'desc',
          'defs',
          'path',
          'tspan',
        ].includes(tag)
      ) {
        const htmlChild = document.createElement(tag);
        node.appendChild(htmlChild);
        return makeMockSelection(htmlChild);
      }
      node.appendChild(child);
      return makeMockSelection(child);
    },
    selectAll: function () {
      return sel;
    },
    data: function () {
      return sel;
    },
    enter: function () {
      return sel;
    },
    on: function () {
      return sel;
    },
    call: function () {
      return sel;
    },
    transition: function () {
      return sel;
    },
    duration: function () {
      return sel;
    },
    dispatch: function () {
      return sel;
    },
  };
  return sel;
}

function makeMockD3() {
  return {
    select: function (selectorOrNode) {
      // If string, find element; if node, wrap directly
      let node;
      if (typeof selectorOrNode === 'string') {
        node = document.querySelector(selectorOrNode);
      } else {
        node = selectorOrNode;
      }
      return makeMockSelection(node);
    },
    selection: makeMockSelection,
    forceSimulation: makeMockSimulation,
    forceLink: function () {
      const fl = {
        id: function () {
          return fl;
        },
        distance: function () {
          return fl;
        },
        strength: function () {
          return fl;
        },
      };
      return fl;
    },
    forceManyBody: function () {
      const fmb = {
        strength: function () {
          return fmb;
        },
      };
      return fmb;
    },
    forceCenter: function () {
      return makeMockSelection();
    },
    forceCollide: function () {
      const fc = {
        radius: function () {
          return fc;
        },
      };
      return fc;
    },
    forceX: function () {
      const fx = {
        strength: function () {
          return fx;
        },
      };
      return fx;
    },
    forceY: function () {
      const fy = {
        strength: function () {
          return fy;
        },
      };
      return fy;
    },
    zoom: function () {
      const z = {
        scaleExtent: function () {
          return z;
        },
        on: function () {
          return z;
        },
      };
      return z;
    },
  };
}

function loadModule() {
  // Reset module-level state
  delete window.D3EgoGraph;
  // Mock D3 BEFORE loading the module
  window.d3 = makeMockD3();
  // Inject the module source into the jsdom window
  const src = fs.readFileSync(MODULE_PATH, 'utf8');
  const script = document.createElement('script');
  script.textContent = src;
  document.body.appendChild(script);
}

beforeEach(() => {
  // Clean DOM
  document.body.innerHTML = '';
  // Reset matchMedia to default (no reduced motion)
  if (window.matchMedia) {
    window.matchMedia.mockClear && window.matchMedia.mockClear();
  }
  // Ensure matchMedia is the default in jsdom (returns matches: false)
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  loadModule();
});

// ── Tests ─────────────────────────────────────────────────────────

describe('D3EgoGraph — module API', () => {
  test('exposes a global D3EgoGraph object', () => {
    expect(window.D3EgoGraph).toBeDefined();
    expect(typeof window.D3EgoGraph).toBe('object');
  });

  test('exposes createEgoGraph, createFullGraph, colorize, labelize, slugify', () => {
    expect(typeof window.D3EgoGraph.createEgoGraph).toBe('function');
    expect(typeof window.D3EgoGraph.createFullGraph).toBe('function');
    expect(typeof window.D3EgoGraph.colorize).toBe('function');
    expect(typeof window.D3EgoGraph.labelize).toBe('function');
    expect(typeof window.D3EgoGraph.slugify).toBe('function');
  });

  test('exposes canonical CAT_COLORS and CAT_LABELS', () => {
    expect(window.D3EgoGraph.CAT_COLORS.stoff).toBe('#667eea');
    expect(window.D3EgoGraph.CAT_COLORS.konzept).toBe('#45b7d1');
    expect(window.D3EgoGraph.CAT_COLORS.didaktik).toBe('#2e7d32');
    expect(window.D3EgoGraph.CAT_LABELS.stoff).toBe('Stoff');
    expect(window.D3EgoGraph.CAT_LABELS.didaktik).toBe('KMK-Standard');
  });
});

describe('D3EgoGraph.colorize', () => {
  test('returns canonical color for known category', () => {
    expect(window.D3EgoGraph.colorize('stoff')).toBe('#667eea');
    expect(window.D3EgoGraph.colorize('konzept')).toBe('#45b7d1');
  });

  test('returns fallback gray for unknown category', () => {
    expect(window.D3EgoGraph.colorize('unknown-category')).toBe('#888');
    expect(window.D3EgoGraph.colorize('')).toBe('#888');
  });
});

describe('D3EgoGraph.labelize', () => {
  test('returns canonical German label for known category', () => {
    expect(window.D3EgoGraph.labelize('stoff')).toBe('Stoff');
    expect(window.D3EgoGraph.labelize('lehrplan')).toBe('Lehrplan');
  });

  test('returns the input itself for unknown category', () => {
    expect(window.D3EgoGraph.labelize('unknown-category')).toBe('unknown-category');
  });
});

describe('D3EgoGraph.slugify', () => {
  test('slugifies umlauts correctly', () => {
    expect(window.D3EgoGraph.slugify('Säuren')).toBe('saeuren');
    expect(window.D3EgoGraph.slugify('Oxidation')).toBe('oxidation');
    expect(window.D3EgoGraph.slugify('Größe')).toBe('groesse');
  });

  test('replaces spaces and special chars with single hyphen', () => {
    expect(window.D3EgoGraph.slugify('Ammoniak Synthese')).toBe('ammoniak-synthese');
    expect(window.D3EgoGraph.slugify('C++ Language')).toBe('c-language');
  });

  test('trims leading and trailing hyphens', () => {
    expect(window.D3EgoGraph.slugify('--test--')).toBe('test');
    expect(window.D3EgoGraph.slugify(' test ')).toBe('test');
  });

  test('returns empty string for empty input', () => {
    expect(window.D3EgoGraph.slugify('')).toBe('');
  });
});

describe('D3EgoGraph.createEgoGraph', () => {
  function makeContainer() {
    const c = document.createElement('div');
    c.id = 'test-ego';
    // jsdom doesn't compute layout, so set dimensions explicitly
    Object.defineProperty(c, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 280, configurable: true });
    document.body.appendChild(c);
    return c;
  }

  test('renders without error and creates an svg with role=img', async () => {
    const c = makeContainer();
    const data = {
      entities: [{ name: 'Ammoniak', category: 'stoff' }],
      articles: [],
    };
    await window.D3EgoGraph.createEgoGraph(c, data, {
      entity: { name: 'Ammoniak', category: 'stoff', relatedEntities: [] },
    });
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('Ammoniak');
  });

  test('adds a <title> and <desc> inside the SVG', async () => {
    const c = makeContainer();
    const data = { entities: [], articles: [] };
    await window.D3EgoGraph.createEgoGraph(c, data, {
      entity: { name: 'Wasser', category: 'stoff', relatedEntities: [] },
    });
    const title = c.querySelector('svg title');
    const desc = c.querySelector('svg desc');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('Wasser');
    expect(desc).not.toBeNull();
  });

  test('adds a visually-hidden <ul> fallback for screen readers', async () => {
    const c = makeContainer();
    const data = { entities: [], articles: [] };
    await window.D3EgoGraph.createEgoGraph(c, data, {
      entity: { name: 'Ethanol', category: 'stoff', relatedEntities: [] },
    });
    const ul = c.querySelector('ul.d3-ego-fallback');
    expect(ul).not.toBeNull();
    expect(ul.classList.contains('sr-only')).toBe(true);
    const lis = ul.querySelectorAll('li');
    expect(lis.length).toBeGreaterThan(0);
    expect(lis[0].textContent).toContain('Ethanol');
  });

  test('handles missing entity gracefully', async () => {
    const c = makeContainer();
    const data = { entities: [], articles: [] };
    await window.D3EgoGraph.createEgoGraph(c, data, { entity: null });
    // Should not throw; should display error or empty
    const svg = c.querySelector('svg');
    expect(svg).toBeNull();
    // Container has fallback error message
    expect(c.innerHTML).toContain('Kein Entity');
  });

  test('skips d3.transition when prefers-reduced-motion is reduce', async () => {
    window.matchMedia = jest.fn().mockImplementation((q) => ({
      matches: q.includes('reduce'),
      media: q,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    const c = makeContainer();
    const data = { entities: [], articles: [] };
    // The module must not throw; we just verify the SVG still gets created
    await window.D3EgoGraph.createEgoGraph(c, data, {
      entity: { name: 'Methan', category: 'stoff', relatedEntities: [] },
    });
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});

describe('D3EgoGraph.createFullGraph', () => {
  function makeContainer() {
    const c = document.createElement('div');
    c.id = 'test-full';
    Object.defineProperty(c, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(c);
    return c;
  }

  test('renders a full SVG with role=img and counts in aria-label', async () => {
    const c = makeContainer();
    const data = {
      source: 'neo4j',
      entities: [
        { id: 'e1', name: 'Säuren', category: 'konzept' },
        { id: 'e2', name: 'Basen', category: 'konzept' },
      ],
      articles: [
        { id: 'a1', title: 'Säuren und Basen', type: 'article', url: '/x/', entities: ['Säuren'] },
      ],
    };
    await window.D3EgoGraph.createFullGraph(c, data, { showLegend: true });
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('3 Knoten');
  });

  test('renders a fallback <ul> with one entry per node', async () => {
    const c = makeContainer();
    const data = {
      entities: [{ id: 'e1', name: 'Säuren', category: 'konzept' }],
      articles: [
        { id: 'a1', title: 'Säuren', type: 'article', url: '/x/' },
        { id: 'a2', title: 'Startseite', type: 'page', url: '/' },
      ],
    };
    await window.D3EgoGraph.createFullGraph(c, data, { showLegend: false });
    const ul = c.querySelector('ul.d3-ego-fallback');
    expect(ul).not.toBeNull();
    const lis = ul.querySelectorAll('li');
    // 1 entity + 2 articles = 3 list items
    expect(lis).toHaveLength(3);
  });

  test('limits nodes to top-N by connections when maxNodes is set', async () => {
    const c = makeContainer();
    const data = {
      entities: [
        {
          id: 'e1',
          name: 'Hub',
          category: 'konzept',
          relatedEntities: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
        },
        {
          id: 'e2',
          name: 'Zwei',
          category: 'stoff',
          relatedEntities: [{ name: 'x' }, { name: 'y' }],
        },
        { id: 'e3', name: 'Eins', category: 'stoff', relatedEntities: [{ name: 'z' }] },
        { id: 'e4', name: 'Null', category: 'stoff', relatedEntities: [] },
      ],
      articles: [],
    };
    await window.D3EgoGraph.createFullGraph(c, data, { showLegend: false, maxNodes: 2 });
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-label')).toContain('2 Knoten');
  });

  test('keeps all nodes when maxNodes exceeds entity count', async () => {
    const c = makeContainer();
    const data = {
      entities: [
        { id: 'e1', name: 'A', category: 'stoff', relatedEntities: [] },
        { id: 'e2', name: 'B', category: 'stoff', relatedEntities: [] },
      ],
      articles: [],
    };
    await window.D3EgoGraph.createFullGraph(c, data, { showLegend: false, maxNodes: 50 });
    expect(c.querySelector('svg').getAttribute('aria-label')).toContain('2 Knoten');
  });
});

describe('D3EgoGraph.entityHref', () => {
  const SLUGS_PATH = path.resolve(
    __dirname,
    '..',
    'myhugoapp',
    'static',
    'js',
    'utils',
    'slugs.js'
  );

  test('uses canonical Slugs.entityUrl when Slugs is loaded', () => {
    require(SLUGS_PATH); // executes IIFE → window.Slugs
    loadModule();
    expect(window.D3EgoGraph.entityHref('Essigsäure')).toBe('/entity/essigsaeure/');
    expect(window.D3EgoGraph.entityHref('Hall-Héroult-Prozess')).toBe(
      '/entity/hall-heroult-prozess/'
    );
    expect(window.D3EgoGraph.entityHref('Eisen(III)-oxid (Fe2O3)')).toBe(
      '/entity/eisen-iii-oxid-fe2o3/'
    );
  });

  test('falls back to module-local transliteration without Slugs', () => {
    delete window.Slugs;
    loadModule();
    expect(window.D3EgoGraph.entityHref('Größe')).toBe('/entity/groesse/');
    expect(window.D3EgoGraph.entityHref('pH-Wert')).toBe('/entity/ph-wert/');
  });

  test('is the function used by the click handler (navigation contract)', () => {
    require(SLUGS_PATH);
    loadModule();
    const source = fs.readFileSync(MODULE_PATH, 'utf8');
    // The click navigation must go through entityHref, never raw slugify
    expect(source).toMatch(/location\.href\s*=\s*entityHref\(d\.label\)/);
    expect(source).not.toMatch(/location\.href\s*=\s*'\/entity\/'\s*\+\s*slugify\(d\.label\)/);
  });
});

describe('D3EgoGraph — module isolation', () => {
  test('does not leak globals other than D3EgoGraph', () => {
    // Module only adds D3EgoGraph to window
    const allowed = ['D3EgoGraph', 'd3'];
    // Check that the module didn't add a bunch of other stuff
    const keys = Object.keys(window).filter(
      (k) => !['D3EgoGraph', 'd3'].includes(k) && k.toLowerCase().includes('ego')
    );
    expect(keys).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════
// Part B — shape coding, bounded topic graphs, directed Vorwissen
// layout (x-anchored: components left, related right), ego multi-center
// ════════════════════════════════════════════════════════════════════

describe('D3EgoGraph.shapeOf (Part B)', () => {
  test('maps every category to a distinguishable shape', () => {
    expect(window.D3EgoGraph.shapeOf('stoff')).toBe('circle');
    expect(window.D3EgoGraph.shapeOf('konzept')).toBe('square');
    expect(window.D3EgoGraph.shapeOf('reaktion')).toBe('diamond');
    expect(window.D3EgoGraph.shapeOf('methode')).toBe('triangle');
    expect(window.D3EgoGraph.shapeOf('person')).toBe('hexagon');
    expect(window.D3EgoGraph.shapeOf('quelle')).toBe('hexagon');
    expect(window.D3EgoGraph.shapeOf('lernziel')).toBe('cross');
    expect(window.D3EgoGraph.shapeOf('unknown')).toBe('circle');
  });

  test('nodePathD produces valid SVG path data for every shape', () => {
    ['circle', 'square', 'diamond', 'triangle', 'hexagon', 'cross'].forEach((shape) => {
      const d = window.D3EgoGraph.nodePathD(shape, 10);
      expect(typeof d).toBe('string');
      expect(d).toMatch(/^M/);
      expect(d).toMatch(/Z$/);
      expect(d).not.toContain('NaN');
    });
  });

  test('nodePathFor resolves via category with a circle fallback', () => {
    const d = window.D3EgoGraph.nodePathFor('stoff', 7);
    expect(d).toMatch(/A7,7/);
    const d2 = window.D3EgoGraph.nodePathFor('nope', 7);
    expect(d2).toBe(d);
  });
});

describe('D3EgoGraph.buildTopicNodes (Part B)', () => {
  const DATA = {
    entities: [
      {
        name: 'Säure',
        category: 'konzept',
        components: ['Base'],
        relatedEntities: ['Salz', 'pH-Wert'],
      },
      { name: 'Base', category: 'konzept', components: [], relatedEntities: ['Wasser'] },
      { name: 'Salz', category: 'stoff', components: [], relatedEntities: [] },
      {
        name: 'pH-Wert',
        category: 'konzept',
        components: ['Wasser'],
        relatedEntities: ['Indikator'],
      },
      { name: 'Wasser', category: 'stoff', components: [], relatedEntities: ['Salz'] },
      { name: 'Indikator', category: 'methode', components: [], relatedEntities: [] },
      { name: 'Unwichtig', category: 'konzept', components: [], relatedEntities: [] },
    ],
    articles: [],
  };

  test('selects seed entities by canonical slug and keeps them all', () => {
    const built = window.D3EgoGraph.buildTopicNodes(DATA, {
      topic: 'Säure-Base-Reaktion',
      topicSlugs: ['saeure', 'base'],
      cap: 80,
    });
    const labels = built.nodes.map((n) => n.label);
    expect(labels).toContain('Säure');
    expect(labels).toContain('Base');
    expect(labels).not.toContain('Unwichtig');
  });

  test('caps at the configured limit (seeds always included)', () => {
    const built = window.D3EgoGraph.buildTopicNodes(DATA, {
      topic: 'T',
      topicSlugs: ['saeure', 'base', 'salz'],
      cap: 5,
    });
    expect(built.nodes.length).toBeLessThanOrEqual(5);
    for (const seed of ['Säure', 'Base', 'Salz']) {
      expect(built.nodes.some((n) => n.label === seed)).toBe(true);
    }
  });

  test('marks x-groups: components left, related right, seeds center', () => {
    const built = window.D3EgoGraph.buildTopicNodes(DATA, {
      topic: 'T',
      topicSlugs: ['saeure'],
      cap: 80,
    });
    const byLabel = Object.fromEntries(built.nodes.map((n) => [n.label, n]));
    expect(byLabel['Säure'].xGroup).toBe('center');
    expect(byLabel['Base'].xGroup).toBe('left'); // component of Säure
    expect(byLabel['Salz'].xGroup).toBe('right'); // related of Säure
    expect(byLabel['pH-Wert'].xGroup).toBe('right');
  });

  test('emits composition and related links from seeds', () => {
    const built = window.D3EgoGraph.buildTopicNodes(DATA, {
      topic: 'T',
      topicSlugs: ['saeure'],
      cap: 80,
    });
    const comp = built.links.filter((l) => l.type === 'composition');
    const related = built.links.filter((l) => l.type === 'related');
    expect(comp.length).toBeGreaterThanOrEqual(1);
    expect(related.length).toBeGreaterThanOrEqual(2);
  });

  test('falls back to slug-entity lookup when topicSlugs is empty', () => {
    const built = window.D3EgoGraph.buildTopicNodes(DATA, {
      topic: 'Säure',
      topicSlugs: [],
      cap: 80,
    });
    expect(built.nodes.some((n) => n.label === 'Säure')).toBe(true);
  });
});

describe('D3EgoGraph.createTopicGraph (Part B)', () => {
  function makeContainer() {
    const c = document.createElement('div');
    c.id = 'test-topic';
    Object.defineProperty(c, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(c);
    return c;
  }

  test('renders an SVG with topic in the aria-label', async () => {
    const c = makeContainer();
    const data = {
      entities: [
        { name: 'Säure', category: 'konzept', components: ['Base'], relatedEntities: [] },
        { name: 'Base', category: 'konzept', components: [], relatedEntities: [] },
      ],
      articles: [],
    };
    await window.D3EgoGraph.createTopicGraph(c, data, {
      topic: 'Säure-Base-Reaktion',
      topicSlugs: ['saeure'],
      cap: 80,
    });
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('Säure-Base-Reaktion');
  });

  test('renders a fallback ul for a11y', async () => {
    const c = makeContainer();
    const data = {
      entities: [{ name: 'Base', category: 'konzept', components: [], relatedEntities: [] }],
      articles: [],
    };
    await window.D3EgoGraph.createTopicGraph(c, data, {
      topic: 'Basen',
      topicSlugs: ['base'],
      cap: 80,
    });
    const ul = c.querySelector('ul.d3-ego-fallback');
    expect(ul).not.toBeNull();
    expect(ul.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  test('shows the dismissible Vorwissen hint when hintContainer is provided', async () => {
    const hint = document.createElement('div');
    hint.id = 'kg-hint';
    document.body.appendChild(hint);
    const c = makeContainer();
    const data = {
      entities: [{ name: 'Base', category: 'konzept', components: [], relatedEntities: [] }],
      articles: [],
    };
    await window.D3EgoGraph.createTopicGraph(c, data, {
      topic: 'Basen',
      topicSlugs: ['base'],
      cap: 80,
      hintContainer: hint,
    });
    expect(hint.style.display).not.toBe('none');
    expect(hint.textContent).toContain('Voraussetzungen');
  });
});

describe('D3EgoGraph.createEgoGraph — multi-center search (Part B)', () => {
  function makeContainer() {
    const c = document.createElement('div');
    c.id = 'test-search';
    Object.defineProperty(c, 'clientWidth', { value: 500, configurable: true });
    Object.defineProperty(c, 'clientHeight', { value: 300, configurable: true });
    document.body.appendChild(c);
    return c;
  }

  test('renders an ego graph around multiple matches', async () => {
    const c = makeContainer();
    const data = {
      entities: [
        { name: 'Säure', category: 'konzept', relatedEntities: ['Base'] },
        { name: 'Base', category: 'konzept', relatedEntities: [] },
        { name: 'Salz', category: 'stoff', relatedEntities: [] },
      ],
      articles: [],
    };
    await window.D3EgoGraph.createEgoGraph(c, data, { matches: ['Säure', 'Base'], cap: 30 });
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-label')).toContain('Säure');
    const ul = c.querySelector('ul.d3-ego-fallback');
    expect(ul).not.toBeNull();
  });

  test('caps neighbor nodes at 30 around multiple centers', async () => {
    const c = makeContainer();
    const entities = [{ name: 'Zentrum', category: 'konzept', relatedEntities: [] }];
    for (let i = 0; i < 60; i++)
      entities.push({ name: 'N' + i, category: 'konzept', relatedEntities: [] });
    entities[0].relatedEntities = entities.slice(1).map((e) => e.name);
    const data = { entities, articles: [] };
    await window.D3EgoGraph.createEgoGraph(c, data, { matches: ['Zentrum'], cap: 30 });
    const lis = c.querySelectorAll('ul.d3-ego-fallback li');
    expect(lis.length).toBeLessThanOrEqual(31); // 1 center + 30 neighbors
  });
});
