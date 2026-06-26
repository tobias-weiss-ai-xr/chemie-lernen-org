# Tasks: sprint-8b-neo4j-data (ARCHIVED)

- [x] **8b.1** `export-kg-data.mjs` — lift limits, env-driven
      (LIMIT_ENTITIES, LIMIT_ARTICLES, etc.)
- [x] **8b.2** `export-kg-data.mjs` — parameterise all `$limit` in
      Cypher (no string interpolation)
- [x] **8b.3** `backfill-orphan-rels.mjs` — write `:BESTEHT_AUS`
      and `:GEHOERT_ZU` (idempotent, dry-run, wipe)
- [x] **8b.4** `generate-entity-pages.mjs` — richer markdowns
      (description, relatedEntities, components, articles)
- [x] **8b.5** `generate-entity-pages.mjs` — prune stale pages
      (preserve 3 hand-written elements)
- [x] **8b.6** `element-detail.html` shortcode
- [x] **8b.7** `/api/kg-stats` endpoint (6 queries, 5-min cache)
- [x] **8b.8** `docs/KNOWLEDGE_GRAPH_SCHEMA.md`
- [x] **8b.9** 18 data-quality tests in
      `tests/kg-data-quality.test.js`
