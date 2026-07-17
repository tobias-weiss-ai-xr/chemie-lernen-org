## Architecture

### Current State (broken)

Two competing curriculum schemas:

**Schema A** (`import-curricula.mjs`):

```
(:Curriculum) -[:HAS_TOPIC]-> (:Topic) -[:HAS_SUBTOPIC]-> (:SubTopic) -[:HAS_LEARNING_OBJECTIVE]-> (:LearningObjective)
```

**Schema B** (`neo4j-migrate-curriculum.mjs`):

```
(:Curriculum) -[:HAS_SUBTOPIC]-> (:SubTopic) -[:COVERS]-> (:LearningObjective)
```

Schema B was used in Sprint 23 for the single "Mittelstufe Chemie" seed. Schema A was never confirmed run.

### Decision: Schema B (COVERS_TOPIC→FULFILLS)

Rationale:

- Already used in production (Sprint 23 migration)
- Shorter chain: Curriculum→SubTopic→LearningObjective (3 levels vs 4)
- Topic names can be properties on SubTopic nodes, not separate nodes
- FULFILLS is semantically clearer than HAS_LEARNING_OBJECTIVE

### Unified Schema

```
(:Curriculum {state, grade, school_type})
  -[:HAS_SUBTOPIC]->
(:SubTopic {name, topic})
  -[:FULFILLS]->
(:LearningObjective {description, objective_id})
  -[:MENTIONED_BY]->
(:Entity {name, kategorie})
```

New relationship types (activated):

- `(:Entity) -[:FULFILLS_OBJECTIVE]-> (:LearningObjective)` — entity covers this objective
- `(:Document) -[:TEACHES_TOPIC]-> (:SubTopic)` — article teaches this subtopic

### Import Pipeline

```
myhugoapp/data/curricula/{state}.json
  → scripts/import-curricula-all.mjs (NEW)
    → Neo4j (Curriculum, SubTopic, LearningObjective nodes + relationships)
  → scripts/link-entities-to-curricula.mjs (EXISTS — update for new schema)
    → Neo4j (Entity→LearningObjective links via text matching)
```

## Key Files

| File                                     | Change                                         |
| ---------------------------------------- | ---------------------------------------------- |
| `scripts/import-curricula-all.mjs`       | NEW — batch import all 16 states               |
| `scripts/import-curricula.mjs`           | UPDATE — reconcile to Schema B                 |
| `scripts/neo4j-migrate-curriculum.mjs`   | Keep as reference, mark deprecated             |
| `scripts/link-entities-to-curricula.mjs` | UPDATE — match Schema B                        |
| `scripts/kg-enrich-relations.mjs`        | Activate semantic enrichment                   |
| `scripts/_neo4j-subset-filter.mjs`       | Verify CHEMIE_LABELS includes all labels       |
| `api/server.js`                          | Update /api/kg-stats to count curriculum nodes |

## Verification

1. Run import-curricula-all.mjs → verify node counts in Neo4j
2. Run link-entities-to-curricula.mjs → verify Entity→LearningObjective links
3. Verify /api/kg-stats returns correct curriculum statistics
4. No duplicate nodes (run on idempotent import)
5. node --check on all modified JS
