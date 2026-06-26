# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

---

slug: wissensnetz-ssr-improve
status: awaiting-approval
intent: clear
pending-action: write .omo/plans/wissensnetz-ssr-improve.md
approach: 3-wave plan — SSR entity template → Neo4j export script → regenerate entity pages with enriched data

---

# Draft: wissensnetz-ssr-improve

## Components (topology ledger)

| id                      | outcome                                                                             | status | evidence path                                |
| ----------------------- | ----------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| entity-single-ssr       | Entity detail page renders title/desc/badge server-side; JS only for graph+articles | active | .omo/evidence/task-1-wissensnetz-ssr-improve |
| neo4j-export-script     | npm run build exports Neo4j data to kg_data.json                                    | active | .omo/evidence/task-2-wissensnetz-ssr-improve |
| regenerate-entity-pages | generate-entity-pages.mjs creates enriched .md pages from non-empty kg_data.json    | active | .omo/evidence/task-3-wissensnetz-ssr-improve |

## Open assumptions (announced defaults)

| assumption                                    | adopted default                                                                    | rationale                                                                                                 | reversible?                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Neo4j entities have no `description` property | Use Hugo `.Description` from frontmatter for SSR; improve with category-based text | Entity frontmatter description exists but is generic; real descriptions would require Neo4j schema change | Yes — add description to Neo4j later |

## Findings (cited - path:lines)

1. **kg_data.json is empty** — 0 entities, 0 articles (Neo4j mass-delete aftermath, see AGENTS.md safety rules). myhugoapp/data/kg_data.json
2. **entity/single.html is pure client-side JS** — Fetches `/api/kg-data`, renders everything via innerHTML. Lines 358-799 in myhugoapp/layouts/entity/single.html
3. **55 entity pages exist** — myhugoapp/content/entity/\*/index.md with basic frontmatter (title, description, categories) but no body content. All were created by generate-entity-pages.mjs when kg_data.json had data.
4. **d3 is already local** — `/js/vendor/d3.v7.min.js` exists, entity/single.html line 657 loads it locally.
5. **Entity descriptions in frontmatter are generic** — Pattern: "Fachbegriff: <name> — Kategorie: <cat> — N Artikel auf chemie-lernen.org"
6. **Fallback data exists in server.js** — getFallbackData() (line 718+) has 20+ hardcoded articles and ~100 hardcoded entities with categories, components, relatedEntities. But these have no descriptions, and articles arrays are empty.
7. **Neo4j queries** — /api/kg-data (line 1381+) queries Neo4j for entities + articles, caches for 5 min, falls back to getFallbackData().

## Decisions (with rationale)

1. **SSR first, not API optimization** — Changing entity/single.html to render from Hugo frontmatter (title, description, category badge, breadcrumb) removes the loading flash with minimal effort. The JS fetch becomes supplemental (graph data only, can lazy-load). Big UX win per effort unit.
2. **Neo4j export script before regenerating pages** — Without a fresh kg_data.json, generate-entity-pages.mjs creates pages with "0 Artikel" everywhere. The export script must run at build time.
3. **Keep existing generated page structure** — content/entity/<slug>/index.md with YAML frontmatter. Don't rewrite the page structure — just enrich it.
4. **No new API endpoint** — A per-entity endpoint (/api/kg-data/entity?slug=X) would reduce payload but requires backend changes. Defer this to a future round. The SSR + lazy graph pattern already removes the main performance bottleneck.

## Scope IN

- Entity detail SSR (title, description, badge from Hugo frontmatter)
- Neo4j export script for build-time kg_data.json generation
- Regenerate entity pages with correct article counts from Neo4j
- Progressive enhancement: SSR content visible immediately, graph loads later

## Scope OUT (Must NOT have)

- No new API endpoints in server.js
- No Neo4j schema changes (no adding description property)
- No article detail pages (out of scope - blog posts are /posts/)
- No CSS redesign (already done in Wave 2+3)
- No changes to the entity index page (already polished)
- No changes to the Neo4j data model

## Open questions

None — all answered by exploration.

## Approval gate

status: awaiting-approval
Pending: write .omo/plans/wissensnetz-ssr-improve.md with full todos and present for user approval.
