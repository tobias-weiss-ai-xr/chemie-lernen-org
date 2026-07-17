## Architecture

### Pipeline Flow (existing, broken)

```
Neo4j → export-kg-data.mjs → kg_data.json → Hugo SSR → /entity/ pages
                                              ↓
                                    api/server.js /api/kg-data (live fallback)
```

### Root Causes

1. **Empty export**: `export-kg-data.mjs` does `import neo4j from 'neo4j-driver'` but the package lives in `api/package.json`. Fixed in deploy.yml with `NODE_PATH=api/node_modules`. Need to verify end-to-end.

2. **articleCount [object Object]**: Neo4j Integer type doesn't auto-convert to JS number in the export. The mapping code has `toNumber()` handling but it's incomplete — the `articleCount` in entity-index.js template rendering calls `.low` which returns an Integer object, not a number.

3. **[undefined](/) links**: Articles reference null/undefined `url` fields. The export maps `d.url` but some Document nodes lack URL properties.

4. **No Neo4j indexes**: Labels queried by name/url have no index — full scan on every request.

### Fix Strategy

**articleCount**: In `export-kg-data.mjs`, ensure `articleCount` is always converted via `.toNumber()` or `parseInt()`. In `entity-index.js`, defensively handle both Integer objects and plain numbers with `Number(value)`.

**Article links**: Filter out articles with null/undefined URLs in the export. In templates, skip rendering if URL is missing.

**Indexes**: Add via Cypher `CREATE INDEX` statements in a new script `scripts/create-neo4j-indexes.mjs`.

## Key Files

| File                                            | Change                                          |
| ----------------------------------------------- | ----------------------------------------------- |
| `scripts/export-kg-data.mjs`                    | Fix Integer→number conversion for articleCount  |
| `myhugoapp/static/js/entity-index.js`           | Defensive Number() wrapping for articleCount    |
| `myhugoapp/layouts/_default/entity/single.html` | Fix [undefined] links, fix articleCount display |
| `scripts/create-neo4j-indexes.mjs`              | NEW — index creation script                     |
| `tests/kg-data-quality.test.js`                 | Update expected counts                          |
| `openspec/specs/entity-knowledge-graph/spec.md` | Update with fix documentation                   |

## Verification

1. Run export-kg-data.mjs → verify kg_data.json has N entities, N articles
2. Run generate-entity-pages.mjs → verify entity pages generated
3. Hugo build → verify /entity/ renders card grid
4. node --check on all modified JS
5. npm test → all suites pass
6. Verify articleCount displays as integer, not [object Object]
7. Verify no [undefined] links on entity detail pages
