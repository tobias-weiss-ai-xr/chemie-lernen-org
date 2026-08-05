# Spec: learning-paths

**Capability:** Structured curriculum-aligned learning paths with enrollment, progress tracking, and completion certificates
**Owners:** Sisyphus (Sprint 14)

---

## Purpose

Users can follow curated learning paths through the chemistry curriculum. Each path is a structured sequence of topics and learning objectives drawn from the existing Neo4j Curriculum graph. Users enroll, make progress by completing content, and earn a certificate upon completion.

## ADDED Requirements

### Requirement: LP-1 — Learning path definition

The system SHALL define learning paths as Neo4j nodes with label `LearningPath`.
Each path SHALL have: `slug`, `title`, `description`, `color`, `icon`, `estimatedHours`.
Each path SHALL connect to existing `Curriculum` nodes via `BELONGS_TO_PATH` relationship.
Topic ordering within a path SHALL use `:HAS_TOPIC {order: integer}` relationships from the path node to `Topic` nodes.

#### Scenario: Path defined in Neo4j

- **WHEN** a new learning path is created
- **THEN** a `(:LearningPath {slug, title, description, color, icon, estimatedHours})` node exists
- **AND** it connects to existing `(:Curriculum)` via `-[:BELONGS_TO_PATH]->`
- **AND** topic ordering is stored on `-[:HAS_TOPIC {order: 1}]->` relationships

### Requirement: LP-2 — List learning paths

The system SHALL provide `GET /api/learning-paths` returning all learning paths.
For authenticated users, each path SHALL include the user's enrollment status and progress percentage.
Response SHALL be JSON array with fields: `slug`, `title`, `description`, `color`, `icon`, `estimatedHours`, `topicCount`, `enrolled`, `progressPercent`.

#### Scenario: Unauthenticated user lists paths

- **WHEN** an unauthenticated user calls `GET /api/learning-paths`
- **THEN** response is `401 Unauthorized`

#### Scenario: Authenticated user lists paths with progress

- **WHEN** an authenticated user calls `GET /api/learning-paths`
- **THEN** response status is `200`
- **AND** body is a JSON array of path objects
- **AND** each path includes `enrolled: true/false` and `progressPercent: 0-100`

### Requirement: LP-3 — Single path detail

The system SHALL provide `GET /api/learning-paths/:slug` returning a single path with its full topic tree.
For enrolled users, each topic SHALL include completion status.

#### Scenario: Enrolled user views path detail

- **WHEN** an enrolled user calls `GET /api/learning-paths/stoffe-teilchen`
- **THEN** response includes `topics: [{slug, title, order, completed, learningObjectives: [...]}]`

### Requirement: LP-4 — Path enrollment

The system SHALL provide `POST /api/learning-paths/:slug/enroll` to enroll an authenticated user in a path.
Enrollment SHALL be idempotent — re-enrolling returns the existing enrollment.
User progress data SHALL be stored in `FileBackedSessionStore` under `user.progress.paths`.

#### Scenario: First-time enrollment

- **WHEN** an authenticated user calls `POST /api/learning-paths/stoffe-teilchen/enroll`
- **THEN** response is `200` with `{enrolled: true, path: "stoffe-teilchen", enrolledAt: "<ISO date>"}`

#### Scenario: Re-enrollment is idempotent

- **WHEN** the same user calls the same endpoint again
- **THEN** response is `200` with same `enrolledAt` timestamp (no duplicate enrollment)

### Requirement: LP-5 — Progress tracking

The system SHALL track user progress through learning paths.
Completing a learning objective (via article read, quiz pass, or exercise completion) SHALL mark it as complete in the user's progress.
Progress percentage SHALL be calculated as: `completedObjectives / totalObjectives * 100`.

#### Scenario: Progress updates after quiz completion

- **WHEN** a user completes a quiz with 80%+ score for a learning objective in an enrolled path
- **THEN** the learning objective is marked complete
- **AND** path progress percentage increases proportionally

### Requirement: LP-6 — Progress aggregation endpoint

The system SHALL provide `GET /api/learning-paths/progress` returning aggregated progress across all enrolled paths.
Response SHALL include: `totalXp`, `streakDays`, `paths: [{slug, title, progressPercent, completedObjectives, totalObjectives}]`.

#### Scenario: User checks aggregated progress

- **WHEN** an authenticated user calls `GET /api/learning-paths/progress`
- **THEN** response includes all enrolled paths with per-path and aggregate progress data

### Requirement: LP-7 — Certificate generation

The system SHALL generate a PDF certificate when a user completes all objectives in a learning path.
Certificate SHALL include: user display name, path title, completion date, verification hash, and a decorative border.
Generation SHALL use PDFKit (server-side, no external binaries).
Verification hash SHALL be `SHA256(userId + pathSlug + completionDate)`.

#### Scenario: Path completion triggers certificate

- **WHEN** a user's `progressPercent` reaches 100% on an enrolled path
- **THEN** a PDF certificate is generated
- **AND** `GET /api/learning-paths/:slug/certificate` returns the PDF file
- **AND** the response Content-Type is `application/pdf`
