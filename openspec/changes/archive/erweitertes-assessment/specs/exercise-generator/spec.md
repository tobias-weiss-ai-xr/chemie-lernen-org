## MODIFIED Requirements

### Requirement: Auto-grade exercise answers

The system SHALL auto-grade MCQ/calc/fill-in-blank deterministically and use AI for short answer grading. The grading endpoint SHALL return enriched feedback alongside the score.

#### Scenario: Auto-grade MCQ correct

- **WHEN** POST to `/api/exercises/answer` with `{exerciseId, answer: "A"}`
- **THEN** returns 200 with `{correct: true, score: 100, gradedBy: "deterministic", feedback: {summary: string, detailedExplanation: string}}`

#### Scenario: AI-grade short answer with feedback

- **WHEN** POST to `/api/exercises/answer` with `{exerciseId, answer: "Ein Atom besteht aus...", type: "short-answer"}`
- **THEN** returns 200 with `{correct: true/false, score: 0-100, gradedBy: "ai", feedback: {summary, detailedExplanation, conceptLinks: [{slug, label}], studyRecommendation}}`

#### Scenario: Fill-in-blank case-insensitive match

- **WHEN** POST to `/api/exercises/answer` with `{exerciseId, answer: "kohlenstoff", type: "fill-in-blank"}`
- **AND** `acceptableAnswers` includes `"Kohlenstoff"`
- **THEN** returns 200 with `{correct: true, score: 100, gradedBy: "deterministic"}`

#### Scenario: Calculation within tolerance

- **WHEN** POST to `/api/exercises/answer` with `{exerciseId, answer: "44.02", type: "calculation"}`
- **AND** expected answer is `44.01` with tolerance `0.1`
- **THEN** returns 200 with `{correct: true, score: 100, gradedBy: "deterministic"}`

### Requirement: Exercise history

The system SHALL persist generated exercises with feedback data and allow retrieval. The history SHALL include concept-level analysis.

#### Scenario: Get exercise history with feedback

- **WHEN** GET `/api/exercises/history?limit=10`
- **THEN** returns 200 with `{exercises: [{id, question, type, difficulty, correct, score, feedback: {summary, conceptLinks}, timestamp}...], total}`

## ADDED Requirements

### Requirement: Generation with FSRS calibration

The system SHALL accept FSRS learner context to calibrate generated exercise difficulty within the requested level.

#### Scenario: Calibrated generation

- **WHEN** POST to `/api/exercises/generate` with `{learningObjectiveSlug, difficulty: "mittel", fsrsContext: {stability: 5, difficulty: 0.3, retrievability: 0.6}}`
- **THEN** the generator adjusts the question's complexity toward the easier side of "mittel" (since stability is low)
- **AND** includes an extra hint in the explanation

### Requirement: Feedback endpoint

The system SHALL provide a dedicated feedback endpoint to generate individualized feedback for previously graded answers.

#### Scenario: Generate feedback for graded answer

- **WHEN** POST to `/api/exercises/feedback` with `{exerciseId, userId, answer, gradedResult}`
- **THEN** returns 200 with individualized feedback (per feedback spec)
- **AND** the feedback is persisted in Neo4j as a `(:Feedback)` node linked to the `(:GradedAnswer)`
