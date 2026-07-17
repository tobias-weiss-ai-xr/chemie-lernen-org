## Why

The Lehrpläne (curricula) data exists as 16 state JSON files (~1.7 MB, 1,788 topics, 21,602 learning objectives) but has never been imported into Neo4j as typed nodes. Two competing import schemas exist: `import-curricula.mjs` uses `HAS_LEARNING_OBJECTIVE` while `neo4j-migrate-curriculum.mjs` uses `HAS_SUBTOPIC→COVERS`. The existing KG entities are not linked to curricula — there's no way to see which Bundesland teaches which concept. The Neo4j schema has 12 declared but unused relationship types and 13 semantic enrichment types that were designed but never activated. This sprint reconciles the schemas, imports all curricula, links entities to learning objectives, and cleans up the schema.

## What Changes

- Pick one unified curriculum schema (COVERS_TOPIC→FULFILLS chain)
- Import all 16 state curricula as typed Neo4j nodes: Curriculum→Topic→SubTopic→LearningObjective
- Link existing KG entities to learning objectives via MENTIONS/COVERS relationships
- Activate semantic relationship enrichment (kg-enrich-relations.mjs) — AEHNLICH_ZU, BEINHALTET, etc.
- Remove 12 unused relationship types from schema documentation
- Update `_neo4j-subset-filter.mjs` if new labels added

## Capabilities

### Modified Capabilities

- `central-kg-architecture/spec.md` — unified curriculum schema, new relationship types
- `lehrplan-curriculum/spec.md` — import pipeline, schema reconciliation
- `learning-paths/spec.md` — real curriculum data as foundation

## Impact

- **Neo4j**: 16 state curricula imported (1,788 topics, 21,602 objectives) — currently 0
- **API**: `/api/kg-stats` returns curriculum node counts
- **Schema**: Unified, no competing schemas
- **Data**: Entities linked to learning objectives across all 16 states
