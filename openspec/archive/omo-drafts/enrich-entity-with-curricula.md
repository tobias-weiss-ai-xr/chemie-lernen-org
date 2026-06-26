# ⚠️ LEGACY — Archived 2026-06-26

This file is from the `.omo/`, `.opencode/`, `.hermes/`, or `.sisyphus/` planning directory used before the OpenSpec bootstrap. The contents reflect planning state at the time of the original work — they may be out of date.

**Where to look instead**:

- Main specs: `openspec/specs/<capability>/spec.md`
- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/`

The source directories ($.omo, .opencode, .hermes, .sisyphus) are kept for historical reference but should not be used for new planning.

---

---

slug: enrich-entity-with-curricula
status: drafting
intent: clear
pending-action: write .omo/plans/enrich-entity-with-curricula.md
approach: Import curriculum topics as :Entity nodes (kategorie: lehrplan) in Neo4j; extend /api/kg-data to include them; add "Lehrplan" filter button in frontend; auto-link topics to existing entities via name normalization

---

# Draft: enrich-entity-with-curricula

## Components (topology ledger)

<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->

| id  | outcome (one line)                                                                                                                                | status | evidence path                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | Import script: reads data/curricula/\*.json, creates :Entity (kategorie:lehrplan) + :Entity (kategorie:lernziel) nodes in Neo4j                   | active | api/server.js:301-304 (Neo4j config), api/server.js:374-382 (entity query pattern), data/curricula/ (15 files, 1788 topics, 21602 learning objectives) |
| C2  | API + entity linking: extends /api/kg-data to return curriculum topics as entities; auto-links topics to existing entities via name normalization | active | api/server.js:362-443 (/api/kg-data endpoint), api/server.js:320-354 (fallback data shape)                                                             |
| C3  | Frontend: adds "Lehrplan" category filter, shows state/grade metadata in cards, new card variant for curriculum topics                            | active | entity-index.js:53-100 (catLabels, catColors, init), entity-index.js:214-239 (filter rendering), entity-index.js:278-330 (card rendering)              |

## Open assumptions (announced defaults)

<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->

| assumption                 | adopted default                                                                                                | rationale                                                                                                              | reversible?                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Topic representation       | Curriculum topics become :Entity nodes with kategorie:'lehrplan' (not separate node type)                      | Existing Cypher query MATCH (e:Entity) ... works unchanged. Frontend category filter pattern requires category string. | Yes — can add separate label later |
| Learning objective display | Learning objectives rendered as sub-entities with kategorie:'lernziel', linked to parent via :TEIL_VON         | Keeps graph structure, enables future queries like "find topics with objective mentioning Redox"                       | Yes                                |
| Entity linking method      | Normalize titles: lowercase, remove "Lernbereich N:", strip parentheticals like "(ca. X Std.)", split on " – " | Simple deterministic approach, no LLM dependency. Covers ~70% of topics.                                               | Yes — can replace with ML later    |
| Fallback data              | Minimal embedded curriculum fallback (BY Gymnasium only)                                                       | Keep fallback bundle small (~20KB max). Full data requires Neo4j.                                                      | No — bundle size constraint        |
| Filter UI                  | Simple "Lehrplan" category button alongside existing categories                                                | Consistent UX, zero layout changes. Users see curriculum topics seamlessly.                                            | Yes — can add separate tab later   |

## Findings (cited - path:lines)

**Neo4j schema (current):**

- Nodes: (:Entity {name, kategorie, seeded}), (:Document {url, title, type, date, tags, ...}), (:Tag {name})
- Rels: [:RELATED_TO], [:BESTEHT_AUS], [:MENTIONS], [:HAS_TAG], [:GEHOERT_ZU]
- Database: 'chemie' on bolt://chemie-neo4j:7687 (api/server.js:301-304)
- Entity query: MATCH (e:Entity) ... RETURN e.name, e.kategorie ... LIMIT 500 (api/server.js:373-382)

**API /api/kg-data:**

- Queries Neo4j; falls back to getFallbackData() on failure (api/server.js:362-443)
- Returns: {source, articles: [...], entities: [...], loadTime} (api/server.js:426-431)
- Fallback shape: {articles: [{id, title, url, entities, date}], entities: [{id, name, category, articles, relatedEntities, articleCount}]} (api/server.js:320-354)
- Fallback has 10 articles, 18 entities (hardcoded)

**Frontend entity-index.js:**

- 435 lines, vanilla JS IIFE (entity-index.js:1)
- Fetches /api/kg-data (entity-index.js:26)
- Category labels: stoff, konzept, reaktion, methode, person, quelle (entity-index.js:57-64)
- Category colors mapped per name (entity-index.js:65-72)
- Filter buttons generated from catLabels, active class + background color (entity-index.js:214-239)
- Cards render: name link (/entity/<slug>/), category badge, related entities chips, pagination (entity-index.js:278-330)
- Sort modes: relations (default), name, articles, category (entity-index.js:184-201)
- Tooltip: first 5 articles + article count + related count (entity-index.js:125-154)
- Search: matches entity name OR related entity names (entity-index.js:106-112)
- Pagination: 24 items/page, page buttons generated (entity-index.js:172-175, 337-357)

**Curriculum data (data/curricula/):**

- 15 state JSON files (no index.json content as separate entity source)
- Total: 1788 topics, 1418 unique titles, 21602 learning objectives
- Structure: {state, state_abbr, school_curricula[{school_type, grade_levels[{grade, topics[{title, learning_objectives[{text}]}]}]}]}
- Sample clean titles: "Donator-Akzeptor-Konzept", "Redoxreaktionen", "Atombau und Periodensystem", "Säure-Base-Gleichgewichte"
- Bayern (by.json) is cleanest; Thüringen (th.json) has formatting noise
- All files have consistent schema (from analysis: th.json, by.json)

**Existing import scripts:**

- scripts/knowledge-graph.mjs: Uses MERGE to create (:Document), links via [:MENTIONS] to (:Entity), creates [:RELATED_TO] between co-mentioned entities (knowledge-graph.mjs:41-60, 165-199)
- scripts/bootstrap-kg.mjs: Seeds entities, sets kategorie, creates [:BESTEHT_AUS] and [:GEHOERT_ZU] relationships, uses MERGE pattern (bootstrap-kg.mjs:35-50, 150-232)
- Both use neo4j-driver with MERGE (safe — no DETACH DELETE) (bootstrap-kg.mjs:150, knowledge-graph.mjs:41)
- @graphwiz/neo4j utility for connection lifecycle (knowledge-graph.mjs:12)

**Docker/Infrastructure:**

- Neo4j container: image neo4j:5.26-community, port 7687 (docker-compose.yml:2-24)
- No mass-deletion allowed (AGENTS.md safety rule)
- Existing Cypher never uses DETACH DELETE

## Decisions (with rationale)

1. **Topic as :Entity (kategorie: 'lehrplan')** — Zero changes to the core /api/kg-data query; curriculum topics appear alongside existing entities automatically because MATCH (e:Entity) gets both.

2. **Learning objectives as :Entity (kategorie: 'lernziel')** — Same benefit + queryable. [:TEIL_VON] links each objective to its parent topic. Not displayed in entity page by default (too many: 21602 would drown filters), but searchable and available for future features.

3. **Name normalization for linking** — Simple 4-step pipeline: (a) lowercase, (b) remove "lernbereich N:" prefix, (c) remove parentheticals like "(ca. X Std.)", (d) split on " – " and take the first meaningful part. Matches against existing :Entity.name. Creates [:RELATED_TO {weight: 1, auto: true}].

4. **Grade as property vs relationship** — Store `grade`, `school_type`, `state`, `state_abbr` as properties on the topic :Entity. Avoids schema complexity of separate Grade/State/SchoolType nodes for MVP. Can extract later if needed.

5. **Fallback data** — Add ~5 representative curriculum entries to the static fallback. Small enough to not bloat the bundle, but enough to demonstrate the feature when Neo4j is down.

6. **Frontend: new category only** — No separate tab, no new HTML structure. Just add 'lehrplan' to catLabels and catColors. Card rendering shows grade+state in the subtitle. Tooltip shows "X Lernziele" instead of "X Artikel".

## Scope IN

1. Import script `scripts/import-curricula.mjs`: Reads 15 state JSON files, creates curriculum topic + learning objective entities in Neo4j
2. Entity linking: Auto-links topics to existing entities via normalized name matching
3. API extension: Extends /api/kg-data to include curriculum topics in the entities array
4. Fallback data update: Adds representative curriculum entries to getFallbackData()
5. Frontend: Adds "Lehrplan" category filter with purple color #9b59b6
6. Frontend: Curriculum card shows grade/state in subtitle, learning objective count
7. Frontend: Curriculum entity tooltip shows "X Lernziele in Y Schulformen" instead of article count

## Scope OUT (Must NOT have)

1. NO new Neo4j node labels — uses existing :Entity label with new kategorie values
2. NO interactive curriculum explorer with Bundesland/Klassenstufe dropdowns — MVP uses flat filter
3. NO changes to /wissennetz/ interactive graph
4. NO changes to the curriculum scraper code (blocked: no Python host)
5. NO curriculum data without Neo4j being online (except minimal fallback)
6. NO DETACH DELETE or mass-deletion operations
7. NO new npm packages in the frontend
8. NO curriculum data editing UI — read-only display
9. NO browser-based curriculum browsing by state/grade — just the entity filter

## Open questions

None — all forks resolved to defaults above.

## Approval gate

status: awaiting-approval

<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
