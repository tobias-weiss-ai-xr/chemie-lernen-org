## Context

16 state curriculum JSONs exist (`data/curricula/`). BB and BE were scraped with an older scraper version and have garbled entries (~15% of topics broken). Saarland scraper exists at `scripts/scrape-saarland-curriculum.mjs` but was never run successfully into the dataset. 8 of 68 themenbereiche articles (~12%) have no cross-links to KG entities. 9 klassenstufen directories under `content/klassenstufen/` contain only `_index.md` with minimal metadata.

## Goals / Non-Goals

**Goals:**

- BB/BE: re-scrape, validate, replace JSONs
- SL: run scraper, validate, add to dataset
- Cross-link audit script: report coverage % and list gaps
- Populate 9 klassenstufen: overview text, linked themenbereiche, curriculum alignment per state, practice links
- CI: `npm run validate:curricula` validates all state JSONs (structure, min 50 topics, min 200 objectives)

**Non-Goals:**

- Importing curricula into Neo4j (Sprint 28 covers this)
- Scraping additional states beyond SL

## Decisions

| Decision                                   | Rationale                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| **Re-scrape BB/BE from scratch**           | Patching garbled JSON is error-prone; scraper is deterministic             |
| **klassenstufen content in Hugo markdown** | Static content, no JS needed; aligns with existing Hugo convention         |
| **validate-curricula.mjs as CI gate**      | Prevents future data regression; runs in <5s                               |
| **Cross-link audit is a report script**    | Does not auto-fix; human reviews gaps and adds to content-cross-links.json |

## Risks / Trade-offs

- [Scraper broken] → BB/BE scrapers may have bit-rot since last use; budget time for fixes
- [SL curriculum format differs] → Saarland might use different structure; validate before merging
- [klassenstufen content outdated] → Hard links to state curricula may drift; acceptable for static site
