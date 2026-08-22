# Spec: gamification (delta for R4 Differentiation)

**Capability:** Gamification and learner profiles with per-learner Bloom target depth for differentiated learning
**Change:** zpd-deepdive-differentiation
**Parent Spec:** `openspec/specs/gamification/spec.md`
**Owners:** pi (BZ-R4)

---

## ADDED Requirements

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

## API Endpoints

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
// or
{
  "bloomLevel": "analyze"
}
```

Both formats SHALL be accepted and converted to the canonical numeric index.

## Backward Compatibility

- Existing user profiles WITHOUT `targetBloomIndex` SHALL default to `6`
- Existing API consumers not using Bloom target fields SHALL continue to work
- All existing gamification features (XP, levels, badges, streaks) SHALL remain unchanged
