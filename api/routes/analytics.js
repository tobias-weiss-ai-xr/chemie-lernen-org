/**
 * Teacher Analytics route handlers — premium-gated analytics dashboard.
 *
 * Routes (all require premium):
 *   GET /api/analytics/class-overview
 *   GET /api/analytics/students
 *   GET /api/analytics/topic-breakdown
 *   GET /api/analytics/export
 *   GET /api/analytics/engagement-timeline
 */

import { Router } from 'express';
import pino from 'pino';
import { requirePremium } from '../auth.js';
import {
  getAllUsersDetailed,
  getClassOverview,
  getClassTopicBreakdown,
  getEngagementTimeline,
} from '../auth-db.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// ── Class Overview ────────────────────────────────────────────

/**
 * GET /api/analytics/class-overview
 * Returns aggregate class statistics.
 */
router.get('/api/analytics/class-overview', requirePremium, async (_req, res) => {
  try {
    const overview = getClassOverview();
    const timeline = getEngagementTimeline(12);
    res.json({ ...overview, weeklyActiveUsers: timeline });
  } catch (err) {
    logger.error('[analytics] class-overview error:', err.message);
    res.status(500).json({ error: 'Klassenübersicht konnte nicht geladen werden' });
  }
});

// ── Student List (paginated, sortable, searchable) ──────────

/** @type {Set<string>} Allowed sort fields */
const SORT_FIELDS = new Set([
  'xp',
  'name',
  'level',
  'streak',
  'avgQuizScore',
  'lastActive',
  'created_at',
]);

/**
 * GET /api/analytics/students?sort=xp&order=desc&limit=50&offset=0&search=max
 */
router.get('/api/analytics/students', requirePremium, async (req, res) => {
  try {
    const { sort = 'xp', order = 'desc', limit = 50, offset = 0, search = '' } = req.query;

    // Validate params
    const safeSort = SORT_FIELDS.has(sort) ? sort : 'xp';
    const safeOrder = order === 'asc' ? 'asc' : 'desc';
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    const safeOffset = Math.max(0, Number(offset) || 0);

    let students = getAllUsersDetailed();

    // Search filter (case-insensitive name substring)
    if (search) {
      const q = search.toLowerCase();
      students = students.filter((u) => (u.name || '').toLowerCase().includes(q));
    }

    // Enrich each student with computed fields
    students = students.map((u) => {
      const g = u.gamification || {};
      const quizzes = u.quiz_results || [];
      const quizCount = quizzes.length;
      const avgQuizScore =
        quizCount > 0
          ? parseFloat(
              (quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizCount).toFixed(1)
            )
          : 0;

      // Last active = most recent quiz or xpLog entry
      const lastXp = (g.xpLog || []).reduce((latest, e) => {
        const t = e.timestamp ? new Date(e.timestamp).getTime() : 0;
        return t > latest ? t : latest;
      }, 0);
      const lastQuiz = quizzes.reduce((latest, q) => {
        const t = q.completedAt ? new Date(q.completedAt).getTime() : 0;
        return t > latest ? t : latest;
      }, 0);
      const lastActive = new Date(Math.max(lastXp, lastQuiz)).toISOString();

      // Topics explored (unique quiz topics + completed objectives slugs)
      const topicsExplored = [...new Set(quizzes.map((q) => q.topic).filter(Boolean))];

      return {
        id: u.id,
        name: u.name || 'Unbekannt',
        email: u.email,
        xp: g.xp || 0,
        level: typeof g.xp === 'number' && g.xp > 0 ? calculateLevelLocal(g.xp).level : 0,
        streak: g.streak || 0,
        lastActive: lastActive !== '1970-01-01T00:00:00.000Z' ? lastActive : null,
        quizCount,
        avgQuizScore,
        completedObjectives: (g.completedObjectives || []).length,
        topicsExplored,
      };
    });

    // Sort
    const dir = safeOrder === 'asc' ? 1 : -1;
    students.sort((a, b) => {
      const aVal = a[safeSort];
      const bVal = b[safeSort];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return dir * aVal.localeCompare(bVal, 'de');
      }
      return dir * ((aVal || 0) - (bVal || 0));
    });

    const total = students.length;
    const paged = students.slice(safeOffset, safeOffset + safeLimit);

    res.json({ students: paged, total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    logger.error('[analytics] students error:', err.message);
    res.status(500).json({ error: 'Schülerliste konnte nicht geladen werden' });
  }
});

/** Inline calculateLevel for student enrichment (avoids importing gamification module) */
function calculateLevelLocal(xp) {
  return { level: Math.floor(xp / 500), xp };
}

// ── Topic Breakdown ─────────────────────────────────────────

/**
 * GET /api/analytics/topic-breakdown
 * Returns class-wide quiz performance per topic with weak area detection.
 */
router.get('/api/analytics/topic-breakdown', requirePremium, async (_req, res) => {
  try {
    const breakdown = getClassTopicBreakdown();
    res.json(breakdown);
  } catch (err) {
    logger.error('[analytics] topic-breakdown error:', err.message);
    res.status(500).json({ error: 'Themenanalyse konnte nicht geladen werden' });
  }
});

// ── CSV Export ────────────────────────────────────────────────

/**
 * GET /api/analytics/export?format=csv
 * Returns student progress data as downloadable CSV.
 */
router.get('/api/analytics/export', requirePremium, async (_req, res) => {
  try {
    const students = getAllUsersDetailed();

    const rows = [
      [
        'Name',
        'E-Mail',
        'XP',
        'Level',
        'Streak',
        'Quiz-Anzahl',
        'Quiz-Durchschnitt',
        'Letzte Aktivität',
      ],
    ];

    for (const u of students) {
      const g = u.gamification || {};
      const quizzes = u.quiz_results || [];
      const quizCount = quizzes.length;
      const avgScore =
        quizCount > 0
          ? (quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizCount).toFixed(1)
          : '0.0';

      // Last active
      const lastXp = (g.xpLog || []).reduce((latest, e) => {
        const t = e.timestamp ? new Date(e.timestamp).getTime() : 0;
        return t > latest ? t : latest;
      }, 0);
      const lastQuiz = quizzes.reduce((latest, q) => {
        const t = q.completedAt ? new Date(q.completedAt).getTime() : 0;
        return t > latest ? t : latest;
      }, 0);
      const lastActive = new Date(Math.max(lastXp, lastQuiz));
      const lastActiveStr =
        lastActive.getTime() > 0 ? lastActive.toISOString().slice(0, 10) : 'Nie';

      const level = typeof g.xp === 'number' && g.xp > 0 ? calculateLevelLocal(g.xp).level : 0;

      rows.push([
        u.name || 'Unbekannt',
        u.email,
        String(g.xp || 0),
        String(level),
        String(g.streak || 0),
        String(quizCount),
        avgScore,
        lastActiveStr,
      ]);
    }

    // Proper CSV with quoting and BOM for Excel
    const csvContent =
      '\uFEFF' +
      rows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="klassenfortschritt-export.csv"');
    res.send(csvContent);
  } catch (err) {
    logger.error('[analytics] export error:', err.message);
    res.status(500).json({ error: 'Export fehlgeschlagen' });
  }
});

// ── Engagement Timeline ──────────────────────────────────────

/**
 * GET /api/analytics/engagement-timeline?weeks=12
 * Returns weekly active user counts for the last N weeks.
 */
router.get('/api/analytics/engagement-timeline', requirePremium, async (req, res) => {
  try {
    const weeks = Number(req.query.weeks) || 12;
    const timeline = getEngagementTimeline(weeks);
    res.json({ timeline });
  } catch (err) {
    logger.error('[analytics] engagement-timeline error:', err.message);
    res.status(500).json({ error: 'Aktivitätsverlauf konnte nicht geladen werden' });
  }
});

export default router;
