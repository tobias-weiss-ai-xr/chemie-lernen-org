## MODIFIED Requirements

### Requirement: Quiz engine

The core quiz engine SHALL support both hand-authored questions (from `quiz-database.js`) and AI-generated questions (from `/api/exercises/generate`). Generated questions SHALL be cached per session.

- Question rendering from structured data (hand-authored and AI-generated)
- Answer validation and scoring
- Difficulty management (leicht/mittel/schwer) with adaptive defaults
- Feedback display (correct/incorrect with explanations)
- Progress tracking through a quiz session

#### Scenario: Load AI-generated questions

- **WHEN** a quiz section initializes on a topic page
- **AND** the quiz data includes `source: "ai"` for some questions
- **THEN** the quiz engine fetches questions from `/api/exercises/generate` with the topic's learning objectives
- **AND** mixes them with hand-authored questions from `quiz-database.js`
- **AND** randomizes the combined set

### Requirement: Difficulty levels

The system SHALL support three difficulty levels with adaptive defaults based on FSRS stability.

| Level | Label  | Description                                       | FSRS Stability Range |
| ----- | ------ | ------------------------------------------------- | -------------------- |
| 1     | Leicht | Basic recall: element symbols, simple definitions | < 7 days             |
| 2     | Mittel | Application: calculations, equation balancing     | 7-30 days            |
| 3     | Schwer | Transfer: multi-step problems, synthesis tasks    | > 30 days            |

Difficulty determines question selection, scoring multipliers, and time limits. The adaptive default SHALL be overridable by the learner.

#### Scenario: Adaptive difficulty from FSRS stability

- **WHEN** a learner starts a quiz on "Atomaufbau"
- **AND** their FSRS stability for "Atomaufbau" concepts is < 7 days
- **THEN** the quiz defaults to "Leicht" difficulty
- **AND** a tooltip explains: "Basierend auf Ihren letzten Antworten empfehlen wir leichte Fragen"
- **AND** the learner can still manually switch to "Mittel" or "Schwer"

#### Scenario: No FSRS data available

- **WHEN** the learner has no FSRS history for the current topic
- **THEN** the system uses the learner's global average stability
- **AND** if no global data exists either, defaults to "Leicht"

### Requirement: User progress tracking

Progress SHALL be tracked via `quiz-user-system.js` and `progress-tracker.js`, with dual persistence: localStorage (primary, offline-resilient) and Neo4j backend (authoritative for teacher dashboards).

- Quiz scores stored in localStorage
- Completion status per topic
- Best score tracking with date
- Number of attempts per quiz
- Streak tracking for consecutive correct answers
- Neo4j sync for teacher-accessible data

#### Scenario: Sync to backend after online

- **WHEN** a learner completes assessment results while offline
- **AND** they come online
- **THEN** unsynced results are posted to `POST /api/quiz-results` batch endpoint
- **AND** localStorage is marked as synced (`synced: true`)

### Requirement: Quiz data

Quiz questions SHALL be stored in both structured data files (`quiz-database.js`) and generated on-demand. AI-generated questions SHALL include source metadata.

- `myhugoapp/static/data/quiz-database.js` — main hand-authored question bank
- Topic-specific quiz data in `myhugoapp/content/themenbereiche/`
- Each hand-authored question has: `id`, `type`, `difficulty`, `question`, `options`, `correctAnswer`, `explanation`, `topic`
- Each AI-generated question has: `source: "ai"`, `generatedAt`, `cacheKey`, plus all hand-authored fields

#### Scenario: Generated question metadata

- **WHEN** an AI-generated question is loaded
- **THEN** it includes `source: "ai"`, `generatedAt: ISO-date`, `cacheKey: string`
- **AND** it follows the same data structure as hand-authored questions for rendering compatibility

## ADDED Requirements

### Requirement: Exercise session context

The quiz engine SHALL pass FSRS context to the generation endpoint, allowing exercise difficulty to be calibrated to the learner.

#### Scenario: Pass FSRS context to generation

- **WHEN** requesting `/api/exercises/generate` with `{includeFsrsContext: true}`
- **THEN** the request includes the learner's FSRS parameters for the topic
- **AND** the generator uses these to calibrate question difficulty within the specified level

### Requirement: Mixed-source quiz rendering

The quiz engine SHALL render AI-generated questions with the same layout, ARIA labels, and keyboard navigation as hand-authored questions.

#### Scenario: Visual parity

- **WHEN** an AI-generated question appears in a quiz
- **THEN** it has identical visual styling, feedback animation, and accessibility attributes as a hand-authored question
- **AND** a subtle "KI-generiert" badge is shown next to the question type label
