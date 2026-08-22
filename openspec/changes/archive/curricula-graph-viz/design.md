# Design: curricula-graph-viz

## Context

- Neo4j `chemie` DB holds both subsets (labels verified 2026-08-12):
  - **Modulhandbuch**: `University` (30) `-[:OFFERS]->` `UniversityModule`
    (822) `-[:COVERS|TEACHES]->` `Entity` (227); `UniversityModule`
    `-[:CARRIES]->` `ECTS`, `-[:OFFERED_IN]->` `ModuleOffering`;
    `Content -[:TEACHES]-> UniversityModule` (189).
  - **Lehrplan**: `Curriculum` (per state/school_type, ~50)
    `-[:HAS_TOPIC]->` `Topic` (1479), `-[:HAS_SUBTOPIC]->` `SubTopic`
    (1788); `Topic -[:HAS_LEARNING_OBJECTIVE]->` `LearningObjective`
    (19,659); `Entity(kategorie='lehrplan')` (1504)
    `-[:BEINHALTET|RELATED_TO|FULFILLS|ERFUELLT]->` Entity/Lernziel,
    `-[:MENTIONS]->` Content; non-lehrplan `Entity` (konzept/stoff…)
    `-[:COVERS_TOPIC]->` `SubTopic` (1976).
- Current index UI (`curricula-index.js`, 1130 lines) renders four tabs
  as flat lists/tables fetched from `/api/kg-data?lehrplan=true`.
- `entity-graph-cytoscape.js` already proves the cytoscape pattern on
  `/entity/` (labels constant size, cose layout, category colors,
  node-click details). Vendor at `/js/vendor/cytoscape.min.js`.

## Goals / Non-Goals

**Goals:**

- One interactive graph on `/curricula/` showing both subsets and their
  bridges (UniversityModule–Entity–SubTopic; Curriculum–Topic–Objective).
- Scope switcher: All / Universitäten / Lehrpläne; state & university
  filters; search highlight; click → detail panel.
- Backend returns cytoscape-ready nodes/edges with sane caps.

**Non-Goals:**

- No changes to per-state detail pages (`/curricula/<state>/`).
- No new data import — only read/visualize existing KG.
- No D3/Three rewrite; reuse vendored cytoscape.
- The `/modulhandbuch/` page keeps its own UI (graph is an additional
  entry point).

## Decisions

- **D1 — One new endpoint `GET /api/curricula/graph`** in
  `api/routes/curricula.js`. Params: `scope` (`all|universities|
curriculum`), `university` (short code), `state` (state_abbr),
  `limit` (node cap, default 500, max 1500), `q` (name substring).
  Returns `{ nodes:[{id,label,type,meta}], edges:[{source,target,
type}], meta:{counts, truncated} }`.
- **D2 — Node id scheme**: namespaced ids to keep them stable across
  scopes: `uni:<short>`, `mod:<uni>:<code>`, `cur:<slug>`,
  `topic:<slug>`, `sub:<slug>`, `lo:<slug>` (objectives only appear in
  `scope=curriculum` with small caps), `ent:<slug>`, `page:<url>`.
- **D3 — Edge mapping**: OFFERS (uni→mod), COVERS+TEACHES (mod→ent,
  both mapped to a single colored edge type "verbindet"), CARRIES
  (mod→ects as property, not node — ECTS shown as badge), HAS_TOPIC
  (cur→topic), HAS_SUBTOPIC (topic/cur→sub), HAS_LEARNING_OBJECTIVE
  (topic→lo), COVERS_TOPIC (ent→sub), MENTIONS/BEINHALTET (lehrplan
  ent→page/ent, capped), TEACHES (page→mod).
- **D4 — Caps**: universities+modules always full (852 nodes);
  curriculum scope caps topics+subtopics+objectives by `limit`,
  preferring nodes with highest degree; objectives capped hard at 150
  per request.
- **D5 — Neo4j query strategy**: 3 parallel queries (universities,
  curriculum structure, entity bridges), merged in JS. All label-scoped,
  no code-analysis labels.
- **D6 — Frontend**: rewrite `curricula-index.js` as a cytoscape
  renderer mirroring `entity-graph-cytoscape.js` conventions (same style
  tokens, node colors per type, click → `/api/kg-data/entity/<slug>`
  or inline meta). Lazy-load cytoscape vendor from the template like
  `/entity/`. Scope/state/university controls re-fetch the graph.
- **D7 — a11y/UX**: nodes keyboard-focusable, details panel is a
  `<div role="complementary">`, search has live region, prefers-reduced-
  motion respected (no auto-rotation), German labels.

## Risks / Trade-offs

- **Payload size**: full university graph ≈ 850 nodes / ~1200 edges
  (~400 KB JSON) — acceptable for lazy route; caps protect curriculum
  scope. `limit` param lets clients trim.
- **Objective count**: 19.6k objectives can't render — hard cap + show
  objectives only for a focused topic (click topic → "Lernziele anzeigen"
  re-fetch with `scope=curriculum&topic=<slug>`).
- **Neo4j load**: 3 read queries per request, cached in-memory (short
  TTL 60s, keyed by scope+params) to survive traffic.
- **Existing tests**: curricula tests assert the old tab UI indirectly —
  they test API routes, not DOM; the graph endpoint is additive, so they
  stay green. `test-curricula-modulhandbuch.spec.js` (Playwright) may
  assert tab buttons — will be updated to the graph selector.
