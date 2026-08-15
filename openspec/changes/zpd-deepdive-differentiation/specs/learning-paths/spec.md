# Spec: learning-paths (delta for R4 Differentiation)

**Capability:** Structured curriculum-aligned learning paths with ZPD-aware next-step routing and per-learner Bloom target depth differentiation
**Change:** zpd-deepdive-differentiation
**Parent Spec:** `openspec/specs/learning-paths/spec.md`
**Owners:** pi (BZ-R4)

---

## ADDED Requirements

### Requirement: LP-DIFF-1 — Per-learner Bloom target depth

The system SHALL support a per-learner Bloom target depth configuration that limits the maximum Bloom level objectives returned for that learner.

- Each user SHALL have a `targetBloomIndex` (integer 1–6) stored in their profile
- Default value SHALL be `6` (create level)
- The `targetBloomIndex` SHALL be configurable via API
- Bloom levels: `1=remember, 2=understand, 3=apply, 4=analyze, 5=evaluate, 6=create`

#### Scenario: User has default Bloom target

- **WHEN** a new user is created
- **THEN** their `targetBloomIndex` is `6`

#### Scenario: User configures lower Bloom target

- **WHEN** a user sets `targetBloomIndex` to `3` (apply)
- **THEN** subsequent next-objective queries return only objectives with `blooms_index <= 3`

### Requirement: LP-DIFF-2 — Bloom depth filtering on next objective

The `nextObjectiveInZPD` computation SHALL respect the learner's `targetBloomIndex` as an additional filter constraint.

- Objectives with `blooms_index > targetBloomIndex` SHALL be excluded from ZPD consideration
- The existing ZPD conditions (prereqAvg >= θ_high, loMastery <= θ_low) remain applicable
- Bloom depth filtering is an **AND** condition with ZPD conditions

#### Scenario: Objective above target is filtered out

- **GIVEN** user has `targetBloomIndex = 3`
- **AND** objective `A` has `blooms_index = 4` and is in ZPD by other criteria
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** objective `A` is NOT returned

#### Scenario: Highest Bloom within target is returned

- **GIVEN** user has `targetBloomIndex = 4`
- **AND** objectives `A` (bloom=3, in ZPD), `B` (bloom=4, in ZPD), `C` (bloom=5, in ZPD) exist
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** objective `B` with bloom=4 is returned (highest within target)

#### Scenario: No objectives within target returns empty

- **GIVEN** user has `targetBloomIndex = 2`
- **AND** all in-ZPD objectives have `blooms_index >= 3`
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** response has `inZPD: false`

### Requirement: LP-DIFF-3 — Bloom target API endpoints

The system SHALL provide endpoints to retrieve and configure a user's Bloom target.

#### Scenario: Get current Bloom target

- **WHEN** authenticated user calls `GET /api/zpd/bloom-target`
- **THEN** response contains `targetBloomIndex` and `bloomLevel` string
- **AND** response contains `isDefault` boolean

#### Scenario: Set Bloom target by index

- **WHEN** authenticated user POSTs `{ targetBloomIndex: 4 }` to `/api/zpd/bloom-target`
- **THEN** user's target is updated to `4`
- **AND** response confirms the update

#### Scenario: Set Bloom target by level string

- **WHEN** authenticated user POSTs `{ bloomLevel: "analyze" }` to `/api/zpd/bloom-target`
- **THEN** user's target is updated to `4` (index for analyze)

#### Scenario: Invalid Bloom target is rejected

- **WHEN** user POSTs `{ targetBloomIndex: 7 }` to `/api/zpd/bloom-target`
- **THEN** response is `400 Bad Request` with error message

### Requirement: LP-DIFF-4 — Bloom target in path responses

Path detail responses SHALL include the learner's effective Bloom target information.

#### Scenario: Path detail includes Bloom target

- **GIVEN** authenticated user with `targetBloomIndex = 4`
- **WHEN** calling `GET /api/learning-paths/:slug`
- **THEN** response contains `bloomTarget.index` and `bloomTarget.level`

#### Scenario: Next endpoint includes Bloom target info

- **WHEN** calling `GET /api/learning-paths/:slug/next`
- **THEN** response contains `bloomTarget` field
- **AND** response contains `filteredOutCount` indicating how many objectives were excluded by Bloom depth filter

## MODIFIED Requirements

### Requirement: LP-ZPD-1 (modified) — ZPD-aware next objective with Bloom depth

The system SHALL compute the next optimal learning objective as the highest-Bloom objective in ZPD **that does not exceed the learner's target Bloom depth**.

#### Scenario: Next objective respects Bloom target

- **GIVEN** user has `targetBloomIndex = 3`
- **AND** objectives with bloom=4,5,6 are in ZPD but exceed target
- **AND** objective with bloom=3 is in ZPD
- **WHEN** `GET /api/learning-paths/:slug/next` is called
- **THEN** the bloom=3 objective is returned (not higher ones)

### Requirement: LP-ZPD-2 (modified) — Strategy activator considers Bloom target

The `recommendedStrategy` SHALL consider when a learner reaches their Bloom target.

#### Scenario: At target level suggests differentiation

- **WHEN** the next objective's Bloom index equals the learner's `targetBloomIndex`
- **THEN** `recommendedStrategy` MAY be `differentiate` (suggest advancing target or switching path)

#### Scenario: No objectives within target suggests differentiation

- **WHEN** no objectives exist within the learner's `targetBloomIndex`
- **THEN** `recommendedStrategy` SHALL be `differentiate`

## Backward Compatibility

- **All existing functionality SHALL remain unchanged** when `targetBloomIndex` is not explicitly set (defaults to 6)
- **Existing API contracts SHALL not break** — new fields are additive only
- **ZPD computation without target SHALL behave identically** to the parent `bloom-zpd-adaptive-engine` implementation
