# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

# wissensnetz-ssr-improve - Work Plan

## TL;DR (For humans)

**What you'll get:** Entity detail pages (z.B. chemie-lernen.org/entity/wasser/) zeigen Name, Kategorie und Beschreibung sofort beim Seitenaufruf — ohne Ladeanimation. Die d3-Vernetzungsgrafik lädt danach lazy im Hintergrund. Zusätzlich wird das Wissensnetz-Datenfile (kg_data.json) bei jedem Build automatisch aus Neo4j aktualisiert, damit alle Entity-Seiten aktuelle Artikelzahlen und Verknüpfungen enthalten.

**Why this approach:** Die Entity-Seiten rendern aktuell alles via Client-JS — der Nutzer sieht erst einen leeren Skeleton, dann nach API-Aufruf den Inhalt. Durch SSR (Server-Side Rendering) ist der Kopfteil sofort da, die Grafik lädt progressiv. Das Export-Skript stellt sicher, dass die Build-Pipeline aktuelle Daten hat.

**What it will NOT do:** Keine neuen API-Endpunkte, keine Änderungen am Neo4j-Datenmodell, keine Artikel-Detailseiten, keine weiteren CSS-Änderungen.

**Effort:** Short (3 Waves, ~2h)
**Risk:** Low — Template-Änderungen sind rückwärtskompatibel, Export-Skript läuft isoliert
**Decisions to sanity-check:** Export-Skript sollte Daten in kg_data.json genau so strukturieren wie der bestehende /api/kg-data Endpoint.

Your next move: approve den Plan, dann starte ich die Umsetzung.

---

> TL;DR (machine): 3 waves — SSR entity template rendering from Hugo frontmatter, Neo4j build-time export script, entity-page regeneration. Effort: Short. Risk: Low.

## Scope

### Must have

- entity/single.html: Render entity name, category badge, description server-side from Hugo frontmatter (`.Title`, `.Description`, `.Params.categories`)
- entity/single.html: Client JS only fetches `/api/kg-data` for d3 ego graph + article relation enrichment
- Remove skeleton/loading flash for the header section
- scripts/export-kg-data.mjs: Query Neo4j at build time, write to data/kg_data.json (same shape as /api/kg-data response)
- Integrate export script into build pipeline
- Run generate-entity-pages.mjs to regenerate all 55 entity .md pages with correct article counts and descriptions

### Must NOT have (guardrails, anti-slop, scope boundaries)

- No new API routes in server.js
- No Neo4j schema changes (no description property added)
- No article detail pages
- No CSS redesign
- No entity-index page changes
- No changes to the API response shape
- No changes to existing content/entity/\*/index.md slugs or structure

## Verification strategy

> Zero human intervention - all verification is agent-executed.

- Test decision: tests-after — verify with lint + Playwright + manual entity page inspection
- Evidence: .omo/evidence/task-<N>-wissensnetz-ssr-improve.ext

## Execution strategy

### Parallel execution waves

- Wave 1 (SSR template): entity/single.html Hugo template changes
- Wave 2 (Export script): scripts/export-kg-data.mjs + npm run build integration
- Wave 3 (Regenerate): generate-entity-pages.mjs with fresh kg_data.json

### Dependency matrix

| Todo                  | Depends on | Blocks | Can parallelize with |
| --------------------- | ---------- | ------ | -------------------- |
| 1. SSR template       | —          | —      | 2 (parallel)         |
| 2. Export script      | —          | 3      | 1 (parallel)         |
| 3. Regenerate pages   | 2          | —      | —                    |
| 4. Final verification | 1, 2, 3    | —      | —                    |

## Todos

> Implementation + Test = ONE todo. Never separate.

<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [ ] 1. entity/single.html: SSR for entity title, description, category badge, breadcrumb from Hugo frontmatter
     What to do / Must NOT do: Modify entity/single.html so that the entity name, description, category badge, and breadcrumb are rendered in Hugo template (Go template syntax) from `.Title`, `.Description`, `.Params`. The client JS script (the IIFE) must be modified to only fetch `/api/kg-data` for the d3 ego graph and article relation enrichment — NOT re-render the header card. The header-card div in the IIFE's render() function must be removed (it's already SSR'd). The skeleton div should only show for the graph/relations section, not the entire page.
     Must NOT do: Do not change the CSS section. Do not remove the JSON-LD or document.title update. Do not remove the ego graph rendering. Do not change entity-index.js. Do not remove the \_fuzzyFind or render functions — they're still needed for the `Meinten Sie` banner and article data.
     Reference: myhugoapp/layouts/entity/single.html lines 338-800 (full file). The template definition blocks are at line 1 (`css`), line 337 (`main`). Current SSR is just breadcrumb + skeleton. The JS at line 358-799 does all rendering. Need to move lines 483-493 (header card HTML) into the Hugo template. Keep the JS function `render()` but only use it for articles, relations, graph, JSON-LD, and document title.
     Acceptance criteria: Hugo builds without error. Entity detail page shows name, description, badge immediately in page source (no JS required). No visual regression in the header card appearance.
     QA scenarios: `npm run validate`, `hugo server` then check /entity/wasser/ page source for SSR content, `lsp_diagnostics` on single.html.
     Commit: Y | feat(wissensnetz): SSR entity title/desc/badge from Hugo frontmatter

- [ ] 2. scripts/export-kg-data.mjs: Neo4j build-time export to data/kg_data.json
     What to do / Must NOT do: Create scripts/export-kg-data.mjs that connects to Neo4j (same env vars as api/server.js), runs the same Cypher queries as the /api/kg-data endpoint (lines 1409-1420 for entities, 1436-1443 for articles), and writes the combined response to myhugoapp/data/kg_data.json in the same shape as the /api/kg-data response: `{ source: 'neo4j', articles: [...], entities: [...], updatedAt: <ISO timestamp> }`. Must handle Neo4j connection failure gracefully (log warning, exit 0, don't overwrite existing kg_data.json).
     Must NOT do: Do not use the server.js driver instance — create a standalone connection. Do not import from server.js. Do not modify the existing generate-entity-pages.mjs. Do not modify api/server.js. Do not expose this as a web endpoint.
     Reference: api/server.js lines 1409-1454 (Neo4j queries), lines 1515-1521 (response shape). Neo4j env: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE from api/server.js (check lines 140-170 for exact env var names).
     Acceptance criteria: Running `node scripts/export-kg-data.mjs` produces myhugoapp/data/kg_data.json with >0 entities and >0 articles. Running it with Neo4j down does not overwrite existing file.
     QA scenarios: Run script with Neo4j up → verify json has data. Run with Neo4j down → verify file unchanged.
     Commit: Y | feat(scripts): Neo4j build-time export to kg_data.json

- [ ] 3. Regenerate entity pages with fresh kg_data.json
     What to do / Must NOT do: After task 2 produces a fresh kg_data.json, run `node scripts/generate-entity-pages.mjs` to regenerate all entity .md files in myhugoapp/content/entity/. The script reads kg_data.json and creates/updates index.md files with enriched frontmatter (correct articleCount, description with actual counts).
     Must NOT do: Do not modify generate-entity-pages.mjs. Do not delete entity directories. Do not touch layouts or JS files.
     Reference: scripts/generate-entity-pages.mjs (full file, 70 lines). It reads myhugoapp/data/kg_data.json, iterates entities, writes myhugoapp/content/entity/<slug>/index.md.
     Acceptance criteria: All 55+ entity pages now have accurate article counts in their frontmatter description. Hugo build succeeds.
     QA scenarios: Run script, check a few entity .md files for updated description. `hugo build` succeeds.
     Commit: N (regeneration, no code changes)

- [ ] 4. Final verification — lint, hugo build, Playwright tests
     What to do: Run `npm run validate` (lint + format:check + test:unit). Run `hugo build` (or `npm run hugo:build`). Check entity detail pages render with SSR content. Run existing Playwright tests.
     Must NOT do: No code changes.
     Reference: AGENTS.md commands section.
     Acceptance criteria: npm run validate passes. Hugo build succeeds with no errors. Entity pages show SSR content in page source.
     QA scenarios: Full validate suite + Hugo build.
     Commit: N (verification only)

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit — all 4 todos verified
- [ ] F2. Code quality review — lint clean
- [ ] F3. Real manual QA — entity page renders correctly
- [ ] F4. Scope fidelity — no scope creep

## Commit strategy

- Todo 1: feat(wissensnetz): SSR entity title/desc/badge from Hugo frontmatter
- Todo 2: feat(scripts): Neo4j build-time export to kg_data.json
- Todo 3: No commit (regeneration only)
- Todo 4: No commit (verification only)

## Success criteria

1. Entity detail page (e.g. /entity/wasser/) shows entity name, description, category badge in HTML source (no JS required)
2. Client JS still loads d3 ego graph with related entities and articles
3. kg_data.json is populated after running export script
4. generate-entity-pages.mjs produces pages with accurate article counts
5. `npm run validate` passes
6. `hugo build` succeeds
