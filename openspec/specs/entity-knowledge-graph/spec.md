# Spec: entity-knowledge-graph

**Capability:** Entity Knowledge Graph for chemie-lernen.org
**Owners:** Sisyphus (Sprint 6, 8a, 8b)
**Status:** Active — main spec; deltas via `openspec/changes/`

---

## Purpose

chemie-lernen.org maintains a knowledge graph of chemistry entities
(Stoffe, Konzepte, Reaktionen, Methoden, Personen, Quellen, Lehrpläne,
Lernziele, Didaktik) extracted from ~1,000 articles and ~5,000 learning
objectives across 16 German state curricula. The graph powers:

- **Entity pages** at `/entity/{slug}/` with related-entity navigation
  and article links
- **Wissensnetz** at `/wissennetz/` with full-graph visualization
- **RAG context** for the KI-Assistent
- **A11y-compliant** ego-graph with click-to-navigate, screen-reader
  fallback, and `prefers-reduced-motion` handling

## Requirements

### REQ-EKG-1: Neo4j-backed knowledge graph

The graph lives in Neo4j 5.26 community edition (`chemie` database,
`bolt://chemie-neo4j:7687`). Schema:

- 4 node labels: `:Entity`, `:Document`, `:Tag`, `:Content`
- 10 relationship types: `:HAS_TAG`, `:MENTIONS`, `:RELATED_TO`,
  `:BESTEHT_AUS`, `:ERFUELLT`, `:TEIL_VON`, `:GEHOERT_ZU`, plus 12
  semantic types from `kg-enrich-relations.mjs` (`:ERZEUGT`,
  `:BESCHREIBT`, `:AEHNLICH_ZU`, `:BEINHALTET`, `:BETEILIGT_AN`,
  `:WIRD_VERWENDET_IN`, `:VERALLGEMEINERT`, `:VERGLEICHBAR`,
  `:DEMONSTRIERT`, `:VERWENDET`, `:WENDET_AN`, `:ENTDECKT`,
  `:QUELLE_VON`)
- 9 `kategorie` values: `stoff`, `konzept`, `reaktion`, `methode`,
  `person`, `quelle`, `lehrplan`, `lernziel`, `didaktik`
- `:Entity` PK is `name` (lowercased)

### REQ-EKG-2: Build-time export pipeline

- `scripts/export-kg-data.mjs` runs in CI before Hugo build, exports the
  full graph (default 5,000 entities, 10,000 articles) to
  `myhugoapp/data/kg_data.json` via parameterised Cypher (`$limit`
  Cypher params, never string-interpolated).
- All scripts accept `LIMIT_ENTITIES`, `LIMIT_ARTICLES`,
  `LIMIT_CURRICULA`, `MAX_ARTICLES_PER_ENTITY` env vars.
- `scripts/export-kg-data.mjs` exits 0 even if Neo4j is unreachable,
  emitting a `[CI] Neo4j export skipped (non-fatal)` warning.

### REQ-EKG-3: Entity page generation

- `scripts/generate-entity-pages.mjs` reads `kg_data.json` and writes
  one Hugo markdown per entity to `myhugoapp/content/entity/{slug}/index.md`.
- Frontmatter includes: `title`, `description`, `kategorie`,
  `articleCount`, `relatedEntities`, `components`, `kategorie`.
- The generator prunes stale pages not in the current data, except
  hand-written element markdowns (Kohlenstoff, Palladium, Platin) which
  are preserved.
- Element entities use `element-detail.html` shortcode to render a
  periodic-table-style card with `atommasse`, `schmelzpunkt`, `dichte`.

### REQ-EKG-4: SSR rendering

- `myhugoapp/layouts/entity/single.html` server-renders all entity
  metadata from `.Site.Data.kg_data` at build time.
- HTML source contains entity name, category badge, article count,
  relation count, JSON-LD structured data, OG/Twitter meta tags.
- The skeleton loader is hidden by default and only shows when SSR
  data is missing.
- A `<noscript>` fallback shows the entity name, description, and
  related links without any JavaScript.

### REQ-EKG-5: API surface

- `GET /api/kg-data` — full graph JSON (fallback to content-links.json
  if Neo4j is down). Result is inlined into `ki-assistent.html`.
- `GET /api/kg-stats` — 6 Cypher counts:
  - entities by `kategorie`
  - relationship type counts
  - 5 data-quality signals: `missingDescription`, `missingKategorie`,
    `orphans` (no relations), `danglingRefs`, `duplicateNames`
  - 5-min in-memory LRU cache
- `GET /api/entity/:slug` — single entity detail (used by KI-Assistent
  for currentEntity context)

### REQ-EKG-6: Data quality

- All `relatedEntities` references must point to existing entities
  (no dangling refs).
- All entities have a `kategorie` (no null).
- `description` coverage ≥ 50% (enriched from first-mention article).
- Element entities have non-null `symbol` and `ordnungszahl`.
- `scripts/backfill-orphan-rels.mjs` writes `:BESTEHT_AUS` (from
  `components`) and `:GEHOERT_ZU` (from `kategorie` → :Category nodes).
- Tests in `tests/kg-data-quality.test.js` (18 cases) assert the above.

## Scenarios

### S-EKG-1: Build a fresh entity page

**Given** a new entity "Glucose" with `kategorie=stoff`,
`description="Traubenzucker, ein Monosaccharid"`, 3 related entities,
5 articles
**When** the build pipeline runs:

1. `export-kg-data.mjs` exports "Glucose" with 5 articles into
   `kg_data.json`
2. `generate-entity-pages.mjs` writes
   `content/entity/glucose/index.md` with frontmatter and a body
3. Hugo renders the page from `layouts/entity/single.html`
   **Then** `/entity/glucose/` returns HTTP 200 with:

- `<h1>Glucose</h1>` in the HTML source
- `<script type="application/ld+json">` block with `DefinedTerm` schema
- 3 related-entity tags in the source
- 5 article links in the source
- The D3 ego-graph initializes and renders in the browser

### S-EKG-2: Neo4j unreachable during build

**Given** Neo4j is down
**When** `export-kg-data.mjs` runs
**Then** it logs `[CI] Neo4j export skipped (non-fatal)` and exits 0,
`kg_data.json` retains the previous content (or is empty if first run),
Hugo still builds successfully

### S-EKG-3: KI-Assistent requests entity context

**Given** the user opens `/entity/ammoniak/` and clicks the
"Ask the AI" button
**When** the chat sends `POST /api/chat` with
`{"message": "...", "currentEntity": "Ammoniak"}`
**Then** the system prompt includes
`"Du liest gerade die Seite zu „Ammoniak". Beziehe dich bevorzugt auf diesen Begriff."`
and the RAG context includes the entity with its `description` and
related entities ordered by TF-IDF score

### S-EKG-4: Data quality regression

**Given** an entity with a dangling `relatedEntities` reference to a
non-existent entity
**When** `tests/kg-data-quality.test.js` runs against a live Neo4j
**Then** the test fails with a list of all dangling references
**And** `npm run validate` exits 1
