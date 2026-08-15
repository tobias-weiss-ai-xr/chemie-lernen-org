# Spec: quiz

**Capability:** Interactive chemistry quiz system for chemie-lernen.org
**Owners:** Sisyphus
**Status:** Active — main spec

---

## MODIFIED Requirements

### Requirement: REQ-QUIZ-5 — User progress tracking (enhanced with mastery bridge)

The system SHALL track user quiz progress via `quiz-user-system.js` and
`progress-tracker.js`, storing scores in localStorage and tracking completion,
best scores, attempts, and streaks.

When the `ENABLE_MASTERY_AUTO_INGEST` feature flag is `true`, the system
SHALL additionally bridge quiz result submissions (`PUT /api/quiz-results`)
into the ZPD mastery model:

- The quiz topic is mapped to `:LearningObjective` slugs via the Neo4j
  `Topic → SubTopic → FULFILLS` chain.
- For each matched LO, aggregated mastery is computed (combining quiz
  evidence with any existing auto-grader and FSRS signals) and upserted
  as `:ObjectiveState` with `source: 'quiz'`.
- Failures in this bridging step are logged but never surface to the
  learner.

#### Scenario: Quiz result triggers mastery bridge

- **WHEN** `ENABLE_MASTERY_AUTO_INGEST=true`
- **AND** an authenticated user submits `PUT /api/quiz-results` with a score
- **THEN** the quiz topic is resolved to LearningObjective slugs
- **AND** aggregated mastery is upserted for each matched LO

#### Scenario: Mastery bridge disabled — no upsert

- **WHEN** `ENABLE_MASTERY_AUTO_INGEST=false` (or unset)
- **AND** a user submits `PUT /api/quiz-results`
- **THEN** quiz results are saved to users.json as before
- **AND** no mastery upsert occurs

#### Scenario: Cross-platform progress

- **WHEN** a student completes quizzes on mobile and desktop
- **WHEN** they return to a previously quizzed topic
- **THEN** their best score is shown from localStorage
- **AND** unanswered questions are prioritized
- **AND** the progress bar shows completion per difficulty level

### Requirement: REQ-QUIZ-6 — Spaced repetition (enhanced with mastery signal)

The system SHALL implement the FSRS (Free Spaced Repetition Scheduler)
algorithm via `spaced-repetition.js`, scheduling review intervals that adapt
to individual performance and storing parameters in localStorage.

FSRS card stability SHALL serve as a mastery signal for the unified mastery
aggregator (see learning-paths ZPD requirements). High-stability cards
indicate strong retention and contribute positively to the aggregated
mastery for the associated LearningObjective.

#### Scenario: FSRS stability feeds into mastery aggregation

- **WHEN** a user has FSRS cards with high stability for a topic
- **AND** the mastery aggregator computes mastery for the associated LO
- **THEN** the FSRS signal reflects the retention strength (stability
  mapped to [0,1])
