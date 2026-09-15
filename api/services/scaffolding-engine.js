/**
 * scaffolding-engine.js — Bloom-staircase scaffolding plan engine (public).
 *
 * Produces a "scaffolding plan": a staircase of progressive cognitive steps
 * that bridge a learner's current Bloom level to a target objective's Bloom
 * level. The engine does NOT generate German hint text — that is the private
 * chemie-core's job (LiteLLM prompts). This engine only produces the JSON
 * plan (Bloom levels, verbs, scaffold descriptors, hint types) that the
 * private prompt templates consume.
 *
 * Spec: EG-SCAFFOLD-1, EG-SCAFFOLD-2, LP-SCAFFOLD-1, LP-SCAFFOLD-2.
 *
 * All Cypher is scoped to the chemie subset via subsetMatch().
 */

import neo4j from 'neo4j-driver';
import { getNeo4jDriver, NEO4J_DATABASE, toNumberSafe } from './neo4j.js';
import { subsetMatch } from '../scripts/_neo4j-subset-filter.mjs';

/**
 * Metadata per Bloom index 1–6: level name, German verb label, scaffold
 * descriptor, and the hint type the private feedback-engine uses to select
 * its prompt strategy.
 */
export const BLOOM_METADATA = [
  {
    level: 'remember',
    verb: 'Erinnern',
    descriptor: 'Abruf von Fakten, Definitionen, Formeln',
    hintType: 'direct-recall',
  },
  {
    level: 'understand',
    verb: 'Verstehen',
    descriptor: 'Erklärung in eigenen Worten, Zusammenhänge erkennen',
    hintType: 'analogy',
  },
  {
    level: 'apply',
    verb: 'Anwenden',
    descriptor: 'Transfer auf neues Beispiel, Berechnung durchführen',
    hintType: 'worked-example',
  },
  {
    level: 'analyze',
    verb: 'Analysieren',
    descriptor: 'Struktur zerlegen, Muster erkennen, vergleichen',
    hintType: 'socratic-question',
  },
  {
    level: 'evaluate',
    verb: 'Bewerten',
    descriptor: 'Kritische Bewertung, Argumente abwägen, Stellung nehmen',
    hintType: 'compare-contrast',
  },
  {
    level: 'create',
    verb: 'Erschaffen',
    descriptor: 'Neues Modell entwerfen, Experiment planen, Synthese',
    hintType: 'open-ended-challenge',
  },
];

const MAX_STAIRCASE_STEPS = 5;

/**
 * Normalize a Bloom index to a valid 1–6 integer payload.
 * @param {unknown} value
 * @returns {number|null} normalized integer, or null if invalid/out of range.
 */
function normalizeBloom(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 6) return null;
  return Math.trunc(n);
}

/**
 * Compute the staircase of steps from `bloomsMaxReached + 1` to `targetBloom`.
 * Pure function (no DB access).
 *
 * @param {number|string|undefined} bloomsMaxReached learner's highest reached Bloom level
 * @param {number|string|undefined} targetBloom   the objective's Bloom level
 * @returns {Array<{step:number, bloomIndex:number, level:string, verb:string, descriptor:string, hintType:string}>}
 */
export function computeStaircase(bloomsMaxReached, targetBloom) {
  const learner = normalizeBloom(bloomsMaxReached) ?? 0;
  const target = normalizeBloom(targetBloom);
  if (target === null) return [];
  if (learner >= target) return [];

  const steps = [];
  const start = Math.min(learner + 1, target);
  // Truncate to the highest `MAX_STAIRCASE_STEPS` levels up to target.
  const firstLevel = Math.max(start, target - MAX_STAIRCASE_STEPS + 1);
  for (let level = firstLevel; level <= target; level += 1) {
    steps.push({
      step: steps.length + 1,
      bloomIndex: level,
      ...BLOOM_METADATA[level - 1],
    });
  }
  return steps;
}

/**
 * Read the learner's current `bloomsMaxReached` (:ObjectiveState) and the
 * objective's `blooms_index` (:LearningObjective) from Neo4j (chemie subset),
 * then compute the scaffolding plan.
 *
 * @param {string|number} userId
 * @param {string} objectiveSlug
 * @returns {Promise<{objectiveSlug:string, targetBloom:number, learnerBloom:number, staircase:Array, totalSteps:number, gap:number}|null>}
 *   null if the objective doesn't exist, has no blooms_index, or is not in the subset.
 */
export async function scaffoldingPlan(userId, objectiveSlug) {
  const driver = getNeo4jDriver();
  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: neo4j.session.READ,
  });
  try {
    const result = await session.run(
      `MATCH (lo:LearningObjective {slug: $objectiveSlug})
       ${subsetMatch('lo')}
       AND lo.blooms_index IS NOT NULL
       OPTIONAL MATCH (s:ObjectiveState)-[:FOR]->(lo)
         WHERE s.userId = $userId
       RETURN lo.blooms_index AS targetBloom,
              coalesce(s.bloomsMaxReached, 0) AS learnerBloom`,
      { objectiveSlug: String(objectiveSlug), userId: String(userId) }
    );

    if (!result.records || result.records.length === 0) {
      return null;
    }

    const rec = result.records[0];
    const targetBloom = toNumberSafe(rec.get('targetBloom'));
    const learnerBloom = toNumberSafe(rec.get('learnerBloom'));
    if (!Number.isInteger(targetBloom) || targetBloom < 1 || targetBloom > 6) {
      return null;
    }

    const staircase = computeStaircase(learnerBloom, targetBloom);
    return {
      objectiveSlug: String(objectiveSlug),
      targetBloom,
      learnerBloom,
      staircase,
      totalSteps: staircase.length,
      gap: Math.max(0, targetBloom - learnerBloom),
    };
  } finally {
    await session.close();
  }
}
