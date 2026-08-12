# Change Proposal: curricula-graph-viz

## Why

The curricula area (`/curricula/`) currently renders a tabbed list UI
("Durchsuchen / Ländervergleich / Lernziele / Inhalte") that shows flat
cards and comparison tables. The data behind it — the Lehrplan graph
(Curriculum → Topic → SubTopic → LearningObjective, 16 Bundesländer) and
the Modulhandbuch graph (University → UniversityModule → Entity/ECTS) —
is a connected knowledge graph stored in Neo4j, but the UI never exposes
that connectivity. Users cannot see _how_ a university module relates to
a school topic, which learning objectives a state curriculum covers, or
where content pages bridge the two. The Ländervergleich tab in
particular is not useful because it only compares name matches in a
flat table.

The fix: replace the tab list with an interactive **graph visualization**
of the Lehrplan/Modulhandbuch knowledge graph (cytoscape.js, already
vendored for `/entity/`). Nodes are universities, modules, curricula,
topics, subtopics, learning objectives, entities and content pages;
edges are the KG relationships. Users can switch scope (All /
Universitäten / Lehrpläne), search, click nodes for details and follow
connections.

## What Changes

- **New API**: `GET /api/curricula/graph` returns cytoscape-ready
  `{ nodes, edges, meta }` with scope params
  (`scope=all|universities|curriculum`, `university=CAM`,
  `state=RP`, `limit=N`, `q=search`).
- **Frontend rewrite**: `myhugoapp/static/js/curricula-index.js` stops
  rendering the 4-tab list and renders an interactive cytoscape graph:
  - scope switcher (Alle / Universitäten / Lehrpläne)
  - search box (highlights matching nodes, filters edges)
  - legend of node types/edge types
  - click node → detail panel (name, type, metadata, links to
    `/entity/<slug>` or module page)
  - zoom/pan, fit, force-directed layout (cose)
- **Template**: `curricula-index.html` gets the graph container +
  cytoscape vendor loading (same lazy pattern as `/entity/`), keeps the
  existing title/intro.
- **Keep**: the per-state detail pages (`/curricula/<state>/`,
  `curricula-state.js`, `curricula.html` accordion) stay as-is — they are
  deep-read pages, not the index.
- **Remove UI**: the four tabs (Durchsuchen / Ländervergleich /
  Lernziele / Inhalte) and their flat list/compare renderers.

## Capabilities

### New Capabilities

- `curricula-graph`: interactive knowledge-graph visualization of the
  Lehrplan + Modulhandbuch subsets, backed by a dedicated graph API.

### Modified Capabilities

- `lehrplan-curriculum`: the curricula index page changes from tabbed
  list/compare UI to a graph visualization (requirement change for the
  index surface; per-state pages unchanged).
- `modulhandbuch-university`: module-handbook data becomes browsable
  inside the curricula graph (scope=universities) in addition to the
  existing `/modulhandbuch/` page.

## Impact

- `api/routes/curricula.js` — add `/api/curricula/graph` route
  (Neo4j reads only, scoped to chemie subset labels).
- `myhugoapp/static/js/curricula-index.js` — full rewrite (graph renderer).
- `myhugoapp/layouts/_default/curricula-index.html` — graph container +
  cytoscape lazy loading, drop the tab chrome.
- `myhugoapp/static/js/vendor/cytoscape.min.js` — already present,
  reused.
- Tests: new `tests/curricula-graph.test.mjs` (route shape, scoping,
  caps), keep existing curricula tests green.
- Perf: cytoscape vendor is lazy-loaded only on `/curricula/`; graph
  endpoint caps nodes (default limit, configurable) so payloads stay
  small.
