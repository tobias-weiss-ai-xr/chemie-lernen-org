## 1. Scraper Infrastructure

- [x] 1.1 Create `scripts/modulhandbuch/` directory with `_scraper_utils.mjs` — shared HTTP fetch with retry, rate limiting, normalized JSON output schema
- [x] 1.2 Create BY scraper (`scripts/modulhandbuch/by.mjs`) — LMU + TUM, produces `myhugoapp/data/modulhandbuch/by.json` (10 modules)
- [x] 1.3 Create NW scraper (`scripts/modulhandbuch/nw.mjs`) — Köln + Münster, produces `myhugoapp/data/modulhandbuch/nw.json` (18 modules)
- [x] 1.4 Create BW scraper (`scripts/modulhandbuch/bw.mjs`) — Heidelberg + Freiburg, produces `myhugoapp/data/modulhandbuch/bw.json` (18 modules)
- [x] 1.5 Add `npm run scrape:modulhandbuch` script to package.json + `_run-all.mjs` runner

## 2. Neo4j Import Pipeline

- [x] 2.1 Create `scripts/import-modulhandbuch.mjs` — pre-existing (240 lines), MERGE on (short_code)/(module_code, university), dry-run flag, --file flag
- [x] 2.2 Create relationships — pre-existing (OFFERED_BY, TAUGHT_BY, PART_OF in import script)
- [x] 2.3 Create COVERS/TEACHES — pre-existing (`scripts/link-modules-to-entities.mjs`, `scripts/curricula/link-module-entities.mjs`)
- [ ] 2.4 Validate import — run import against Neo4j, verify node/relationship counts (requires running API server)
- [x] 2.5 Add `npm run import:modulhandbuch` script to package.json

## 3. Studienvergleich Page

- [x] 3.1 Create `myhugoapp/content/studienvergleich/_index.md` — pre-existing with `layout: studienvergleich`
- [x] 3.2 Create `myhugoapp/layouts/_default/studienvergleich.html` — pre-existing (146 lines, full UI with state/topic/degree selectors, comparison table, matrix, stats)
- [x] 3.3 Create `myhugoapp/static/js/studienvergleich.js` — pre-existing (371 lines, full JS with fetch, comparison rendering, dedup)
- [x] 3.4 Add `/api/modulhandbuch/compare` endpoint — pre-existing at `/api/studienvergleich/compare` (takes u1, u2, topic, level)

## 4. Tests & Documentation

- [x] 4.1 Write unit tests for `_scraper_utils.mjs` — 13 tests (extractTopics, fetchWithRetry, writeOutput)
- [ ] 4.2 Write integration tests for `import-modulhandbuch.mjs` (mock JSON → Neo4j) — requires running server
- [ ] 4.3 Expand `tests/modulhandbuch-api.test.js` — add tests for /compare endpoint — requires running server
- [x] 4.4 Document scrapers and import in `docs/modulhandbuch.md`
