/**
 * feedback-engine.js — Generates individualized feedback for assessment answers.
 *
 * Produces per-answer feedback referencing the learner's FSRS state,
 * past mistakes, and the specific concepts involved.
 * Also handles teacher override and feedback caching.
 *
 * All content is in German (de-de).
 */

// ── In-memory feedback cache ──────────────────────────────────────────
// Key: `${questionId}::${answer}::${studentLevel}`
// Value: { feedback, createdAt }

const feedbackCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Build a cache key for feedback.
 * @param {string} questionId
 * @param {string} answer
 * @param {string} studentLevel - 'leicht' | 'mittel' | 'schwer'
 * @returns {string}
 */
function cacheKey(questionId, answer, studentLevel, gradeResult) {
  // Cache key derived from the documented (questionId, answer, studentLevel)
  // triplet, refined with the grading outcome so distinct grade results
  // (e.g. 100% vs partial credit) don't collide.
  const outcome = gradeResult ? `${gradeResult.correct}:${gradeResult.score}` : '';
  return `${questionId}::${String(answer).trim().toLowerCase()}::${studentLevel}::${outcome}`;
}

/**
 * Get cached feedback if available and not expired.
 * @param {string} key
 * @returns {object|null}
 */
function getCachedFeedback(key) {
  const entry = feedbackCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    feedbackCache.delete(key);
    return null;
  }
  return entry.feedback;
}

/**
 * Set cached feedback.
 * @param {string} key
 * @param {object} feedback
 */
function setCachedFeedback(key, feedback) {
  feedbackCache.set(key, { feedback, createdAt: Date.now() });
  // Evict oldest entries if cache exceeds 10k items
  if (feedbackCache.size > 10000) {
    const oldest = feedbackCache.entries().next().value;
    if (oldest) feedbackCache.delete(oldest[0]);
  }
}

// ── Concept extraction from MCQ options ───────────────────────────────

/**
 * Common chemistry misconception pairs — maps wrong MCQ choices to the
 * concept the learner likely misunderstood.
 *
 * Key format: `${topicSlug}::${questionId}::${wrongOptionId}`
 */
const MISCONCEPTION_MAP = {
  // Example — will be populated from KG in production
};

/**
 * Try to detect which concept a learner misunderstood from a wrong MCQ answer.
 *
 * @param {object} exercise - { id, type, options, correctAnswer, learningObjective }
 * @param {string} userAnswer - The option ID the learner chose
 * @returns {Array<{slug: string, label: string}>} Identified concept links
 */
function detectMisconception(exercise, userAnswer) {
  if (exercise.type !== 'mcq' || !exercise.options) return [];

  const correctOption = (exercise.options || []).find(
    (o) => String(o.id).toUpperCase() === String(exercise.correctAnswer).trim().toUpperCase()
  );
  const chosenOption = (exercise.options || []).find(
    (o) => String(o.id).toUpperCase() === String(userAnswer).trim().toUpperCase()
  );

  if (!correctOption || !chosenOption || chosenOption.id === correctOption.id) return [];

  // Check misconception map
  const key = `${exercise.learningObjective?.slug || ''}::${exercise.id}::${String(userAnswer).toUpperCase()}`;
  const mapped = MISCONCEPTION_MAP[key];
  if (mapped) return [mapped];

  // Fallback: return a generic concept link based on the topic
  const topicSlug = exercise.learningObjective?.slug || '';
  return [{ slug: topicSlug, label: exercise.learningObjective?.title || topicSlug }];
}

// ── Study recommendation ──────────────────────────────────────────────

/**
 * Generate a study recommendation based on score and FSRS stability.
 *
 * @param {number} score - 0-100
 * @param {number|null} fsrsStability - FSRS stability in days (null if unknown)
 * @param {string} topicTitle - Human-readable topic name
 * @returns {string} Recommendation text
 */
export function generateStudyRecommendation(score, fsrsStability, topicTitle) {
  if (score >= 80) {
    return `Gut gemacht zum Thema "${topicTitle}". Ihre Stabilität für dieses Konzept ist stark. Versuchen Sie die nächste Schwierigkeitsstufe.`;
  }

  let recommendation = `Wiederholen Sie das Thema "${topicTitle}".`;

  if (fsrsStability !== null && fsrsStability < 7) {
    recommendation += ` Ihre Stabilität für dieses Konzept ist niedrig (${Math.round(fsrsStability)} Tage).`;
  }

  if (score < 40) {
    recommendation += ' Beginnen Sie mit den Grundlagen und arbeiten Sie sich schrittweise vor.';
  } else if (score < 60) {
    recommendation +=
      ' Konzentrieren Sie sich auf die Konzepte, die Sie noch nicht sicher beherrschen.';
  } else {
    recommendation += ' Ein gezieltes Wiederholen der offenen Punkte wird empfohlen.';
  }

  return recommendation;
}

// ── Main feedback generation ──────────────────────────────────────────

/**
 * Generate individualized feedback for a graded answer.
 *
 * @param {object} params
 * @param {object} params.exercise - The exercise object (from generate/grade cycle)
 * @param {string|number} params.userAnswer - The student's answer
 * @param {{ correct: boolean, score: number, gradedBy: string }} params.gradeResult - From auto-grader
 * @param {object} [params.fsrsContext] - { stability: number, difficulty: number } (optional)
 * @param {string} [params.studentLevel='mittel'] - 'leicht' | 'mittel' | 'schwer'
 * @returns {Promise<{ summary: string, detailedExplanation: string, conceptLinks: Array<{slug: string, label: string}>, studyRecommendation: string, aiGenerated: boolean }>}
 */
export async function generateFeedback({
  exercise,
  userAnswer,
  gradeResult,
  fsrsContext,
  studentLevel,
}) {
  const key = cacheKey(exercise.id, String(userAnswer), studentLevel || 'mittel', gradeResult);
  const cached = getCachedFeedback(key);
  if (cached) {
    return { ...cached, aiGenerated: true };
  }

  const score = gradeResult.score || 0;
  const correct = gradeResult.correct || false;
  const topicTitle = exercise.learningObjective?.title || exercise.topic || '';

  // Detect misconceptions
  const conceptLinks = detectMisconception(exercise, String(userAnswer));

  // Build feedback text based on correctness
  let summary;
  let detailedExplanation;

  if (correct) {
    if (score === 100) {
      summary = 'Richtig!';
      detailedExplanation = `Ihre Antwort ist korrekt. ${exercise.explanation || ''}`.trim();
    } else {
      summary = `Teilweise richtig (${score}%).`;
      detailedExplanation = exercise.explanation
        ? `Teilweise richtig. ${exercise.explanation}`
        : 'Ihre Antwort ist teilweise korrekt.';
    }
  } else {
    summary = `Leider nicht richtig.`;
    detailedExplanation = exercise.explanation
      ? `Die richtige Antwort: ${exercise.explanation}`
      : `Die richtige Antwort ist "${exercise.correctAnswer || ''}".`;

    if (conceptLinks.length > 0) {
      const concepts = conceptLinks.map((c) => c.label).join(', ');
      detailedExplanation += ` Mögliche Verwechslung bei: ${concepts}.`;
    }
  }

  // Generate study recommendation
  const studyRecommendation = generateStudyRecommendation(
    score,
    fsrsContext?.stability ?? null,
    topicTitle
  );

  // Add AI disclaimer
  const aiGenerated = true;
  if (aiGenerated) {
    detailedExplanation += '\n\n*KI-generiert — bitte mit Lehrenden besprechen.*';
  }

  const feedback = {
    summary,
    detailedExplanation,
    conceptLinks:
      conceptLinks.length > 0
        ? conceptLinks
        : [{ slug: exercise.learningObjective?.slug || '', label: topicTitle }],
    studyRecommendation,
    aiGenerated,
  };

  setCachedFeedback(key, feedback);

  return feedback;
}

/**
 * Override feedback with teacher's annotation.
 *
 * @param {object} originalFeedback - The feedback object from generateFeedback()
 * @param {string} teacherNote - The teacher's override text
 * @returns {object} Updated feedback with teacher override markers
 */
export function applyTeacherOverride(originalFeedback, teacherNote) {
  return {
    ...originalFeedback,
    summary: 'Lehrkraft-Kommentar:',
    detailedExplanation: teacherNote,
    studyRecommendation: originalFeedback.studyRecommendation,
    aiGenerated: false,
    teacherOverride: true,
  };
}

// ── Cache management ───────────────────────────────────────────────────

/**
 * Clear all cached feedback (useful for testing or cache invalidation).
 */
export function clearFeedbackCache() {
  feedbackCache.clear();
}

/**
 * Get current cache size.
 * @returns {number}
 */
export function getFeedbackCacheSize() {
  return feedbackCache.size;
}
