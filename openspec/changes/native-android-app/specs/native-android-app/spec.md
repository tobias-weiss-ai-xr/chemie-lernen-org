## ADDED Requirements

### Requirement: Native Android application

The system SHALL provide a native Android application (Kotlin + Jetpack Compose) in the `android/` directory that consumes the existing chemie-lernen.org REST API and mirrors the web client's behavior for quizzes, grading, and offline sync.

#### Scenario: Build produces a debug APK

- **WHEN** a developer runs `./gradlew assembleDebug` in the `android/` directory with JDK 17+ and Android SDK installed
- **THEN** the build completes with exit code 0
- **AND** produces `android/app/build/outputs/apk/debug/app-debug.apk`

#### Scenario: App authenticates against the live API

- **WHEN** a user logs in with email and password via the app
- **THEN** the app sends `POST /api/auth/login` with the credentials, receives a JWT and user payload
- **AND** stores the token via EncryptedSharedPreferences
- **AND** a subsequent `GET /api/auth/me` request with `Authorization: Bearer <jwt>` returns the authenticated user

### Requirement: Auth session persistence

The app SHALL persist the JWT across app restarts and restore the session using `GET /api/auth/me`, showing a logged-in state without re-entering credentials.

#### Scenario: Restore session from stored token

- **WHEN** the app starts with a stored token
- **AND** the network is available
- **THEN** the app calls `GET /api/auth/me`
- **AND** shows the main shell with the user's profile loaded

#### Scenario: Invalid token

- **WHEN** the stored token is expired or rejected with 401
- **THEN** the app clears the token
- **AND** navigates to the login screen

### Requirement: Browse curricula offline-first

The app SHALL allow browsing states → topics → learning objectives, caching fetched data locally so prior selections are viewable offline.

#### Scenario: Browse topics by state and grade

- **WHEN** a user selects a state and grade on the Home screen
- **THEN** the app fetches `GET /api/curricula/topics?state=&grade=` (or falls back to cache when offline)
- **AND** shows a list of topics with their learning-objective counts

#### Scenario: Offline fallback for cached topics

- **WHEN** the network is unavailable
- **AND** the user previously visited the same state/grade
- **THEN** the app renders the topic list from the local cache
- **AND** displays a connectivity banner

### Requirement: Quiz with static and AI exercises

The app SHALL run quizzes mixing hand-authored questions (`GET /api/quizzes/:topic`) and AI-generated exercises (`POST /api/exercises/generate`), grading MCQ deterministically.

#### Scenario: Generate an AI MCQ and submit an answer

- **WHEN** a user taps "AI-Übung" on a topic with a learning objective
- **THEN** the app POSTs `/api/exercises/generate` with `{topicSlug, difficulty, type: "mcq"}`
- **AND** renders options with letter ids (`id: "A"…`)
- **AND** when the user selects an option the app maps the 0-based index to the letter id
- **AND** POSTs `/api/exercises/grade` with `{exerciseId, answer: "<letter>"}`
- **AND** displays `{score, correct, gradedBy}` with feedback

#### Scenario: Grade a wrong answer shows weak concept

- **WHEN** the submitted letter id does not match `correctAnswer`
- **THEN** the app receives `{correct: false, score: 0}`
- **AND** on the dashboard the assessment appears with the exercise id in `weakConcepts`

### Requirement: Offline grade queue

The app SHALL persist quiz submissions locally when offline and sync them when connectivity returns, mirroring the web `QuizGradeQueue` flow.

#### Scenario: Offline submission is queued

- **WHEN** a user answers an AI exercise while offline
- **THEN** the app stores `(exerciseId, answerLetter, timestamp)` in the local database
- **AND** shows a pending-sync badge in the quiz UI

#### Scenario: Queue drains on reconnect

- **WHEN** connectivity returns
- **THEN** the app POSTs each queued `{exerciseId, answer}` to `/api/exercises/grade`
- **AND** calls `/api/assessment/sync` with the collected batch
- **AND** clears successfully submitted rows

### Requirement: FSRS spaced-repetition review

The app SHALL fetch due review cards from `/api/fsrs/cards` and submit review ratings.

#### Scenario: Review due cards

- **WHEN** a user opens the FSRS screen
- **THEN** the app fetches due cards and shows the first card's front
- **AND** on a rating tap POSTs `/api/fsrs/cards/:cardId/review` with the rating
- **AND** returns the next card

### Requirement: Gamification integration

The app SHALL surface the learner's XP, streak, level, badges, and check-in status, and allow daily check-in.

#### Scenario: Show profile and check in

- **WHEN** a user opens Profil
- **THEN** the app shows XP and streak from `GET /api/gamification/profile` and `GET /api/check-in`
- **WHEN** the user taps "Einchecken"
- **THEN** the app POSTs `/api/check-in` and updates the streak display

### Requirement: Learner and teacher dashboards

The app SHALL show the learner's assessment history and weak concepts, and — for teacher-role users — a class breakdown.

#### Scenario: Learner dashboard

- **WHEN** a learner opens the dashboard
- **THEN** the app fetches `GET /api/assessment/results`
- **AND** displays recent assessments with scores and weak concepts

#### Scenario: Teacher class results

- **WHEN** a teacher-role user opens the dashboard with a curriculum selected
- **THEN** the app fetches `GET /api/assessment/class-results?curriculumSlug=...`
- **AND** displays class average and topic breakdown
- **AND** a learner-role user receives 403 and the app hides the teacher screen

### Requirement: German localization and brand theme

The app SHALL ship `de` as the default locale and use the site brand colors (primary `#2d6a4f`) in light and dark themes.

#### Scenario: Brand theme applied

- **WHEN** the app renders in light theme
- **THEN** the primary color matches the site green
- **AND** all user-facing strings are in German (de)
