/**
 * Adaptive learning route handlers — evidence-based personalization.
 *
 * Research basis (4,495 papers on adaptive learning): the optimal
 * challenge point for long-term learning is a success rate of
 * 70–80%. Below that, the task is too hard (frustration, cognitive
 * overload); above that, too easy (no learning gain).
 *
 * GET /api/adaptive/recommendations
 *   → per-topic difficulty recommendation based on quiz history:
 *     - <70% recent accuracy  → recommend 'leicht' (easier)
 *     - 70–85%                → 'mittel' (keep current)
 *     - >85%                  → 'schwer' (more challenge)
 *   Anonymous users receive a neutral default.
 *
 * GET /api/adaptive/recommendations/:topic
 *   → single-topic recommendation.
 */

import { Router } from 'express';
import { getQuizResults } from '../auth-db.js';

const logger = {
  info: (...args) => console.log('[adaptive]', ...args),
  error: (...args) => console.error('[adaptive]', ...args),
  warn: (...args) => console.warn('[adaptive]', ...args),
};

const router = Router();

const DIFFICULTY_LEVELS = ['leicht', 'mittel', 'schwer'];

/** Map accuracy to recommended difficulty (70–80% sweet spot). */
function accuracyToDifficulty(accuracy) {
  if (accuracy < 0.7) return 'leicht';
  if (accuracy > 0.85) return 'schwer';
  return 'mittel';
}

/** Compute recommendation from a list of quiz results for one topic. */
function recommendForTopic(results) {
  if (!results || results.length === 0) {
    return {
      difficulty: 'mittel',
      accuracy: null,
      sampleSize: 0,
      trend: 'neutral',
      reason: 'Noch keine Ergebnisse für dieses Thema',
    };
  }

  // Weight recent results more (recency weighting).
  const recent = results.slice(-8);
  const weights = recent.map((r, i) => 1 + i * 0.25); // later results weigh more
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < recent.length; i++) {
    const pct = typeof recent[i].percentage === 'number' ? recent[i].percentage : 0;
    weightedSum += pct * weights[i];
    weightTotal += weights[i];
  }
  const accuracy = weightedSum / weightTotal / 100;

  // Trend: compare first half vs second half of recent results.
  let trend = 'neutral';
  if (recent.length >= 4) {
    const half = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, half).reduce((s, r) => s + (r.percentage || 0), 0) / half;
    const secondHalf =
      recent.slice(half).reduce((s, r) => s + (r.percentage || 0), 0) / recent.slice(half).length;
    if (secondHalf - firstHalf > 8) trend = 'improving';
    else if (firstHalf - secondHalf > 8) trend = 'declining';
  }

  const difficulty = accuracyToDifficulty(accuracy);

  const reasons = {
    leicht:
      'Deine letzten Ergebnisse lagen unter 70% — wir empfehlen, das Thema zu wiederholen oder leichtere Übungen zu wählen.',
    mittel: 'Deine Trefferquote liegt im optimalen Lernbereich (70–85%) — weiter so!',
    schwer:
      'Stark! Deine Trefferquote liegt über 85% — fordere dich mit schwereren Übungen heraus.',
  };

  return {
    difficulty,
    accuracy: Math.round(accuracy * 100),
    sampleSize: recent.length,
    trend,
    reason: reasons[difficulty],
  };
}

/** Map quiz topic name → recommendation key. */
function topicKey(topic) {
  return String(topic || 'allgemein')
    .toLowerCase()
    .trim();
}

router.get('/api/adaptive/recommendations', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      // Anonymous: neutral defaults for all known topics.
      return res.json({
        authenticated: false,
        defaultDifficulty: 'mittel',
        topics: {},
      });
    }

    const results = getQuizResults(req.user.id) || [];
    const byTopic = {};
    for (const r of results) {
      const key = topicKey(r.topic);
      if (!byTopic[key]) byTopic[key] = [];
      byTopic[key].push(r);
    }

    const topics = {};
    for (const [key, list] of Object.entries(byTopic)) {
      topics[key] = recommendForTopic(list);
    }

    // Overall recommendation across all topics.
    const allKeys = Object.keys(topics);
    let overall = {
      difficulty: 'mittel',
      accuracy: null,
      sampleSize: 0,
      trend: 'neutral',
      reason: 'Beantworte Quizfragen, um personalisierte Empfehlungen zu erhalten.',
    };
    if (allKeys.length > 0) {
      const allResults = Object.values(byTopic).flat();
      overall = recommendForTopic(allResults);
      overall.reason =
        overall.difficulty === 'leicht'
          ? 'Übergreifend liegt deine Trefferquote unter 70% — wir empfehlen Wiederholung und leichtere Übungen.'
          : overall.difficulty === 'schwer'
            ? 'Übergreifend liegt deine Trefferquote über 85% — du bist bereit für schwerere Aufgaben!'
            : 'Übergreifend liegst du im optimalen Lernbereich (70–85%) — weiter so!';
    }

    res.json({
      authenticated: true,
      defaultDifficulty: overall.difficulty,
      overall,
      topics,
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[adaptive] recommendations error'
    );
    res.status(500).json({ error: 'Empfehlungen konnten nicht geladen werden' });
  }
});

router.get('/api/adaptive/recommendations/:topic', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.json({
        authenticated: false,
        topic: req.params.topic,
        difficulty: 'mittel',
        accuracy: null,
        sampleSize: 0,
        trend: 'neutral',
      });
    }
    const results = getQuizResults(req.user.id) || [];
    const key = topicKey(req.params.topic);
    const topicResults = results.filter((r) => topicKey(r.topic) === key);
    const rec = recommendForTopic(topicResults);
    res.json({ authenticated: true, topic: req.params.topic, ...rec });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[adaptive] topic recommendation error'
    );
    res.status(500).json({ error: 'Empfehlung konnte nicht geladen werden' });
  }
});

export default router;
export { DIFFICULTY_LEVELS, accuracyToDifficulty, recommendForTopic };
