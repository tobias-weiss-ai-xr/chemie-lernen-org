# Chemie-Lernen Android App

Native Android client (Kotlin + Jetpack Compose, Material 3, MVVM) for
[chemie-lernen.org](https://chemie-lernen.org). Consumes the existing
Express REST API (`docs/openapi.yaml`) — no server changes required.

## Features

- **Auth** — login/register against `/api/auth/*`; JWT stored in
  EncryptedSharedPreferences; session restore via `/api/auth/me`
- **Browse** — states → topics → learning objectives from `/api/curricula/*`
  with an offline Room cache (network-first, cache fallback)
- **Üben (Quiz)** — AI-generated MCQs from `/api/exercises/generate`
  (options carry letter ids); answer submitted as the lettered id to
  `/api/exercises/grade` (mirrors the web `_normalizeAiAnswer` mapping);
  individualized feedback display
- **Offline resilience** — submissions made offline are queued in Room
  (`pending_grade`) and drained on reconnect (`/api/exercises/grade` per
  item, then `/api/assessment/sync`), mirroring the web `QuizGradeQueue`
- **FSRS** — spaced-repetition review cards from `/api/fsrs/cards`
- **Gamification** — XP profile, daily check-in, achievements, badges
- **Lernpfade** — learning-path list + enrollment from `/api/learning-paths*`
- **Dashboards** — learner results + weak concepts; teacher class
  breakdown (role-gated)

## Requirements

- JDK 17+
- Android SDK (platform 35, build-tools 35.0.0)
- Network access to Maven Central + Google Maven (first build)

## Build

```bash
cd android
export ANDROID_HOME=/path/to/android-sdk
./gradlew assembleDebug
```

The debug APK is at `app/build/outputs/apk/debug/app-debug.apk`.

CI (`.github/workflows/android.yml`) builds the debug + release (unsigned)
APKs and uploads them as artifacts on every push/PR touching `android/**`.

Override the API base URL (e.g. for a staging host):

```bash
./gradlew assembleDebug -PapiBaseUrl=https://staging.chemie-lernen.org
```

Debug builds default to `http://10.0.2.2:3001` (emulator → host loopback).

## Unit tests

```bash
./gradlew testDebugUnitTest
```

Covers: auth repository (login/restore/invalid token), offline grade
queue (enqueue/drain/keep-on-failure), quiz view model (index→letter
mapping, offline fallback).

## Install on a device

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Release / signing

The release build type signs only when a keystore is present via **env vars**
(or `-P` gradle properties). Without them the release APK stays unsigned
(`app-release-unsigned.apk`):

```bash
CHEMIE_RELEASE_STORE_FILE=/abs/path/chemie-release.jks \
CHEMIE_RELEASE_STORE_PASSWORD=... \
CHEMIE_RELEASE_KEY_ALIAS=chemie \
CHEMIE_RELEASE_KEY_PASSWORD=... \
./gradlew assembleRelease
```

CI does this automatically from GitHub secrets:

- `CHEMIE_RELEASE_KEYSTORE_B64` — base64 of the `.jks` file
- `CHEMIE_RELEASE_STORE_PASSWORD`
- `CHEMIE_RELEASE_KEY_ALIAS`
- `CHEMIE_RELEASE_KEY_PASSWORD`

The release job decodes the keystore, builds, verifies with `apksigner`
and uploads the signed `app-release.apk` as an artifact. If the secrets are
missing (e.g. PR from a fork), the build still succeeds as unsigned.

> ⚠️ The keystore and passwords are secrets — never commit them. Back up the
> keystore; losing it makes existing Play updates impossible (same signing
> key required). The repo keystore used by CI lives at
> `~/.android/chemie-release.jks` with creds in `~/.android/release-creds.txt`
> (host: the build machine).

## Architecture

```
android/
├── app/
│   ├── src/main/java/de/chemielernen/app/
│   │   ├── ChemieApp.kt            # service locator (repos, DB, token store)
│   │   ├── MainActivity.kt
│   │   ├── data/api/               # Retrofit + DTOs + NetworkModule (Bearer interceptor)
│   │   ├── data/db/                # Room entities/DAOs/AppDatabase
│   │   ├── data/repo/              # Auth/Browse/Quiz/GradeQueue repositories
│   │   └── ui/                     # Compose screens + ViewModels (MVVM)
│   └── src/test/                   # JVM unit tests
└── gradle/libs.versions.toml       # dependency catalog
```

## Notes

- Auth: the server accepts both the `chemie_auth` cookie and
  `Authorization: Bearer <jwt>`; the app uses the Bearer header.
- AI generation is rate-limited server-side (60 req/min) — the app caches
  generated exercises per topic in Room to avoid repeated LiteLLM calls.
- The app is a sibling of the web PWA; both share the same backend and
  data (assessments, XP, FSRS cards, learning-path progress).
