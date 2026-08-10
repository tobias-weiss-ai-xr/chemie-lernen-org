/**
 * learning-engine.js — Learning paths & gamification engine for chemie-lernen.org
 *
 * Manages learning path definitions, enrollment, progress tracking,
 * XP system, achievements/badges, daily check-in streaks, and
 * PDF certificate generation.
 *
 * All user-facing strings are in German (de-de).
 */

// ── Achievement definitions ───────────────────────────────────
const ACHIEVEMENTS = [
  {
    id: 'first-steps',
    title: 'Erste Schritte',
    description: 'Sammle 50 XP',
    icon: '🎯',
    condition: { type: 'xp', threshold: 50 },
  },
  {
    id: 'fleissig',
    title: 'Fleißig',
    description: 'Sammle 500 XP',
    icon: '🔥',
    condition: { type: 'xp', threshold: 500 },
  },
  {
    id: 'chemie-experte',
    title: 'Chemie-Experte',
    description: 'Sammle 2000 XP',
    icon: '🧪',
    condition: { type: 'xp', threshold: 2000 },
  },
  {
    id: 'lernpfad-abgeschlossen',
    title: 'Lernpfad abgeschlossen',
    description: 'Schließe einen Lernpfad ab',
    icon: '🏆',
    condition: { type: 'pathCompleted', threshold: 1 },
  },
  {
    id: 'serien-check-in',
    title: '7 Tage Serie',
    description: 'Checke 7 Tage in Folge ein',
    icon: '📅',
    condition: { type: 'streak', threshold: 7 },
  },
  {
    id: 'quiz-meister',
    title: 'Quiz-Meister',
    description: 'Bestehe 10 Quizze mit 80%+',
    icon: '📝',
    condition: { type: 'quizzesPassed', threshold: 10 },
  },
  {
    id: 'aufgaben-loeser',
    title: 'Aufgaben-Löser',
    description: 'Löse 25 Übungsaufgaben',
    icon: '✏️',
    condition: { type: 'exercisesCompleted', threshold: 25 },
  },
];

// ── XP constants ──────────────────────────────────────────────
const XP = {
  ARTICLE_READ: 10,
  QUIZ_PASSED: 25,
  EXERCISE_COMPLETED: 15,
  CHECK_IN: 5,
  STREAK_BONUS_7: 5,
  STREAK_BONUS_30: 10,
};

// ── Helper: read/write user progress in session store ─────────

function getProgress(sessionStore, userId) {
  const session = sessionStore.getSession(userId);
  if (!session.progress) {
    session.progress = {};
  }
  // Fill any missing sub-fields so consumers (addXpEntry's xpHistory.unshift,
  // badge counters, streak logic) never crash on partially initialized
  // progress (e.g. restored from disk or created by other flows).
  const p = session.progress;
  p.xp = p.xp || 0;
  p.xpHistory = p.xpHistory || [];
  p.earnedBadges = p.earnedBadges || [];
  p.paths = p.paths || {};
  p.streak = p.streak || 0;
  p.lastCheckIn = p.lastCheckIn || null;
  p.uniqueArticlesToday = p.uniqueArticlesToday || [];
  p.quizzesPassed = p.quizzesPassed || 0;
  p.exercisesCompleted = p.exercisesCompleted || 0;
  return p;
}

// ── Learning Path Queries ─────────────────────────────────────

/**
 * Fetch all learning paths from Neo4j with optional user progress.
 */
export async function listPaths(neo4jDriver, sessionStore, userId) {
  const session = neo4jDriver.session({ database: 'chemie' });
  try {
    const result = await session.run(
      `MATCH (lp:LearningPath)
       OPTIONAL MATCH (lp)-[:HAS_TOPIC]->(t:Topic)
       RETURN lp.slug AS slug, lp.title AS title, lp.description AS description,
              lp.color AS color, lp.icon AS icon, lp.estimatedHours AS estimatedHours,
              count(DISTINCT t) AS topicCount
       ORDER BY lp.title`
    );

    const progress = userId ? getProgress(sessionStore, userId) : null;

    return result.records.map((rec) => {
      const slug = rec.get('slug');
      const pathProgress = progress && progress.paths ? progress.paths[slug] : null;
      return {
        slug,
        title: rec.get('title'),
        description: rec.get('description'),
        color: rec.get('color'),
        icon: rec.get('icon'),
        estimatedHours: rec.get('estimatedHours'),
        topicCount: rec.get('topicCount').toNumber(),
        enrolled: !!pathProgress,
        progressPercent: pathProgress ? pathProgress.progressPercent || 0 : 0,
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Fetch a single learning path detail with topic tree from Neo4j.
 */
export async function getPathDetail(neo4jDriver, slug, sessionStore, userId) {
  const session = neo4jDriver.session({ database: 'chemie' });
  try {
    const pathResult = await session.run(
      `MATCH (lp:LearningPath {slug: $slug})
       OPTIONAL MATCH (lp)-[r:HAS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       RETURN lp.title AS title, lp.description AS description,
              lp.color AS color, lp.icon AS icon, lp.estimatedHours AS estimatedHours,
              t.title AS topicTitle, t.slug AS topicSlug, r.order AS topicOrder,
              lo.text AS loText, lo.slug AS loSlug
       ORDER BY r.order, lo.text`,
      { slug }
    );

    if (pathResult.records.length === 0) return null;

    const first = pathResult.records[0];
    const base = {
      slug,
      title: first.get('title'),
      description: first.get('description'),
      color: first.get('color'),
      icon: first.get('icon'),
      estimatedHours: first.get('estimatedHours'),
      topics: [],
    };

    const progress = userId ? getProgress(sessionStore, userId) : null;
    const pathProgress = progress && progress.paths ? progress.paths[slug] : null;
    const completedLos = new Set(pathProgress ? pathProgress.completedLos || [] : []);

    const topicMap = new Map();
    for (const rec of pathResult.records) {
      const topicSlug = rec.get('topicSlug');
      if (!topicSlug) continue;

      if (!topicMap.has(topicSlug)) {
        topicMap.set(topicSlug, {
          slug: topicSlug,
          title: rec.get('topicTitle'),
          order: rec.get('topicOrder') ? rec.get('topicOrder').toNumber() : 0,
          completed: false,
          learningObjectives: [],
        });
      }

      const loSlug = rec.get('loSlug');
      if (loSlug) {
        const entry = topicMap.get(topicSlug);
        entry.learningObjectives.push({
          slug: loSlug,
          text: rec.get('loText'),
          completed: completedLos.has(loSlug),
        });
      }
    }

    base.topics = Array.from(topicMap.values());
    base.enrolled = !!pathProgress;
    base.progressPercent = pathProgress ? pathProgress.progressPercent || 0 : 0;

    return base;
  } finally {
    await session.close();
  }
}

// ── Enrollment ────────────────────────────────────────────────

/**
 * Enroll a user in a learning path (idempotent).
 */
export function enrollInPath(sessionStore, userId, pathSlug) {
  const progress = getProgress(sessionStore, userId);
  if (!progress.paths) progress.paths = {};

  if (progress.paths[pathSlug]) {
    return { enrolled: true, enrolledAt: progress.paths[pathSlug].enrolledAt };
  }

  progress.paths[pathSlug] = {
    enrolledAt: new Date().toISOString(),
    completedLos: [],
    progressPercent: 0,
  };

  return { enrolled: true, enrolledAt: progress.paths[pathSlug].enrolledAt };
}

// ── Progress Tracking ─────────────────────────────────────────

/**
 * Mark a learning objective as completed and recalculate progress.
 * Call this when a user reads an article, passes a quiz, or completes an exercise
 * related to a specific learning objective.
 */
export function getAggregatedProgress(sessionStore, userId) {
  const progress = getProgress(sessionStore, userId);
  const paths = progress.paths || {};
  const pathList = Object.entries(paths).map(([slug, data]) => ({
    slug,
    progressPercent: data.progressPercent || 0,
    completedObjectives: (data.completedLos || []).length,
    totalObjectives: data.totalObjectives || 0,
    completedAt: data.completedAt || null,
  }));

  return {
    totalXp: progress.xp || 0,
    streakDays: progress.streak || 0,
    paths: pathList,
  };
}

// ── XP System ─────────────────────────────────────────────────

function addXpEntry(sessionStore, userId, amount, action, metadata) {
  const progress = getProgress(sessionStore, userId);
  progress.xp = (progress.xp || 0) + amount;
  progress.xpHistory.unshift({
    action,
    amount,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  });
  if (progress.xpHistory.length > 200) progress.xpHistory.length = 200;
  return progress.xp;
}

/**
 * Award XP for reading an article.
 */
export function awardExerciseXp(sessionStore, userId, exerciseId, score) {
  const progress = getProgress(sessionStore, userId);
  const newTotal = addXpEntry(sessionStore, userId, XP.EXERCISE_COMPLETED, 'exercise_completed', {
    exerciseId,
    score,
  });
  progress.exercisesCompleted = (progress.exercisesCompleted || 0) + 1;
  return newTotal;
}

// ── Achievements / Badges ─────────────────────────────────────

/**
 * Evaluate and earn any newly unlocked badges.
 * Call this after any XP change or check-in.
 */
export function evaluateBadges(sessionStore, userId) {
  const progress = getProgress(sessionStore, userId);
  const earned = new Set(progress.earnedBadges || []);

  const counters = {
    xp: progress.xp || 0,
    streak: progress.streak || 0,
    pathCompleted: Object.values(progress.paths || {}).filter((p) => p.completedAt).length,
    quizzesPassed: progress.quizzesPassed || 0,
    exercisesCompleted: progress.exercisesCompleted || 0,
  };

  const newlyEarned = [];

  for (const badge of ACHIEVEMENTS) {
    if (earned.has(badge.id)) continue;

    const cond = badge.condition;
    let qualifies = false;

    switch (cond.type) {
      case 'xp':
        qualifies = counters.xp >= cond.threshold;
        break;
      case 'streak':
        qualifies = counters.streak >= cond.threshold;
        break;
      case 'pathCompleted':
        qualifies = counters.pathCompleted >= cond.threshold;
        break;
      case 'quizzesPassed':
        qualifies = counters.quizzesPassed >= cond.threshold;
        break;
      case 'exercisesCompleted':
        qualifies = counters.exercisesCompleted >= cond.threshold;
        break;
    }

    if (qualifies) {
      earned.add(badge.id);
      progress.earnedBadges.push(badge.id);
      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}

/**
 * Get all achievements with earned status for a user.
 */
export function getAchievements(sessionStore, userId) {
  const progress = getProgress(sessionStore, userId);
  const earnedSet = new Set(progress.earnedBadges || []);

  const badges = ACHIEVEMENTS.map((badge) => ({
    id: badge.id,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    earned: earnedSet.has(badge.id),
  }));

  return {
    badges,
    totalXp: progress.xp || 0,
    streak: progress.streak || 0,
    xpHistory: (progress.xpHistory || []).slice(0, 50),
  };
}

export { ACHIEVEMENTS, XP };
