# Wissensnetz: Canonical Slugs, Link Audit & Themen-Portal Graph

Date: 2026-08-26
Status: Approved (user: "a + b")
Component: hugo-chemie-lernen-org — `/wissennetz/` graph, entity pages, curricula pages

## Problem Statement

Two user-reported problems on the live site (verified 2026-08-26):

1. **Dead concept links.** A full crawl of all 1759 sitemap URLs plus every `/entity/` href on entity,
   article, curricula and themenbereich pages found **exactly 20 dead links**, all of the form
   `/entity/...`:
   - 17 umlaut slug mismatches: `/entity/essigs%C3%A4ure/` (page exists as `essigsaeure`),
     `hydrath%C3%BClle`, `martin-luther-universit%C3%A4t-halle-wittenberg`,
     `friedrich-w%C3%B6hler`, `h%C3%A4m`, `hall-h%C3%A9roult-prozess`, `weins%C3%A4ure`, etc.
   - 3 special-character slug errors: `/entity/gilbert-n.-lewis/` (period kept),
     `/entity/eiseni/` (parenthesis dropped without separator), `/entity/eiseniii-oxid-fe2o3/`
     (page slug differs).

   Root cause: **at least three different slug implementations** exist (d3-ego-graph.js `slugify`,
   the entity-detail inline-JS tag builder, and build-time generators), with different rules for
   umlauts (transliterate `ä→ae` vs keep raw/URL-encoded) and punctuation (periods, parentheses,
   subscripts). There is no single source of truth, so links are rebuilt inconsistently every time
   a generator or consumer changes. Fixing the current 20 by hand does not prevent recurrence.

2. **Unübersichtlicher Graph.** `/wissennetz/` renders all **545 entities + articles in a single
   force-directed graph** (700 px height). Zoom and a legend exist, but there is no initial
   clustering or structural entry point, so the result is a hairball. The same data feeds the
   curricula views.

## Goals

- Zero dead `/entity/` links, durably enforced by CI.
- One canonical slug utility used by every link producer (client JS and build-time Node scripts).
- A Wissensnetz that is navigable: topic portals → bounded subgraphs, search-driven ego graphs.
- Curricula ("Lehrpläne") presented as a calm, structured topic map with concept chips that link to
  working `/entity/` pages, **plus** an optional compact subgraph per curriculum topic (user: "a + b").

Non-goals: redesigning the Neo4j schema, rewriting the whole API, changing article content pipeline
output format.

## Part A — Canonical slugs, dead-link prevention, redirects

### A1. Shared slug module (single source of truth)

New module `myhugoapp/static/js/utils/slugs.js` exposing:

- `slugify(name)` → canonical entity slug, ASCII-only:
  - lowercase
  - explicit German transliteration: `ä→ae ö→oe ü→ue ß→ss` (matches existing page slugs)
  - general diacritics via NFD normalization: strip combining marks (`é→e`, `è→e`, `ñ→n`, …),
    then explicit replacements for chars NFD can't handle (e.g. `æ→ae`, `œ→oe`, `ø→o`, `å→a`)
  - subscript digits `₀₁₂₃₄₅₆₇₈₉→0..9`
  - every remaining run of non `[a-z0-9]` → single `-` (handles spaces, parentheses, periods,
    slashes, `+`, `∘`, `°`, etc.)
  - trim leading/trailing `-`
  - **idempotent**: `slugify(slugify(x)]) === slugify(x)` so it is safe to apply twice
- `entityUrl(name) → '/entity/' + slugify(name) + '/'`
- a `SLUG_INDEX` map name→slug exported for build-time parity checks

The module must be plain ES5-compatible JavaScript (IIFE assigning to `globalThis.Slugs`) so it can
run in the browser, in the vm-based node:test stubs (existing test pattern), and be imported by
Node build scripts.

A Node mirror `scripts/lib/slugs.mjs` re-exports the same functions by wrapping the shared file
(`import slug source + export`), so client and server **cannot drift**. Parity is enforced by a test
that compares outputs over a corpus of real entity names.

### A2. Route all link producers through `entityUrl()`

Change every place that builds an `/entity/` URL:

- `myhugoapp/static/js/visualization/d3-ego-graph.js` — replace internal `slugify` with
  `globalThis.Slugs.entityUrl` (keep a thin local alias for existing tests).
- The entity-detail inline script in `myhugoapp/layouts/entity/single.html` — the tag builders for
  related entities, components (as links where pages exist), sources, and university/person tags
  must use `Slugs.entityUrl` instead of their local ad-hoc slug chains.
- `myhugoapp/static/js/entity-index.js` (entity browsing/search), `wissennetz-graph.js`,
  `curricula-state.js`/`curricula-index.js` — any `/entity/` construction.
- Build-time generators that emit entity links into generated markdown/frontmatter:
  `scripts/generate-entity-pages.mjs`, `scripts/generate-curricula-pages.mjs` — use the Node
  mirror so generated hrefs are ASCII slugs from the start.

### A3. CI link-audit test (prevents recurrence)

New test `tests/link-audit.test.js` (node:test, pure unit, no network):

1. Given a corpus of entities (real names from `data/kg_fallback.json` + fixture kg_data), compute
   the slug set; assert `entityUrl(name)` is consistent (no duplicates, no non-ASCII).
2. Parse fixture HTML (representative entity detail page, wissennetz page, curricula page) and
   collect every `href` matching `^/entity/` **outside `<script>` blocks**; assert every such href
   resolves to a known slug (or is one of the legacy alias list).
3. A `scripts/audit-entity-links.mjs` that runs **after `hugo build`** in CI: walks the built
   `public/` tree, collects `/entity/` hrefs from real `<a>` tags, resolves them against the
   slug registry, exits non-zero on any unknown path. Wired into the existing test job in GitHub
   Actions so a dead link fails CI.

### A4. Legacy redirects for the 20 current dead links

One-time generated Hugo alias pages (frontmatter `aliases: [...]` on the corrected entity pages,
matching old URL-encoded/umlaut paths against `urldecode`). Coverage: the 17 umlaut URLs + 3
special-character URLs, plus generic safety: any `/entity/<urlencoded-umlaut-slug>/` request is
decoded and 301-redirected to the canonical `/entity/<ae-slug>/` if that page exists. Implemented as
a tiny nginx/traefik location on the server OR Hugo aliases — the **Hugo aliases** variant is
preferred (stays in git, no server config drift); verified by extending the link-audit script to
assert that each legacy URL returns 200/301.

## Part B — Themen-Portale: structured Wissensnetz navigation

### B1. `/wissennetz/` becomes a topic hub (portal landing)

New JS `myhugoapp/static/js/wissennetz-hub.js`:

- Fetches entities + a lightweight fetch of article → themenbereich mapping (existing article API
  data already carries section/`themenbereich` info; see data flow) and renders **portal cards**,
  one per themenbereich section (the 13 sections under `content/themenbereiche/`): card shows the
  German name, concept count, small color swatch. Cards are grouped alphabetically; a search box
  sits above.
- Entity→portal assignment strategy (in priority order):
  1. article `MENTIONS` link (`/api/kg-data` already returns `articleCount` + article URLs; extend
     the entity payload with `themenbereiche: [section…]` derived from linked article sections).
  2. name keyword overlap with section keyword lists (existing `link-entities-to-curricula.mjs`
     already maintains keyword lists per topic).
  3. fallback category bucket ("Weitere Begriffe").
- Interactions: click portal card → `createTopicGraph` (B2) in the same container; breadcrumb
  "Wissensnetz / Themenbereich" back to hub. Empty/error state falls back to the current full
  graph with a notice.

### B2. Bounded topic subgraph

Extend `d3-ego-graph.js` with `createTopicGraph(container, data, { topic, ... })`:

- Input: the topic's entity slugs (from B1 assignment); renders **only** those entities plus their
  direct neighbors (1 hop) capped at ~80 nodes, colored by category (existing `colorize`),
  legend re-used, same zoom/pan and click-to-entity behavior as today.
- Cluster forces: charge by category group so stoff/reaktion/konzept/methode separate visibly.
- Node labels: show on hover/drag and when the node count is small; the existing 15-char
  truncation and text-alternative list for a11y stay.
- Tests: extend `d3-ego-graph.test.js` for the new topic-filter/grouping logic (vm DOM stubs).

### B3. Search-driven ego graphs

On the hub, typing in the search box triggers an **ego graph around the top matches**
(reuse `createEgoGraph` with the matched entities as centers, max 30 neighbor nodes). If a query has
no matches, show the existing "Keine Daten gefunden" empty state. Keeps the interactive exploration
that users like without the 545-node hairball.

### B4. Curricula ("Lehrpläne") as topic maps + compact subgraphs

On each `/curricula/<state>/` page (layout `curricula-state`, data from
`/api/kg-data?lehrplan=true`):

- Render a **structured topic map**: topics grouped by grade level, each topic row shows its
  objective count, and concept chips (via `Slugs.entityUrl`) linking to `/entity/…` pages —
  guaranteed live by Part A.
- Per topic, a **collapsible compact subgraph** ("Grafik anzeigen" toggle) using
  `createTopicGraph` with the topic's curriculum topics→entities assignment
  (`COVERS_TOPIC` in the KG; fallback: keyword match) capped at ~30 nodes.
- Klassische Liste bleibt die Standardansicht (seniorengerecht/ruhig); Graph ist eine optionale
  Zusatzansicht.

## Data flow

- `GET /api/kg-data` (existing) — entities with `relatedEntities`, `components`, `articleCount`.
- Extend entity payload with `themenbereiche: string[]` (from linked article sections) and
  `topics: string[]` (curriculum topic titles from `COVERS_TOPIC`, only for entities that have
  them). Both optional; `null` when unavailable. Backward compatible — existing consumers ignore
  unknown keys.
- `GET /api/kg-data?lehrplan=true` (existing) — used by B4; no schema change needed, B4 consumes
  `curriculumMeta` + topic data already returned.
- Fallback: `data/kg_fallback.json` continues to serve hub/topic assignment when Neo4j is down;
  portal cards degrade to category buckets.

## Error handling

- API timeout/5xx: hub shows current fallback (full graph or category list) with a notice; entity
  pages keep their existing inline-JS fallback text.
- Unknown topic slug (deep link `#saeuren-basen`): hub renders the search page with the topic name
  prefilled; no broken URL.
- Link audit in CI fails the build on any dead `/entity/` href → authors must fix or (rarely)
  extend the legacy alias list.

## Testing

- `tests/slugs.test.js` (new): slugify rules (umlauts, diacritics, subscripts, punctuation,
  idempotence, parity vs the 545 live names corpus), `entityUrl`.
- `tests/link-audit.test.js` (new): fixture-HTML href audit + legacy alias coverage.
- `tests/d3-ego-graph.test.js` (extend): topic-filter membership, neighbor cap, grouping forces,
  labels/legend unchanged behavior.
- `tests/kg-data-quality.test.js` (extend): entity payload now also validated for `themenbereiche`
  and `topics` array types.
- Existing suite (JS node:test + any Python) stays green; CI job runs the new audit against the
  built `public/`.

## Out of scope / follow-ups

- Neo4j schema changes; newer entity pages for the (currently stub-only) 54 repo markdowns — CI
  already regenerates them from `kg_data.json`; Part A ensures their links are canonical.
- The deployed API being older than `main` (observed: live `/api/kg-data` ignores `lehrplan=true`);
  verification step "deploy latest main and re-check" covers this operationally, no code change.
