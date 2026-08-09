## 1. Project scaffold — buildable Gradle project

- [x] 1.1 Create `android/` Gradle project: `settings.gradle.kts`, root + app `build.gradle.kts` (Kotlin 2.x, Compose plugin, Android Gradle Plugin), Gradle wrapper (`gradlew`), `gradle.properties`
- [x] 1.2 `app/src/main/AndroidManifest.xml` with INTERNET + ACCESS_NETWORK_STATE, MainActivity launcher
- [x] 1.3 Brand resources: colors (primary `#2d6a4f`), strings (de), themes (dark/light), app icon placeholder
- [x] 1.4 `android/README.md`: prerequisites (JDK 17+, Android SDK), `./gradlew assembleDebug`, install via adb, signing notes

## 2. Networking layer — Retrofit + DTOs + auth interceptor

- [x] 2.1 DTOs (kotlinx.serialization) for: auth (user, login/register req/res), curricula (state/topic/objective), quizzes (quiz/question/option), exercises (generate/grade/answer/feedback), assessment (results/class-results/sync), fsrs (card/review), gamification (check-in/profile/badges/achievements), learning-paths
- [x] 2.2 `ChemieApi` Retrofit interface covering all endpoints listed in design (base URL `https://chemie-lernen.org`) with `@Headers` for JSON
- [x] 2.3 OkHttp interceptors: Bearer token injector, logging (debug), connectivity check helper
- [x] 2.4 `TokenStore` (EncryptedSharedPreferences) — save/load/clear JWT + cached user; `AuthRepository` wrapping login/register/me/logout

## 3. Data layer — Room cache + offline queue

- [x] 3.1 Room entities: `CachedState`, `CachedTopic`, `CachedObjective`, `PendingGrade(exerciseId, answer, ts)`, `QuizCache`
- [x] 3.2 DAOs with upsert + queries; `AppDatabase` singleton (room_generateschema)
- [x] 3.3 `GradeQueueRepository`: enqueue (offline), drain (online POST `/api/exercises/grade` per item then `/api/assessment/sync`), pending count as Flow

## 4. Feature ViewModels + repositories

- [x] 4.1 AuthViewModel — login/register/restore/session state/documents
- [x] 4.2 BrowseViewModel — states → topics (by state/grade) → objectives; cache-backed loading with network refresh
- [x] 4.3 QuizViewModel — crossword from `/api/quizzes/:topic` + AI from `/api/exercises/generate`; answer → index→letter normalization → local vs online grade; feedback view; pending badge
- [x] 4.4 FsrsViewModel — fetch review cards, submit review, next count
- [x] 4.5 GamificationViewModel — check-in POST/GET, XP profile, achievements/badges
- [x] 4.6 DashboardViewModel — learner results + weakConcepts; teacher class-results (respect 403)

## 5. Compose UI screens

- [x] 5.1 Navigation (NavHost): Splash → Auth (Login/Register tabs) → Main shell with bottom nav (Home, Lernpfade, Übungen, Profil)
- [x] 5.2 Home: state selector → topics cards → objectives list (offline-cached)
- [x] 5.3 Quiz screen: question link, answer select, grade result, pending/offline banner
- [x] 5.4 Profile: login state, XP/level, streak, achievements, settings (dark mode, logout)
- [x] 5.5 Teacher dashboard screen (role-gated): class results summary + topic breakdown
- [x] 5.6 FSRS review screen: question/answer, rating buttons, next

## 6. Tests + verification

- [x] 6.1 Unit tests: AuthRepository (login/restore/invalid token), GradeQueueRepository (enqueue offline, drain online via fake), QuizViewModel (index→letter mapping, offline enqueue)
- [x] 6.2 `./gradlew assembleDebug` builds successfully; `./gradlew testDebugUnitTest` green (8 tests)
- [x] 6.3 README documents API URL override via `-PapiBaseUrl` (dev vs prod base URL)

## 7. OpenSpec lifecycle

- [x] 7.1 `openspec validate native-android-app` passes
- [x] 7.2 Commit + push (GitHub + Codeberg)

## 8. CI

- [x] 8.1 `.github/workflows/android.yml`: on push/PR touching `android/**`, runs `testDebugUnitTest` + `assembleDebug`, uploads debug APK artifact; separate job builds `assembleRelease` (prod API base URL, unsigned) and uploads it
- [x] 8.2 Release signing: unconditional-keystore signing config in `build.gradle.kts` (env/-P vars `CHEMIE_RELEASE_*`, graceful unsigned fallback); CI decodes keystore from `CHEMIE_RELEASE_KEYSTORE_B64` secret, signs, verifies with `apksigner`, uploads signed `app-release.apk`; keystore generated + registered as GitHub secrets (`keytool` PKCS12, unified store/key password)

## 9. API contract bug-hunt (2026-08)

- [x] 9.1 Aligned every DTO/endpoint in the Android data layer to the REAL backend responses (verified against `api/routes/*` source): states/topics/objectives/by-state now typed to `{topics|states|objectives: [...]}` wrappers; `me()` wraps `{user}` (can be null); FSRS cards use `cardId`/`dueDate`; `reviewCard` sends `{score}` (float) not `{rating}`; check-in POST/GET split into `CheckInResponse`/`CheckInStatus`; badges/achievements wrapped + `title`/`earned` fields; learning paths use `{paths}` wrapper + tree detail + `progressPercent` etc.; `sync` uses `{batch}` with `userId` per item; `XpProfile` uses `xpToNextLevel`/`lastCheckin`; `StudentSummary` uses `assessmentsCompleted`; classAverage is Int; `UserProfile.id` tolerant to numeric ids (StringOrNumberSerializer)
- [x] 9.2 `tests/ApiContractTest.kt`: JSON-snapshot fixtures mirroring real backend payload shapes — regression guard for future API drift (32 unit tests total, green)
- [x] 9.3 Wired previously unreachable `DashboardScreen` into the Profil tab (was dead code — learner/teacher dashboards were inaccessible); made the dashboard safe to compose inside a scrollable column (LazyColumn→Column to avoid infinite-height crash)
- [x] 9.4 Fixed the connectivity observer: `registerDefaultNetworkCallback` previously had a no-op `onAvailable` so the offline queue NEVER drained on reconnect — now reports real capabilities and triggers `QuizViewModel.setConnectivity` (drain on reconnect)
- [x] 9.5 Security: `/api/admin/chat-logs` was COMPLETELY UNAUTHENTICATED despite feeding klassencockpit — leaked every chat session's first user question (120 chars), message counts and timestamps to anonymous callers. Wired the existing-but-unused `adminKeyMiddleware` (klassencockpit already sends `x-api-key` and prompts on 401; the backend just never enforced it). Also gated `/api/chat/feedback` (dead endpoint, anonymous disk-write spam vector) with `requireAuth`.
- [x] 9.6 GDPR fix: `DELETE /api/assessment/user/:userId` compared URL string param vs numeric `req.user.id` with `!==` — ordinary users could NEVER delete their own data (always 403). Normalized with `String() === String()`; teachers/admin still pass via `isTeacherReq`.
- [x] 9.7 Offline-sync data-loss fix: `/api/assessment/sync` filtered `ownBatch` with `item.userId === req.user.id` (String vs Number → always empty) — every offline submission was silently dropped. Fixed with string normalization. Root cause was split userId typing in Neo4j (online grade writes Integer, batchSync writes String): `assessment-store` now reads via `toString(a.userId) = $userId` (compatible with both legacy and new data), writes `String(userId)` everywhere, and `count(DISTINCT toString(a.userId))` avoids double-counting students. Android `StudentSummary.userId` now uses `StringOrNumberSerializer`.
- [x] 9.8 Gamification unification: there were TWO parallel XP/streak/badge engines. Engine A (learning-engine + sessionStore) served `/api/check-in` + `/api/achievements` and absorbed exercise XP — but sessionStore is pruned after 24h and its data never surfaced in `/api/gamification/profile` (Engine B, users.json, what the web dashboards AND the Android app actually display). So check-ins and correct exercises appeared to earn NOTHING. Now `/api/check-in` POST/GET delegate to users.json (`recordCheckin`/gamification status), and exercise grading also awards `awardXp(15, 'exercise_correct')` (100 XP/day cap) to the same store. Verified live: check-in +20/streak 1, second same-day blocked, exercise +15, profile total 35.
