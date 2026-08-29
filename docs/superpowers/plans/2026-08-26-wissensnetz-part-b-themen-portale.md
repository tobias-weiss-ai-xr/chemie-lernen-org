# Implementation Plan — Part B: Themen-Portale & strukturiertes Wissensnetz

- **Repo:** hugo-chemie-lernen-org (branch `main`, direct commits — deploy only via
  `workflow_dispatch` on main; auto-deploy triggers only on `push: [master]`)
- **Spec:** `docs/superpowers/specs/2026-08-26-wissensnetz-slugs-and-graph-redesign.md` (Part B, didactic pass `fc7fc854`)
- **Prereq:** Part A shipped (canonical slugs `globalThis.Slugs` + Node mirror
  `scripts/lib/slugs.mjs`, SSR canonical links, CI link audit, legacy aliases). ✅
- **Mode:** inline execution, TDD per task, commit per task, clean tree before commits.
- **Restraint:** only client-side + one small API extension; NO new server dependencies;
  didactic quality is a requirement (die didaktische Brille).

---

## Ground truth (verified during Part A / this investigation)

- `/api/kg-data?limit=550` → `{total: 545, entities: 545, articles: 119}` in ONE request.
  Entities carry `name, category, relatedEntities[{name,weight}], components[],
articleCount`; articles carry `title, url, entities[]`. **62 article URLs** contain
  `/themenbereiche/<section>/…` → **client-side entity→section mapping works without an
  API change** (129 entities assignable via articles).
- Live data quality quirks: entity names may have a leading space (`' Calvin-Zyklus'`),
  names are NOT consistent with slugs (`'co2-umwandlung'`-style slug-names exist as refs
  but not as entities). All name handling must `.trim()`, and matching must be
  normalized (lowercase, trim) — see `coversMatch` pattern in
  `scripts/link-entities-to-curricula.mjs`.
- `13` sections under `myhugoapp/content/themenbereiche/` (plus `_index.md`): the portal
  source set. Section pages exist (`/themenbereiche/<slug>/`, layout `section/posts.html`).
- `/api/curricula/by-state/:state` (api/server.js ~2957) ALREADY returns per-topic
  `objectives` (collected `lo.text`, KMK operator verbs are embedded in the text) —
  **server side must additionally return topic→entity names via COVERS_TOPIC**
  (direction `(t:Topic)<-[:COVERS_TOPIC]-(e:Entity)` per link-entities phase 1; collect
  `DISTINCT e.name`).
- `curricula-state.js` renders groups school→grade→topics today, uses its own `toSlug`
  for `/entity/` hrefs (lines ~187) — must be swapped to `Slugs.entityUrl` (Part A
  swap is pending for this file; entity-index.js already done).
- `d3-ego-graph.js` internals: node ids `e.id || 'e-' + slugify(e.name)`;
  `buildFullNodes(data)` (entities + articles + composition links) and
  `buildEgoNodes(data, entity)` (1 hop around ONE entity) exist; ALL entity nodes are
  currently `<circle>`s colored by category (`colorize`, `CAT_COLORS`, `CAT_LABELS`);
  legend is circles+symbols; click nav already routed through `entityHref` (Part A).
- Layouts: `wissennetz.html` loads `d3-ego-graph.js` + `wissennetz-graph.js`;
  `curricula-state.html` loads `curricula-state.js` only (needs slugs.js + d3 include
  for graphs); entity single.html already includes slugs.js before d3.
- Jest: `npm test` = `--forceExit --experimental-vm-modules`, integration patterns
  ignore `(complete-site-audit|site-accessibility|mobile-responsiveness|
accessibility-validation|modulhandbuch-api)`. d3 tests inject a d3 mock onto
  jsdom `window` (see `tests/d3-ego-graph.test.js`).

---

## Success criteria (from spec, measurable)

1. Hub renders 13 portal cards in **Lernpfad order** + "Weitere Begriffe" bucket;
   every entity is assigned to exactly one section (article-URL → keyword → fallback).
2. Topic graph: **≤80 nodes**, Voraussetzungen left / Verwandte right (x-anchored),
   shape per category (Stoff=circle, Konzept=square, Reaktion=diamond, Methode=triangle,
   Person/Quelle=hexagon, Lernziel=cross) — distinguishable without color.
3. Search: ego graph around top matches, **≤30 neighbors**, empty state on no match.
4. Curricula: topic rows with concept chips via `Slugs.entityUrl` (all resolve — Part A
   audit is FS-based, chips are client-side: guarded by source-contract tests), Lernziele
   list ≤8 with KMK-operator highlighted, "Grafik anzeigen" toggle → topic graph ≤30 nodes.
5. `npm test` green (all existing + new), `npm run lint` adds no findings,
   `docker build` (real export) still passes the Part A audit stage.
6. 0 dead links in the built tree (audit stage keeps enforcing).

---

## Task 1: wissennetz-hub.js — section assignment + portal rendering (TDD)

**Files:** create `myhugoapp/static/js/wissennetz-hub.js`, `tests/wissennetz-hub.test.js`

Step 1 — write failing tests:

```js
// tests/wissennetz-hub.test.js
const path = require('path');
const fs = require('fs');
const HUB_SRC = fs.readFileSync(
  path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'wissennetz-hub.js'),
  'utf8'
);

function loadHub() {
  const ctx = {};
  const fn = new Function(
    'window',
    'document',
    'fetch',
    'globalThis',
    HUB_SRC + '\nreturn window.WissennetzHub;'
  );
  return fn(
    { WissennetzHub: undefined },
    { getElementById: () => null },
    () => Promise.reject(new Error('no fetch in tests')),
    ctx
  );
}

describe('wissennetz-hub (pure helpers)', () => {
  let hub;
  beforeAll(() => {
    hub = loadHub();
  });

  const DATA = {
    entities: [
      { name: 'Zink', category: 'stoff', relatedEntities: [], components: [], articleCount: 1 },
      {
        name: 'Esterbildung',
        category: 'reaktion',
        relatedEntities: [],
        components: [],
        articleCount: 0,
      },
      {
        name: 'Aktivierungsenergie',
        category: 'konzept',
        relatedEntities: [{ name: 'Esterbildung', weight: 1 }],
        components: ['Ester'],
        articleCount: 0,
      },
      {
        name: ' Calvin-Zyklus',
        category: 'reaktion',
        relatedEntities: [],
        components: [],
        articleCount: 0,
      },
    ],
    articles: [
      {
        title: 'Spannungsreihe',
        url: 'https://chemie-lernen.org/themenbereiche/redox-elektrochemie/spannungsreihe/',
        entities: ['Zink'],
      },
    ],
  };

  it('assigns entities to sections: article URL first, keyword second, fallback last', () => {
    const map = hub.assignEntitiesToSections(
      DATA.entities,
      [{ url1: '/themenbereiche/redox-elektrochemie/', entities: ['Zink'] }],
      []
    );
    // article-based: Zink → redox-elektrochemie
    expect(map.get('Zink')).toBe('redox-elektrochemie');
  });

  it('falls back to keyword overlap and then to the further-terms bucket', () => {
    // 'Esterbildung' & 'Aktivierungsenergie' match the keyword map for
    // erdoel-organische-stoffklassen via 'ester'
    const map = hub.assignEntitiesToSections(
      DATA.entities,
      [{ section: 'redox-elektrochemie', entities: ['Zink'] }],
      { 'erdoel-organische-stoffklassen': ['ester', 'aktivierung'] }
    );
    expect(map.get('Esterbildung')).toBe('erdoel-organische-stoffklassen');
    expect(map.get('Aktivierungsenergie')).toBe('erdoel-organische-stoffklassen');
    // no match → further-terms bucket
    expect(map.get(' Calvin-Zyklus')).toBe('weitere-begriffe');
  });

  it('normalizes names (trim) and counts concepts per section', () => {
    const counts = hub.sectionCounts(DATA.entities, (n) => n);
    // 4 entities, all assigned
    expect(counts.total).toBe(4);
  });

  it('renders portal cards in the Lernpfad order with concept counts', () => {
    const html = hub.buildPortalHtml(
      { 'redox-elektrochemie': 3, 'weitere-begriffe': 1 },
      ['redox-elektrochemie'],
      'redox-elektrochemie'
    );
    expect(html).toContain('data-section="redox-elektrochemie"');
    expect(html).toContain('3');
    expect(html.indexOf('redox-elektrochemie') > -1).toBe(true);
  });
});
```

Step 2: run → FAIL (module missing).

Step 3 — implement `myhugoapp/static/js/wissennetz-hub.js` (IIFE, sets
`globalThis.WissennetzHub`, ES5-compatible):

```js
(function () {
  var PREFIX_RE = /^https?:\/\/[^/]+\//;
  function sectionsFromArticles(articles) {
    var map = {}; // entity -> section (first article wins)
    (articles || []).forEach(function (a) {
      var m = /\/themenbereiche\/([a-z0-9-]+)\//.exec(a.url || '');
      if (!m) return;
      (a.entities || []).forEach(function (en) {
        var key = (en || '').trim();
        if (key && !map[key]) map[key] = m[1];
      });
    });
    return map;
  }

  // didactic: Lernpfad order (spec B1), alphabetic only as fallback option
  var SECTION_ORDER = [
    'einfuehrung-chemie',
    'aufbau-materie',
    'saeuren-basen',
    'redox-elektrochemie',
    'gleichgewicht-geschwindigkeit',
    'energetik',
    'anorganische-verbindungen',
    'erdoel-organische-stoffklassen',
    'reaktionstypen-organisch',
    'produkte-organisch',
    'biochemie',
    'analytische-methoden',
    'tipps-tricks',
  ];

  function assignEntitiesToSections(entities, articleSections, keywordsMap, sectionOrder) {
    var derived = {};
    var orderMap = {};
    (sectionOrder || SECTION_ORDER).forEach(function (s, i) {
      orderMap[s] = i;
    });
    // keyword list per section — normalized
    var kw = normalizeKeywords(keywordsMap);
    // priority 1: article-URL sections
    Object.keys(articleSections).forEach(function (name) {
      derived[name] = articleSections[name];
    });
    // priority 2: keyword overlap
    entities.forEach(function (e) {
      var name = (e.name || '').trim();
      if (derived[name]) return;
      var norm = name.toLowerCase();
      var best = null,
        bestScore = 0;
      Object.keys(kw).forEach(function (section) {
        var score = 0;
        kw[section].forEach(function (word) {
          if (norm.indexOf(word) !== -1) score++;
        });
        if (score > bestScore) {
          bestScore = score;
          best = section;
        }
      });
      if (best) derived[name] = best;
    });
    // priority 3: fallback bucket
    return derived;
  }
  // … plus normalizeKeywords, sectionCounts, buildPortalHtml, buildSearchResults,
  // renderHub (fetch /api/kg-data?limit=550 → build → DOM), init()
  // public API: window.WissennetzHub = { assignEntitiesToSections, sectionCounts,
  //   buildPortalHtml, buildSearchResults, SECTION_ORDER, sectionsFromArticles, init }
})();
```

Implementation notes:

- `sectionCounts(entities, sectionOf)` returns `{ total, bySection }` (trimmed names).
- `buildPortalHtml(bySection, order, active)` renders cards:
  `data-section="…"`, German name (`SECTION_LABELS` map — copy from
  `content/themenbereiche/*/_index.md` titles), concept count, color swatch
  (`SECTION_COLORS` — derive from `CAT_COLORS` palette), secondary link to
  `/themenbereiche/<slug>/`.
- Search: `buildSearchResults(query, entities, limit=6)` → top matches by `title/name`
  prefix+substring, used by Task 3.
- `init()`: guard `if (!window.WissennetzHub) …`; fetch with `AbortSignal.timeout(15000)`;
  on failure → render fallback link + still show search over static list (no graph).

Step 4 — run tests → green. Step 5 — lint clear; commit.

**Commit:** `feat(hub): Themen-Portal — section assignment (Artikel→Keyword→Fallback) + Karten`

---

## Task 2: d3-ego-graph — shape coding, topic graph, directed Vorwissen layout (TDD)

**Files:** modify `myhugoapp/static/js/visualization/d3-ego-graph.js`,
extend `tests/d3-ego-graph.test.js`

Step 1 — failing tests (append):

```js
describe('shape coding + topic graph (Part B)', () => {
  it('maps categories to distinguishable shapes', () => {
    expect(window.D3EgoGraph.shapeOf('stoff')).toBe('circle');
    expect(window.D3EgoGraph.shapeOf('konzept')).toBe('square');
    expect(window.D3EgoGraph.shapeOf('reaktion')).toBe('diamond');
    expect(window.D3EgoGraph.shapeOf('methode')).toBe('triangle');
    expect(window.D3EgoGraph.shapeOf('person')).toBe('hexagon');
    expect(window.D3EgoGraph.shapeOf('quelle')).toBe('hexagon');
    expect(window.D3EgoGraph.shapeOf('lernziel')).toBe('cross');
    expect(window.D3EgoGraph.shapeOf('unknown')).toBe('circle');
  });

  it('builds a bounded topic subgraph: seeds + 1-hop neighbors, capped', () => {
    const data = fixtureData(); // ~10 entities, 3 in topic, 20 other
    const built = window.D3EgoGraph.buildTopicNodesForTest(data, {
      topic: 'Säure-Base-Reaktion',
      topicSlugs: ['saeure-base-reaktion', 'base', 'saeure'],
      cap: 8,
    });
    expect(built.nodes.length).toBeLessThanOrEqual(8);
    expect(built.nodes.some((n) => n.id === 'e-saeure-base-reaktion')).toBe(true);
  });

  it('x-positions components left, related right in directed layout', () => {
    const group = window.D3EgoGraph.directedXGroupForTest({
      components: ['A'],
      relatedEntities: ['B'],
    });
    expect(group.components).toBe('left');
    expect(group.related).toBe('right');
  });
});
```

Step 2 — run → fail (missing exports).

Step 3 — implement in d3-ego-graph.js:

- `shapeOf(category)` map (circle/square/diamond/triangle/hexagon/cross) + `DRAWSHAPE`
  helper; **replace the single `<circle>` node render with a `renderNodeShape`** used by
  `createFullGraph`, `createEgoGraph`, and the new `createTopicGraph` (keep size
  semantics; hexagon/cross as small custom paths; diamond/triangle via `d3.symbol()`
  or path generators — plain SVG `path` shapes, no new deps).
- Legend: per-category entry now draws the SHAPE (not only circle) + color; keep
  "Besteht aus" dashed line + "Artikel" + "Grundlage" entries.
- `createTopicGraph(container, data, options)`:
  - `options.topic`, `options.topicSlugs` (canonical slugs), `options.cap` (default 80),
    `options.hintContainer` (hub hint), reuse container-clearing + zoom/pan + tooltip +
    click-to-entity (`entityHref`) from the shared internals.
  - `buildTopicNodes(data, opts)`: seeds = entities whose slugified name is in
    `topicSlugs`; neighbors = 1 hop via `relatedEntities`/`components`/articles
    (deterministic order, weight desc); cap; never drop a seed.
  - Directed layout: `x-anchor` groups — components + their seeds on `x = -w/4`,
    relatedEntities on `x = +w/4`, center group `x = 0`; `forceX` per group + `charge`
    by category (reuse existing simulation params). Composition edges rendered dashed
    with an arrow head (already the case for "Besteht aus").
  - Labels: show text labels when `nodes.length <= 25`, else hover-only (existing
    truncation at 15 chars + `aria-label` stay).
- `createEgoGraph`: accept `options.matches` (array of names) → `buildEgoNodes` gains a
  multi-center union path (1 hop, cap 30) — used by B3 search. Single `entity` path
  unchanged.
- Keep the Part A `entityHref` click navigation as-is (Slugs preferred).

Step 4 — tests green (all existing 35 + new). Step 5 — commit.

**Commit:** `feat(graph): Form-Kodierung nach Kategorie, createTopicGraph (≤80, Voraussetzungen links), Ego-Mehrfachzentren`

---

## Task 3: Hub wiring — wissennetz.md/HTML, search, fallback (TDD-light)

**Files:** modify `myhugoapp/content/wissennetz.md`, `myhugoapp/layouts/_default/wissennetz.html`,
delete `myhugoapp/static/js/wissennetz-graph.js` (replaced), extend hub tests.

Step 1 — tests for search + fallback rendering (extend `tests/wissennetz-hub.test.js`):

```js
it('search ranks prefix matches first, then substrings', () => {
  const hits = hub.buildSearchResults('säure', [
    { name: 'Säure-Base-Reaktion' },
    { name: 'Essigsäure' },
    { name: 'Base' },
  ]);
  expect(hits[0]).toBe('Säure-Base-Reaktion');
});

it('renders an empty state (no matches) instead of a graph', () => {
  const html = hub.buildEmptySearchHtml('xyz');
  expect(html).toMatch(/keine|Kein/i);
});
```

Step 2 — fail. Step 3 — implement:

- `wissennetz.html`: include `slugs.js` BEFORE `d3-ego-graph.js`; replace
  `wissennetz-graph.js` with `wissennetz-hub.js`. Hub markup in `wissennetz.md`:
  - `<div id="kg-search-wrap">` with `<input id="kg-search" placeholder="Begriff suchen…">`
  - `<div id="kg-portals">` (grid of portal cards)
  - `<div id="kg-graph-area">` (empty by default; gets topic/search graph)
  - `<div id="kg-hint">` — didactic banner
    "Starte mit deinen Voraussetzungen (links im Graphen)" shown once when a topic
    graph opens (dismissible via localStorage flag).
  - Button "Gesamtübersicht" → `createFullGraph` fallback.
- `wissennetz-hub.js` `init()` wires: click on portal card → `createTopicGraph`
  (needs `topic` name + `topicSlugs` from assignment: slugify all assigned entity
  names); search input (debounced 250 ms) → if ≥2 chars → `createEgoGraph(…,
{ matches: top 6 })` else reset to portals; breadcrumb "Wissensnetz / <Themenbereich>".
- Remove old `kg-controls` filter chips block from wissennetz.md? Keep category chips
  ONLY on the full-graph fallback. Simpler: keep `#kg-controls` markup but hide it on
  hub default view (JS toggles `hidden`). Decide: repurpose — hide on portals, show on
  "Gesamtübersicht" (full graph still uses filterControls).
- CSS: portal grid (responsive), cards, swatches, hint box; dark-mode via existing vars.

Step 4 — tests + manual `hugo:build` sanity (page renders, scripts resolve in built
`public/wissennetz/index.html`). Step 5 — commit.

**Commit:** `feat(hub): Portal-Ansicht im Wissensnetz — Suche, Karten-Grid, Vorwissen-Hinweis, Gesamtübersicht-Fallback`

---

## Task 4: API — by-state topics + COVERS_TOPIC entity names (TDD)

**Files:** modify `api/server.js` (~`/api/curricula/by-state/:state`), new
`tests/curricula-by-state.test.js`, extend `api/app` tests minimally.

Step 1 — failing tests (pure mapper extracted from the handler):

```js
// tests/curricula-by-state.test.js
// Extract the response mapper as a pure export? Route handler stays inline;
// we test the SHAPE by running the query builder and the mapper against mock records.
const path = require('path');
const { buildByStateQuery, mapCurriculumTopics } = require('../api/curricula-mapper.cjs');

describe('curricula by-state mapper (COVERS_TOPIC extension)', () => {
  it('includes collect(e.name) as entities per topic', () => {
    const q = buildByStateQuery();
    expect(q).toMatch(/COVERS_TOPIC/);
    expect(q).toMatch(/entities/);
  });

  it('caps objectives at 8 and entities at 12', () => {
    const rows = mapCurriculumTopics([
      {
        slug: 't1',
        title: 'Säuren',
        grade: '10',
        schoolType: 'gymnasium',
        objectiveCount: 12,
        objectives: Array.from({ length: 12 }, (_, i) => 'L' + i),
        entities: Array.from({ length: 20 }, (_, i) => 'E' + i),
      },
    ]);
    expect(rows[0].objectives.length).toBe(8);
    expect(rows[0].entities.length).toBe(12);
  });
});
```

Step 2 — fail (module missing). Step 3 — implement:

- Create `api/curricula-mapper.cjs` (CommonJS — server is CJS): exports
  `buildByStateQuery()` (the Cypher: adds
  `OPTIONAL MATCH (t)<-[:COVERS_TOPIC]-(e:Entity) WITH t, … collect(DISTINCT e.name) AS entities`
  and keeps existing fields) and `mapCurriculumTopics(records)` (objectiveCount via
  `toNumber()`, `objectives: slice(0,8)`, `entities: slice(0,12)`).
- `server.js` handler uses both (keep fallback path unchanged — fallback keeps
  `objectiveCount` only, no dead UI).
- Ordering stays `ORDER BY t.grade, t.title`.

Step 4 — tests green. Step 5 — commit.

**Commit:** `feat(api): by-state liefert COVERS_TOPIC-Entities (≤12) + Lernziele (≤8)`

---

## Task 5: curricula-state.js — Themen-Landkarte, Lernziele, Graph-Toggle (TDD)

**Files:** modify `myhugoapp/static/js/curricula-state.js`,
`myhugoapp/layouts/_default/curricula-state.html`, extend `tests/curricula-state.test.js` (new).

Step 1 — failing tests (pure builders):

```js
// tests/curricula-state.test.js
describe('curricula-state (Part B)', () => {
  let cs;
  beforeAll(() => {
    cs = loadModule();
  }); // new Function pattern like hub tests

  it('builds topic rows with canonical entity chips via Slugs.entityUrl', () => {
    global.Slugs = { entityUrl: (n) => '/entity/' + n.toLowerCase() + '/' };
    const row = cs.buildTopicRowHtml({ title: 'Säuren', entities: ['Säure', 'Base'] }, []);
    expect(row).toContain('href="/entity/säure/"'); // entityUrl applied
    expect(row).toContain('Säure');
  });

  it('highlights KMK operator verbs in Lernziele text', () => {
    const html = cs.highlightOperators('SuS erklären den pH-Wert.');
    expect(html).toContain('<strong>erklären</strong>');
  });

  it('caps Lernziele at 8 and renders the toggle', () => {
    const html = cs.buildTopicRowHtml(
      { title: 'Säuren', objectives: ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9'] },
      8
    );
    expect((html.match(/<li>/g) || []).length).toBeLessThanOrEqual(8);
    expect(html).toContain('Grafik anzeigen');
  });
});
```

Step 2 — fail. Step 3 — implement in curricula-state.js:

- Replace own `toSlug` link production with `globalThis.Slugs.entityUrl` (slugs.js
  loaded in the layout before this script). Keep a non-Slugs fallback for tests.
- `buildTopicRowHtml(topic, objectiveCap)`: chips `<a class="entity-tag" data-slug>` per
  `topic.entities` (from Task 4 API), Lernziele `<ul>` bullets (≤8) with
  `highlightOperators` — KMK verb list:
  `['nennen','benennen','beschreiben','erklären','erläutern','begründen','untersuchen','vergleichen','beurteilen','bewerten','ableiten','deuten','vorhersagen','planen','darstellen','zuordnen','berechnen','protokollieren']`
  (word-boundary regex, `<strong class="kg-operator">`).
  Toggle button `data-graph-toggle` per row.
- `init()`: after existing render — click handler on `data-graph-toggle` → lazy-load
  `/api/kg-data?limit=550` once (cache in module var) → find row's topic → slugs =
  slugify(row.entities) → `globalThis.D3EgoGraph.createTopicGraph(row graph container,
data, { topic: row.title, topicSlugs, cap: 30 })`. Re-click collapses (empty
  container). Wenn entities leer (alte API) → Button zeigt nur "keine Zuordnung" und
  ist deaktiviert (nie tote UI).
- `curricula-state.html`: add `<script src="/js/utils/slugs.js">` +
  `<script src="/js/visualization/d3-ego-graph.js">` before curricula-state.js.

Step 4 — tests green + manual: `hugo:build` + inspect built curricula page has the
script tags; `node -e` runtime check of chips hrefs vs `public/entity/*` dirs from a
545-export build (Part A procedure) — assert 0 dead chip hrefs. Step 5 — commit.

**Commit:** `feat(curricula): Themen-Landkarte — Chips via Slugs.entityUrl, Lernziele ≤8 mit KMK-Operator, Graph-Toggle ≤30`

---

## Task 6: E2E & CI — final verification

**Files:** none required (audit stage from Part A already covers the built tree);
add source-contract regression tests if missing (cheap):

- Extend `tests/wissennetz-hub.test.js` + `tests/curricula-state.test.js` with a
  source-contract test: hub/curricula chip hrefs MUST go through
  `globalThis.Slugs.entityUrl` (search the module source for `entityUrl(string)` /
  `Slugs.entityUrl` — same pattern as Part A d3 test).
- Verify:
  1. `npm test` — all suites green (existing 51 + new hub/curricula/curricula-mapper).
  2. `npm run lint` on touched files → zero findings.
  3. Full-data local pipeline (Part A procedure): fetch `/api/kg-data?limit=550` →
     string-shape → `myhugoapp/data/kg_data.json` → `node scripts/generate-entity-pages.mjs`
     → `npm run hugo:build` → `node scripts/audit-entity-links.mjs myhugoapp/public`
     → expect `0 mismatch, 0 missing` → restore tree (`git checkout data + content/entity`,
     `git clean -fd`, `sudo rm -rf myhugoapp/public`).
  4. `docker build -t chemie-b-check .` — audit stage prints
     `Entity link audit passed` (regression guard still green with hub changes).
  5. Python YAML check on deploy.yml (unchanged this part but cheap).
- Commit any test-only additions.

**Commit:** `test(wissensnetz): Source-Contract für entityUrl in Hub/Curricula-Chips`

---

## Post-implementation verification & handoff

- `git log --oneline -10` shows one commit per task; `git status` clean.
- Update plan checkboxes (all `- [x]`).
- **Deploy:** user triggers `gh workflow run "Deploy chemie-lernen.org" --ref main`
  (workflow_dispatch only on main; auto-deploy only on master push — safe). Smoke checks
  #1–#8 (incl. legacy umlaut URL) must pass; THEN manual browser pass:
  - `/wissennetz/`: 13 cards in Lernpfad order, click card → subgraph with shapes,
    Voraussetzungen left; search 'säure' → ego graph; Gesamtübersicht → full graph.
  - `/curricula/HE/`: topic rows with chips (all resolve), Lernziele bullets with
    operator `<strong>`, graph toggle renders a ≤30-node topic graph.
- Part B afterwards: none planned beyond this; follow-ups (e.g. Lernpfad-Sequenz auf
  Portalseite, zusätzliche Sektionen) go into the spec's out-of-scope list.

## Known risks & mitigations

| Risk                                     | Mitigation                                                                                                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COVERS_TOPIC direction wrong in KG       | Server query tries `(t)<-[:COVERS_TOPIC]-(e)`; if the live response has empty `entities` for all topics, swap direction to `(t)-[:COVERS_TOPIC]->(e)` (verified at deploy smoke; chips fall back to keyword matching client-side so UI never breaks) |
| `topicSlugs` mismatch (name → canonical) | Seeds resolved by slugify(name) with trim; seeds missing from data are skipped, cap still holds                                                                                                                                                      |
| Lemma-/keyword-Assignment ungenau        | Keyword lists are curated per section; article-URL assignment is priority 1 and exact                                                                                                                                                                |
| Hub fetch timeout / API down             | `AbortSignal.timeout(15000)` + fallback message + retry hint; portals still show names from a bundled static copy if feasible (optional)                                                                                                             |
| d3 symbol API changes                    | Use plain SVG path generators (no d3.symbol dependency)                                                                                                                                                                                              |
| Lernziele-Text ohne Operator-Verb        | `highlightOperators` leaves text unchanged — never a dead UI element                                                                                                                                                                                 |

---

## Task 6 — Abschlussverifikation (checked, 2026-08-26)

- [x] `npm test` — 99 Suiten / 2037 Tests grün (deren .mjs-Umzug + meine 56 Suiten inkl. Hub/Curricula/Curricula-Mapper; 3 Suiten per `__flaky__`-Ignore übersprungen).
- [x] `npm run lint` — 0 errors / 0 warnings auf `main` nach Rebase (Task-6-Fix `3aa6a1a0` + deren eslint-Policy `27e48f3d`).
- [x] Integrations-Rebase: lokale main (~580 Commits, Part A+B) auf `origin/main` (~981 Commits, Refactor-Serie) via `git rebase --onto origin/main df717861 main` — 8 Konflikte didaktisch synthetisiert; `api/server.js` = deren modularisierte Architektur (routes/ + services/), meine by-state-Erweiterung in `api/routes/curricula.js` + `api/curricula-mapper.cjs`.
- [x] Full-data pipeline (CI-Run): Export KG → generate-entity-pages → Docker-Build inkl. audit stage → `Entity link audit passed`.
- [x] Deploy live (3 aufeinanderfolgende Runs, zuletzt `e31dd2cb`): test-Job (bun install + npm ci api + lint + 99 Suiten) und build-and-deploy (Legion-Runner, Neo4j-Export, Entity-Pages, pagefind, ghcr push, SSH-Deploy) grün.
- [x] Live-API-Verifikation: `GET /api/curricula/by-state/:state` → `source: neo4j`, **28/28 BY-Topics mit entities** (Konzept-Chips via COVERS_TOPIC ∪ FULFILLS ∪ Wortgrenzen-Text-Match; Stopword/`\Q…\E`/Längen-Filter gegen Rauschen). `/wissennetz/`, `/entity/zink/`, `/curricula/by/` → 200.
- [x] Infra-Nebenerkenntnisse: `package-lock.json` gitignored (bun ist Paketmanager); Pagefind-npx-Download ist transient (einmaliger Retry nötig); ESLint global sauber.

**Abschluss-Hinweis:** Nebenläufiger Agent hat während des Rebase `281cebb9` (Rate-Limit-Fix) gepusht — mein finaler Stand liegt darauf (`e31dd2cb`..`58ff4275`); `git push` danach ff nötig war, ist erledigt.
