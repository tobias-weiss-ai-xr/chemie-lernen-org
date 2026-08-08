## 1. Project scaffold — buildable Gradle project

- [ ] 1.1 Create `android/` Gradle project: `settings.gradle.kts`, root + app `build.gradle.kts` (Kotlin 2.x, Compose plugin, Android Gradle Plugin), Gradle wrapper (`gradlew`), `gradle.properties`
- [ ] 1.2 `app/src/main/AndroidManifest.xml` with INTERNET + ACCESS_NETWORK_STATE, MainActivity launcher
- [ ] 1.3 Brand resources: colors (primary `#2d6a4f`), strings (de), themes (dark/light), app icon placeholder
- [ ] 1.4 `android/README.md`: prerequisites (JDK 17+, Android SDK), `./gradlew assembleDebug`, install via adb, signing notes

## 2. Networking layer — Retrofit + DTOs + auth interceptor

- [ ] 2.1 DTOs (kotlinx.serialization) for: auth (user, login/register req/res), curricula (state/topic/objective), quizzes (quiz/question/option), exercises (generate/grade/answer/feedback), assessment (results/class-results/sync), fsrs (card/review), gamification (check-in/profile/badges/achievements), learning-paths
- [ ] 2.2 `ChemieApi` Retrofit interface covering all endpoints listed in design (base URL `https://chemie-lernen.org`) with `@Headers` for JSON
- [ ] 2.3 OkHttp interceptors: Bearer token injector, logging (debug), connectivity check helper
- [ ] 2.4 `TokenStore` (EncryptedSharedPreferences) — save/load/clear JWT + cached user; `AuthRepository` wrapping login/register/me/logout

## 3. Data layer — Room cache + offline queue

- [ ] 3.1 Room entities: `CachedState`, `CachedTopic`, `CachedObjective`, `PendingGrade(exerciseId, answer, ts)`, `QuizCache`
- [ ] 3.2 DAOs with upsert + queries; `AppDatabase` singleton (room_generateschema)
- [ ] 3.3 `GradeQueueRepository`: enqueue (offline), drain (online POST `/api/exercises/grade` per item then `/api/assessment/sync`), pending count as Flow

## 4. Feature ViewModels + repositories

- [ ] 4.1 AuthViewModel — login/register/restore/session state/documents
- [ ] 4.2 BrowseViewModel — states → topics (by state/grade) → objectives; cache-backed loading with network refresh
- [ ] 4.3 QuizViewModel — crossword from `/api/quizzes/:topic` + AI from `/api/exercises/generate`; answer → index→letter normalization → local vs online grade; feedback view; pending badge
- [ ] 4.4 FsrsViewModel — fetch review cards, submit review, next-due count
- [ ] 4.5 GamificationViewModel — check-in POST/GET, XP profile, achievements/badges
- [ ] 4.6 DashboardViewModel — learner results + weakConcepts; teacher class-results (respect 403)

## 5. Compose UI screens

- [ ] 5.1 Navigation (NavHost): Splash → Auth (Login/Register tabs) → Main shell with bottom nav (Home, Lernpfade, Übungen, Profil)
- [ ] 5.2 Home: state selector → topics cards → objectives list (offline-cached)
- [ ] 5.3 Quiz screen: question card, options, feedback, next; AI-question generation with loading state; pending/offline banner
- [ ] 5.4 Profile: login state, XP/level, streak, achievements, settings (dark mode, logout)
- [ ] 5.5 Teacher dashboard screen (role-gated): class results summary + topic breakdown
- [ ] 5.6 FSRS review screen: card front/back, grade buttons, next due

## 6. Tests + verification

- [ ] 6.1 Unit tests: AuthRepository (token save/load/restore), GradeQueueRepository (enqueue offline, drain online via fake), QuizViewModel (index→letter mapping, offline enqueue), DTO serialization round-trip
- [ ] 6.2 `./gradlew assembleDebug` builds successfully; `./gradlew testDebugUnitTest` green
- [ ] 6.3 README documents API URL override via `BuildConfig` (dev vs prod base URL)

## 7. OpenSpec lifecycle

- [ ] 7.1 `openspec validate native-android-app` passes
- [ ] 7.2 Commit + push (GitHub + Codeberg)
