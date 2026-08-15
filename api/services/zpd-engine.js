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
 * Compute the next optimal objective for a user: the highest-Bloom objective
 * currently inside the user's Zone of Proximal Development.
 *
 * @param {string|number} userId
 * @param {string|null} pathSlug - restrict to objectives of this Curriculum path
 * @param {{thetaHigh:number, thetaLow:number}} [thresholds]
 * @returns {Promise<{slug:string,bloom:number,description:string,prereqAvg:number,loMastery:number}|null>}
 */
export async function nextObjectiveInZPD(userId, pathSlug = null, thresholds = ZPD_THRESHOLDS) {
  const driver = getNeo4jDriver();
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
  });
  try {
    const result = await session.run(
      `MATCH (lo:LearningObjective)
       ${subsetMatch('lo')}
       AND ($pathSlug IS NULL OR EXISTS {
         MATCH (c:Curriculum {slug: $pathSlug})-[:HAS_TOPIC]->(:Topic)-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo)
       })
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
       RETURN lo.slug AS slug,
              coalesce(lo.blooms_index, 3) AS bloom,
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
      }
    );
    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      slug: r.get('slug'),
      bloom: toNumberSafe(r.get('bloom')),
      description: r.get('description'),
      prereqAvg: toNumberSafe(r.get('prereqAvg')),
      loMastery: toNumberSafe(r.get('loMastery')),
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
 * @param {{loMastery?:number, prereqAvg?:number}|null} next
 * @param {{hasPeer?:boolean}} [opts]
 * @returns {'scaffold'|'peer'|'differentiate'|'tool'|'assess'|null}
 */
export function recommendedStrategy(next, { hasPeer = false } = {}) {
  if (!next) return null;
  const loMastery = next.loMastery ?? 0;
  const prereqAvg = next.prereqAvg ?? 1;
  if (loMastery === 0 && prereqAvg >= 0.8) return 'scaffold';
  if (loMastery > 0.6 && loMastery < 0.8) return 'assess';
  if (hasPeer) return 'peer';
  return 'differentiate';
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
