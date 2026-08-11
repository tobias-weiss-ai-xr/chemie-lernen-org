## Context

The platform exposes a complete REST API (`docs/openapi.yaml`, base `https://chemie-lernen.org/`):

- `POST /api/auth/register|login` → JWT (+ user), `GET /api/auth/me`, `PUT /api/auth/profile`
- `GET /api/curricula/states`, `/api/curricula/topics`, `/api/curricula/objectives`, `/api/curricula/by-state/:state`, `/api/curricula/topic/:slug/articles`, `/api/curricula/objective/:slug/articles`
- `GET /api/quizzes/:topic`, `GET /api/quiz-results`, `GET/POST /api/fsrs/cards`, `POST /api/fsrs/cards/:cardId/review`
- `POST /api/exercises/generate|grade|answer|feedback`, `GET /api/exercises/history`, `GET /api/assessment/results`, `GET /api/assessment/class-results`, `PUT /api/assessment/feedback/:feedbackId`, `POST /api/assessment/sync`
- `POST /api/check-in`, `GET /api/check-in`, `GET /api/achievements`, `POST /api/gamification/xp`, `GET /api/gamification/profile`, `GET /api/gamification/badges`
- `GET /api/learning-paths`, `GET /api/learning-paths/:slug`, `GET /api/learning-paths/progress`, `POST /api/learning-paths/:slug/enroll`

Auth: Bearer JWT in `Authorization` header (supported by `requireAuth`/`authMiddleware`); role-gated teacher endpoints use `role: "teacher"|"admin"` on the user record.

The web client (quiz-system.js, assessment-dashboard.js) already established contracts the app must mirror: AI MCQ returns `options:[{id:'A',text},…]`, `correctAnswer` letter id, UI submits 0-based index mapped to letter id; grading `score` is 0–100; offline queue posts `{exerciseId, answer}` with letter answers to `/api/exercises/grade`, then bulk `/api/assessment/sync`.

Non-goals: no server-side changes beyond (optionally) an `api-version` header; no iOS; no social/chat features in v1; no in-app purchase frontend (web tiers remain).

## Goals / Non-Goals

**Goals:**

- Compilable, runnable Kotlin + Jetpack Compose app in `android/` (Gradle project)
- Auth (login/register/logout, token persistence with EncryptedSharedPreferences, session restore)
- Browse curricula (states → topics → objectives) with offline caching
- Full quiz loop: static quizzes + AI MCQ, deterministic grading, individualized feedback, offline queue + sync
- FSRS card review (fetch cards, submit review, show next due)
- Gamification: check-in, XP profile, achievements/badges
- Learning paths list & enroll
- Learner dashboard (results/weak concepts); teacher class-results when role allows
- Dark/light theme matching site brand (#2d6a4f), German UI strings (de)
- Unit tests for auth repository, offline queue, and view models
- README with build/install instructions and signing notes

**Non-Goals:**

- iOS app
- WebView wrapper around the PWA (it's a native app)
- Stripe checkout inside the app (web handles premium)
- Real-time websocket chat
- Notifications in v1 (planned, server has no push infra yet)

## Decisions

### Decision 1: Native Kotlin + Jetpack Compose (Material 3), MVVM

**Chosen:** Kotlin 2.x, Jetpack Compose (Material 3), single `app` module, ViewModel + StateFlow MVVM, Navigation Compose.
**Alternatives:** Flutter/React Native (cross-platform but not "native", adds runtime), WebView wrapper (not native, poor offline), bare XML views (slower to build). Compose is the Android platform's current standard; team is Kotlin-friendly; matches "native" ask.

### Decision 2: HTTP client — Retrofit + OkHttp (with Interceptor) rather than Ktor

**Chosen:** Retrofit2 + OkHttp + kotlinx.serialization via converter. Simple, sync-friendly, battle-tested, easy Bearer interceptor.
**Alternatives:** Ktor client (nice but more setup), Volley (legacy).

### Decision 3: Local persistence — Room + SharedPreferences (encrypted)

**Chosen:** Room for cache tables (curricula/topics/objectives, quiz cache, unsynced grades) with `@Database` + DAOs; EncryptedSharedPreferences for JWT + user profile; WorkManager not used in v1 (drain queue on `onConnectivityChanged`).
**Alternatives:** SQLDelight (needs driver), DataStore (fine for prefs, less for relational cache).

### Decision 4: API contract mirrored from the web client + OpenAPI

**Chosen:** Single `ChemieApi` Retrofit interface with DTOs mirroring `docs/openapi.yaml` + exercised.js response shapes (options letter ids!). Reuse `_normalizeAiAnswer` semantics (index→letter) in the app's QuizViewModel.
**Justification:** Server is the single source of truth; the app doesn't redefine grading.

### Decision 5: Offline queue — mirrored QuizGradeQueue semantics

**Chosen:** `GradeQueueRepository` persists `PendingGrade(exerciseId, answer, ts)` in Room; on submit offline → insert row, show pending badge; on connectivity restored → drain, POST `/api/exercises/grade` per item, then `/api/assessment/sync` for the batch; clear rows on success. Matches web's `chemie-offline-grades` behavior.

## Future (not in scope)

- Push notifications via FCM + server endpoint
- Caching full article pages from `/api/article/:slug` for offline reading
- Apple iOS port sharing the Ktor/Compose Multiplatform stack
