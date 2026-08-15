# Design: zpd-deepdive-scaffolding (R2)

## Concept: Bloom-staircase scaffolding

When a learner encounters an objective at Bloom level N but their
`bloomsMaxReached` is at level M < N, the scaffolding engine produces a
**staircase of hints** from level M+1 to N. Each hint is a "cognitive
step" that bridges the learner from what they can already do (level M) to
what the objective requires (level N).

```
Learner position: bloomsMaxReached = 2 (understand)
Target objective:  blooms_index    = 4 (analyze)

Staircase:
  Step 1 (Bloom 3 — apply):     "Wende das Konzept auf ein Beispiel an…"
  Step 2 (Bloom 4 — analyze):   "Zerlege die Struktur in ihre Bestandteile…"
```

The engine does **not** generate the German text — that is the private
`chemie-core`'s job (LiteLLM prompts in `api/prompts/`). The engine
produces a **scaffolding plan**: a JSON structure specifying Bloom levels,
verbs, and scaffold descriptors that the private prompt templates use to
craft actual hints.

## Bloom staircase model

### Bloom levels and German verb labels

| Index | Level       | German verb label      | Scaffold descriptor                                    |
| ----- | ----------- | ---------------------- | ------------------------------------------------------ |
| 1     | remember    | *Erinnern*             | Abruf von Fakten, Definitionen, Formeln               |
| 2     | understand  | *Verstehen*            | Erklärung in eigenen Worten, Zusammenhänge erkennen    |
| 3     | apply       | *Anwenden*             | Transfer auf neues Beispiel, Berechnung durchführen   |
| 4     | analyze     | *Analysieren*          | Struktur zerlegen, Muster erkennen, vergleichen       |
| 5     | evaluate    | *Bewerten*             | Kritische Bewertung, Argumente abwägen, Stellung nehmen|
| 6     | create      | *Erschaffen*           | Neues Modell entwerfen, Experiment planen, Synthese   |

### Staircase computation

Given `bloomsMaxReached = M` and `targetBloom = N`:

- If `M >= N`: no scaffolding needed (learner at or above target).
- If `M == N - 1`: single step — one hint at level N.
- If `M < N - 1`: multi-step — hints from `M + 1` to `N` inclusive.

```js
function computeStaircase(bloomsMaxReached, targetBloom) {
  if (bloomsMaxReached >= targetBloom) return [];
  const steps = [];
  for (let level = bloomsMaxReached + 1; level <= targetBloom; level++) {
    steps.push({ bloomIndex: level, ...BLOOM_METADATA[level] });
  }
  return steps;
}
```

### Scaffolding plan output

```json
{
  "objectiveSlug": "stoffe-teilchen-lo-3",
  "targetBloom": 4,
  "learnerBloom": 2,
  "staircase": [
    {
      "step": 1,
      "bloomIndex": 3,
      "level": "apply",
      "verb": "Anwenden",
      "descriptor": "Transfer auf neues Beispiel, Berechnung durchführen",
      "hintType": "worked-example"
    },
    {
      "step": 2,
      "bloomIndex": 4,
      "level": "analyze",
      "verb": "Analysieren",
      "descriptor": "Struktur zerlegen, Muster erkennen, vergleichen",
      "hintType": "socratic-question"
    }
  ],
  "totalSteps": 2,
  "gap": 2
}
```

`hintType` per level (used by private prompt templates to select the
prompt strategy):

| Bloom level | hintType                |
| ----------- | ----------------------- |
| remember    | `direct-recall`         |
| understand  | `analogy`               |
| apply       | `worked-example`        |
| analyze     | `socratic-question`     |
| evaluate    | `compare-contrast`      |
| create      | `open-ended-challenge`  |

## Service: `api/services/scaffolding-engine.js`

### Public API

```js
import {
  computeStaircase,
  scaffoldingPlan,
  BLOOM_METADATA,
} from './scaffolding-engine.js';
```

#### `computeStaircase(bloomsMaxReached, targetBloom) → Array<Step>`

Pure function. Returns the array of staircase steps (or empty if none
needed). No DB access.

#### `scaffoldingPlan(userId, objectiveSlug) → Promise<Plan|null>`

Async. Reads the learner's `bloomsMaxReached` from `:ObjectiveState` and
the objective's `blooms_index` from `:LearningObjective`, then calls
`computeStaircase`. Returns the full plan object (see above) or `null` if
the objective doesn't exist or has no `blooms_index`.

Cypher query (reads only, no writes):

```cypher
MATCH (lo:LearningObjective {slug: $objectiveSlug})
WHERE lo.blooms_index IS NOT NULL
OPTIONAL MATCH (s:ObjectiveState)-[:FOR]->(lo)
  WHERE s.userId = $userId
RETURN lo.blooms_index AS targetBloom,
       coalesce(s.bloomsMaxReached, 0) AS learnerBloom
```

Scoped to `chemie` subset via `subsetMatch()`.

## Route: `GET /api/scaffolding/hints` (auth required)

| Param           | Location | Required | Description                           |
| --------------- | -------- | -------- | ------------------------------------- |
| `objectiveSlug` | query    | yes      | The learning objective to scaffold   |

Response 200:

```json
{
  "objectiveSlug": "stoffe-teilchen-lo-3",
  "targetBloom": 4,
  "learnerBloom": 2,
  "staircase": [ ... ],
  "totalSteps": 2,
  "gap": 2
}
```

Response 404 if the objective slug doesn't exist or has no `blooms_index`.

Response 200 with `staircase: []` and `totalSteps: 0` if the learner is
already at or above the target level (no scaffolding needed).

## Component wiring

```
GET /api/scaffolding/hints?objectiveSlug=X
  → scaffolding-engine.scaffoldingPlan(userId, objectiveSlug)
    → Neo4j: read ObjectiveState + LearningObjective
    → computeStaircase(learnerBloom, targetBloom)
      → return plan

Private chemie-core (consumes plan):
  feedback-engine    → uses plan.staircase[i].hintType to select prompt template
  exercise-generator → uses plan.gap to calibrate exercise difficulty
```

## Thresholds & constraints

- Max gap: 5 (Bloom 1 → 6). If `gap > 5`, the engine truncates the
  staircase to 5 steps (the highest 5 levels up to target), since a gap
  wider than the full Bloom taxonomy indicates a prerequisite issue
  rather than a scaffolding issue.
- Zero-gap (`learnerBloom >= targetBloom`): empty staircase — the learner
  should be assessed or moved to the next objective.
