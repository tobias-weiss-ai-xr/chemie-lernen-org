## Context

The modulhandbuch infrastructure is already in place but empty:

- Neo4j labels: University, UniversityModule, ModuleOffering, Lecturer, Degree, ECTS
- API routes: `/api/modulhandbuch/*` (7 endpoints) in `api/routes/modulhandbuch.js`
- Entity page: "Universitäten" section in `entity/single.html` (SSR + JS fetch)
- Subset filter: modulhandbuch labels included in `_neo4j-subset-filter.mjs:CHEMIE_LABELS`

What's missing: scraped data, an import pipeline, and a comparison page to make the data browsable before linking it to individual entity pages.

## Goals / Non-Goals

**Goals:**

- Scrape module handbooks from 4-6 priority states (BY, NW, BW, HE, SN, BE) with chemistry teaching programs (Lehramt Chemie)
- Import scraped data into Neo4j via a reproducible script
- Create `/studienvergleich/` page to browse/compare module offerings by state and sub-field
- Link modules to KG entities where possible (e.g., "Anorganische Chemie I" → Anorganische Chemie entity)
- Add validation tests for the import + API

**Non-Goals:**

- Scraping ALL 16 states (Sprint 36+ content)
- Real-time syncing with university websites (manual re-run on demand)
- Authentication or personalization for the comparison page
- Automated scraping CI pipeline (manual trigger via npm script)

## Decisions

### Scraper architecture: per-state scripts with shared utility

Each state gets its own scraper script (`scripts/modulhandbuch/<state>.mjs`) that produces a JSON file (`myhugoapp/data/modulhandbuch/<state>.json`). A shared utility (`_scraper_utils.mjs`) handles:

- HTTP fetch with retry + rate limiting (1 req/s per domain)
- HTML parsing via regex/string (no jsoup/cheerio dependency)
- Normalized data schema output

**Rationale:** Per-state scripts keep parsing logic isolated (each uni website has different HTML structure). The shared utility prevents code duplication for HTTP and normalization.

**Alternatives considered:** Single mega-scraper with per-state configs — harder to debug when one state's site changes layout.

### Data schema: flat JSON → Neo4j nodes

Each JSON file contains an array of module objects:

```json
{
  "university": "LMU München",
  "state": "BY",
  "modules": [
    {
      "id": "CHE-001",
      "name": "Anorganische Chemie I",
      "type": "Vorlesung",
      "credits": 6,
      "semester": "WS",
      "degree": "Bachelor Lehramt Chemie",
      "lecturer": "Prof. Dr. X",
      "description": "Grundlagen der Anorganischen Chemie...",
      "topics": ["Atombau", "Periodensystem", "Chemische Bindung"],
      "url": "https://..."
    }
  ]
}
```

Neo4j import creates:

- `(:University {name, state, url})`
- `(:ModuleOffering {id, name, type, credits, semester, description, url})`
- `(:Lecturer {name})`
- `(:Degree {name})`
- Relationships: `OFFERED_BY`, `TAUGHT_BY`, `PART_OF`, `COVERS` (→ Entity)

### Link modules → KG entities via topic matching

Module `topics` array (derived from description keywords) is matched against KG entity names via fuzzy matching (Lunr-style contains). This is a best-effort link, not exhaustive.

**Rationale:** Universities don't publish machine-readable links to curriculum entities. Keyword matching gives useful coverage (~60-70%) with no manual effort.

**Risk:** False positives (e.g., "Allgemeine Chemie" matching multiple entities). Mitigation: only create links for unambiguous matches (unique entity name match within module's sub-field).

### Studienvergleich page: JS client-side rendering

The `/studienvergleich/` page fetches from `/api/modulhandbuch/compare?state=X&topic=Y` and renders a comparison table. Client-side rendering avoids Hugo build-time dependency on API data.

**Filter state:** Stored in URL query params for shareable links (`?state=BY&topic=Anorganische`).

## Risks / Trade-offs

| Risk                                                  | Likelihood | Mitigation                                                                                    |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| University website structure changes (scraper breaks) | Medium     | Isolated per-state scripts; error messages identify exact state; CI runs validate JSON schema |
| Low match rate between modules and KG entities        | Medium     | Manual topic annotation in JSON as fallback; no hard dependency                               |
| Rate limiting / blocking during scrape                | High       | 1s delay between requests, user-agent header, configurable retry                              |
| Duplicate modules across scrape runs                  | Low        | Import uses MERGE on (university, moduleId) composite key                                     |
| GDPR concerns with lecturer names                     | Low        | Public data from official module handbooks; no personal contact info                          |

## Migration Plan

1. Create scraper utility + BY scraper (prototype state)
2. Test import into Neo4j, verify entity links
3. Create 3 more state scrapers (NW, BW, HE) in parallel
4. Build Studienvergleich page
5. Expand tests
6. Scrape remaining 2 states (SN, BE)
7. Deploy and verify

Rollback: `MATCH (n:ModuleOffering) DETACH DELETE n` + remove `/studienvergleich/` page.
