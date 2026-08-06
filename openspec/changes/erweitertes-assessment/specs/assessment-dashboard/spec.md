## ADDED Requirements

### Requirement: Learner assessment dashboard

The system SHALL provide a learner-facing dashboard showing personal assessment history, progress by topic, weak areas, and study recommendations.

#### Scenario: Dashboard loads learner data

- **WHEN** a learner visits `/dashboard`
- **AND** they are authenticated
- **THEN** the dashboard fetches `GET /api/assessment/results?learnerId={userId}`
- **AND** displays: recent assessments (last 10), overall score trend (line chart), weak topics (bottom 3 by score), recommended next steps

#### Scenario: Weak topic identification

- **WHEN** the learner has completed assessments in multiple topics
- **THEN** topics are ranked by average score
- **AND** the bottom 3 are highlighted with "Übungsbedarf" label
- **AND** clicking a weak topic navigates to the relevant themenbereich page

### Requirement: Teacher class dashboard

The system SHALL provide a teacher-facing dashboard showing aggregate assessment results for their students, class-wide weak areas, and individual student reports.

#### Scenario: Teacher views class overview

- **WHEN** a teacher visits `/lehrerdashboard`
- **AND** they select a class/curriculum
- **THEN** the dashboard shows: number of students assessed, average score per topic, class-wide weakest concepts, recent assessment activity

#### Scenario: Drill-down to individual student

- **WHEN** a teacher clicks on a student name in the class overview
- **THEN** they see that student's full assessment history
- **AND** they can view/override individual feedback entries
- **AND** they can assign a custom assessment to that student

### Requirement: Assessment export

The system SHALL allow teachers to export class assessment data as CSV.

#### Scenario: Export class results

- **WHEN** a teacher clicks "Export CSV" on the class dashboard
- **THEN** a CSV file is downloaded with columns: student_id, topic, exercise_type, score, date, feedback_summary

### Requirement: Dashboard data API

The system SHALL expose a REST API for dashboard data consumption.

#### Scenario: GET assessment results

- **WHEN** GET `/api/assessment/results?learnerId={userId}&limit=20&offset=0`
- **THEN** returns 200 with `{results: [{assessmentId, topic, score, date, weakConcepts: [{slug, label, score}]}...], total, page}`

#### Scenario: GET teacher class data

- **WHEN** GET `/api/assessment/class-results?curriculumSlug=bw-gymnasium`
- **THEN** returns 200 with `{classAverage: number, topicBreakdown: [{topic, averageScore, studentCount}], students: [{userId, averageScore, assessmentsCompleted}...]}`

### Requirement: Privacy and data retention

The system SHALL enforce data privacy and retention policies for assessment data.

#### Scenario: Data retention

- **WHEN** an assessment result is older than 365 days
- **THEN** it is automatically archived to cold storage
- **AND** removed from the live dashboard

#### Scenario: GDPR deletion

- **WHEN** a user requests account deletion
- **THEN** ALL assessment nodes associated with that userId are deleted from Neo4j
- **AND** the dashboard no longer shows data for that user
