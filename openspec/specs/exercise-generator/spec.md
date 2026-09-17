# exercise-generator Specification

## Purpose

Curriculum-grounded exercise generation and grading: the system generates exercises (MCQ, fill-in-blank, calculation) from knowledge-graph learning objectives via LiteLLM, auto-grades answers (deterministic for MCQ/calc, AI-assisted for short answers), and persists an exercise history per user.

## Requirements

### Requirement: Generate curriculum-grounded exercises

The system SHALL generate exercises (MCQ, fill-in-blank, calculation) from KG learning objectives via LiteLLM.

#### Scenario: Generate MCQ from learning objective

- **WHEN** a POST to `/api/exercises/generate` with `{learningObjectiveSlug: "atomaufbau", difficulty: "easy", type: "mcq"}`
- **THEN** returns 200 with `{question, options: [{id, text},...], correctId, explanation, learningObjective, difficulty}`

#### Scenario: Generate calculation exercise

- **WHEN** a POST to `/api/exercises/generate` with `{learningObjectiveSlug: "molare-masse", difficulty: "medium", type: "calculation"}`
- **THEN** returns 200 with `{question, expectedAnswer, tolerance, explanation, learningObjective}`

### Requirement: Auto-grade exercise answers

The system SHALL auto-grade MCQ/calc and use AI for short answer grading.

#### Scenario: Auto-grade MCQ correct

- **WHEN** POST to `/api/exercises/answer` with `{exerciseId, answer: "A"}`
- **THEN** returns 200 with `{correct: true, points, explanation}`

#### Scenario: AI-grade short answer

- **WHEN** POST to `/api/exercises/answer` with `{exerciseId, answer: "Ein Atom besteht aus...", type: "short-answer"}`
- **THEN** returns 200 with `{correct: true/false, score: 0-100, feedback}`

### Requirement: Exercise history

The system SHALL persist generated exercises and allow retrieval.

#### Scenario: Get exercise history

- **WHEN** GET `/api/exercises/history?limit=10`
- **THEN** returns 200 with `{exercises: [{id, question, type, difficulty, correct, timestamp}...], total}`

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

| Bloom Index | Level      | hintType               |
| ----------- | ---------- | ---------------------- |
| 1           | remember   | `direct-recall`        |
| 2           | understand | `analogy`              |
| 3           | apply      | `worked-example`       |
| 4           | analyze    | `socratic-question`    |
| 5           | evaluate   | `compare-contrast`     |
| 6           | create     | `open-ended-challenge` |

#### Scenario: Hint type selects prompt strategy

- **WHEN** the scaffolding plan includes a step at Bloom 3 (apply)
- **THEN** the step's `hintType` is `"worked-example"`
- **AND** the private feedback-engine uses this to select the worked-example
  prompt template
