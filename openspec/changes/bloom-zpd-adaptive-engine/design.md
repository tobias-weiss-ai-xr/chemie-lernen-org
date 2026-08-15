# Design: bloom-zpd-adaptive-engine

## Model

Two orthogonal coordinates per objective:

| Axis                         | Defined by                            | Stored on                          |
| ---------------------------- | ------------------------------------- | ---------------------------------- |
| **Bloom** (cognitive demand) | `blooms_level` + `blooms_index` (1–6) | `:LearningObjective`               |
| **ZPD** (learner fit)        | `mastery` of LO + its prerequisites   | `:ObjectiveState` per `(user, LO)` |

Bloom order (Anderson/Krathwohl):

```
1 remember · 2 understand · 3 apply · 4 analyze · 5 evaluate · 6 create
```

ZPD membership for a learner `u` and objective `lo`:

```
prereqOk  = avg( mastery(u, p) for p in prerequisites(lo) ) >= θ_high   // 0.8
notDone   = mastery(u, lo) <= θ_low                                     // 0.60
inReach   = blooms_index(lo) <= bloomsMaxReached(u) + 1                 // one step up
inZPD(u, lo) = prereqOk AND notDone AND inReach
```

Anything with `mastery > θ_low` is _mastered_; anything failing `prereqOk`
is _blocked_; everything else fitting the band is _in ZPD_.

## Neo4j schema additions

```cypher
// on :LearningObjective
SET lo.blooms_index = 1..6          // derived from blooms_level

// learner state (chemie subset only)
// NOTE: users live in users.json, NOT as :User nodes in the KG, so the
// record carries a userId property and links directly to the objective.
(:ObjectiveState {
   userId: string,            // = req.user.id
   mastery: double,           // 0..1
   bloomsMaxReached: int,     // highest Bloom index demonstrated
   lastSeen: datetime,
   source: string,
   updatedAt: datetime
})-[:FOR]->(:LearningObjective)
```

`mastery` is aggregated by the R1 deep dive; this change only _reads/writes_
the `:ObjectiveState` via `POST /api/zpd/mastery` and seeds it from existing
quiz/exercise completions where available.

## nextObjectiveInZPD (Cypher sketch)

```cypher
// params: userId, pathSlug?, thetaHigh=0.8, thetaLow=0.6
MATCH (u:User {id:$userId})
MATCH (lo:LearningObjective)
WHERE $pathSlug IS NULL
      OR EXISTS {
        MATCH (p:LearningPath {slug:$pathSlug})-[:HAS_TOPIC]->(:Topic)-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo)
      }
OPTIONAL MATCH (lo)<-[:PREREQUISITE]-(pre:LearningObjective)
OPTIONAL MATCH (u)-[:HAS_OBJECTIVE_STATE]->(st:ObjectiveState)-[:FOR]->(pre)
WITH lo,
     avg(CASE WHEN pre IS NULL THEN 1.0 ELSE st.mastery END) AS prereqAvg,
     // learner's own mastery of lo
     head([ (u)-[:HAS_OBJECTIVE_STATE]->(s:ObjectiveState)-[:FOR]->(lo) | s.mastery ]) AS loMastery
WHERE prereqAvg >= $thetaHigh
  AND coalesce(loMastery, 0.0) <= $thetaLow
RETURN lo.slug AS slug, lo.blooms_index AS bloom,
       lo.description AS description, prereqAvg AS prereqAvg
ORDER BY lo.blooms_index DESC, lo.slug
LIMIT 1
```

## Strategy activator (hook)

Given the ZPD query result + learner signals, return one recommended strategy
so the UI / calling service can delegate to the right deep dive later:

| Condition                               | `recommendedStrategy`                        |
| --------------------------------------- | -------------------------------------------- |
| `loMastery = 0` and prereqs solid       | `scaffold` (R2) or `differentiate` (R4)      |
| `0.6 < loMastery < 0.8`                 | `assess` (R1 — confirm with formative check) |
| peer with overlapping ZPD exists        | `peer` (R3)                                  |
| spatial/visual objective & level allows | `tool` (R5)                                  |
| default                                 | `differentiate` (R4)                         |

This change returns the _field_; the actual behavior of each strategy is
implemented in the roadmap deep dives.

## API contract

### `GET /api/learning-paths/:slug/next` (auth required)

```json
{
  "inZPD": true,
  "next": { "slug": "stoffe-teilchen-lo-3", "bloom": 3, "description": "…" },
  "recommendedStrategy": "scaffold",
  "prereqAvg": 0.91
}
```

### `POST /api/zpd/mastery` (auth required)

```json
{ "objectiveSlug": "stoffe-teilchen-lo-3", "mastery": 0.7, "bloomLevel": 3, "source": "quiz" }
```

Upserts the `:ObjectiveState` for the calling user; updates `bloomsMaxReached`
and `lastSeen`. Returns the updated state.

## Component wiring (existing → engine)

| Existing component                   | Role in engine                                |
| ------------------------------------ | --------------------------------------------- |
| quiz / exercise completion           | seed `mastery` via `POST /api/zpd/mastery`    |
| FSRS (Android)                       | future source for `mastery` (R1)              |
| auto-grader / feedback-engine (core) | future source for Bloom-level mastery (R1/R2) |
| learning-paths route                 | consumes `nextObjectiveInZPD`                 |
| `collab-engine` / Hubs               | consume ZPD overlap for peer matching (R3)    |

## Thresholds & tuning

θ_high=0.8, θ_low=0.6 are starting values; R1 owns tuning + per-cohort
calibration. `bloomsMaxReached + 1` keeps the staircase to one Bloom step at a
time (avoid over-jumping).
