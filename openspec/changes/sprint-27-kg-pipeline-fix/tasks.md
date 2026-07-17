## Sprint 27: KG Pipeline Fix + Entity Quality

### Pipeline + Export

- [x] 27.1: Fix Integer→number conversion in `export-kg-data.mjs` for `articleCount` — use `.toNumber?.() ?? Number()` pattern
- [x] 27.2: Filter null/undefined article URLs in export — skip documents without `url` property
- [ ] 27.3: ⛔ BLOCKED — Run export locally (with Neo4j) or verify deploy.yml NODE_PATH fix — Neo4j not reachable in dev environment

### Entity Page Bugs

- [x] 27.4: Fix `articleCount` display in `entity-index.js` — wrap with `Number()` to handle Integer objects
- [x] 27.5: Fix `articleCount` display in `entity/single.html` — same defensive Number() wrapping
- [x] 27.6: Fix `[undefined](/)` article links in entity detail — filter articles with missing URLs before rendering

### Neo4j Performance

- [x] 27.7: Create `scripts/create-neo4j-indexes.mjs` — indexes on Entity(name), Document(url), Curriculum(state+grade), Content(title)
- [ ] 27.8: ⛔ BLOCKED — Run index creation script and verify via `SHOW INDEXES` Cypher (Neo4j unreachable)

### Verification

- [x] 27.9: node --check + eslint pass on all changed files
- [ ] 27.10: ⛔ BLOCKED — Re-run full pipeline: export → generate entities → Hugo build → verify /entity/ renders correctly (Neo4j needed)
- [ ] 27.11: ⛔ BLOCKED — npm test (Neo4j needed for integration tests)
