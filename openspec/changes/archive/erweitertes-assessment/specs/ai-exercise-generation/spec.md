## ADDED Requirements

### Requirement: Generate MCQ from learning objective

The system SHALL generate multiple-choice questions from KG learning objectives via LiteLLM, with plausible distractors and a difficulty-calibrated explanation.

#### Scenario: Generate MCQ by topic and difficulty

- **WHEN** POST to `/api/exercises/generate` with `{topicSlug: "atomaufbau", difficulty: "mittel", type: "mcq"}`
- **THEN** returns 200 with `{question, options: [{id: "A", text}, {id: "B", text}, {id: "C", text}, {id: "D", text}], correctId: "C", explanation, learningObjectiveSlug, difficulty}`

#### Scenario: Distractor plausibility

- **WHEN** generating an MCQ for "Atomaufbau" at "schwer" difficulty
- **THEN** distractors SHALL be plausible wrong answers (common misconceptions at that level), not obviously incorrect options
- **AND** the correct answer SHALL not be identifiable by length or pattern matching

### Requirement: Generate fill-in-blank exercise

The system SHALL generate cloze (fill-in-the-blank) exercises where the learner types the correct term or value.

#### Scenario: Generate fill-in-blank

- **WHEN** POST to `/api/exercises/generate` with `{learningObjectiveSlug: "periodensystem", difficulty: "leicht", type: "fill-in-blank"}`
- **THEN** returns 200 with `{question: "Das Element mit der Ordnungszahl 6 ist ____.", acceptableAnswers: ["Kohlenstoff", "C"], explanation, learningObjectiveSlug}`

#### Scenario: Multiple acceptable answers

- **WHEN** the blank could accept a name or symbol
- **THEN** `acceptableAnswers` SHALL include all valid variants (e.g., ["Kohlenstoff", "C"])

### Requirement: Generate calculation exercise

The system SHALL generate calculation exercises with expected numeric answers and tolerances.

#### Scenario: Generate calculation

- **WHEN** POST to `/api/exercises/generate` with `{learningObjectiveSlug: "molare-masse", difficulty: "mittel", type: "calculation"}`
- **THEN** returns 200 with `{question, expectedAnswer: 44.01, unit: "g/mol", tolerance: 0.1, explanation, learningObjectiveSlug, difficulty}`

### Requirement: Generate short-answer exercise

The system SHALL generate short-answer exercises requiring a free-text response of 1-3 sentences.

#### Scenario: Generate short-answer

- **WHEN** POST to `/api/exercises/generate` with `{learningObjectiveSlug: "atommodelle", difficulty: "schwer", type: "short-answer"}`
- **THEN** returns 200 with `{question, rubric: {keyConcepts: ["Elektronenwolke", "Orbital", "Aufenthaltswahrscheinlichkeit"], minLength: 20, maxLength: 200}, explanation, learningObjectiveSlug, difficulty}`

### Requirement: Generation caching

The system SHALL cache generated exercises per (learningObjectiveSlug, difficulty, type) tuple to avoid redundant LLM calls.

#### Scenario: Cache hit

- **WHEN** the same (learningObjectiveSlug, difficulty, type) is requested within 24 hours
- **THEN** the previously generated exercise is returned without calling LiteLLM
- **AND** response includes header `X-Cache: HIT`

#### Scenario: Cache miss

- **WHEN** the tuple has not been cached OR the cache has expired (>24h)
- **THEN** LiteLLM is called to generate a fresh exercise
- **AND** the result is cached with TTL 24h

### Requirement: Topic discovery fallback

The system SHALL fall back to the KG's curriculum-topic hierarchy if no specific `learningObjectiveSlug` is provided.

#### Scenario: Fallback to topic

- **WHEN** POST to `/api/exercises/generate` with `{topicSlug: "saeuren-basen", difficulty: "mittel", type: "mcq"}` (no learningObjectiveSlug)
- **THEN** the system queries Neo4j for learning objectives under that topic
- **AND** selects one at random (weighted by FSRS-identified weakness if user context is available)
- **AND** generates the exercise for that learning objective
