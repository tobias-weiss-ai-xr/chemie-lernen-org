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
