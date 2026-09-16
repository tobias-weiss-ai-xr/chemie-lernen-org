/**
 * zpd-engine.js — Bloom × ZPD adaptive engine (public).
 *
 * Provides the shared model that turns the platform's isolated ZPD strategy
 * components (formative assessment, scaffolding, peer collaboration,
 * differentiation, tech integration) into one coherent adaptive experience:
 *
 *   - learner-state  : (user × LearningObjective) mastery record
 *   - ZPD math       : an objective is "in ZPD" when its prerequisites are
 *                      solid and the objective itself is not yet mastered
 *   - nextObjectiveInZPD : the highest-Bloom objective currently in ZPD
 *   - recommendedStrategy : which ZPD strategy to apply next (activation hook)
 *
 * Users live in users.json (NOT as :User nodes in the KG), so the learner
 * state is modelled as `:ObjectiveState {userId, ...}-[:FOR]->(:LearningObjective)`.
 *
 * All Cypher is scoped to the chemie subset via subsetMatch().
 */

import neo4j from 'neo4j-driver';
import { getNeo4jDriver, NEO4J_DATABASE, toNumberSafe } from './neo4j.js';
import { subsetMatch } from '../scripts/_neo4j-subset-filter.mjs';
import {
  getBloomTarget as authGetBloomTarget,
  setBloomTarget as authSetBloomTarget,
} from './bloom-target.js';
import { resolveTool } from './tool-router.js';

export const ZPD_THRESHOLDS = { thetaHigh: 0.8, thetaLow: 0.6 };

const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

/** Map a Bloom level string/number to its 1–6 index (0 if unknown). */
export function bloomIndex(level) {
  if (typeof level === 'number') return level >= 1 && level <= 6 ? level : 0;
  if (!level) return 0;
  const idx = BLOOM_LEVELS.indexOf(String(level).toLowerCase());
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Get a learner's target Bloom depth (spec ZPD-BLOOM-1).
 * @returns {{targetBloomIndex:number, bloomLevel:string, isDefault:boolean}}
 */
export function getBloomTarget(userId) {
  const idx = authGetBloomTarget(userId);
  return {
    targetBloomIndex: idx,
    bloomLevel: BLOOM_LEVELS[idx - 1] || '',
    isDefault: idx === 6,
  };
}

/**
 * Set a learner's target Bloom depth (spec ZPD-BLOOM-2). Accepts an integer
 * 1–6 or a level string. Resolves to a synchronous result for engine parity.
 * @returns {{ok:boolean, targetBloomIndex?:number, bloomLevel?:string, error?:string}}
 */
export function setBloomTarget(userId, target) {
  const result = authSetBloomTarget(userId, target);
  if (!result.ok) return result;
  return {
    ok: true,
    targetBloomIndex: result.targetBloomIndex,
    bloomLevel: result.bloomLevel || BLOOM_LEVELS[result.targetBloomIndex - 1],
  };
}

/**
 * Compute the next optimal objective for a user: the highest-Bloom objective
 * currently inside the user's Zone of Proximal Development. When
 * `targetBloomIndex` is provided (or fetched from the user's profile), only
 * objectives at or below that Bloom depth are considered — this is how the
 * platform implements per-learner differentiation without overwhelming novices.
 *
 * @param {string|number} userId
 * @param {string|null} pathSlug - restrict to objectives of this Curriculum path
 * @param {{thetaHigh:number, thetaLow:number}} [thresholds]
 * @param {number|null} [targetBloomIndex] - optional Bloom ceiling (1–6); when
 *   omitted, resolved from the user's profile via getBloomTarget().
 * @returns {Promise<{slug:string,bloom:number,description:string,prereqAvg:number,loMastery:number,filteredOutCount:number}|null>}
 */
export async function nextObjectiveInZPD(
  userId,
  pathSlug = null,
  thresholds = ZPD_THRESHOLDS,
  targetBloomIndex = null
) {
  if (thresholds == null) thresholds = ZPD_THRESHOLDS; // Resolve the effective Bloom ceiling: caller-supplied wins, else profile.
  let bloomTarget;
  if (targetBloomIndex != null) {
    bloomTarget = Number(targetBloomIndex);
  } else {
    bloomTarget = Number(authGetBloomTarget(userId));
  }
  if (!Number.isInteger(bloomTarget) || bloomTarget < 1 || bloomTarget > 6) {
    bloomTarget = 6;
  }

  const driver = getNeo4jDriver();
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
  });
  try {
    const pathFilter = `($pathSlug IS NULL
            OR EXISTS {
              MATCH (c:Curriculum {slug: $pathSlug})-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo)
            }
            OR EXISTS {
              MATCH (c:Curriculum {slug: $pathSlug})-[:HAS_TOPIC]->(:Topic)-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo)
            })`;

    const result = await session.run(
      `MATCH (lo:LearningObjective)
       ${subsetMatch('lo')}
       AND ${pathFilter}
       OPTIONAL MATCH (lo)<-[:PREREQUISITE]-(pre:LearningObjective)
       OPTIONAL MATCH (s:ObjectiveState)-[:FOR]->(pre)
         WHERE s.userId = $userId
       WITH lo,
            CASE WHEN count(pre) = 0 THEN 1.0
                 ELSE avg(coalesce(s.mastery, 0.0)) END AS prereqAvg
       OPTIONAL MATCH (ls:ObjectiveState)-[:FOR]->(lo)
         WHERE ls.userId = $userId
       WITH lo, prereqAvg, coalesce(ls.mastery, 0.0) AS loMastery,
            coalesce(lo.blooms_index, 3) AS bloom
       WHERE prereqAvg >= $thetaHigh
         AND loMastery <= $thetaLow
         AND bloom <= $bloomTarget
       RETURN lo.slug AS slug,
              bloom,
              lo.text AS description,
              prereqAvg AS prereqAvg,
              loMastery AS loMastery
       ORDER BY bloom DESC, lo.slug
       LIMIT 1`,
      {
        userId: String(userId),
        pathSlug: pathSlug || null,
        thetaHigh: thresholds.thetaHigh,
        thetaLow: thresholds.thetaLow,
        bloomTarget,
      }
    );

    // Count how many objectives would have matched WITHOUT the Bloom filter but
    // were excluded because their depth exceeds the learner's ceiling. This is
    // used by the strategy activator to suggest raising the target when the
    // learner has effectively outgrown their current ceiling.
    let filteredOutCount = 0;
    if (result.records.length === 0) {
      const countResult = await session.run(
        `MATCH (lo:LearningObjective)
         ${subsetMatch('lo')}
         AND ${pathFilter}
         AND coalesce(lo.blooms_index, 3) > $bloomTarget
         OPTIONAL MATCH (lo)<-[:PREREQUISITE]-(pre:LearningObjective)
         OPTIONAL MATCH (s:ObjectiveState)-[:FOR]->(pre)
           WHERE s.userId = $userId
         WITH lo,
              CASE WHEN count(pre) = 0 THEN 1.0
                   ELSE avg(coalesce(s.mastery, 0.0)) END AS prereqAvg
         OPTIONAL MATCH (ls:ObjectiveState)-[:FOR]->(lo)
           WHERE ls.userId = $userId
         WITH lo, prereqAvg, coalesce(ls.mastery, 0.0) AS loMastery
         WHERE prereqAvg >= $thetaHigh
           AND loMastery <= $thetaLow
         RETURN count(lo) AS c`,
        {
          userId: String(userId),
          pathSlug: pathSlug || null,
          thetaHigh: thresholds.thetaHigh,
          thetaLow: thresholds.thetaLow,
          bloomTarget,
        }
      );
      filteredOutCount = toNumberSafe(countResult.records[0]?.get('c')) || 0;
    }

    if (result.records.length === 0) {
      return null;
    }
    const r = result.records[0];
    return {
      slug: r.get('slug'),
      bloom: toNumberSafe(r.get('bloom')),
      description: r.get('description'),
      prereqAvg: toNumberSafe(r.get('prereqAvg')),
      loMastery: toNumberSafe(r.get('loMastery')),
      filteredOutCount,
    };
  } finally {
    await session.close();
  }
}

/**
 * Activation hook: given a ZPD result, recommend which of the five ZPD
 * classroom strategies to apply next. Actual strategy behaviour is implemented
 * in the separate roadmap deep-dive changes (R1–R5).
 *
 * Differentiation (zpd-deepdive-differentiation): when the surfaced objective's
 * Bloom index already equals the learner's ceiling and they keep draining the
 * queue, the learner has outgrown their ceiling → recommend 'differentiate'
 * (the activator suggests raising the target).
 *
 * @param {{loMastery?:number, prereqAvg?:number, bloom?:number}|null} next
 * @param {{hasPeer?:boolean, targetBloomIndex?:number, objectiveTags?:string[]}} [opts]
 * @returns {'scaffold'|'peer'|'differentiate'|'tool'|'assess'|null}
 */
export function recommendedStrategy(
  next,
  { hasPeer = false, targetBloomIndex = null, objectiveTags } = {}
) {
  if (!next) return null;
  const loMastery = next.loMastery ?? 0;
  const prereqAvg = next.prereqAvg ?? 1;
  const bloom = next.bloom ?? null;
  // Tech integration: a concrete tool match beats the generic default. When
  // resolver returns a tool, prefer 'tool'; otherwise fall through to the
  // differentiation default (safest fallback per REQ-TTR-2/TTR-3).
  if (Array.isArray(objectiveTags) && objectiveTags.length > 0 && bloom != null) {
    if (resolveTool(bloom, objectiveTags)) {
      return 'tool';
    }
  }
  // Differentiation: learner is already operating at (or above) their Bloom
  // ceiling → suggest advancing the ceiling rather than piling on more of the
  // same depth.
  if (bloom != null && targetBloomIndex != null && bloom >= targetBloomIndex) {
    return 'differentiate';
  }
  // Differentiation: nothing is left inside the learner's depth range this
  // session → suggest adjusting the target upward.
  if (loMastery === 0 && prereqAvg >= 0.8) return 'scaffold';
  if (loMastery > 0.6 && loMastery < 0.8) return 'assess';
  if (hasPeer) return 'peer';
  return 'differentiate';
}

/**
 * Produce the `toolRecommendation` sub-object for a ZPD next objective when
 * the strategy resolves to `tool`. Returns null when no tool matches.
 *
 * @param {{bloom?:number}|null} next
 * @param {string[]|undefined} [objectiveTags]
 * @returns {{toolId:string, toolType:string, launchUrl:string, rationale:string}|null}
 */
export function recommendedTool(next, objectiveTags) {
  if (!next || next.bloom == null) return null;
  return resolveTool(next.bloom, objectiveTags);
}

/**
 * Upsert a learner's mastery record for one objective.
 *
 * @param {string|number} userId
 * @param {string} objectiveSlug
 * @param {{mastery?:number, bloomLevel?:string|number, source?:string}} data
 * @returns {Promise<{mastery:number, bloomsMaxReached:number}|null>} null if the objective doesn't exist
 */
export async function upsertObjectiveState(
  userId,
  objectiveSlug,
  { mastery = 0, bloomLevel, source = 'quiz' } = {}
) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const result = await session.run(
      `MATCH (lo:LearningObjective {slug: $objectiveSlug})
       ${subsetMatch('lo')}
       MERGE (s:ObjectiveState {userId: $userId, objectiveSlug: $objectiveSlug})-[:FOR]->(lo)
       ON CREATE SET s.mastery = 0.0, s.bloomsMaxReached = 0,
                     s.lastSeen = datetime(), s.updatedAt = datetime(), s.source = $source
       SET s.mastery = $mastery,
           s.bloomsMaxReached = CASE
             WHEN s.bloomsMaxReached >= $bloomIndex THEN s.bloomsMaxReached
             ELSE $bloomIndex END,
           s.lastSeen = datetime(),
           s.updatedAt = datetime(),
           s.source = $source
       RETURN s.mastery AS mastery, s.bloomsMaxReached AS bloomsMaxReached`,
      {
        userId: String(userId),
        objectiveSlug,
        mastery: Number(mastery) || 0,
        bloomIndex: bloomIndex(bloomLevel),
        source,
      }
    );
    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      mastery: toNumberSafe(r.get('mastery')),
      bloomsMaxReached: toNumberSafe(r.get('bloomsMaxReached')),
    };
  } finally {
    await session.close();
  }
}

/**
 * Count the number of :ObjectiveState records for a user.
 * Used by cold-start detection (formative-assessment 2.1): if a user has zero
 * objective states, the route layer can seed them from historical signals.
 */
export async function countObjectiveStates(userId) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const result = await session.run(
      `MATCH (s:ObjectiveState {userId: $userId})
       RETURN count(s) AS total`,
      { userId: String(userId) }
    );
    return toNumberSafe(result.records[0]?.get('total')) ?? 0;
  } finally {
    await session.close();
  }
}

/**
 * Map a curricular-proximity level to a distance ∈ [0, 1] used by the peer
 * match score (peer-collaboration PC-2). Lower = closer curricular position.
 *
 * @param {'same-objective'|'same-subtopic'|'same-topic'|'cross-topic'|string} level
 * @returns {number}
 */
export function curricularDistanceMetric(level) {
  switch (level) {
    case 'same-objective':
      return 0;
    case 'same-subtopic':
      return 0.3;
    case 'same-topic':
      return 0.6;
    case 'cross-topic':
    default:
      return 1.0;
  }
}

/**
 * Classify a peer's MKO (more-knowledgeable-other) direction relative to a
 * requesting learner, based on their mastery of each other's next objective
 * versus the upper ZPD threshold θ_high.
 *
 * @param {number} myMastery mastery of the peer's next objective (0–1)
 * @param {number} peerMastery mastery of my next objective (0–1)
 * @param {number} thetaHigh upper ZPD threshold, default ZPD_THRESHOLDS.thetaHigh
 * @returns {'mko-for-you'|'you-are-mko'|'peer'}
 */
export function classifyMKODirection(myMastery, peerMastery, thetaHigh = ZPD_THRESHOLDS.thetaHigh) {
  if (peerMastery >= thetaHigh) return 'mko-for-you';
  if (myMastery >= thetaHigh) return 'you-are-mko';
  return 'peer';
}

/**
 * Compute a peer match score ∈ [0, 1] combining Bloom proximity, curricular
 * proximity and the MKO bonus (peer-collaboration PC-2).
 *
 * Score formula:
 *   1.0 - 0.3·|bloom_A - bloom_B| - 0.2·curricularDistance + 0.2·mkoBonus
 *
 * @param {number} myBloom the requesting learner's nextInZPD Bloom index
 * @param {number} peerBloom the candidate's nextInZPD Bloom index
 * @param {number} curricularDistance ∈ [0,1], see curricularDistanceMetric()
 * @param {0|0.2} mkoBonus 0.2 when one learner is the other's MKO
 * @returns {number}
 */
export function peerMatchScore(myBloom, peerBloom, curricularDistance, mkoBonus = 0) {
  const bloomDelta = Math.abs((Number(myBloom) || 0) - (Number(peerBloom) || 0));
  const dist = Number(curricularDistance) || 0;
  const bonus = Number(mkoBonus) || 0;
  const raw = 1.0 - 0.3 * bloomDelta - 0.2 * dist + 0.2 * bonus;
  return Math.min(1.0, Math.max(0.0, raw));
}

/**
 * Find peer-collaboration candidates whose current learning position (the
 * objective they are working toward, per their :ObjectiveState) overlaps the
 * requesting learner's Zone of Proximal Development (peer-collaboration PC-1).
 *
 * Runs the requesting learner's own nextInZPD, then queries other learners'
 * :ObjectiveState records whose Bloom range (±1 of myNext) overlaps, filters
 * to the same curricular path when `pathSlug` is given, and ranks results by
 * the composite peer match score.
 *
 * @param {string|number} userId
 * @param {string|null} pathSlug - restrict candidates to this Curriculum path
 * @param {{maxCandidates?:number, thresholds?:{thetaHigh:number,thetaLow:number}}} [opts]
 * @returns {Promise<{myNext:object|null, candidates:object[]}>}
 */
export async function findPeerCandidates(
  userId,
  pathSlug = null,
  { maxCandidates = 5, thresholds = ZPD_THRESHOLDS } = {}
) {
  const myNext = await nextObjectiveInZPD(userId, pathSlug, thresholds);
  if (!myNext) {
    return { myNext: null, candidates: [] };
  }

  const myBloom = Number(myNext.bloom) || 3;
  const cap = Math.min(Number(maxCandidates) || 5, 20);
  const bloomLow = Math.max(1, myBloom - 1);
  const bloomHigh = Math.min(6, myBloom + 1);

  const driver = getNeo4jDriver();
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
  });
  try {
    const pathFilter = `($pathSlug IS NULL
            OR EXISTS {
              MATCH (c:Curriculum {slug: $pathSlug})-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(otherLo)
            }
            OR EXISTS {
              MATCH (c:Curriculum {slug: $pathSlug})-[:HAS_TOPIC]->(:Topic)-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(otherLo)
            })`;

    const result = await session.run(
      `MATCH (otherSt:ObjectiveState)-[:FOR]->(otherLo:LearningObjective)
       ${subsetMatch('otherLo')}
       AND ${pathFilter}
       AND otherSt.userId <> $userId
       AND otherSt.mastery <= $thetaLow
       AND otherSt.bloomsMaxReached >= $bloomLow
       AND otherSt.bloomsMaxReached <= $bloomHigh
       RETURN otherSt.userId AS userId,
              otherLo.slug AS objectiveSlug,
              coalesce(otherLo.blooms_index, 3) AS bloom,
              otherSt.mastery AS mastery,
              otherSt.mkoFor AS mkoFor
       ORDER BY abs(coalesce(otherLo.blooms_index, 3) - $myBloom),
                otherSt.mastery DESC
       LIMIT $limit`, // fetch ~2× the cap so a post-filter on curricular distance still yields enough
      {
        userId: String(userId),
        pathSlug: pathSlug || null,
        thetaLow: thresholds.thetaLow,
        bloomLow,
        bloomHigh,
        myBloom,
        limit: cap * 2,
      }
    );

    // When a path is requested, all overlapping candidates already share that
    // path (same topic). Without it, assume cross-topic so a same-Bloom peer is
    // still preferred but we don't overclaim curricular proximity.
    const curricularDistance = pathSlug
      ? curricularDistanceMetric('same-topic')
      : curricularDistanceMetric('cross-topic');

    const candidates = result.records
      .map((r) => {
        const peerBloom = toNumberSafe(r.get('bloom')) ?? myBloom;
        const peerMastery = toNumberSafe(r.get('mastery')) ?? 0;
        const mkoBonus = peerMastery >= thresholds.thetaHigh ? 1 : 0;
        return {
          userId: String(r.get('userId')),
          displayName: null,
          objectiveSlug: r.get('objectiveSlug'),
          bloom: peerBloom,
          mastery: peerMastery,
          loMastery: peerMastery,
          matchScore: peerMatchScore(myBloom, peerBloom, curricularDistance, mkoBonus),
          mkoDirection: classifyMKODirection(0, peerMastery, thresholds.thetaHigh),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, cap);

    return {
      myNext: {
        slug: myNext.slug,
        bloom: myBloom,
      },
      candidates,
    };
  } finally {
    await session.close();
  }
}
