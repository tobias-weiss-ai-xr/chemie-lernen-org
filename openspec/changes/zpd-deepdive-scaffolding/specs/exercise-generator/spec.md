# Spec: exercise-generator

**Capability:** Curriculum-grounded exercise generation and grading with Bloom-staircase scaffolding integration
**Owners:** Sisyphus

---

## ADDED Requirements

### Requirement: EG-SCAFFOLD-1 — Bloom-staircase scaffolding plan

The system SHALL provide a scaffolding plan that maps the cognitive gap
between a learner's current Bloom level and a target objective's Bloom
level into a staircase of progressive hints, each annotated with its
Bloom index, verb label, and hint type.

#### Scenario: Multi-step staircase for a 2-level gap

- **WHEN** a learner with `bloomsMaxReached = 2` (understand) requests a
  scaffolding plan for an objective at `blooms_index = 4` (analyze)
- **THEN** the plan contains exactly 2 steps
- **AND** step 1 has `bloomIndex: 3`, `level: "apply"`, `hintType: "worked-example"`
- **AND** step 2 has `bloomIndex: 4`, `level: "analyze"`, `hintType: "socratic-question"`
- **AND** the plan includes `gap: 2` and `totalSteps: 2`

#### Scenario: Zero gap returns empty staircase

- **WHEN** a learner with `bloomsMaxReached >= targetBloom` requests a plan
- **THEN** the plan returns `staircase: []`, `totalSteps: 0`, `gap: 0`

#### Scenario: Maximum gap truncation

- **WHEN** the cognitive gap exceeds 5 Bloom levels (full taxonomy span)
- **THEN** the staircase is truncated to at most 5 steps (highest levels up
  to target)

### Requirement: EG-SCAFFOLD-2 — Hint type per Bloom level

Each staircase step SHALL carry a `hintType` that downstream LLM prompt
templates (in the private feedback-engine) use to select the appropriate
prompt strategy.

| Bloom Index | Level     | hintType                |
| ----------- | --------- | ----------------------- |
| 1           | remember  | `direct-recall`         |
| 2           | understand| `analogy`               |
| 3           | apply     | `worked-example`        |
| 4           | analyze   | `socratic-question`     |
| 5           | evaluate  | `compare-contrast`      |
| 6           | create    | `open-ended-challenge`  |

#### Scenario: Hint type selects prompt strategy

- **WHEN** the scaffolding plan includes a step at Bloom 3 (apply)
- **THEN** the step's `hintType` is `"worked-example"`
- **AND** the private feedback-engine uses this to select the worked-example
  prompt template
