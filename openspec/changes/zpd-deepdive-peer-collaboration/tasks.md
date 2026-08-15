# Tasks: zpd-deepdive-peer-collaboration

## 1. Peer scoring logic (pure functions — no DB)

- [ ] 1.1 Implement `peerMatchScore(myBloom, peerBloom, curricularDistance, mkoBonus)`
      in `api/services/zpd-engine.js`: returns a match score ∈ [0, 1] per the
      design formula (Bloom proximity, curricular proximity, MKO bonus).
- [ ] 1.2 Implement `classifyMKODirection(myMastery, peerMastery, thetaHigh)`:
      returns `'mko-for-you'` | `'you-are-mko'` | `'peer'` based on mastery
      comparison against `θ_high`.
- [ ] 1.3 Implement `curricularDistanceMetric(level)` helper: maps
      `'same-objective' → 0`, `'same-subtopic' → 0.3`, `'same-topic' → 0.6`,
      `'cross-topic' → 1.0`.

## 2. ZPD overlap query

- [ ] 2.1 Implement `findPeerCandidates(userId, pathSlug?, {maxCandidates, thresholds})`
      in `api/services/zpd-engine.js`: runs `nextObjectiveInZPD` for the user,
      then queries `ObjectiveState` for other learners with overlapping Bloom
      range, ranks by match score. Returns `PeerCandidate[]`.
- [ ] 2.2 Add unit tests in `tests/zpd-engine-peer.test.mjs`:
      - `peerMatchScore` returns correct values for same-Bloom, adjacent-Bloom,
        and cross-topic cases.
      - `classifyMKODirection` classifies correctly.
      - `curricularDistanceMetric` maps all levels.
      - `findPeerCandidates` (mocked driver) returns ranked candidates.
- [ ] 2.3 Verify `npm run lint` and `npm test` pass.

## 3. API routes

- [ ] 3.1 Add `POST /api/collab/sessions/zpd-match` to `api/routes/collab.js`:
      accepts `{pathSlug?, createSession?, maxCandidates?}`, calls
      `findPeerCandidates()`, optionally creates a session via `collab-engine`.
- [ ] 3.2 Add `GET /api/collab/peer-status` to `api/routes/collab.js`:
      returns current user's peer collaboration context (active session,
      nextInZPD, available peer count).
- [ ] 3.3 Add route tests in `tests/collab-routes-peer.test.mjs`:
      - 401 when anonymous.
      - Returns candidates array when authenticated.
      - Returns session object when `createSession: true`.
      - Validates input (maxCandidates capped at 20).

## 4. Collab session enrichment

- [ ] 4.1 When `createSession: true`, populate session metadata with
      `zpdContext: { sharedObjective, bloomLevel, prerequisiteRelation }`
      derived from the match.
- [ ] 4.2 Ensure session name auto-generates from the shared objective's
      parent topic name (e.g., "ZPD-Peer: Stoffe und Teilchen").

## 5. Spec sync & cleanup

- [ ] 5.1 Validate: `npx openspec validate zpd-deepdive-peer-collaboration`.
- [ ] 5.2 Verify: `npm run lint` green, `npm test` green.
