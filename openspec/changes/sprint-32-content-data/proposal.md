## Why

Of 16 Bundesland curricula, 2 have grade-D quality (Brandenburg, Berlin — garbled parsing from scraper changes), and Saarland is missing entirely despite a scraper existing. Only ~92% of themenbereiche articles are cross-linked to KG entities. The 9 klassenstufen directories are empty shells with only `_index.md` files. No CI gate validates curriculum data structure. This sprint fills remaining data and content gaps.

## What Changes

- Re-scrape and fix Brandenburg (bb.json) and Berlin (be.json) curriculum data
- Run Saarland scraper, validate output, add sl.json to dataset
- Create `scripts/cross-link-audit.mjs` — report cross-link coverage, flag gaps
- Populate 9 klassenstufen with introductory content, curriculum links, exercises
- Add CI validation step: validate all state JSONs on push before Hugo build
- Add `/api/didaktik` test coverage

## Capabilities

### New Capabilities

(none — all capabilities exist)

### Modified Capabilities

- `lehrplan-curriculum/spec.md`: Add quality thresholds (min topics/objectives per state), didaktik endpoint requirements, CI gate spec

## Impact

- **Data**: 18/18 states covered (was 16 + 2 broken), quality ≥ B
- **Content**: 100% themenbereiche cross-linked, 9 klassenstufen with real content
- **CI**: Curriculum quality gate blocks PRs with regressions
