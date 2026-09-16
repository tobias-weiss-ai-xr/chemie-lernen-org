# Change Proposal: zpd-deepdive-peer-collaboration

## Why

The Bloom × ZPD adaptive engine (`bloom-zpd-adaptive-engine`, already merged)
returns a `recommendedStrategy` field including `"peer"` when a learner with an
overlapping ZPD is available. However, no actual peer-matching logic exists
yet — the strategy hook is a no-op for the `"peer"` case.

The existing `collab-engine` (in-memory, `api/collab-engine.js` — private
`chemie-core`) and `api/routes/collab.js` provide real-time collaboration
sessions (create, join, chat, shared exercises, quiz challenges). These
sessions are **topic-based** but **not ZPD-aware**: any learner can join any
session, and room creation does not consider mastery overlap or Bloom proximity.

This creates a mismatch with Vygotsky's ZPD theory: peer collaboration is most
effective when the **more-knowledgeable other** (MKO) is within one Bloom step
of the learner's next objective. Random grouping wastes the adaptive signal the
engine already computes.

## What Changes

- **ZPD overlap query**: a Cypher query that finds learners whose current
  `nextInZPD` objectives overlap with a given user's — candidates for peer
  collaboration.
- **`findPeerCandidates(userId, pathSlug?)`**: new function in the public
  `api/services/zpd-engine.js` returning ranked peer matches (same or adjacent
  Bloom, same or prerequisite-related objective).
- **`POST /api/collab/sessions/zpd-match`**: new route that creates a
  collaboration session pre-populated with ZPD-matched learners (or returns
  candidates without creating a session).
- **Collab session enrichment**: extend session metadata with `zpdContext`
  (shared objective slug, Bloom level, prerequisite relationship) so the UI can
  display the learning rationale.
- **`ObjectiveState` label addition**: add `ObjectiveState` to
  `CHEMIE_LABELS` in the subset filter (already done in the parent change).

### Explicitly OUT of scope

- Real-time presence/WebSocket notifications for peer availability (future work).
- Automatic session re-matching mid-session (beyond initial creation).
- Teacher-assigned grouping overrides (future differentiation deep dive R4).
- UI/UX for the peer matching flow (frontend-only change).

## Capabilities

### New Capability

- `peer-collaboration`: ZPD-matched peer grouping for collaborative learning,
  leveraging the Bloom × ZPD engine to pair learners at optimal Bloom proximity.

### Modified Capabilities

- `learning-paths`: `recommendedStrategy = "peer"` now has a backing
  implementation (peer matching query + session creation).
- `lehrplan-curriculum`: no schema changes (uses existing `ObjectiveState`
  already created by parent change).

## Impact

- `api/services/zpd-engine.js` — add `findPeerCandidates()` public function
- `api/routes/collab.js` — add `POST /api/collab/sessions/zpd-match`
- Tests: `tests/zpd-engine-peer.test.mjs` — DB-free unit tests for overlap
  scoring + ranking logic.
- No changes to the private `chemie-core` collab-engine internals; this change
  wraps it with ZPD-aware session creation.
