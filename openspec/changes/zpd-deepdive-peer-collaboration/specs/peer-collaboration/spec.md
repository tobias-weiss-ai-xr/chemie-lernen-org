# Spec: peer-collaboration

**Capability:** ZPD-matched peer grouping for collaborative learning
**Owners:** Sisyphus

---

## ADDED Requirements

### Requirement: PC-1 — ZPD overlap peer matching

The system SHALL find peer candidates whose current learning position overlaps
with a given user's Zone of Proximal Development. A peer candidate is a learner
whose `nextInZPD` objective shares curricular proximity (same topic or
sub-topic) and Bloom proximity (index difference ≤ 1) with the requesting
user's `nextInZPD` objective.

#### Scenario: Same-Bloom peer is best match

- **WHEN** learner A's `nextInZPD` is `blooms_index = 3` on topic "Stoffe"
- **AND** learner B's `nextInZPD` is `blooms_index = 3` on the same sub-topic
- **THEN** the match score for B is highest among all candidates
- **AND** `mkoDirection` is `'peer'` (neither is clearly the MKO)

#### Scenario: MKO-qualified peer scores higher

- **WHEN** learner A's `nextInZPD` is `blooms_index = 4`
- **AND** learner B's mastery of that objective is `≥ θ_high` (0.8)
- **THEN** `mkoDirection` for B is `'mko-for-you'`
- **AND** the match score includes the MKO bonus (+0.2)

#### Scenario: Cross-topic learner is not a candidate

- **WHEN** a learner's `nextInZPD` is on a completely different topic
- **THEN** the `curricularDistance` is 1.0 (maximum)
- **AND** the match score is low enough to exclude from results

### Requirement: PC-2 — Peer candidate ranking

Peer candidates SHALL be ranked by a composite match score ∈ [0, 1] that
combines Bloom proximity, curricular distance, and MKO qualification.

- Score formula: `1.0 - 0.3 × |bloom_A - bloom_B| - 0.2 × curricularDistance
  + 0.2 × mkoBonus`
- The MKO bonus is 0.2 when one learner's mastery of the other's next
  objective exceeds `θ_high`, otherwise 0.
- Results SHALL be returned in descending match-score order, capped at
  `maxCandidates` (default 5, maximum 20).

#### Scenario: Candidates sorted by match score

- **WHEN** three candidates exist with scores 0.9, 0.7, 0.5
- **THEN** they appear in the response in that order

#### Scenario: maxCandidates limits results

- **WHEN** `maxCandidates` is 2 and five candidates exist
- **THEN** only the top 2 by match score are returned

### Requirement: PC-3 — ZPD-matched session creation

The system SHALL optionally create a collaboration session pre-populated with
ZPD-matched context. When `createSession: true`, the response includes a session
object with `zpdContext` metadata (shared objective slug, Bloom level,
prerequisite relationship).

#### Scenario: Session created with ZPD context

- **WHEN** `POST /api/collab/sessions/zpd-match` is called with
  `createSession: true`
- **THEN** the response contains a `session` object with `id`, `name`, `topic`
- **AND** `session.zpdContext.sharedObjective` is the objective both learners
  are working on
- **AND** `session.zpdContext.bloomLevel` is the Bloom index of that objective

#### Scenario: Candidates-only mode (no session)

- **WHEN** `POST /api/collab/sessions/zpd-match` is called without
  `createSession` or with `createSession: false`
- **THEN** the response contains `candidates` array but no `session` object

### Requirement: PC-4 — Peer status endpoint

The system SHALL provide `GET /api/collab/peer-status` (auth required)
returning the current user's peer collaboration context: whether an active
session exists, their `nextInZPD`, and the count of available peer candidates.

#### Scenario: Peer status with no active session

- **WHEN** an authenticated user has no active collab session
- **THEN** `hasActiveSession` is `false`
- **AND** `currentSession` is `null`

#### Scenario: Peer status with active session

- **WHEN** an authenticated user has an active collab session
- **THEN** `hasActiveSession` is `true`
- **AND** `currentSession` contains the session id and participant count

### Requirement: PC-5 — Auth required for peer endpoints

All peer-collaboration endpoints SHALL require authentication. Anonymous
requests SHALL receive HTTP 401.

#### Scenario: Unauthenticated access rejected

- **WHEN** an unauthenticated request hits `POST /api/collab/sessions/zpd-match`
  or `GET /api/collab/peer-status`
- **THEN** the response status is 401
