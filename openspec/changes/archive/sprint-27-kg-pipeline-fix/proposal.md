## Why

The Wissensnetz (knowledge graph) is broken end-to-end. The export pipeline produces an empty `kg_data.json` (0 entities, 0 articles), so the /entity/ page shows a fallback message instead of the interactive card grid. Entity detail pages have two data bugs: `articleCount` renders as `[object Object]` instead of an integer, and article links render as `[undefined](/)`. Neo4j has no indexes on the most frequently queried labels (Entity.name, Document.url, Curriculum), making all KG queries slow. The existing tests reference stale expected counts. This sprint fixes the pipeline and entity pages so the Wissensnetz actually works.

## What Changes

- Fix `export-kg-data.mjs` import path (`NODE_PATH=api/node_modules` already added to deploy.yml) and re-run export
- Fix `articleCount` display bug in entity detail pages (`entity/single.html` and `entity-index.js`)
- Fix `[undefined](/)` article links caused by null article data
- Add Neo4j indexes on `Entity(name)`, `Document(url)`, `Curriculum(state, grade)`
- Re-run full pipeline: export → generate entity pages → Hugo build → verify
- Update `kg-data-quality.test.js` expected counts to match actual data

## Capabilities

### Modified Capabilities

- `entity-knowledge-graph/spec.md` — fix entity page bugs, update pipeline docs
- `wissensnetz-graph/spec.md` — ensure graph loads from real data
- `central-kg-architecture/spec.md` — add index definitions

## Impact

- **Data**: `kg_data.json` populated with real entity/article data
- **Performance**: Neo4j queries faster with proper indexes
- **UX**: Entity pages show correct article counts and working links
- **CI**: Test expectations match actual data
