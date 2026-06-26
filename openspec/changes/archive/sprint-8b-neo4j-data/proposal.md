# Change: sprint-8b-neo4j-data (ARCHIVED)

**Status:** Archived (shipped 2026-06-26)
**Commit:** `5d5e6238`
**Implemented by:** Sisyphus
**Spec impact:** `specs/entity-knowledge-graph/spec.md` REQ-EKG-1, 2, 3, 6

## Why

- `myhugoapp/data/kg_data.json` was empty (`{articles:[], entities:[]}`)
- The 54 entity pages were stale leftovers from a prior export
- Only `RELATED_TO` was being written; `BESTEHT_AUS` and `GEHOERT_ZU`
  were read but never written
- No `/api/kg-stats` endpoint
- Tests covered UI/API shape, not data integrity

## What changed

- **`scripts/export-kg-data.mjs`** — lifted hard `LIMIT 500/100`
  ceilings to configurable env vars (`LIMIT_ENTITIES=5000`,
  `LIMIT_ARTICLES=10000`, etc.); all limits now passed as `$limit`
  Cypher params (no more string interpolation)
- **`scripts/backfill-orphan-rels.mjs`** — new script that writes
  `:BESTEHT_AUS` (from `components`) and `:GEHOERT_ZU` (from
  `kategorie` → :Category nodes); idempotent, `--dry-run` and
  `--wipe` flags
- **`scripts/generate-entity-pages.mjs`** — produces richer markdowns
  with description template, relatedEntities list, components list,
  article list; prunes stale pages (except the 3 hand-written
  element markdowns)
- **`myhugoapp/layouts/shortcodes/element-detail.html`** — new
  shortcode for periodic-table-style element cards
- **`/api/kg-stats`** — new endpoint, 6 Cypher counts, 5-min LRU
  cache, no comments
- **`docs/KNOWLEDGE_GRAPH_SCHEMA.md`** — new schema doc
- **`tests/kg-data-quality.test.js`** — 18 new tests for orphan
  detection, dangling refs, duplicate names, kategorie coverage,
  element completeness, description coverage

## Capabilities added

- Pipeline re-established (kg_data.json is now populated)
- Data-quality signals visible via `/api/kg-stats`
- Backfill scripts make the schema vocabulary (10 rel types)
  actually populated
