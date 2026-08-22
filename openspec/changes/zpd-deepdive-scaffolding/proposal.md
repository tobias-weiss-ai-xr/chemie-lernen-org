# Change Proposal: zpd-deepdive-scaffolding (R2)

## Why

The Bloom × ZPD adaptive engine (parent change `bloom-zpd-adaptive-engine`)
establishes the `recommendedStrategy` hook. When this hook returns `scaffold`,
the platform currently has **no mechanism** to generate Bloom-staircase
hints — progressive scaffolding that walks a learner from their current
Bloom level up to the target objective's cognitive demand.

The existing `feedback-engine` (private `chemie-core`) provides generic
correct/incorrect feedback and static tips, and the Exercise Generator can
scale difficulty by Bloom band. But neither implements **adaptive
scaffolding**: hints calibrated to the learner's `bloomsMaxReached` that
bridge the cognitive gap one Bloom step at a time (remember → understand →
apply → analyze → evaluate → create).

Without this, the `scaffold` strategy recommendation is inert — it tells the
UI "use scaffolding" but there is nothing to invoke.

## What Changes

This change introduces the **scaffolding engine**: a public service that,
given a learner's current Bloom position and a target objective, produces a
structured set of progressive hints climbing the Bloom staircase. It
exposes:

1. **`api/services/scaffolding-engine.js`** (public) — pure-function
   staircase logic + a Cypher query to fetch the learner's current state.
2. **`GET /api/scaffolding/hints`** (auth required) — returns the
   Bloom-staircase hint plan for a given objective.
3. **Hint-level metadata** — each hint carries its Bloom index, a verb
   label, and a scaffold descriptor (what cognitive operation to guide).

The actual **hint text generation** (LLM prompts) remains in the private
`chemie-core` feedback-engine and exercise generator. This change provides
the scaffolding *plan* (which Bloom levels, how many steps, what verbs)
that those private services consume.

### Explicitly OUT of scope

- Actual LLM hint text generation (private `chemie-core`)
- R1 formative assessment unification (mastery aggregation)
- R3 peer collaboration, R4 differentiation, R5 tech integration
- Front-end UI rendering of hints

## Capabilities

### Modified Capabilities

- **exercise-generator**: gains a `scaffolding-plan` concept — exercises can
  request a Bloom-staircase hint plan alongside the question.
- **learning-paths**: the `scaffold` strategy now has a concrete backing
  service to invoke.

## Impact

- `api/services/scaffolding-engine.js` (new, public) — staircase logic
- `api/routes/scaffolding.js` (new, public) — `GET /api/scaffolding/hints`
- Neo4j: **no schema changes** — reads existing `:ObjectiveState` and
  `:LearningObjective` data.
- Tests: `tests/scaffolding-engine.test.mjs` (DB-free unit tests).

## Rollback plan

- Delete `api/services/scaffolding-engine.js`,
  `api/routes/scaffolding.js`, and their tests.
- Remove the scaffolding route registration from `api/server.js`.
- No Neo4j schema changes, so no data rollback needed.
