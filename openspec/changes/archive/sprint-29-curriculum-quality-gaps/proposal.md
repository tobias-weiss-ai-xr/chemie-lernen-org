## Why

Of the 16 Bundesland curriculum JSON files, 2 have grade-D quality (Brandenburg BB, Berlin BE — garbled parsing, ~15% of data broken). Saarland (SL) is missing entirely despite a scraper existing. Only 42 of ~68 themenbereiche articles are cross-linked (11% gap). The 9 klassenstufen directories are empty shells with only `_index.md` files. No `/api/didaktik` endpoint exists despite being referenced in specs. No CI check prevents curriculum data regression. This sprint fixes the broken data, adds missing coverage, and adds automated quality gates.

## What Changes

- Re-scrape and clean Brandenburg + Berlin curriculum data (fix garbled parsing)
- Run Saarland scraper, validate JSON, add to curricula dataset
- Cross-link remaining 8 unlinked themenbereiche articles via content-cross-links.json
- Create GET /api/didaktik endpoint (didactic guidelines from KG nodes)
- Populate 9 klassenstufen with introductory content and curriculum links
- Add CI step: curriculum quality report on push (validate JSON structure, check for regressions)

## Capabilities

### Modified Capabilities

- `lehrplan-curriculum/spec.md` — quality thresholds, didaktik endpoint
- `central-kg-architecture/spec.md` — klassenstufen content model

## Impact

- **Data**: 18/18 states covered (was 16 + 2 broken), quality all ≥B
- **Content**: 100% themenbereiche cross-linked, 9 populated klassenstufen directories
- **API**: New `/api/didaktik` endpoint
- **CI**: Curriculum quality gate prevents regression
