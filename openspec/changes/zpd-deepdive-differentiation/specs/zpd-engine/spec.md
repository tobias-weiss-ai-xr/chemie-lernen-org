# Spec: zpd-engine (delta for R4 Differentiation)

**Capability:** Bloom × ZPD adaptive engine with per-learner Bloom target depth filtering
**Change:** zpd-deepdive-differentiation
**Parent Change:** `bloom-zpd-adaptive-engine`
**Owners:** pi (BZ-R4)

---

## ADDED Requirements

### Requirement: ZPD-BLOOM-1 — Bloom target retrieval

The engine SHALL provide a function to retrieve a user's Bloom target depth.

```javascript
/**
 * Get a user's target Bloom index.
 * @param {string|number} userId
 * @returns {Promise<{targetBloomIndex:number, bloomLevel:string, isDefault:boolean}>}
 */
async function getBloomTarget(userId)
```

- Returns the stored `targetBloomIndex` for the user
- If not set, returns default value `6` (create)
- `isDefault` is `true` when using the default (not explicitly set)
- `bloomLevel` is the string representation of the index

#### Scenario: Get default Bloom target

- **WHEN** `getBloomTarget(userId)` is called for a new user
- **THEN** returns `{ targetBloomIndex: 6, bloomLevel: 'create', isDefault: true }`

#### Scenario: Get custom Bloom target

- **GIVEN** user has `targetBloomIndex` set to `3`
- **WHEN** `getBloomTarget(userId)` is called
- **THEN** returns `{ targetBloomIndex: 3, bloomLevel: 'apply', isDefault: false }`

### Requirement: ZPD-BLOOM-2 — Bloom target configuration

The engine SHALL provide a function to set a user's Bloom target depth.

```javascript
/**
 * Set a user's target Bloom index.
 * @param {string|number} userId
 * @param {number|string} target - Bloom index (1-6) or level string
 * @returns {Promise<{targetBloomIndex:number, bloomLevel:string}>}
 */
async function setBloomTarget(userId, target)
```

- Accepts either numeric index (1-6) or string level ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')
- Converts string to index internally
- Validates the target is within valid range
- Throws error for invalid values

#### Scenario: Set Bloom target by index

- **WHEN** `setBloomTarget(userId, 4)` is called
- **THEN** user's target is set to `4`
- **AND** returns `{ targetBloomIndex: 4, bloomLevel: 'analyze' }`

#### Scenario: Set Bloom target by string

- **WHEN** `setBloomTarget(userId, 'analyze')` is called
- **THEN** user's target is set to `4`
- **AND** returns `{ targetBloomIndex: 4, bloomLevel: 'analyze' }`

#### Scenario: Invalid target throws error

- **WHEN** `setBloomTarget(userId, 7)` is called
- **THEN** throws error with message about valid range

### Requirement: ZPD-BLOOM-3 — Bloom depth filtering in nextObjectiveInZPD

The `nextObjectiveInZPD` function SHALL accept an optional `targetBloomIndex` parameter and filter results accordingly.

```javascript
/**
 * @param {string|number} userId
 * @param {string|null} pathSlug
 * @param {number} [targetBloomIndex] - optional override; if not provided, uses user's stored target
 * @returns {Promise<{slug:string, bloom:number, description:string, prereqAvg:number, loMastery:number, filteredOutCount?:number}|null>}
 */
async function nextObjectiveInZPD(userId, pathSlug, targetBloomIndex)
```

- When `targetBloomIndex` is provided, uses that value
- When not provided, retrieves from `getBloomTarget(userId)`
- Adds `lo.blooms_index <= $targetBloomIndex` to Cypher WHERE clause
- Returns `filteredOutCount` indicating how many in-ZPD objectives were excluded by this filter

#### Scenario: Filter by explicit target

- **GIVEN** user has stored target = 6
- **WHEN** `nextObjectiveInZPD(userId, null, 3)` is called
- **THEN** only objectives with `blooms_index <= 3` are considered
- **AND** result reflects the lower target

#### Scenario: Use stored target when not provided

- **GIVEN** user has stored target = 3
- **WHEN** `nextObjectiveInZPD(userId, null)` is called (no explicit target)
- **THEN** only objectives with `blooms_index <= 3` are considered

#### Scenario: Filtered count is returned

- **GIVEN** 5 objectives are in ZPD, 3 have bloom <= targetBloomIndex
- **WHEN** `nextObjectiveInZPD(userId, pathSlug)` is called
- **THEN** result includes `filteredOutCount: 2`

### Requirement: ZPD-BLOOM-4 — Strategy activator considers Bloom constraints

The `recommendedStrategy` function SHALL consider Bloom target constraints when determining the strategy.

```javascript
/**
 * @param {{loMastery?:number, prereqAvg?:number, bloom?:number}|null} next
 * @param {{hasPeer?:boolean, targetBloomIndex?:number}} [opts]
 * @returns {'scaffold'|'peer'|'differentiate'|'tool'|'assess'|null}
 */
function recommendedStrategy(next, opts)
```

- When `opts.targetBloomIndex` is provided and `next.bloom >= targetBloomIndex`, returns `'differentiate'`
- When no objectives exist within target (i.e., `next` is null but there are objectives in ZPD above target), returns `'differentiate'`

#### Scenario: At target Bloom level

- **GIVEN** `next = { bloom: 4, loMastery: 0.3, prereqAvg: 0.9 }`
- **AND** `opts = { targetBloomIndex: 4 }`
- **THEN** returns `'differentiate'`

#### Scenario: Below target with solid prerequisites

- **GIVEN** `next = { bloom: 2, loMastery: 0, prereqAvg: 0.9 }`
- **AND** `opts = { targetBloomIndex: 4 }`
- **THEN** returns `'scaffold'` (unchanged from parent)

## MODIFIED Requirements

### Requirement: ZPD-CORE-1 (modified) — nextObjectiveInZPD signature

The function signature SHALL be extended to support optional Bloom target parameter while maintaining backward compatibility.

- Existing calls without `targetBloomIndex` parameter SHALL continue to work
- Default behavior (no parameter) SHALL match parent implementation's behavior

#### Scenario: Existing calls work without modification

- **WHEN** code calls `nextObjectiveInZPD(userId, pathSlug)` with two parameters
- **THEN** it SHALL work without error
- **AND** use the user's stored `targetBloomIndex`

#### Scenario: Default behavior is preserved

- **GIVEN** user has no explicit `targetBloomIndex` set (defaults to 6)
- **WHEN** `nextObjectiveInZPD(userId, pathSlug)` is called
- **THEN** it SHALL return the same result as the parent implementation

## Pure Function Requirements

### Requirement: ZPD-FN-1 — bloomIndex handles all valid inputs

The `bloomIndex()` helper function SHALL correctly map:
- All valid Bloom level strings (case-insensitive) to their 1-6 indices
- Valid numeric indices (1-6) to themselves
- Invalid inputs to 0

#### Scenario: All Bloom levels map correctly

- **THEN** `bloomIndex('remember')` === 1
- **AND** `bloomIndex('understand')` === 2
- **AND** `bloomIndex('apply')` === 3
- **AND** `bloomIndex('analyze')` === 4
- **AND** `bloomIndex('evaluate')` === 5
- **AND** `bloomIndex('create')` === 6

## Backward Compatibility

- **All existing `nextObjectiveInZPD` calls SHALL continue to work** without modification
- **Default `targetBloomIndex = 6` SHALL preserve** existing behavior
- **The `bloomIndex()` function signature SHALL NOT change**
- **Existing tests in parent change SHALL continue to pass**
