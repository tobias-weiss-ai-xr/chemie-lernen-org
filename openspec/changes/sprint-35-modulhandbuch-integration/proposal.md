## Why

16 German federal states each publish chemistry curriculum documents (Lehrpläne) for grades 5-13. The next logical step is to connect these curriculum requirements to actual university module offerings (Modulhandbücher) — enabling students to see which university courses align with their Abitur curriculum, and which Schwerpunkt (focus area) leads where.

The infrastructure already exists: Neo4j modulhandbuch labels (University, UniversityModule, ModuleOffering, Lecturer, Degree, ECTS), a `/api/modulhandbuch*` route with 7 endpoints, and an entity page "Universitäten" section. What's missing is:

- Scraped module handbook data (currently empty)
- A comparison page to browse course offerings across states
- Imported data linked to KG chemie entities

## What Changes

- Create state-specific scraper scripts for university module handbooks (priority: states with chemistry teaching programs)
- Import scraped data into Neo4j under existing modulhandbuch labels
- Create a /studienvergleich/ (study comparison) page to browse and compare module offerings across universities/states
- Link university modules → KG entities (Welche Uni behandelt Thema X am tiefsten?)
- Add validation tests for the import pipeline

## Capabilities

### New Capabilities

- `study-comparison`: Browse and compare university module offerings across federal states, filter by chemistry sub-field (Anorganische, Organische, Physikalische, etc.), and see which KG entities each module covers
- `module-scraping`: Scrape module handbooks from university websites and import into Neo4j with proper labelling (University, ModuleOffering, Lecturer, Degree, ECTS)

### Modified Capabilities

- (none — existing modulhandbuch route data will grow but API contract stays the same)

## Impact

**Code changes:**

- `scripts/modulhandbuch/` — New directory with state-specific scrapers (`_scraper_utils.mjs` base, then one per state)
- `scripts/import-modulhandbuch.mjs` — Imports scraped JSON into Neo4j modulhandbuch nodes
- `scripts/export-kg-data.mjs` — May need update to include modulhandbuch entities
- `myhugoapp/layouts/_default/studienvergleich.html` — New study comparison page
- `myhugoapp/static/js/studienvergleich.js` — JS for filtering/sorting
- `api/routes/modulhandbuch.js` — May need small enhancements for comparison queries
- `tests/modulhandbuch-api.test.js` — Expand existing tests

**Dependencies:**

- Node.js built-in `https` module for scraping (no new npm deps)
- Neo4j for data storage (already exists)

**Rollback plan:**

- Data import is additive — no existing data is modified
- Reverse: delete imported modulhandbuch nodes via targeted Cypher query (`MATCH (n:ModuleOffering) DETACH DELETE n`)
