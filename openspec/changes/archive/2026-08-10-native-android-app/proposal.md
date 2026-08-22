## Why

chemie-lernen.org is a rich interactive chemistry platform — AI-generated exercises, auto-grading with individualized feedback, learning paths with gamification (XP, check-ins, badges, FSRS spaced repetition), teacher/learner dashboards, and offline resilience. All of this sits behind a well-documented Express API (`docs/openapi.yaml`, 26 paths, Bearer JWT auth) served at `https://chemie-lernen.org/api/`.

Today the platform is only usable through the browser (a Hugo site + PWA). There is no native mobile experience. Learners — especially pupils — predominantly use phones, and the browser UX for quizzes/dashboards on small screens is suboptimal. A native Android app unlocks:

- Better mobile UX (bottom nav, native gesture handling, offline-first caching via Room/SQLDelight)
- Push notifications for check-in streaks, XP milestones, teacher->student feedback
- Deep offline support (quiz queue already exists server-side via `/api/assessment/sync`)
- Distribution via Play Store / sideload APK

## What Changes

A new **native Android app** (Kotlin + Jetpack Compose + MVVM) lives in `android/`:

- **Auth**: login/register against `/api/auth/*`, stores JWT in EncryptedSharedPreferences; Bearer token on every request; session restore via `/api/auth/me`
- **Browse**: state/grade → curricula → topics → learning objectives (from `/api/curricula/*`), cached in local DB for offline browsing
- **Quiz**: run static quizzes from `/api/quizzes/:topic` and AI-generated exercises from `/api/exercises/generate`; deterministic grading via `/api/exercises/grade`; offline-queued with `/api/assessment/sync` when connectivity returns (mirrors web `QuizGradeQueue`)
- **FSRS**: spaced-repetition card review from `/api/fsrs/*`
- **Gamification**: check-in streak, XP, level, achievements/badges from `/api/gamification/*` and `/api/check-in*`
- **Learning paths**: list, enroll, progress from `/api/learning-paths*`
- **Dashboards**: learner personal results + weak concepts from `/api/assessment/results`; teacher class breakdown from `/api/assessment/class-results` (role-gated)
- **Offline-first**: local cache (Room or DataStore) for curricula/quizzes; queued grade submissions; connectivity-aware UI banner

## Capabilities

### New Capabilities

- `native-android-app`: Kotlin + Jetpack Compose Android application consuming the existing API. MVVM architecture, Retrofit/Ktor client, offline cache with Room, Biometric-safe token storage, dark/light theme matching the site's brand.

### Modified Capabilities

- `quiz`: quiz data model honored by the app; offline grading reuses `/api/assessment/sync`
- `gamification`: check-in/XP triggerable from the app; server remains single source of truth
- `pwa`: PWA remains the web experience; native app is a sibling client, not a replacement

## Impact

- **API**: No breaking changes. The app only consumes existing endpoints; one optional addition: `GET /api/auth/me` already exists, needed for token restore.
- **Repo layout**: New `android/` top-level directory (Gradle project, `settings.gradle.kts`, `build.gradle.kts`, `app/` module). Not wired into Hugo build (docker-compose unaffected).
- **CI/DX**: Gradle wrapper committed; `./gradlew assembleDebug` produces APK; unit tests for ViewModels + offline queue in `android/app/src/test/`.
- **Docs**: `docs/openapi.yaml` unchanged (endpoints exist); new `android/README.md` covers build, signing, release notes.

## Risks

- Android toolchain not installed in the current dev container — need JDK + Android SDK + Gradle to build (installed ad-hoc; not in docker-compose).
- API auth via cookie + Authorization header: app must send `Authorization: Bearer <jwt>` (already supported by `requireAuth`).
- LiteLLM rate limits apply to native users too — app reuses the same rate-limited endpoints and should cache generated exercises.
