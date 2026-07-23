## 1. Scraper Infrastructure

- [ ] 1.1 Create `scripts/modulhandbuch/` directory with `_scraper_utils.mjs` — shared HTTP fetch with retry (2 retries), rate limiting (1s between requests), and normalized JSON output schema
- [ ] 1.2 Create BY scraper (`scripts/modulhandbuch/by.mjs`) — scrape LMU München + TUM Chemie Lehramt module handbooks, output to `myhugoapp/data/modulhandbuch/by.json`
- [ ] 1.3 Create NW scraper (`scripts/modulhandbuch/nw.mjs`) — scrape Uni Köln + Uni Münster Chemie Lehramt module handbooks, output to `myhugoapp/data/modulhandbuch/nw.json`
- [ ] 1.4 Create BW scraper (`scripts/modulhandbuch/bw.mjs`) — scrape Uni Heidelberg + Uni Freiburg, output to `myhugoapp/data/modulhandbuch/bw.json`
- [ ] 1.5 Add `npm run scrape:modulhandbuch` script to package.json that runs all scrapers

## 2. Neo4j Import Pipeline

- [ ] 2.1 Create `scripts/import-modulhandbuch.mjs` — read all `myhugoapp/data/modulhandbuch/*.json` files, insert into Neo4j using MERGE on (university, moduleId) composite key
- [ ] 2.2 Import creates University, ModuleOffering, Lecturer, Degree nodes with OFFERED_BY, TAUGHT_BY, PART_OF relationships
- [ ] 2.3 Create COVERS relationships from ModuleOffering → Entity nodes via topic keyword matching
- [ ] 2.4 Validate import — verify correct node/relationship counts via Cypher queries
- [ ] 2.5 Add `npm run import:modulhandbuch` script to package.json

## 3. Studienvergleich Page

- [ ] 3.1 Create `myhugoapp/content/studienvergleich/_index.md` with `layout: studienvergleich`
- [ ] 3.2 Create `myhugoapp/layouts/_default/studienvergleich.html` — template with filter bar, comparison table container, loading state
- [ ] 3.3 Create `myhugoapp/static/js/studienvergleich.js` — fetches `/api/modulhandbuch/compare`, renders state-by-state comparison table, URL query param persistence
- [ ] 3.4 Add `/api/modulhandbuch/compare` endpoint if missing — accepts state + topic params, returns grouped module data

## 4. Tests & Documentation

- [ ] 4.1 Write unit tests for `_scraper_utils.mjs` (normalization, retry logic)
- [ ] 4.2 Write integration tests for `import-modulhandbuch.mjs` (mock JSON → Neo4j)
- [ ] 4.3 Expand `tests/modulhandbuch-api.test.js` — add tests for /compare endpoint
- [ ] 4.4 Document scrapers and import in `docs/modulhandbuch.md`
