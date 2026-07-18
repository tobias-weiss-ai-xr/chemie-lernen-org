## Sprint 28: Neo4j Schema Reconciliation + Curriculum Import

### Schema Reconciliation

- [x] 28.1: Pick Schema B (COVERS_TOPIC→FULFILLS) as canonical — document decision in central-kg-architecture/spec.md
- [x] 28.2: Mark `neo4j-migrate-curriculum.mjs` as deprecated (add comment header)
- [x] 28.3: Update `import-curricula.mjs` to use Schema B (HAS_SUBTOPIC→FULFILLS chain)
- [x] 28.4: Clean up 12 unused relationship types from schema docs (TEIL_VON, FOERDERT, etc.)

### Curriculum Import

- [x] 28.5: Create `scripts/import-curricula-all.mjs` — batch import all 16 state JSONs as Curriculum→SubTopic→LearningObjective
- [x] 28.6: Make import idempotent (MERGE on state+grade+subtopic_name+objective_id)
- [ ] 28.7: ⛔ BLOCKED — Run import — verify 16 Curriculum, ~1788 SubTopic, ~21602 LearningObjective nodes created (Neo4j unreachable)

### Entity Linking

- [x] 28.8: Update `scripts/link-entities-to-curricula.mjs` for Schema B — text-match entities to learning objectives
- [ ] 28.9: ⛔ BLOCKED — Run linking — verify Entity→LearningObjective relationships created (Neo4j unreachable)

### Semantic Enrichment

- [x] 28.10: Activate `scripts/kg-enrich-relations.mjs` — generate AEHNLICH_ZU, BEINHALTET, etc. between entities
- [x] 28.11: Update `_neo4j-subset-filter.mjs` CHEMIE_LABELS if needed

### API + Verification

- [x] 28.12: Update `/api/kg-stats` endpoint to report curriculum node/relationship counts
- [x] 28.13: node --check + eslint pass; Neo4j-dependent verification blocked
