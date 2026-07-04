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

- [ ] **ELP-11** 5 new endpoints per `lehrplan-curriculum/spec.md`
      REQ-LP-6

## Front-end phase

- [ ] **ELP-12** `/lehrplaene/` index + per-state pages
- [ ] **ELP-13** Lehrplan-Bezug on entity pages
- [ ] **ELP-14** "Lehrplan" filter chip on Wissensnetz
- [ ] **ELP-15** Extend `getRAGContext` for curriculum nodes

## Testing phase

- [ ] **ELP-16** Extend `tests/kg-data-quality.test.js`
- [ ] **ELP-17** 5 endpoint tests
- [ ] **ELP-18** Playwright test for `/lehrplaene/by/`

## Final

- [ ] **ELP-19** Commit + push
