## ADDED Requirements

### Requirement: Deterministic grading for MCQ

The system SHALL grade MCQ submissions by exact match against the stored correct answer ID.

#### Scenario: Grade correct MCQ

- **WHEN** POST to `/api/exercises/grade` with `{exerciseId, answer: "C", type: "mcq"}`
- **AND** the stored correct answer is `"C"`
- **THEN** returns 200 with `{correct: true, score: 100, gradedBy: "deterministic"}`

#### Scenario: Grade incorrect MCQ

- **WHEN** POST to `/api/exercises/grade` with `{exerciseId, answer: "A", type: "mcq"}`
- **AND** the stored correct answer is `"C"`
- **THEN** returns 200 with `{correct: false, score: 0, gradedBy: "deterministic"}`

### Requirement: Deterministic grading for calculation

The system SHALL grade calculation submissions by checking the answer is within the specified tolerance of the expected value.

#### Scenario: Grade calculation within tolerance

- **WHEN** POST to `/api/exercises/grade` with `{exerciseId, answer: "44.02", type: "calculation"}`
- **AND** the stored expected answer is `44.01` with tolerance `0.1`
- **THEN** returns 200 with `{correct: true, score: 100, gradedBy: "deterministic"}`

#### Scenario: Grade calculation outside tolerance

- **WHEN** POST to `/api/exercises/grade` with `{exerciseId, answer: "44.2", type: "calculation"}`
- **THEN** returns 200 with `{correct: false, score: 0, gradedBy: "deterministic"}`

#### Scenario: Unit-agnostic comparison

- **WHEN** the answer includes units (e.g., "44.01 g/mol")
- **THEN** the system SHALL strip units before numeric comparison
- **AND** accept the answer if the numeric value is within tolerance

### Requirement: AI-assisted grading for short-answer

The system SHALL use LiteLLM to grade short-answer responses against the exercise rubric.

#### Scenario: Grade correct short-answer

- **WHEN** POST to `/api/exercises/grade` with `{exerciseId, answer: "Das Bohrsche Modell zeigt Elektronen auf festen Bahnen um den Kern.", type: "short-answer"}`
- **AND** the rubric requires `keyConcepts: ["Elektronen", "Bahn", "Kern"]`
- **THEN** returns 200 with `{correct: true, score: 100, feedback, gradedBy: "ai"}`

#### Scenario: Grade partially correct short-answer

- **WHEN** the answer covers only 2 of 3 key concepts
- **THEN** returns `{correct: false, score: 66, feedback: "Sie haben X und Y richtig beschrieben. Ergänzen Sie bitte noch Z.", gradedBy: "ai"}`

#### Scenario: Grade fill-in-blank by acceptable answers

- **WHEN** POST to `/api/exercises/grade` with `{exerciseId, answer: "Kohlenstoff", type: "fill-in-blank"}`
- **AND** `acceptableAnswers` includes `["Kohlenstoff", "C"]`
- **THEN** returns 200 with `{correct: true, score: 100, gradedBy: "deterministic"}`

#### Scenario: Fill-in-blank case-insensitive

- **WHEN** the answer is "kohlenstoff" (lowercase)
- **AND** the acceptable list includes "Kohlenstoff"
- **THEN** the match is case-insensitive: returns `{correct: true}`

### Requirement: Partial credit for fill-in-blank with formula variants

The system SHALL accept common chemical formula variants for fill-in-blank answers.

#### Scenario: Formula variant accepted

- **WHEN** the acceptable answer is "H2O"
- **AND** the learner types "H₂O" or "H20" (common mistake corrected within margin)
- **THEN** returns `{correct: true, score: 100, feedback: "Richtig!", gradedBy: "deterministic"}`

### Requirement: Rate limiting

The system SHALL enforce rate limits on the grading endpoint to prevent abuse.

#### Scenario: Rate limit exceeded

- **WHEN** more than 60 grading requests per minute from the same user
- **THEN** returns 429 with `{error: "rate_limit_exceeded", retryAfter: 60}`
