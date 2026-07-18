## Sprint 29: Curriculum Quality + Content Gaps

### Curriculum Data Quality

- [ ] 29.1: ⛔ Scraper-dependent — Re-scrape Brandenburg (bb.json) — fix garbled parsing, validate structure
- [ ] 29.2: ⛔ Scraper-dependent — Re-scrape Berlin (be.json) — fix garbled parsing, validate structure
- [ ] 29.3: ⛔ Scraper-dependent — Run Saarland scraper — generate sl.json, validate topic/objective counts
- [x] 29.4: Create `scripts/validate-curricula.mjs` — validate all state JSONs (structure, min topics, min objectives)

### Content Cross-Linking

- [x] 29.5: Identify 8 unlinked themenbereiche articles — add to content-cross-links.json
- [ ] 29.6: ⛔ Needs tool/script run — Re-run cross-link audit — verify ≥95% coverage

### Didaktik Endpoint

- [x] 29.7: Create GET /api/didaktik in server.js — return didactic guidelines for a topic
- [ ] 29.8: ⛔ BLOCKED — Test /api/didaktik returns valid JSON (Neo4j unreachable)

### Klassenstufen Content

- [x] 29.9: Populate 9 klassenstufen/\_index.md with overview + curriculum links + related themenbereiche

### CI Quality Gate

- [x] 29.10: Add curriculum validation step to deploy.yml CI (before Hugo build)
- [x] 29.11: node --check + eslint pass on validation script; Hugo build + npm test need Neo4j
