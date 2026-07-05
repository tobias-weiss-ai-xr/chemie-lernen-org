# Change: extend-entity-kg-with-lehrplan (Active)

**Status:** Active (proposal stage)
**Spec impact:** Extends `entity-knowledge-graph/spec.md` with
curriculum/didaktik data; new main spec `lehrplan-curriculum/spec.md`;
complies with `central-kg-architecture/spec.md` REQ-CKG-2, REQ-CKG-3

## Why

The central Neo4j `chemie` database has 16k chemistry nodes
(14,474 :Entity, 1,405 :Document, 171 :Tag, 90 :Content) but is
missing the curricula + didaktik data. The 16 state curricula
JSON files in `myhugoapp/data/curricula/` (21k learning
objectives, 12.8 MB of cross-links) and the 5 KMK guidelines in
`myhugoapp/data/didaktik/didaktik.json` are NOT in Neo4j.

The `chemie` DB is the user's **central knowledge graph for
everything** (see `AGENTS.md` §"Central Knowledge Graph
architecture" and `central-kg-architecture/spec.md`). It contains
the chemie subset + a code-analysis subset (~683k nodes) and will
contain more subsets (modulhandbücher, etc.). All queries must
scope to their subset.

The new spec `lehrplan-curriculum/spec.md` defines the target
schema. This change implements it.

## What changed (planned)

1. **Scope-filter convention** (NEW, per user decision 2026-06-26):
   - All queries in scripts, API, and tests MUST filter to the
     chemie label set:
     `Entity | Document | Tag | Content | Curriculum | Topic |
SubTopic | LearningObjective | DidacticGuideline |
GuidelineSection`
   - Centralize as a Cypher `MATCH (n) WHERE n:Entity OR n:Document
OR ...` pattern in a shared helper
   - Add `scripts/_neo4j-chemie-filter.cjs` (or `.mjs`) with:
     - `CHEMIE_LABELS` array
     - `chemieMatch()` Cypher snippet generator
     - `chemieMatchParam()` for use in `WHERE` clauses
   - Refactor existing queries in `api/server.js` to use the helper
   - Tests in `tests/neo4j-scope-filter.test.js` assert the helper
     is used in all chemie queries

2. **Import phase**:
   - New `scripts/import-didaktik.mjs` — reads
     `myhugoapp/data/didaktik/didaktik.json` and creates
     `:DidacticGuideline` + `:GuidelineSection` nodes
   - Extend `scripts/import-curricula.mjs` (or create
     `scripts/import-curricula-v2.mjs`) — creates `:Curriculum`,
     `:Topic`, `:SubTopic`, `:LearningObjective` nodes
   - Both scripts are idempotent (use `MERGE` not `CREATE`)
   - Both exit 0 on partial success (per the existing
     `export-kg-data.mjs` pattern)

3. **Schema phase**:
   - Add the new node labels and rel types per
     `lehrplan-curriculum/spec.md` REQ-LP-2, REQ-LP-3
   - Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md` with the new labels

4. **Integration phase**:
   - Wire `:FULFILLS` from `:LearningObjective` to `:Entity` based on
     `content-neo4j-mapping.json` (1.4 MB of pre-computed mappings)
   - Wire `:COVERS_TOPIC` from `:Document` to `:Topic` based on
     `content-links.json` (12.8 MB)
   - Re-link `:Content` nodes to the new `:Curriculum` graph (current
     `:Content` only has `{title, type, url}` — needs refactor)

5. **API phase**:
   - Add the 5 new endpoints per `lehrplan-curriculum/spec.md`
     REQ-LP-6: `/api/curriculum/{state}`, `/api/curriculum/{state}/grade/{n}`,
     `/api/curriculum/topic/{slug}/articles`,
     `/api/curriculum/objective/{id}/articles`, `/api/didaktik`

6. **Front-end phase**:
   - New `/lehrplaene/` index page
   - Per-state `/lehrplaene/{state}/` page (Hugo templated from
     `myhugoapp/data/curricula/{state}.json`)
   - Lehrplan-Bezug section on entity pages
   - Topic/objective link-out from article pages
   - "Lehrplan" filter chip on Wissensnetz
   - KI-Assistent: extend `getRAGContext` to include curriculum
     nodes when the query references a state/grade

7. **Testing phase**:
   - Extend `tests/kg-data-quality.test.js` with curriculum + didaktik
     checks (REQ-LP-4, REQ-LP-5, REQ-LP-8)
   - Add 5 endpoint tests for the new API routes
   - Add a Playwright test for `/lehrplaene/by/`
   - Add `tests/neo4j-scope-filter.test.js` to assert scope filter
     is applied

## Tasks

- [ ] **ELP-1** Create `scripts/_neo4j-chemie-filter.mjs` with
      `CHEMIE_LABELS` + `chemieMatch()` helper
- [ ] **ELP-2** Refactor `api/server.js` queries to use the helper
- [ ] **ELP-3** Refactor `scripts/export-kg-data.mjs` to use the helper
- [ ] **ELP-4** Add `tests/neo4j-scope-filter.test.js`
- [ ] **ELP-5** Write `scripts/import-didaktik.mjs` for the 5 KMK
      guidelines
- [ ] **ELP-6** Extend `scripts/import-curricula.mjs` for the 16
      state curricula (or write v2)
- [ ] **ELP-7** Run both importers and verify node counts
- [ ] **ELP-8** Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md`
- [ ] **ELP-9** Wire `:FULFILLS` and `:COVERS_TOPIC` based on
      pre-computed mapping files
- [ ] **ELP-10** Refactor `:Content` node shape (add state, grade,
      objective text)
- [ ] **ELP-11** Add 5 API endpoints
- [ ] **ELP-12** Build `/lehrplaene/` index and per-state pages
- [ ] **ELP-13** Add Lehrplan-Bezug section to entity pages
- [ ] **ELP-14** Add "Lehrplan" filter chip to Wissensnetz
- [ ] **ELP-15** Extend `getRAGContext` to include curriculum nodes
- [ ] **ELP-16** Extend `tests/kg-data-quality.test.js`
- [ ] **ELP-17** Add 5 endpoint tests
- [ ] **ELP-18** Add Playwright test for `/lehrplaene/by/`
- [ ] **ELP-19** Commit atomically + push

## Status

In progress (proposal stage).
