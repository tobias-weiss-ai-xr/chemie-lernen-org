/**
 * mastery-aggregator.js — formative mastery aggregation (public).
 *
 * Turns up to three evidence signals into a single weighted mastery value
 * in [0, 1] for a (learner × LearningObjective) pair:
 *
 *   - quiz results      : percentage scored on topic quizzes
 *   - FSRS cards        : spaced-repetition stability/ease of flash cards
 *   - graded answers    : correctness of recent auto-graded exercise answers
 *
 * This module is intentionally PURE and DB-free. The signal data is passed in
 * as arguments so it never depends on private stores (auth-db.js /
 * assessment-store.js). Missing sources are handled by proportional weight
 * redistribution. Weights are configurable via env vars.
 *
 * Defaults (env-overridable):
 *   MASTERY_WEIGHT_AUTOGRADER = 0.40
 *   MASTERY_WEIGHT_QUIZ       = 0.35
 *   MASTERY_WEIGHT_FSRS       = 0.25
 *
 * Weights are normalised so they always sum to 1.0 over the sources that
 * actually contributed a signal.
 */

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function envWeight(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Read weights from env (with `process` polyfill-friendly guard for tests). */
export function loadWeights() {
  return {
    autoGrader: envWeight('MASTERY_WEIGHT_AUTOGRADER', 0.4),
    quiz: envWeight('MASTERY_WEIGHT_QUIZ', 0.35),
    fsrs: envWeight('MASTERY_WEIGHT_FSRS', 0.25),
  };
}

/**
 * Map a quiz percentage or raw score to [0, 1].
 * Accepts either a 0–100 percentage (e.g. 85) or an object {score, total}.
 * Returns null when there is no usable evidence.
 */
export function quizSignal(quizResults, topic, objectiveSlug) {
  const list = Array.isArray(quizResults) ? quizResults : [];
  // Prefer exact objective-level rows, then fall back to topic rows.
  const rows = list.filter(
    (r) =>
      r &&
      (objectiveSlug == null && topic == null
        ? true
        : (objectiveSlug != null && r.objectiveSlug === objectiveSlug) ||
          (r.topic && topic && String(r.topic).toLowerCase() === String(topic).toLowerCase()))
  );
  if (rows.length === 0) return null;
  const nums = rows
    .map((r) => {
      if (r && typeof r.percentage === 'number') return r.percentage / 100;
      if (r && typeof r.score === 'number' && Number(r.total) > 0) {
        return r.score / Number(r.total);
      }
      return null;
    })
    .filter((n) => n !== null && Number.isFinite(n));
  if (nums.length === 0) return null;
  return clamp01(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * Map FSRS card stability/ease to [0, 1].
 * stability is in days; higher stability => stronger memory. ease ≈ 2–3.
 * Uses recency-weighted average of stability, scaled to [0,1] via an
 * asymptote (stability/(stability + convenience constant)).
 */
export function fsrsSignal(fsrsCards, topicId) {
  const list = Array.isArray(fsrsCards) ? fsrsCards : [];
  const rows = list.filter(
    (c) => c && (topicId == null || c.topicId === topicId || c.topic === topicId)
  );
  if (rows.length === 0) return null;
  const vals = rows
    .map((c) => {
      if (typeof c.stability === 'number' && Number.isFinite(c.stability) && c.stability > 0) {
        // stability is in days -> asymptotic map: 0d=>0, ~7d=>0.5, 30d=>~0.81.
        return c.stability / (c.stability + 7);
      }
      if (typeof c.ease === 'number' && Number.isFinite(c.ease)) {
        // ease 1.3 (hard) .. 3.0 (easy) -> [0,1]
        return clamp01((c.ease - 1.3) / 1.7);
      }
      return null;
    })
    .filter((n) => n !== null);
  if (vals.length === 0) return null;
  return clamp01(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * Map recent graded answers to [0,1] — average correctness over the newest
 * up-to-GRADED_WINDOW answers for the given objective slug.
 */
export function autoGraderSignal(gradedAnswers, loSlug) {
  const list = Array.isArray(gradedAnswers) ? gradedAnswers : [];
  const rows = list.filter(
    (g) =>
      g &&
      (loSlug == null ||
        (g.learningObjectiveSlugs && g.learningObjectiveSlugs.includes(loSlug)) ||
        g.learningObjectiveSlug === loSlug ||
        g.objectiveSlug === loSlug)
  );
  if (rows.length === 0) return null;
  const evaluated = rows
    .map((g) => (typeof g.correct === 'boolean' ? (g.correct ? 1 : 0) : null))
    .filter((n) => n !== null);
  if (evaluated.length === 0) return null;
  return clamp01(evaluated.reduce((a, b) => a + b, 0) / evaluated.length);
}

/**
 * Redistribute weights after removing missing (null) sources.
 * Throws if a provided weight is negative; normalises remaining to sum => 1.
 */
function redistributeWeights(sources, weights) {
  const keys = Object.keys(weights).filter((k) => sources[k] !== null && sources[k] !== undefined);
  if (keys.length === 0) return [];
  const rawSum = keys.reduce((a, k) => a + Number(weights[k]) || 0, 0);
  if (!Number.isFinite(rawSum) || rawSum <= 0) {
    // Fall back to equal weights when provided weights are meaningless.
    const w = 1 / keys.length;
    return keys.map((k) => ({ key: k, value: sources[k], weight: w }));
  }
  return keys.map((k) => ({
    key: k,
    value: sources[k],
    weight: clamp01(Number(weights[k]) / rawSum),
  }));
}

/**
 * Aggregate mastery from up to three signal sources.
 *
 * @param {string} userId                 learner id (returned for context)
 * @param {string} objectiveSlug          learning objective slug
 * @param {object} [options]
 * @param {Array|null} [options.quizResults]    quiz result rows
 * @param {Array|null} [options.fsrsCards]      FSRS card rows
 * @param {Array|null} [options.gradedAnswers]  graded answer rows
 * @param {object}   [options.weights]          explicit {autoGrader,quiz,fsrs}
 * @returns {{userId, objectiveSlug, mastery:number|null, sources:{...}, weights:{...}}}
 *          mastery is null when NO source contributed a signal.
 */
export function aggregateMastery(userId, objectiveSlug, options = {}) {
  const {
    quizResults = null,
    fsrsCards = null,
    gradedAnswers = null,
    weights = null,
  } = options || {};
  const wp = weights && typeof weights === 'object' ? { ...weights } : loadWeights();

  // The caller (route layer) is responsible for passing correctly-scoped rows
  // (via mapTopicToObjectives). Here we just aggregate whatever signals arrived.
  const quiz = quizSignal(quizResults);
  const fsrs = fsrsSignal(fsrsCards);
  const grader = autoGraderSignal(gradedAnswers);

  const sources = { quiz, fsrs, autoGrader: grader };
  const used = redistributeWeights(sources, wp);

  if (used.length === 0) {
    return {
      userId,
      objectiveSlug,
      mastery: null,
      sources: { quiz, fsrs, autoGrader: grader },
      weights: { ...wp },
    };
  }

  const mastery = clamp01(used.reduce((sum, s) => sum + s.value * s.weight, 0));
  return {
    userId,
    objectiveSlug,
    mastery,
    sources: { quiz, fsrs, autoGrader: grader },
    weights: { ...wp },
  };
}

/**
 * resolve a quiz topic / FSRS topicId to `:LearningObjective` slugs via the
 * `Topic -> SubTopic -> LearningObjective` (FULFILLS) chain. Uses lazy Neo4j
 * imports so the pure signal helpers stay DB-free in unit tests.
 * Matches the topic by slug *or* normalized title (case-insensitive).
 */
export async function mapTopicToObjectives(topic) {
  if (!topic || typeof topic !== 'string' || topic.trim() === '') return [];
  const [{ getNeo4jDriver, NEO4J_DATABASE }, { subsetMatch }] = await Promise.all([
    import('./neo4j.js'),
    import('../scripts/_neo4j-subset-filter.mjs'),
  ]);
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  try {
    const norm = topic.trim().toLowerCase();
    const result = await session.run(
      `MATCH (t:Topic)
       ${subsetMatch('t')}
       AND (toLower(coalesce(t.title,'')) = $norm OR toLower(coalesce(t.slug,'')) = $norm)
       MATCH (t)-[:HAS_SUBTOPIC]->(:SubTopic)-[:FULFILLS]->(lo:LearningObjective)
       ${subsetMatch('lo')}
       RETURN DISTINCT lo.slug AS slug`,
      { norm }
    );
    return result.records
      .map((r) => r.get('slug'))
      .filter((s) => typeof s === 'string' && s.length > 0);
  } finally {
    await session.close();
  }
}

export default {
  aggregateMastery,
  quizSignal,
  fsrsSignal,
  autoGraderSignal,
  loadWeights,
  mapTopicToObjectives,
};
