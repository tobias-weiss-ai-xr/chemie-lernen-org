# Spec: central-kg-architecture

**Capability:** Central Neo4j knowledge graph shared across all
applications (chemie-lernen.org, code-analysis, future Modulhandbücher,
personal data, etc.)
**Status:** Active — main spec; non-negotiable architectural rule
**Owners:** Sisyphus (all consumers)

---

## Purpose

The Neo4j `chemie` database is the **central knowledge graph for
everything** owned by the user. It is NOT a chemie-specific database.
The chemie-lernen.org application is one of several consumers.

Subsets currently in the KG:

| Subset                  | Labels                                                                                                                                               | Node count            | Primary consumer                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------ |
| Chemie                  | `Entity`, `Document`, `Tag`, `Content`, plus planned `Curriculum`, `Topic`, `SubTopic`, `LearningObjective`, `DidacticGuideline`, `GuidelineSection` | ~16k + planned growth | chemie-lernen.org                    |
| Code-analysis           | `Variable`, `Parameter`, `Function`, `Class`, `File`, `Module`, `Interface`, `Directory`, `Repository`, `Macro`, `Struct`, `Enum`, `Episodic`        | ~683k                 | dev-agent / codebase analysis tools  |
| Modulhandbuch (planned) | `University`, `Module`, `ModuleOffering`, `ECTS`, `Lecturer`, `Topic`, `Degree`                                                                      | TBD                   | chemie-lernen.org (top-unis feature) |

### Curriculum Learning Labels (Sprint 23+)

Used for structured learning paths and progression tracking.

| Label               | Description                       | Key Properties                                                                                           |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Curriculum`        | A complete course/curriculum path | slug, title, grade, description                                                                          |
| `Topic`             | A major topic within a curriculum | slug, title, order                                                                                       |
| `SubTopic`          | A sub-topic area                  | slug, title, order                                                                                       |
| `LearningObjective` | A measurable learning objective   | slug, description, bloomLevel (remember\|understand\|apply\|analyze\|evaluate\|create), estimatedMinutes |

### Curriculum Relationships — Schema B (Canonical, Sprint 28+)

The canonical relationship schema for curriculum data uses the chain:
`(:Curriculum) -[:HAS_TOPIC]-> (:Topic) -[:HAS_SUBTOPIC]-> (:SubTopic) -[:FULFILLS]-> (:LearningObjective)`

| Type                 | From                | To                  | Description                                    |
| -------------------- | ------------------- | ------------------- | ---------------------------------------------- |
| `HAS_TOPIC`          | `Curriculum`        | `Topic`             | Topics belonging to a curriculum               |
| `HAS_SUBTOPIC`       | `Topic`             | `SubTopic`          | Sub-topics within a topic                      |
| `FULFILLS`           | `SubTopic`          | `LearningObjective` | Sub-topic fulfills/contains learning objective |
| `PREREQUISITE`       | `LearningObjective` | `LearningObjective` | One objective must be completed before another |
| `COVERED_BY`         | `LearningObjective` | `Content`           | The content page that teaches this objective   |
| `FULFILLS_OBJECTIVE` | `Entity`            | `LearningObjective` | Entity (concept/term) fulfills an objective    |
| `COVERS_TOPIC`       | `Entity`            | `Topic`             | Entity covers a curriculum topic               |

### Schema A (Deprecated)

Schema A used `HAS_LEARNING_OBJECTIVE` directly from `:Topic` to `:LearningObjective`,
bypassing `:SubTopic`. This schema was used by `scripts/import-curricula.mjs` and
`scripts/neo4j-migrate-curriculum.mjs` prior to Sprint 28.

```
(:Curriculum) -[:HAS_TOPIC]-> (:Topic) -[:HAS_LEARNING_OBJECTIVE]-> (:LearningObjective)
```

All new imports use **Schema B**. Schema A scripts are marked deprecated.

### Planned / Unused Relationship Types

The following relationship types were defined in older schema versions
or the `entity-knowledge-graph` spec but are **not currently used** in
active pipeline code:

| Type                  | Source    | Notes                                        |
| --------------------- | --------- | -------------------------------------------- |
| `TEIL_VON`            | Entity-KG | Replaced by `HAS_SUBTOPIC` / `FULFILLS`      |
| `FOERDERT`            | Entity-KG | Never materialized at scale                  |
| `REAGIERT_MIT`        | Entity-KG | Never materialized at scale                  |
| `HINDERT`             | Entity-KG | Never materialized at scale                  |
| `IST_BESTANDTEIL_VON` | Entity-KG | Never materialized at scale                  |
| `GEHOERT_ZU`          | Entity-KG | Used for Category membership, not curriculum |
| `ERSETZT_DURCH`       | Entity-KG | Never materialized at scale                  |
| `WIRD_GEBILDET_AUS`   | Entity-KG | Never materialized at scale                  |
| `ENTHAELT`            | Entity-KG | Never materialized at scale                  |
| `WIRD_ABGEBAUT_ZU`    | Entity-KG | Never materialized at scale                  |
| `BESCHLEUNIGT_DURCH`  | Entity-KG | Never materialized at scale                  |

## Requirements

### REQ-CKG-1: Single central database

The Neo4j instance is `chemie-neo4j:7687`, database name `chemie`.
All consumers connect to the same database. There is no "chemie
database" vs "code database" — both are the central KG, different
subsets.

### REQ-CKG-2: Label-based subset isolation

Each subset is identified by a **set of labels**. Subsets are NOT
identified by:

- Database name (always `chemie`)
- Property flag (`is_chemie: true`)
- Node id range
- Connection user

Every query MUST explicitly filter on the subset's labels.

### REQ-CKG-3: Centralized subset selector

`scripts/_neo4j-subset-filter.mjs` exports:

```js
// Pre-defined subsets
export const SUBSETS = {
  chemie: [
    'Entity',
    'Document',
    'Tag',
    'Content',
    'Curriculum',
    'Topic',
    'SubTopic',
    'LearningObjective',
    'DidacticGuideline',
    'GuidelineSection',
    'LearningPath',
  ],
  codeAnalysis: [
    'Variable',
    'Parameter',
    'Function',
    'Class',
    'File',
    'Module',
    'Interface',
    'Directory',
    'Repository',
    'Macro',
    'Struct',
    'Enum',
    'Episodic',
  ],
  modulhandbuch: ['University', 'Module', 'ModuleOffering', 'ECTS', 'Lecturer', 'Topic', 'Degree'],
};

// Cypher snippet generators
export function subsetMatch(subsetName) {
  // Returns: "(n:Entity OR n:Document OR n:Tag OR n:Content ...)"
  const labels = SUBSETS[subsetName];
  return '(' + labels.map((l) => `n:${l}`).join(' OR ') + ')';
}

export function subsetMatchRel(subsetName, relVar = 'r') {
  // Returns a snippet for the FROM or TO side of a relationship
}
```

### REQ-CKG-4: All consumer code uses the selector

- `api/server.js` — every chemie query uses `subsetMatch('chemie')`
- `scripts/export-kg-data.mjs` — same
- `scripts/import-curricula.mjs` — same
- `scripts/import-didaktik.mjs` — same
- `scripts/import-modulhandbuch.mjs` — uses `subsetMatch('modulhandbuch')`
- `tests/kg-data-quality.test.js` — same

A simple `grep` audit can verify:

```bash
# This should return ZERO matches
grep -r "MATCH (n)" api/ scripts/ tests/ | grep -v "_neo4j-subset-filter"
```

### REQ-CKG-5: No mass-delete without consent

Per the user's safety rules, NEVER run:

- `MATCH (n) DETACH DELETE n`
- `MATCH (n:SomeLabel) DETACH DELETE n` for any label that might
  contain other subsets

Cleanup is always:

- Identify the EXACT subset of nodes (by label + property)
- Export a backup first
- Get explicit user consent
- Run the targeted delete
- Verify the delete

### REQ-CKG-6: Cross-subset relationships are allowed

The chemie subset can reference code-analysis nodes (e.g. an
`Entity` might point to a `File` that defines it). Cross-subset
relationships are explicit and documented:

- `:Entity -[:DEFINED_IN]-> :File` (chemie → code-analysis)
- `:Module -[:TEACHES]-> :Entity` (modulhandbuch → chemie)
- `:Curriculum -[:REFERENCES]-> :Module` (chemie → modulhandbuch)

When querying, BOTH sides of a cross-subset relationship must be
filtered to their respective subsets.

### REQ-CKG-7: Audit + observability

- `GET /api/kg-stats` returns per-subset counts
- `GET /api/kg-subsets` returns the list of registered subsets and
  their labels
- The scope-filter helper logs when a query runs without a subset
  filter (warning, not error — for the dev case)

## Scenarios

### S-CKG-1: Chemie query against shared database

**Given** the chemie application runs `MATCH (n) RETURN count(n)`
without a subset filter
**Then** the query returns 700k+ nodes (all subsets mixed)
**And** the chemie app should NOT use this query — it must use
`MATCH (n) WHERE n:Entity OR n:Document OR ... RETURN count(n)` or
the helper `subsetMatch('chemie')`

### S-CKG-2: Adding a new subset (e.g. Personal)

**Given** the user wants to add a personal subset with labels
`Person`, `Address`, `Phone`, `Event`
**Then** the new subset is added to `SUBSETS` in
`scripts/_neo4j-subset-filter.mjs`
**And** all other consumers continue to scope to their own subsets
(chemie app doesn't see the personal data)
**And** cross-subset queries are explicit (e.g. `Person -[:OWNS]-> :Entity`)

### S-CKG-3: Cross-subset query

**Given** a chemie entity "Ammoniak" is referenced by a module at
ETH Zürich (modulhandbuch subset)
**When** the user views `/entity/ammoniak/`
**Then** the page shows "ETH Zürich, Modul 'Anorganische Chemie II'
vermittelt dieses Konzept" (cross-subset query, joining chemie and
modulhandbuch)
**And** the query is: `MATCH (m:Module) WHERE ... WITH m MATCH (m)-[:TEACHES]->(e:Entity) WHERE e.name = 'Ammoniak'`

## References

- `scripts/_neo4j-subset-filter.mjs` (to be created) — the central selector
- `openspec/specs/entity-knowledge-graph/spec.md` — the chemie subset
- `openspec/specs/lehrplan-curriculum/spec.md` — chemie + KMK
- `openspec/specs/modulhandbuch-university/spec.md` (planned) — top-unis subset
- `AGENTS.md` — project conventions including this architecture
