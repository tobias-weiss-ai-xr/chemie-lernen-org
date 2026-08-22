# Design: zpd-deepdive-differentiation

## Overview

This deep dive extends the Bloom × ZPD adaptive engine with **per-learner Bloom target depth**, enabling true differentiation where different learners progress to different cognitive levels within the same curriculum.

## Model Extensions

### Learner Bloom Target

Each user has a `targetBloomIndex` (integer 1-6) representing their highest expected Bloom level:

| Level | Bloom | Description |
| ----- | ----- | ----------- |
| 1 | remember | Recall facts |
| 2 | understand | Explain concepts |
| 3 | apply | Use knowledge in new situations |
| 4 | analyze | Break down complex ideas |
| 5 | evaluate | Judge or critique |
| 6 | create | Design or construct |

Storage: User profile in `users.json` / `auth-db.js`:
```json
{
  "id": "user123",
  "targetBloomIndex": 4
}
```

Default: `6` (create) — full progression for all learners unless customized.

### Path Variants (Optional)

Learning paths can offer multiple variants, each targeting a different Bloom depth range. This allows educators to create:
- **Foundational variant**: targetBloomMax = 3 (apply) — for learners needing conceptual mastery
- **Standard variant**: targetBloomMax = 5 (evaluate) — default balanced approach  
- **Advanced variant**: targetBloomMax = 6 (create) — for learners aiming for highest cognition

Neo4j schema extension (optional - paths may simply use learner's target):
```cypher
(:LearningPath {slug, title, description})
  -[:HAS_VARIANT]->(:PathVariant {name, targetBloomMax})
```

When a learner enrolls in a path, they're assigned to the variant whose `targetBloomMax` best matches their `targetBloomIndex`.

### Bloom Depth Filtering in ZPD

The `nextObjectiveInZPD` query gains an additional WHERE clause:

```cypher
// Existing ZPD conditions
WHERE prereqAvg >= $thetaHigh
  AND loMastery <= $thetaLow
  AND lo.blooms_index <= $targetBloomIndex  // NEW: Bloom depth filter
```

This ensures learners are never routed to objectives beyond their target cognitive level.

## Bloom Target Selection Logic

The effective `targetBloomIndex` for a learner on a given path is determined by:

1. **If path has variants and user is enrolled in a specific variant**: use variant's `targetBloomMax`
2. **If user has explicit `targetBloomIndex`**: use that value
3. **Default**: `6` (create)

This allows both per-learner and per-path-variant configuration.

## API Contract

### GET /api/zpd/bloom-target

Returns the current user's Bloom target configuration.

```json
{
  "targetBloomIndex": 4,
  "bloomLevel": "analyze",
  "isDefault": false
}
```

### POST /api/zpd/bloom-target

Sets the current user's Bloom target.

Request body:
```json
{
  "targetBloomIndex": 4
}
// or
{
  "bloomLevel": "analyze"
}
```

Response:
```json
{
  "targetBloomIndex": 4,
  "bloomLevel": "analyze",
  "updated": true
}
```

### GET /api/learning-paths/:slug/variants

Returns available variants for a path.

```json
{
  "pathSlug": "chemie-grundlagen",
  "variants": [
    { "name": "foundational", "targetBloomMax": 3, "description": "Fokus auf Grund理解" },
    { "name": "standard", "targetBloomMax": 5, "description": "Ausgewogene Vertiefung" },
    { "name": "advanced", "targetBloomMax": 6, "description": "Höchste kognitive Anforderungen" }
  ]
}
```

### POST /api/learning-paths/:slug/enroll

Extended to support variant selection:

Request body:
```json
{
  "variant": "foundational"  // optional
}
```

Response includes the effective target:
```json
{
  "enrolled": true,
  "variant": "foundational",
  "targetBloomMax": 3
}
```

### GET /api/learning-paths/:slug/next (modified)

Now respects Bloom target filtering:

```json
{
  "inZPD": true,
  "next": { "slug": "stoffe-teilchen-lo-3", "bloom": 3, "description": "..." },
  "recommendedStrategy": "differentiate",
  "prereqAvg": 0.91,
  "bloomTarget": 4,
  "filteredOutCount": 2
}
```

## ZPD Engine Extensions

### nextObjectiveInZPD(userId, pathSlug, targetBloomIndex)

Additional parameter:
- `targetBloomIndex` (number, optional): Maximum Bloom index to consider. If not provided, uses user's stored target (or default 6).

Modified Cypher (key addition in WHERE clause):
```cypher
WHERE prereqAvg >= $thetaHigh
  AND loMastery <= $thetaLow
  AND lo.blooms_index <= $targetBloomIndex  // Bloom depth filter
```

When `targetBloomIndex` is below the maximum available, objectives above that level are filtered out, even if they would otherwise be in ZPD.

### getBloomTarget(userId)

Retrieves a user's Bloom target:

```javascript
/**
 * Get a user's target Bloom index.
 * @param {string|number} userId
 * @returns {Promise<{targetBloomIndex:number, bloomLevel:string, isDefault:boolean}>}
 */
async function getBloomTarget(userId) {
  // Look up from user profile / auth-db
  // Return default 6 if not set
}
```

### setBloomTarget(userId, target)

Sets a user's Bloom target:

```javascript
/**
 * Set a user's target Bloom index.
 * @param {string|number} userId
 * @param {number|string} target - Bloom index (1-6) or level string
 * @returns {Promise<{targetBloomIndex:number, bloomLevel:string}>}
 */
async function setBloomTarget(userId, target) {
  const index = typeof target === 'string' ? bloomIndex(target) : target;
  // Validate 1-6
  // Store in user profile
  return { targetBloomIndex: index, bloomLevel: BLOOM_LEVELS[index - 1] };
}
```

## Strategy Activator Updates

The `recommendedStrategy` function may return `'differentiate'` more frequently in these scenarios:

| Condition | Strategy |
| --------- |----------|
| Objective's Bloom index == learner's targetBloomIndex | `differentiate` (suggest switching to easier path variant) |
| No objectives found within targetBloomIndex | `differentiate` (suggest increasing target or switching variant) |
| Learner consistently masters at target level | `differentiate` (suggest advancing target) |

## Fallback Behavior

- If `targetBloomIndex` not set: use 6 (create)
- If variant not specified on enrollment: use learner's `targetBloomIndex`
- If no objectives exist at or below target: return `inZPD: false` with suggestion to adjust target
- If learner reaches their target on a path: recommend path completion or variant switch

## Thresholds & Configuration

- `targetBloomIndex` range: 1-6 (integer)
- Default: 6
- Can be configured per-user via API or admin interface
- Can be configured per-path-variant in Neo4j

## Migration

1. Existing users keep default targetBloomIndex = 6
2. Existing learning paths have no variants (single implicit variant with targetBloomMax = 6)
3. New paths can define variants
4. Users can be migrated to specific targets via bulk update
