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
