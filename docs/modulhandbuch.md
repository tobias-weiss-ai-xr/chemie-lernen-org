# Modulhandbuch Scraping & Import

Scripts for scraping university module handbooks (Modulhandbücher) for chemistry
teaching degrees (Lehramt Chemie) and importing them into the Neo4j knowledge
graph.

## Directory Structure

```
scripts/modulhandbuch/
  _scraper_utils.mjs   — Shared HTTP fetch, retry, rate limiting, JSON schema
  _run-all.mjs         — Run all scrapers in sequence
  by.mjs               — Bayern (LMU München, TUM)
  nw.mjs               — Nordrhein-Westfalen (Uni Köln, Uni Münster)
  bw.mjs               — Baden-Württemberg (Uni Heidelberg, Uni Freiburg)

myhugoapp/data/modulhandbuch/
  by.json              — Scraped data output (Bayern)
  nw.json              — Scraped data output (NRW)
  bw.json              — Scraped data output (BW)

scripts/import-modulhandbuch.mjs   — Import JSON files into Neo4j
scripts/link-modules-to-entities.mjs — Link modules to KG entities
```

## Usage

### Scrape all states

```bash
npm run scrape:modulhandbuch
```

This runs each scraper in sequence (BY → NW → BW). Each scraper:

- Reads university module handbook websites via HTTP
- Extracts module metadata (name, code, credits, level, topics)
- Outputs a JSON file to `myhugoapp/data/modulhandbuch/<state>.json`
- Respects rate limiting (1s between requests)
- Retries failed requests up to 2 times

### Run a single scraper

```bash
node scripts/modulhandbuch/by.mjs
```

### Import into Neo4j

```bash
npm run import:modulhandbuch
```

Or with a specific file:

```bash
node scripts/import-modulhandbuch.mjs --file myhugoapp/data/modulhandbuch/by.json
```

Preview mode (dry run):

```bash
node scripts/import-modulhandbuch.mjs --dry-run
```

### Link modules to knowledge graph entities

```bash
node scripts/link-modules-to-entities.mjs
node scripts/curricula/link-module-entities.mjs
```

## Adding a New State Scraper

1. Create `scripts/modulhandbuch/<state>.mjs` using `_scraper_utils.mjs`:
   ```js
   import { fetchWithRetry, extractTopics, writeOutput } from './_scraper_utils.mjs';
   ```
2. Add `<state>.mjs` to the `scrapers` array in `_run-all.mjs`
3. Run the scraper and verify output JSON
4. Import into Neo4j with `npm run import:modulhandbuch`

## Output Schema

Each JSON file has the format:

```json
{
  "state": "BY",
  "university": "LMU München",
  "url": "https://...",
  "modules": [
    {
      "id": "CHE-001",
      "name": "Anorganische Chemie I",
      "shortName": "AC I",
      "type": "Vorlesung",
      "level": "BSc",
      "credits": 6,
      "semester": "WS",
      "degree": "Bachelor Lehramt Chemie",
      "lecturer": "Prof. Dr. X",
      "description": "Grundlagen...",
      "topics": ["Atombau", "Periodensystem"],
      "url": "https://..."
    }
  ]
}
```

## Neo4j Schema

- `(:University {name, shortCode, state, url})` — MERGE on `shortCode`
- `(:UniversityModule {code, name, type, credits, level, semester, description, url})` — MERGE on `(code, university)`
- `(:Lecturer {name})`
- `(:Degree {name})`
- Relationships:
  - `(m:UniversityModule)-[:OFFERED_BY]->(u:University)`
  - `(m:UniversityModule)-[:TAUGHT_BY]->(l:Lecturer)`
  - `(m:UniversityModule)-[:PART_OF]->(d:Degree)`
  - `(m:UniversityModule)-[:TEACHES|COVERS]->(e:Entity)`

## API Endpoints

All available via the chemie-chat-api at `/api/modulhandbuch/*`:

| Endpoint                                                | Description                         |
| ------------------------------------------------------- | ----------------------------------- |
| `/api/modulhandbuch/universities`                       | List all universities               |
| `/api/modulhandbuch/modules?university=LMU`             | Modules for a university            |
| `/api/studienvergleich/compare?u1=LMU&u2=UKO&topic=...` | Comparison between two universities |
