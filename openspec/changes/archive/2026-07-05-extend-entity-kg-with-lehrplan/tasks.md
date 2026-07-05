# Tasks: extend-entity-kg-with-lehrplan (Active)

## Cleanup phase (per AGENTS.md safety rules)

- [x] **ELP-1** OBSOLETE — `chemie-kg` instance already exists as clean
      separation (0 code-analysis nodes). No cleanup needed.
- [x] **ELP-2** OBSOLETE — see ELP-1
- [x] **ELP-3** OBSOLETE — see ELP-1
- [x] **ELP-4** Verified: chemie-kg has 14,474 Entity, 171 Tag, 90 Content,
      65 Document nodes. No code-analysis pollution. ✓

## Import phase

- [x] **ELP-5** `scripts/import-didaktik.mjs` (5 KMK guidelines) —
      rewritten from old `:Entity {kategorie:'didaktik'}` to spec-compliant
      `:DidacticGuideline` + `:GuidelineSection` + `:HAS_SECTION`.
      Uses `subsetWhere()`, MERGE-only, exit 0 on partial, `--dry-run`,
      `--file=` support. Dry-run verified: 5 guidelines + 92 sections. ✓
- [x] **ELP-6** Extend `scripts/import-curricula.mjs` (16 states) —
      rewritten from old `:Entity {kategorie:'lehrplan'/'lernziel'}` to
      spec-compliant `:Curriculum/:Topic/:SubTopic/:LearningObjective` + `:HAS_TOPIC/:HAS_SUBTOPIC/:HAS_LEARNING_OBJECTIVE`. Uses
      `subsetWhere()`, MERGE-only, exit 0, `--dry-run`/`--state=`/`--file=`.
      Dry-run verified: 27 curricula, 1788 topics, 312 subtopics, 21602 LOs. ✓
- [x] **ELP-7** Run + verify — both imports ran successfully against
      chemie-neo4j:7687 database `chemie`. 5 DidacticGuideline + 92
      GuidelineSection + 27 Curriculum + 1479 Topic + 303 SubTopic +
      19659 LearningObjective nodes created. 354+402 RELATED_TO links.
      Fixed subsetWhere() Cypher bug in Phase 2 of both scripts. ✓

## Schema phase

- [x] **ELP-8** Update `docs/KNOWLEDGE_GRAPH_SCHEMA.md` — updated
      all typed label rows (Curriculum, Topic, SubTopic, LearningObjective,
      DidacticGuideline, GuidelineSection) with actual PKs and properties.
      Updated relationship table (HAS_TOPIC, HAS_SUBTOPIC, HAS_LEARNING_OBJECTIVE,
      HAS_SECTION, COVERS_TOPIC, FULFILLS). Updated data flow diagram. ✓
- [x] **ELP-9** Wire `:FULFILLS` and `:COVERS_TOPIC` from
      pre-computed mapping files — `link-entities-to-curricula.mjs` rewritten
      to use `:Topic` (slug) and `:LearningObjective` (slug) typed labels.
      MERGE-only, exit 0, `--dry-run`. ✓
- [x] **ELP-10** Refactor `:Content` node shape — created
      `scripts/enrich-content-nodes.mjs` that reads `content-neo4j-mapping.json`
      and adds `curriculum_states[]`, `matched_keywords[]`, `link_score`
      to matching :Content nodes. 68 URLs affected. ✓

## API phase

- [x] **ELP-11** 8 API endpoints updated from `:Entity{kategorie}` to
      typed labels (`:Topic`, `:LearningObjective`, `:DidacticGuideline`,
      `:Curriculum`). Added curricula endpoints:
      `/api/curricula/didaktik`, `/api/curricula/by-state/:state`,
      `/api/curricula/objectives`, `/api/curricula/:slug/objectives`,
      `/api/curricula/linked-entities`. Front-end curricula-index.js +
      curricula-state.js updated for new field names. ✓

## Front-end phase

- [x] **ELP-12** curricula-state.js field names updated to match API
      (`topic.title`, `topic.schoolType`, `topic.objectiveCount`,
      objectives as strings). ✓
- [x] **ELP-13** Lehrplan-Bezug on entity pages — added section with
      CSS + SSR + client containers + `fetchLehrplanBezug()` shared
      script to `entity/single.html`. ✓
- [x] **ELP-14** "Lehrplan" filter chip on Wissensnetz — toggle button + highlight logic in `entity-index.js`, CSS in `entity-index.html`,
      `/api/curricula/linked-entities` endpoint. ✓
- [x] **ELP-15** Extend `getRAGContext` for curriculum nodes — added
      typed label query (`:Topic/:LearningObjective/:Curriculum`) to
      `api/server.js`. ✓

## Testing phase

- [x] **ELP-16** `tests/kg-data-quality.test.js` — 31 tests for
      curriculum labels, REQ-LP-8, API contracts. ✓
- [x] **ELP-17** API endpoint contract tests included in
      `kg-data-quality.test.js`. ✓
- [x] **ELP-18** Playwright E2E smoke tests in
      `test-curricula-modulhandbuch.spec.js` — curricula tabs,
      BY topic cards, Wissensnetz grid + Lehrplan toggle. ✓

## Final

- [x] **ELP-19** Commit `9aeb6b5b` + push. All changes committed and
      pushed to master. ✓
