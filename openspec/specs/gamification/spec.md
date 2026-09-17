# gamification Specification

## Purpose

Gamification of the learning experience: XP earning across learning actions, daily check-in streaks, achievement badges, and the XP history/achievements API surfaced to the user dashboard. XP, streaks, and earned badges persist per user via `FileBackedSessionStore`.

## Requirements

### Requirement: GAM-1 — XP earning

The system SHALL award XP for the following actions:

- Article read: 10 XP (max 1 per unique article per day)
- Quiz passed (80%+ score): 25 XP
- Exercise completed (any score): 15 XP
- Daily check-in: 5 XP (bonus +5 XP for 7-day streak, +10 XP for 30-day streak)
  XP SHALL be stored in `FileBackedSessionStore` under `user.progress.xp`.
  Total XP SHALL be the sum of all earned XP (never decremented).

#### Scenario: Article read awards XP

- **WHEN** a user reads a chemistry article (triggers `POST /api/learning-paths/progress`)
- **THEN** user gains 10 XP
- **AND** re-reading the same article on the same day awards 0 additional XP

#### Scenario: Streak bonus on check-in

- **WHEN** a user checks in on day 7 of a streak
- **THEN** user gains 5 XP (check-in) + 5 XP (streak bonus) = 10 XP total
- **AND** the response includes `streakBonus: 5`

### Requirement: GAM-2 — XP history and total

The system SHALL track XP history as an array of `{action, amount, timestamp, metadata}` entries.
The system SHALL provide total XP as the sum of all entries.

#### Scenario: XP history query

- **WHEN** `GET /api/achievements` is called
- **THEN** response includes `totalXp` and `xpHistory` (last 50 entries)

### Requirement: GAM-3 — Achievement definitions

The system SHALL define achievements (badges) with the following properties:

- `id`: unique kebab-case identifier
- `title`: German display name
- `description`: German description
- `icon`: emoji or CSS class
- `condition`: object with `type` and `threshold`

Built-in achievements:
| id | title | condition |
|----|-------|-----------|
| `first-steps` | Erste Schritte | xp >= 50 |
| `fleissig` | Fleißig | xp >= 500 |
| `chemie-experte` | Chemie-Experte | xp >= 2000 |
| `lernpfad-abgeschlossen` | Lernpfad abgeschlossen | pathCompleted >= 1 |
| `serien-check-in` | 7 Tage Serie | streak >= 7 |
| `quiz-meister` | Quiz-Meister | quizzesPassed >= 10 |
| `aufgaben-loeser` | Aufgaben-Löser | exercisesCompleted >= 25 |

Achievement definitions SHALL be hardcoded in the backend module (not in Neo4j).

#### Scenario: Achievement unlocked

- **WHEN** user XP reaches 50
- **THEN** the `first-steps` badge is automatically earned
- **AND** subsequent calls to `GET /api/achievements` include `first-steps` in `earned`

#### Scenario: Achievement not double-earned

- **WHEN** user XP reaches 50 again (can't decrease)
- **THEN** `first-steps` remains earned (no duplicate entry)

### Requirement: GAM-4 — Daily check-in

The system SHALL provide `POST /api/check-in` for daily check-in.
Check-in SHALL be tracked per user per calendar day (UTC).
Streak SHALL be consecutive calendar days — a missed day resets streak to 0.
Streak SHALL persist across sessions via `FileBackedSessionStore`.

#### Scenario: First check-in

- **WHEN** a user calls `POST /api/check-in` for the first time
- **THEN** response is `{checkedIn: true, streak: 1, xpEarned: 5, streakBonus: 0}`

#### Scenario: Same-day check-in is idempotent

- **WHEN** the same user calls `POST /api/check-in` again on the same day
- **THEN** response is `{checkedIn: false, streak: 1, xpEarned: 0, streakBonus: 0, message: "Bereits heute eingecheckt"}`

#### Scenario: Missed day resets streak

- **WHEN** a user checks in after missing a day
- **THEN** streak is 1 (reset)
- **AND** no streak bonus is awarded

### Requirement: GAM-5 — Achievements list endpoint

The system SHALL provide `GET /api/achievements` returning:

- `badges`: array of all badge definitions with `earned: true/false` for the user
- `totalXp`: total XP earned
- `streak`: current streak days
- `xpHistory`: last 50 XP entries

#### Scenario: Authenticated user views achievements

- **WHEN** an authenticated user calls `GET /api/achievements`
- **THEN** response includes all badge definitions with earned status
- **AND** `totalXp` reflects the user's total XP

### Requirement: GAM-6 — Check-in status endpoint

The system SHALL provide `GET /api/check-in` to check today's check-in status without performing one.
Returns whether the user has checked in today and their current streak.

#### Scenario: Query check-in status

- **WHEN** a user calls `GET /api/check-in`
- **THEN** response includes `checkedInToday: true/false` and `streak: integer`

### Requirement: GAM-BLOOM-1 — User profile carries Bloom target depth

The user profile SHALL include a `targetBloomIndex` field representing the learner's highest expected Bloom cognitive level.

- `targetBloomIndex` SHALL be an integer between 1 and 6 (inclusive)
- Valid values map to Bloom levels: `1=remember, 2=understand, 3=apply, 4=analyze, 5=evaluate, 6=create`
- Default value for new users SHALL be `6` (create)
- The field SHALL be modifiable by the user or administrator

#### Scenario: New user has default Bloom target

- **WHEN** a new user account is created
- **THEN** `profile.targetBloomIndex` equals `6`

#### Scenario: User updates Bloom target

- **GIVEN** user's current `targetBloomIndex` is `6`
- **WHEN** user updates to `4`
- **THEN** `profile.targetBloomIndex` equals `4`
- **AND** subsequent learning path recommendations respect this limit

### Requirement: GAM-BLOOM-2 — Bloom target as level string

The system SHALL provide both numeric index and human-readable level string for Bloom target.

- The `bloomLevel` field SHALL contain the string representation: `"remember"`, `"understand"`, `"apply"`, `"analyze"`, `"evaluate"`, or `"create"`
- Updates SHALL accept either `targetBloomIndex` (number) or `bloomLevel` (string)
- The system SHALL convert between representations consistently

#### Scenario: Get Bloom target with both representations

- **WHEN** retrieving user profile via `GET /api/gamification/profile`
- **THEN** response contains both `targetBloomIndex` (number) and `bloomLevel` (string)

#### Scenario: Set Bloom target by string

- **WHEN** user sets `bloomLevel: "apply"`
- **THEN** `targetBloomIndex` is set to `3`

### Requirement: GAM-BLOOM-3 — Bloom target persistence

The Bloom target SHALL persist across sessions and be loaded with the user's profile.

#### Scenario: Bloom target survives logout/login

- **GIVEN** user sets `targetBloomIndex` to `3`
- **WHEN** user logs out and logs back in
- **THEN** `targetBloomIndex` is still `3`

### Requirement: GAM-BLOOM-4 — Bloom target validation

The system SHALL validate Bloom target values on update.

- Integer values outside 1–6 SHALL be rejected
- String values not matching valid Bloom levels SHALL be rejected
- Invalid updates SHALL return `400 Bad Request` with descriptive error

#### Scenario: Invalid numeric target is rejected

- **WHEN** user attempts to set `targetBloomIndex: 0`
- **THEN** request fails with `400 Bad Request`
- **AND** error message indicates valid range is 1–6

#### Scenario: Invalid string target is rejected

- **WHEN** user attempts to set `bloomLevel: "guess"`
- **THEN** request fails with `400 Bad Request`
- **AND** error message lists valid Bloom levels

## API Endpoints (Bloom target extension)

### GET /api/gamification/profile (extended)

Response SHALL include:

```json
{
  "id": "user123",
  "xp": 1500,
  "level": 3,
  "targetBloomIndex": 4,
  "bloomLevel": "analyze",
  "isDefaultBloomTarget": false
}
```

### POST /api/gamification/profile (extended)

Request body MAY include:

```json
{
  "targetBloomIndex": 4
}
```

// or

```json
{
  "bloomLevel": "analyze"
}
```

Both formats SHALL be accepted and converted to the canonical numeric index.

## Backward Compatibility

- Existing user profiles WITHOUT `targetBloomIndex` SHALL default to `6`
- Existing API consumers not using Bloom target fields SHALL continue to work
- All existing gamification features (XP, levels, badges, streaks) SHALL remain unchanged
