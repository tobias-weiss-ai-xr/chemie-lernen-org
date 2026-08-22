# Design: zpd-deepdive-peer-collaboration

## Model

### ZPD overlap (Vygotsky's near-peer principle)

Two learners are good peer-collaboration matches when:

1. Their `nextInZPD` objectives share the same **topic or sub-topic** (curricular
   proximity).
2. Their **Bloom indices** differ by at most 1 step (the MKO is at most one
   Bloom level above).
3. At least one learner has `mastery > θ_low` on the other learner's next
   objective (the MKO can provide guidance).

### Scoring function

Each peer candidate receives a **match score** `∈ [0, 1]`:

```
overlapScore = 1.0
  - 0.3 * abs(bloom_A - bloom_B)           // Bloom proximity (0 = same, 0.3 = 1 apart)
  - 0.2 * (1 - curricularDistance)          // topic/subtopic proximity (0 = same subtopic)
  + 0.2 * mkoBonus                           // bonus if one is MKO for the other
```

- `curricularDistance ∈ [0, 1]`: 0 if same objective, 0.3 if same sub-topic,
  0.6 if same topic, 1.0 otherwise.
- `mkoBonus ∈ {0, 0.2}`: 0.2 if one learner's mastery of the other's next
  objective exceeds `θ_high`.

### Candidate structure

```typescript
interface PeerCandidate {
  userId: string;
  displayName: string;
  objectiveSlug: string;     // candidate's nextInZPD
  bloom: number;
  matchScore: number;
  mkoDirection: 'peer' | 'mko-for-you' | 'you-are-mko';
}
```

## Cypher sketch — findPeerCandidates

```cypher
// Find active learners whose nextInZPD overlaps with $userId's
// params: { userId, pathSlug?, thetaHigh, thetaLow, limit }

// Step 1: get the requesting user's nextInZPD
MATCH (lo:LearningObjective)
${subsetMatch('lo')}
OPTIONAL MATCH (lo)<-[:PREREQUISITE]-(pre:LearningObjective)
OPTIONAL MATCH (s:ObjectiveState)-[:FOR]->(pre) WHERE s.userId = $userId
WITH lo,
     CASE WHEN count(pre) = 0 THEN 1.0
          ELSE avg(coalesce(s.mastery, 0.0)) END AS prereqAvg
OPTIONAL MATCH (ls:ObjectiveState)-[:FOR]->(lo) WHERE ls.userId = $userId
WITH lo, prereqAvg, coalesce(ls.mastery, 0.0) AS loMastery
WHERE prereqAvg >= $thetaHigh AND loMastery <= $thetaLow
WITH lo ORDER BY lo.blooms_index DESC LIMIT 1 AS myNext

// Step 2: find other learners whose ObjectiveState overlaps
MATCH (otherSt:ObjectiveState)-[:FOR]->(otherLo:LearningObjective)
WHERE otherSt.userId <> $userId
  AND otherSt.mastery <= $thetaLow
  AND otherSt.bloomsMaxReached >= myNext.blooms_index - 1
  AND otherSt.bloomsMaxReached <= myNext.blooms_index + 1
RETURN otherSt.userId AS userId,
       otherLo.slug AS objectiveSlug,
       otherLo.blooms_index AS bloom,
       otherSt.mastery AS loMastery
ORDER BY abs(otherLo.blooms_index - myNext.blooms_index),
         otherSt.mastery DESC
LIMIT $limit
```

In practice, the public function `findPeerCandidates()` runs the user's own
`nextObjectiveInZPD` first, then queries for overlap. For unit tests, the
scoring logic is extracted into a pure function.

## API contract

### `POST /api/collab/sessions/zpd-match` (auth required)

```json
// Request
{
  "pathSlug": "niedersachsen-9",   // optional, restrict search to path
  "createSession": true,           // default false — just return candidates
  "maxCandidates": 5              // default 5
}

// Response (candidates only — createSession=false)
{
  "candidates": [
    {
      "userId": "user-42",
      "displayName": "Anna M.",
      "objectiveSlug": "stoffe-teilchen-lo-3",
      "bloom": 3,
      "matchScore": 0.9,
      "mkoDirection": "mko-for-you"
    }
  ],
  "myNext": { "slug": "stoffe-teilchen-lo-4", "bloom": 4 }
}

// Response (session created — createSession=true)
{
  "session": {
    "id": "collab-abc123",
    "name": "ZPD-Peer: Stoffe und Teilchen",
    "topic": "stoffe-teilchen",
    "zpdContext": {
      "sharedObjective": "stoffe-teilchen-lo-3",
      "bloomLevel": 3,
      "prerequisiteRelation": "prerequisite"
    },
    "participants": [...]
  },
  "candidates": [...]
}
```

### `GET /api/collab/peer-status` (auth required)

Returns the current user's peer collaboration context:

```json
{
  "hasActiveSession": true,
  "currentSession": { "id": "collab-abc123", "peerCount": 2 },
  "myNextInZPD": { "slug": "...", "bloom": 4 },
  "availablePeers": 3
}
```

## Component wiring

| Component                  | Role in R3                                    |
| -------------------------- | --------------------------------------------- |
| `zpd-engine.js`            | `findPeerCandidates()` + scoring function     |
| `collab-engine.js` (core)  | `createSession()` with ZPD metadata           |
| `api/routes/collab.js`     | `POST /api/collab/sessions/zpd-match`          |
| `learning-paths` route     | `recommendedStrategy: "peer"` now actionable   |
| `ObjectiveState` (Neo4j)   | read to compute overlap, no schema changes     |

## Privacy & safety

- Peer candidates are only returned to authenticated users.
- `userId` values are internal identifiers; `displayName` is the learner's
  chosen display name.
- Teachers (future R4) can override peer grouping.
- The query respects the `chemie` subset via `subsetMatch()`.
