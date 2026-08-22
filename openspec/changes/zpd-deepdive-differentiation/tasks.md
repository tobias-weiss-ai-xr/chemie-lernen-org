# Tasks: zpd-deepdive-differentiation

## 1. User Bloom Target

- [ ] 1.1 Add `targetBloomIndex` field to user profile in `api/auth-db.js` with default value 6
- [ ] 1.2 Create `api/services/zpd-engine.js` functions: `getBloomTarget(userId)` and `setBloomTarget(userId, target)`
- [ ] 1.3 Add `GET /api/zpd/bloom-target` route returning current user's target
- [ ] 1.4 Add `POST /api/zpd/bloom-target` route to update current user's target
- [ ] 1.5 Validate `targetBloomIndex` is integer between 1-6 or valid Bloom level string

## 2. Bloom Depth Filtering in ZPD Engine

- [ ] 2.1 Extend `nextObjectiveInZPD(userId, pathSlug, targetBloomIndex?)` to accept optional `targetBloomIndex` parameter
- [ ] 2.2 Modify Cypher query to add `lo.blooms_index <= $targetBloomIndex` WHERE clause
- [ ] 2.3 When `targetBloomIndex` not provided, retrieve from user's profile via `getBloomTarget()`
- [ ] 2.4 Return `filteredOutCount` in result to indicate how many objectives were excluded by Bloom depth filter
- [ ] 2.5 Ensure backward compatibility: when no target is set, defaults to 6 (create)

## 3. Path Variants (Optional - Nice to Have)

- [ ] 3.1 Add `:PathVariant` node type with properties: `name`, `targetBloomMax`, `description`
- [ ] 3.2 Add relationship `(:LearningPath)-[:HAS_VARIANT]->(:PathVariant)`
- [ ] 3.3 Extend enrollment to track which variant a user is on
- [ ] 3.4 Add `GET /api/learning-paths/:slug/variants` endpoint
- [ ] 3.5 When computing `nextObjectiveInZPD` for a path, use the variant's `targetBloomMax` if user is enrolled in that variant
- [ ] 3.6 Add Cypher index on `:PathVariant(targetBloomMax)` for performance

## 4. API Integration

- [ ] 4.1 Extend `GET /api/learning-paths/:slug/next` to include `bloomTarget` and `filteredOutCount` in response
- [ ] 4.2 Extend `GET /api/learning-paths/:slug` to include user's effective `targetBloomIndex` for this path
- [ ] 4.3 Add validation middleware to ensure `targetBloomIndex` is within valid range
- [ ] 4.4 Ensure all new endpoints require authentication via `requireAuth`

## 5. Strategy Activator Enhancement

- [ ] 5.1 Update `recommendedStrategy()` to consider Bloom target constraints
- [ ] 5.2 Return `'differentiate'` when objective's Bloom index equals learner's target (suggest advancing)
- [ ] 5.3 Return `'differentiate'` when no objectives exist within target range (suggest adjusting target)

## 6. Tests

- [ ] 6.1 Add unit tests for `bloomIndex()` edge cases (already exists in parent, verify compatibility)
- [ ] 6.2 Add unit tests for `getBloomTarget()` and `setBloomTarget()` in `tests/zpd-engine.test.mjs`
- [ ] 6.3 Add integration tests for Bloom depth filtering in `nextObjectiveInZPD`
- [ ] 6.4 Add tests for `GET /api/zpd/bloom-target` and `POST /api/zpd/bloom-target` endpoints
- [ ] 6.5 Add tests for modified `/:slug/next` endpoint with Bloom target filtering
- [ ] 6.6 Add tests for path variant endpoints (if implemented)
- [ ] 6.7 Verify backward compatibility: existing behavior unchanged when no target is set

## 7. Spec Deltas

- [ ] 7.1 Add delta spec for `zpd-engine` capability in `openspec/changes/zpd-deepdive-differentiation/specs/zpd-engine/spec.md`
- [ ] 7.2 Add delta spec for `learning-paths` capability with Bloom target extensions
- [ ] 7.3 Update main specs after validation (or reference as deltas)

## 8. Documentation & Validation

- [ ] 8.1 Run `npx openspec validate zpd-deepdive-differentiation` - fix any issues
- [ ] 8.2 Update `openspec/SPECS_INDEX.md` to add this change to Active changes
- [ ] 8.3 Ensure all Cypher queries use `subsetMatch()` from `scripts/_neo4j-subset-filter.mjs`
- [ ] 8.4 Verify `npm test` and `npm run lint` pass

## Definition of Done

- [ ] All tasks above completed or explicitly deferred with rationale
- [ ] `npx openspec validate zpd-deepdive-differentiation` passes
- [ ] All tests pass (`npm test`)
- [ ] All linting passes (`npm run lint`)
- [ ] Backward compatible with existing `bloom-zpd-adaptive-engine` change
- [ ] Acceptance gate passes via orchestrator

## Prioritization

**P0 (Must Have):** Tasks 1, 2, 4, 6, 8
**P1 (Should Have):** Task 5
**P2 (Nice to Have):** Task 3 (Path Variants) - can be deferred if time constrained

Minimum viable change: P0 tasks complete. This provides per-learner Bloom target depth without requiring path variant complexities.
