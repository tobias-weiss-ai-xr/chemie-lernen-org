## ADDED Requirements

### Requirement: Per-answer feedback generation

The system SHALL generate individualized feedback for each graded answer, referencing the learner's FSRS state, past mistakes in the same topic, and the specific concepts involved.

#### Scenario: Feedback after incorrect answer

- **WHEN** a learner submits an incorrect answer for "Welches Edelgas hat die Ordnungszahl 10?"
- **AND** the learner has previously confused Helium and Neon
- **THEN** feedback SHALL include: what the correct answer is, why the submitted answer is wrong, and a reminder of the learner's specific past confusion

#### Scenario: Feedback response structure

- **WHEN** POST to `/api/exercises/feedback` with `{exerciseId, userId, answer, gradedResult}`
- **THEN** returns 200 with `{feedback: {summary: string, detailedExplanation: string, conceptLinks: [{slug: string, label: string}], studyRecommendation: string, aiGenerated: true}}`

### Requirement: Concept-level misconception detection

The system SHALL detect which specific concept the learner struggled with by analyzing the graded answer against the knowledge graph.

#### Scenario: Detect misconception from wrong MCQ choice

- **WHEN** an MCQ has option A = Helium, option B = Neon, option C = Argon, option D = Krypton
- **AND** the learner selects A (correct: B)
- **THEN** the feedback engine SHALL identify "Edelgase der 2. Periode" as the misunderstood concept
- **AND** recommend reviewing "Periode" vs "Gruppe" im Periodensystem

### Requirement: Study recommendation generation

The system SHALL generate actionable study recommendations based on the learner's graded answers and FSRS stability for related concepts.

#### Scenario: Recommend specific topic

- **WHEN** a learner scores <60% on an assessment about "Stöchiometrie"
- **THEN** feedback SHALL include a recommendation like "Wiederholen Sie das Thema Molare Masse. Ihre Stabilität für dieses Konzept ist niedrig (3 Tage)."
- **AND** provide a direct link to the relevant themenbereich page

### Requirement: Teacher override and annotation

The system SHALL allow teachers to override AI-generated feedback and add their own annotations.

#### Scenario: Teacher overrides feedback

- **WHEN** a teacher views a student's graded answer via `/api/assessment/answers/{answerId}`
- **AND** the teacher POSTs `{feedbackOverride: "Die eigentliche Verwechslung liegt hier bei den Hauptgruppen, nicht den Perioden."}`
- **THEN** the feedback is replaced with the teacher's text
- **AND** `feedback.teacherOverride` is set to `true`
- **AND** `feedback.teacherNote` stores the original AI text for audit

### Requirement: Feedback caching

The system SHALL cache feedback for identical (questionId, answer, studentLevel) triplets to avoid redundant LLM calls.

#### Scenario: Feedback cache hit

- **WHEN** a second student at the same level submits the same answer to the same question
- **THEN** the cached feedback is returned
- **AND** response includes header `X-Cache: HIT`
