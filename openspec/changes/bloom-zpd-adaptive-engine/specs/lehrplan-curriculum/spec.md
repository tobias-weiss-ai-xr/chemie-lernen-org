# Spec: lehrplan-curriculum

**Capability:** German state curricula (Lehrpläne) + didactic guidelines as part of the knowledge graph, including Bloom-level metadata and the learner-state model for adaptive routing
**Owners:** Sisyphus

---

## ADDED Requirements

### Requirement: REQ-LP-BLOOM-1 — Bloom index on learning objectives

Every `:LearningObjective` node SHALL carry a canonical Bloom level and a
numeric `blooms_index` (1–6) for ordering.

- Levels (Anderson/Krathwohl): `remember=1`, `understand=2`, `apply=3`,
  `analyze=4`, `evaluate=5`, `create=6`.
- `blooms_level` (string) and `blooms_index` (int) SHALL be kept consistent.
- Import scripts and backfills SHALL populate `blooms_index` from `blooms_level`.

#### Scenario: Bloom index present

- **WHEN** a `:LearningObjective` node exists
- **THEN** it has a `blooms_index` integer in 1–6
- **AND** `blooms_index` matches the ordinal of `blooms_level`

### Requirement: REQ-LP-STATE-1 — Learner objective state

The schema SHALL support a per-(user, objective) mastery record used for
ZPD-aware routing. Users are authenticated via `users.json` and are **not**
modelled as `:User` nodes in the knowledge graph, so the record carries a
`userId` property and links directly to the objective:

```cypher
(:ObjectiveState {
   userId: string,           // matches req.user.id from auth
   mastery: double,          // 0..1
   bloomsMaxReached: int,    // highest Bloom index demonstrated
   lastSeen: datetime,
   source: string,           // 'quiz' | 'exercise' | 'fsrs' | 'auto-grader'
   updatedAt: datetime
})-[:FOR]->(:LearningObjective)
```

- `ObjectiveState` nodes SHALL be scoped to the `chemie` KG subset.
- `mastery` SHALL be aggregated from assessment, quiz, FSRS, and auto-grader
  signals (see learning-paths ZPD requirements).

#### Scenario: ObjectiveState links user to objective

- **WHEN** a user's mastery for an objective is recorded
- **THEN** an `(:ObjectiveState {userId})` node exists with that `userId`
- **AND** it connects via `-[:FOR]->` to the `(:LearningObjective)`
