# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# enrich-entity-with-curricula - Work Plan

## TL;DR (For humans)

<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** If Neo4j is online, you can filter the Wissenstnetz-Seite auf "Lehrplan" und siehst alle Chemie-Themen aus den 15 Bundesländern (1788 Topics) — mit Bundesland, Klasse und Schulform als Metadaten. Die Themen sind automatisch mit verwandten chemischen Begriffen verknüpft (z.B. "Redoxreaktionen" ↔ "Redoxreaktion"). Ohne Neo4j siehst du 5 Beispiel-Topics aus Bayern.

**Why this approach:** Curriculum-Topics als `:Entity` mit Kategorie `lehrplan` einzufügen ist der minimal-invasive Weg — die bestehende Neo4j-Abfrage `MATCH (e:Entity)` liefert sie automatisch mit, der Frontend-Filter braucht nur einen neuen Button. Kein Schema-Bruch, keine neue Architektur.

**What it will NOT do:** Kein Curriculum-Explorer mit Dropdowns (Bundesland/Klasse), keine Änderungen am interaktiven Graph /wissennetz/, keine Einzelseiten für Lehrplan-Topics, keine Änderungen an den Scrapern oder JSON-Dateien.

**Effort:** Short (4-6h)
**Risk:** Low — alle Änderungen sind additiv, rückwärtskompatibel, und vermeiden DETACH DELETE
**Decisions to sanity-check:** (1) Curriculum-Topics teilen sich den `:Entity`-Node-Label (kein neuer Label), (2) Verknüpfung per einfacher Name-Normalisierung (kein ML/NLP), (3) Lernziele als eigene Entities mit `kategorie: 'lernziel'`

Your next move: approve, or run a high-accuracy review. Full execution detail follows below.

---

> TL;DR (machine): Short effort, Low risk. Add "Lehrplan" category filter to entity page by importing curriculum JSON as :Entity nodes, extending /api/kg-data, and modifying entity-index.js.

## Scope

### Must have

1. Import script `scripts/import-curricula.mjs` that reads all `data/curricula/*.json` (15 state files) and creates `:Entity {kategorie:'lehrplan'}` + `:Entity {kategorie:'lernziel'}` nodes in Neo4j via MERGE (no DETACH DELETE)
2. Auto-linking: curriculum topics link to existing matching entities via `[:RELATED_TO {weight: 1, auto: true}]` based on name normalization
3. API extension: `/api/kg-data` returns curriculum topics in the `entities` array (category `lehrplan`)
4. API fallback data includes ~5 representative curriculum topics for offline demo
5. Frontend: "Lehrplan" filter category with purple color, curriculum cards show state/grade, tooltip shows learning objective count
6. Frontend: Learning objectives (kategorie:'lernziel') are excluded from the default entity listing (too many) but searchable

### Must NOT have (guardrails, anti-slop, scope boundaries)

1. NO `DETACH DELETE` or `MATCH (n) DELETE n` in any script — all writes use `MERGE`
2. NO new Neo4j node labels beyond `:Entity` — curriculum topics use kategorie:'lehrplan' on existing label
3. NO new npm packages in frontend
4. NO changes to Hugo entity page templates (entity/single.html) — curriculum topics link to /entity/<slug>/ but page may 404 until Hugo build
5. NO interactive Bundesland/Klassenstufe dropdown or curriculum explorer — just the flat category filter
6. NO modifications to `data/curricula/*.json` files or scraper code
7. NO curriculum data that only works when Neo4j is online — fallback must function
8. NO individual entity pages for curriculum topics (out of scope for MVP)

## Verification strategy

> Zero human intervention - all verification is agent-executed.

- Test decision: tests-after (manual verify on deploy + unit tests for entity-linking)
- Evidence: .omo/evidence/ directory
- Frontend: manual session verification via `node` inspect of generated HTML strings
- Script: `node --check scripts/import-curricula.mjs` + dry-run mode
- API: `node -e "require('./api/server.js')"` syntax check + inspect fallback shape

## Execution strategy

### Parallel execution waves

**Wave 1** (C1 — import script):

- Todo 1: Import script — node file that reads JSON, normalizes names, generates MERGE Cypher
- Todo 2: Fallback data update + entity linking logic in API

**Wave 2** (C3 — frontend, runs after Wave 1):

- Todo 3: Frontend entity-index.js — new category, curriculum-aware card/tooltip rendering
- Todo 4: CSS/HTML entity-index.html — if needed

**Wave 3** (final verification):

- Todo 5: Diagnostics + evidence collection + commit

### Dependency matrix

| Todo              | Depends on | Blocks | Can parallelize with |
| ----------------- | ---------- | ------ | -------------------- |
| 1 (import script) | —          | —      | 2                    |
| 2 (API + linking) | —          | —      | 1                    |
| 3 (frontend JS)   | —          | —      | 1, 2                 |
| 4 (frontend CSS)  | —          | —      | 1, 2, 3              |
| 5 (verification)  | 1, 2, 3, 4 | —      | —                    |

## Todos

> Implementation + Test = ONE todo. Never separate.

<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [ ] 1. Create `scripts/import-curricula.mjs` — Neo4j import script for curriculum JSON
     **What to do**: Write an ESM script at `scripts/import-curricula.mjs` that:
  1. Reads all 15 state JSON files from `myhugoapp/data/curricula/??.json`
  1. For each school_curricula → grade_level → topic, creates a topic entity:
     ```cypher
     MERGE (e:Entity {name: toLower(normalizedName)})
     ON CREATE SET e.kategorie = 'lehrplan', e.display_name = $originalTitle,
                   e.state = $stateAbbr, e.state_name = $stateName,
                   e.school_type = $schoolType, e.grade = $grade,
                   e.objective_count = $objectiveCount, e.seeded = true
     ```
  1. For each learning_objective, creates a child entity:
     ```cypher
     MERGE (lo:Entity {name: toLower(normalizedObj)})
     ON CREATE SET lo.kategorie = 'lernziel', lo.display_name = $objText,
                   lo.parent_topic = $topicName, lo.seeded = true
     ```
  1. Links objectives to topics via `[:TEIL_VON]`: `MERGE (lo)-[:TEIL_VON]->(topic)`
  1. Name normalization pipeline (as function):
     - Take curriculum topic title (e.g. "Lernbereich 3: Redoxreaktionen (ca. 9 Std.)")
     - Lowercase
     - Remove "lernbereich N:" prefix
     - Remove parentheticals like "(ca. X Std.)" or "(ca. X Minuten)"
     - Split on " – " and take first part (the meaningful chemical term)
     - Trim whitespace
     - Result used as entity name (e.g., "redoxreaktionen")
  1. Entity linking: After creating all topics, run a second pass:
     ```cypher
     MATCH (t:Entity {kategorie: 'lehrplan'})
     MATCH (e:Entity) WHERE e.kategorie IS NOT NULL AND e.kategorie <> 'lehrplan' AND e.kategorie <> 'lernziel'
     // Use APOC or node-side comparison to fuzzy-match normalized topic name against e.name
     // Example: "redoxreaktionen" matches "redoxreaktion" (startsWith)
     MERGE (t)-[r:RELATED_TO {weight: 1, auto: true}]-(e)
     ```
     Node-side matching logic: For each topic, check if its normalized name starts with the entity name OR entity name starts with normalized topic name (covers plural/singular: "redoxreaktionen" ↔ "redoxreaktion", "atombau" ↔ "atombau und periodensystem")
  1. Script uses `neo4j-driver` with config from env vars (NEO4J_URI default `bolt://chemie-neo4j:7687`, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE default `chemie`)
  1. Has a `--dry-run` flag that prints all Cypher statements without executing them
  1. Reports counts after import: topics created, objectives created, links created
  1. No DETACH DELETE — all writes via MERGE. AGENTS.md rule: "never mass-delete"
  1. Follows existing pattern from `scripts/bootstrap-kg.mjs:150-232` (MERGE + ON CREATE SET + ON MATCH SET)

  **Must NOT do**: No DETACH DELETE, no MATCH (n) DELETE n, no MATCH (d:Document) DELETE d. No modification to curriculum JSON files.

  **Parallelization**: Wave 1 | Blocked by: nothing | Blocks: nothing (can run independently)

  **References**:
  - Existing import pattern: `scripts/bootstrap-kg.mjs:150-232` (MERGE entities, ON CREATE SET, ON MATCH SET)
  - Existing import pattern: `scripts/knowledge-graph.mjs:41-60` (MERGE with params pattern)
  - Neo4j connection: `api/server.js:301-304` (bolt://chemie-neo4j:7687, user/pass, database chemie)
  - Curriculum data structure: `myhugoapp/data/curricula/*.json` (15 files, structure: state → state_abbr → school_curricula[{school_type, grade_levels[{grade, topics[{title, learning_objectives[{text}]}]}]}])
  - Safety rule: `AGENTS.md` lines ~14-16 (DETACH DELETE blacklisted)
  - Existing linking pattern: `scripts/knowledge-graph.mjs:195-199` (MERGE [:RELATED_TO] with weight)

  **Acceptance criteria (agent-executable)**:
  - `node --check scripts/import-curricula.mjs` exits 0
  - `node scripts/import-curricula.mjs --dry-run 2>&1 | grep -c "MERGE"` returns > 0
  - Script reports counts of topics, objectives, and links at end of dry-run
  - No DETACH DELETE or DELETE strings in the file: `grep -c "DETACH DELETE\|MATCH.*DELETE" scripts/import-curricula.mjs` = 0

  **QA scenarios**:
  - Happy: `node scripts/import-curricula.mjs --dry-run` prints all MERGE statements and exit 0. Evidence: `.omo/evidence/task-1-dry-run.txt`
  - Failure: Script with invalid JSON input exits non-zero. Evidence: handle file-not-found gracefully
  - Safety: `grep "DETACH DELETE" scripts/import-curricula.mjs` returns empty

  **Commit**: Y | `feat(curricula): add Neo4j import script for curriculum topics and learning objectives`

- [ ] 2. Extend `/api/kg-data` endpoint with curriculum entity linking + fallback
     **What to do**: Modify `api/server.js`:
  1. In the Neo4j query path (line ~373-431), after fetching existing entities:
     - Also query curriculum topic entities: `MATCH (e:Entity {kategorie: 'lehrplan'}) RETURN ...` (same shape as existing entity query)
     - Merge both arrays, deduplicate by `name`
     - Add `curriculumMeta` field to curriculum entities: `{state, grade, school_type, objective_count}`
  1. In `getFallbackData()` (line ~320-354):
     - Add 5 curriculum topic entities to the `entities` array with representative data:
       ```js
       { id: 'e18', name: 'redoxreaktionen', category: 'lehrplan', curriculumMeta: { state: 'BY', grade: '9', school_type: 'Gymnasium (NTG)', objective_count: 11 }, articles: [], relatedEntities: [{ name: 'redoxreaktion', weight: 1 }], articleCount: 0 }
       { id: 'e19', name: 'saeure-base-gleichgewichte', category: 'lehrplan', curriculumMeta: { state: 'BY', grade: '10', school_type: 'Gymnasium (NTG)', objective_count: 8 }, articles: [], relatedEntities: [{ name: 'säure-base-reaktion', weight: 1 }], articleCount: 0 }
       { id: 'e20', name: 'atombau und periodensystem', category: 'lehrplan', curriculumMeta: { state: 'BY', grade: '9', school_type: 'Realschule', objective_count: 7 }, articles: [], relatedEntities: [{ name: 'atombau', weight: 1 }], articleCount: 0 }
       { id: 'e21', name: 'chemische reaktion', category: 'lehrplan', curriculumMeta: { state: 'BY', grade: '8', school_type: 'Gymnasium (NTG)', objective_count: 8 }, articles: [], relatedEntities: [{ name: 'chemische-reaktion', weight: 1 }], articleCount: 0 }
       { id: 'e22', name: 'donator-akzeptor-konzept', category: 'lehrplan', curriculumMeta: { state: 'BY', grade: '9', school_type: 'Gymnasium (NTG)', objective_count: 5 }, articles: [], relatedEntities: [{ name: 'säure-base-reaktion', weight: 1 }, { name: 'redoxreaktion', weight: 1 }], articleCount: 0 }
       ```
     - Add matching entities to the fallback entities list if not present (redoxreaktion, säure-base-reaktion, atombau, chemische-reaktion)
  1. Response shape becomes: `{source, articles, entities, curricula, loadTime}` where `curricula` is the subset of entities that are `kategorie: 'lehrplan'` (for potential future tab view)

  **Must NOT do**: No changes to the existing entity query shape (backward compatible). No DETACH DELETE. No new endpoint.

  **Parallelization**: Wave 1 | Blocked by: nothing | Blocks: nothing (can run parallel with todo 1)

  **References**:
  - `/api/kg-data` endpoint: `api/server.js:362-443` (full handler)
  - Fallback function: `api/server.js:320-354` (getFallbackData)
  - Existing entity query: `api/server.js:373-382` (MATCH (e:Entity) ... RETURN e.name, e.kategorie...)
  - Frontend data shape: `entity-index.js:53-55` (data.entities, data.articles)

  **Acceptance criteria (agent-executable)**:
  - `node --check api/server.js` exits 0
  - Inspect getFallbackData() return: verify `entities` array now includes 5 curriculum entries with `category: 'lehrplan'` and `curriculumMeta` field
  - All existing entity records unchanged

  **QA scenarios**:
  - Happy: Run `api/server.js` with syntax check + inspect fallback via `node -e`
  - Regression: Existing entity IDs (e0-e17) unchanged in fallback, shapes backward-compatible
  - Safety: grep for DETACH DELETE in api/server.js returns empty

  **Commit**: Y | `feat(api): extend /api/kg-data with curriculum entities and linking`

- [ ] 3. Update `entity-index.js` — add "Lehrplan" filter, curriculum-aware cards and tooltips
     **What to do**: Modify `myhugoapp/static/js/entity-index.js`:
  1. In `catLabels` (line 57-64), add `lehrplan: 'Lehrplan'`
  1. In `catColors` (line 65-72), add `lehrplan: '#9b59b6'` (purple)
  1. In `getTooltipHtml()` (line 125-154), add curriculum-aware tooltip:
     - If `e.category === 'lehrplan'`:
       - Show "X Lernziele · Y Bundesländer" instead of article count
       - Show curriculumMeta (state, grade, school_type) in the tooltip header area
       - If no articles and no related entities, don't show "verwandte Begriffe" section
  1. In `_renderImpl()` card rendering (line 278-323):
     - If `e.category === 'lehrplan'`:
       - Show curriculum meta as second line: `"BY, Gymnasium · Klasse 9"`
       - Show "X Lernziele" instead of "X Artikel"
       - Show `curriculumMeta.objective_count` instead of `artCount` in meta line (line 300-305)
       - If no related entities, skip the related-tags section
     - Card link still goes to `/entity/<slug>/` (page may not exist but link structure consistent)
  1. Import the new `entity-index.js` in the HTML template if there's a cache-busting mechanism — check if there's a version parameter. If so, bump it.
  1. No changes to search, pagination, sorting, or view mode logic — these work generically on the `entities` array

  **Must NOT do**: No changes to search, sorting, pagination logic. No new HTML elements or templates. No CSS changes in JS (colors only). No breaking of existing entity cards.

  **Parallelization**: Wave 2 | Blocked by: nothing (can work with mock data) | Blocks: nothing

  **References**:
  - catLabels: `entity-index.js:57-64`
  - catColors: `entity-index.js:65-72`
  - Tooltip rendering: `entity-index.js:125-154` (entire function)
  - Card rendering: `entity-index.js:278-323` (entity-card HTML generation)
  - Meta line: `entity-index.js:300-305` (relatedCount + artCount display)
  - Filter button generation: `entity-index.js:214-239` (dynamic from catLabels/catCounts)
  - Pagination: `entity-index.js:172-175, 329-357` (no changes needed)
  - Search: `entity-index.js:102-123` (no changes needed)
  - Sort: `entity-index.js:87-100` (no changes needed)

  **Acceptance criteria (agent-executable)**:
  - `node --check myhugoapp/static/js/entity-index.js` exits 0 (or `node -e "require('fs').readFileSync('...')"` since it's a script-type IIFE)
  - grep for `'lehrplan'` in entity-index.js returns at least 3 matches (catLabels, catColors, conditional check in tooltip/card)
  - grep for `'#9b59b6'` returns 1 match
  - grep for `curriculumMeta` returns at least 2 matches

  **QA scenarios**:
  - Happy (no curriculum data): page loads as before with existing categories when API returns no lehrplan entities (catCounts[cat] is falsy so button not shown)
  - Happy (with curriculum data): button appears, clicking it filters correctly, tooltip shows learning objectives, card shows state/grade
  - Regression: existing categories (stoff, konzept, etc.) unchanged

  **Commit**: Y | `feat(entity): add Lehrplan category filter with curriculum-aware card rendering`

- [ ] 4. Update `entity-index.html` CSS for new curriculum category
     **What to do**: Check `myhugoapp/layouts/_default/entity-index.html` for any CSS that needs extending:
  1. If there's hardcoded category badge colors in CSS (not JS), add `.entity-filter-btn[data-cat="lehrplan"]` styles
  1. Add minimal CSS for `.entity-card-curriculum-meta` class:
     ```css
     .entity-card-curriculum-meta {
       font-size: 0.78rem;
       color: var(--text-muted, #888);
       margin-top: 2px;
       line-height: 1.3;
     }
     ```
  1. No major CSS changes needed — existing card structure handles new content

  **Must NOT do**: No changes to the skeleton HTML structure (#entity-app, #entity-skeleton). No new HTML sections or tabs. No existing CSS class removal/modification.

  **Parallelization**: Wave 2 | Blocked by: nothing | Blocks: nothing

  **References**:
  - HTML template: `myhugoapp/layouts/_default/entity-index.html` (326 lines)
  - Existing card CSS: look at `.entity-card`, `.entity-card-name`, `.entity-card-cat`, `.entity-card-meta`, `.entity-card-related` classes

  **Acceptance criteria (agent-executable)**:
  - `grep -c "entity-card-curriculum-meta" myhugoapp/layouts/_default/entity-index.html` >= 1
  - Hugo `layouts` syntax validates (no template errors)

  **QA scenarios**:
  - Happy: CSS present, class referenced from entity-index.js
  - Regression: existing card CSS unmodified

  **Commit**: Y | `feat(entity): add CSS for curriculum card display`

- [ ] 5. Verification: LSP diagnostics, build check, evidence collection
     **What to do**:
  1. Run `node --check scripts/import-curricula.mjs`
  1. Run `node -e "const f=require('fs').readFileSync('myhugoapp/static/js/entity-index.js','utf8'); console.log('JS OK, length:', f.length)"` to verify JS parses
  1. Check the HTML template: `node -e "const f=require('fs').readFileSync('myhugoapp/layouts/_default/entity-index.html','utf8'); console.log('HTML OK, length:', f.length)"`
  1. Run `node --check api/server.js`
  1. Verify no DETACH DELETE in new files
  1. Collect evidence files in `.omo/evidence/`:
     - `task-1-import-curricula-dry-run.txt` — output of dry-run
     - `task-2-fallback-shape.json` — JSON shape of fallback data
     - `task-3-entity-index-labels.txt` — grep results for lehrplan
     - `task-4-css-classes.txt` — grep for entity-card-curriculum-meta
  1. Commit staged changes with a well-structured multi-commit flow (3 commits: import script → API changes → frontend changes)

  **Must NOT do**: No further code changes beyond verification.

  **Parallelization**: Wave 3 | Blocked by: 1, 2, 3, 4 | Blocks: nothing

  **References**:
  - All files changed across todos 1-4

  **Acceptance criteria (agent-executable)**:
  - All commands exit 0
  - Evidence files present in `.omo/evidence/`
  - `grep -r "DETACH DELETE" scripts/import-curricula.mjs api/server.js` returns empty
  - `git status --porcelain` shows expected changes

  **QA scenarios**:
  - Happy: All diagnostics pass, all evidence files non-empty
  - Failure: Any diagnostic fails — fix before proceeding

  **Commit**: Y (see Commit strategy section below)
  What to do / Must NOT do: <...>
  Parallelization: Wave <N> | Blocked by: <...> | Blocks: <...>
  References (executor has NO interview context - be exhaustive): <src/path:lines>
  Acceptance criteria (agent-executable): <exact command or assertion>
  QA scenarios (name the exact tool + invocation): happy + failure, Evidence .omo/evidence/task-1-enrich-entity-with-curricula.<ext>
  Commit: <Y/N> | <type>(<scope>): <summary>

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy

3 atomic commits, split by concern (following AGENTS.md git convention):

**Commit 1:** `feat(curricula): add Neo4j import script for curriculum topics and learning objectives`

- Files: `scripts/import-curricula.mjs`
- Rationale: standalone import tool, independent of API/frontend changes

**Commit 2:** `feat(api): extend /api/kg-data with curriculum entity linking and fallback`

- Files: `api/server.js` (and possibly `api/kg-data.js`)
- Rationale: API layer change, separate from UI

**Commit 3:** `feat(entity): add Lehrplan category filter with curriculum-aware display`

- Files: `myhugoapp/static/js/entity-index.js`, `myhugoapp/layouts/_default/entity-index.html`
- Rationale: UI change, separate from data layer

Each commit follows the repo's SEMANTIC style (detected from AGENTS.md: conventional commits in git log) with Sisyphus attribution footer:

```
Ultraworked with [Sisyphus](https://github.com/code-yeongyu/oh-my-openagent)
Co-authored-by: Sisyphus <clio-agent@sisyphuslabs.ai>
```

## Success criteria

1. [ ] `scripts/import-curricula.mjs` exists, syntax-valid, dry-run outputs MERGE statements for all 15 states
2. [ ] `api/server.js` fallback data includes 5 curriculum entities with `category: 'lehrplan'` and `curriculumMeta`
3. [ ] `entity-index.js` has `lehrplan` in catLabels and catColors
4. [ ] Curriculum entity cards show state/grade/school_type metadata
5. [ ] No DETACH DELETE anywhere in new or changed files
6. [ ] All existing entity categories and functionality remain unchanged
7. [ ] 3 clean commits in git log
