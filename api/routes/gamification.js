/**
 * Gamification route handlers — extracted from server.js.
 *
 * Routes:
 *   POST /api/check-in
 *   GET  /api/check-in
 *   GET  /api/achievements
 *   POST /api/gamification/xp
 *   POST /api/gamification/checkin
 *   GET  /api/gamification/profile
 *   GET  /api/gamification/badges
 */

import { Router } from 'express';
import pino from 'pino';
import { requireAuth } from '../auth.js';
import {
  getGamification,
  awardXp,
  recordCheckin,
  checkBadgeUnlock,
  getBadgeStatus,
  calculateLevel,
} from '../auth-db.js';
import * as learningEngine from '../learning-engine.js';
import { BADGE_INFO } from '../services/badges.js';
import { sessionStore } from '../services/session.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

router.post('/api/check-in', requireAuth, async (req, res) => {
  try {
    const result = learningEngine.dailyCheckIn(sessionStore, req.user.id);
    learningEngine.evaluateBadges(sessionStore, req.user.id);
    res.json(result);
  } catch (err) {
    logger.error('[check-in] error:', err.message);
    res.status(500).json({ error: 'Check-in fehlgeschlagen' });
  }
});

router.get('/api/check-in', requireAuth, async (req, res) => {
  try {
    const status = learningEngine.getCheckInStatus(sessionStore, req.user.id);
    res.json(status);
  } catch (err) {
    logger.error('[check-in] status error:', err.message);
    res.status(500).json({ error: 'Status konnte nicht geladen werden' });
  }
});

router.get('/api/achievements', requireAuth, async (req, res) => {
  try {
    const achievements = learningEngine.getAchievements(sessionStore, req.user.id);
    res.json(achievements);
  } catch (err) {
    logger.error('[achievements] error:', err.message);
    res.status(500).json({ error: 'Errungenschaften konnten nicht geladen werden' });
  }
});

router.post('/api/gamification/xp', requireAuth, async (req, res) => {
  try {
    const { action, topic } = req.body;
    if (
      !action ||
      !['quiz_submit', 'exercise_correct', 'checkin', 'page_visit', 'streak_bonus'].includes(action)
    ) {
      return res.status(400).json({
        error:
          'Ungültige action. Erlaubt: quiz_submit, exercise_correct, checkin, page_visit, streak_bonus',
      });
    }

    const XP_VALUES = {
      quiz_submit: 20,
      exercise_correct: 15,
      checkin: 20,
      page_visit: 5,
      streak_bonus: 30,
    };
    const amount = XP_VALUES[action];
    const source = topic ? `${action}: ${topic}` : `Aktion: ${action}`;

    const xpResult = awardXp(req.user.id, amount, source, action);
    const newBadges = checkBadgeUnlock(req.user.id);

    res.json({
      xpAwarded: xpResult.awarded,
      totalXp: xpResult.totalXp,
      level: calculateLevel(xpResult.totalXp),
      newBadges: newBadges.map((b) => ({
        id: b.badgeId,
        name: b.name,
        earnedAt: b.earnedAt,
      })),
    });
  } catch (err) {
    logger.error('[gamification] xp error:', err.message);
    res.status(500).json({ error: 'XP konnte nicht gutgeschrieben werden' });
  }
});

router.post('/api/gamification/checkin', requireAuth, async (req, res) => {
  try {
    const checkinResult = recordCheckin(req.user.id);
    const newBadges = checkBadgeUnlock(req.user.id);

    res.json({
      checkedIn: checkinResult.checkedIn,
      streak: checkinResult.streak,
      xpAwarded: checkinResult.xpEarned,
      totalXp: checkinResult.totalXp,
      level: calculateLevel(checkinResult.totalXp),
      newBadges: newBadges.map((b) => ({
        id: b.badgeId,
        name: b.name,
        earnedAt: b.earnedAt,
      })),
    });
  } catch (err) {
    logger.error('[gamification] checkin error:', err.message);
    res.status(500).json({ error: 'Check-in fehlgeschlagen' });
  }
});

router.get('/api/gamification/profile', requireAuth, async (req, res) => {
  try {
    const g = getGamification(req.user.id);
    if (!g) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

    const level = calculateLevel(g.xp);
    const xpToNextLevel = (level + 1) * 500 - g.xp;

    // Compute xpBreakdown from xpLog
    const xpLog = g.xpLog || [];
    const xpBreakdown = { quiz: 0, exercise: 0, checkin: 0, visit: 0, bonus: 0 };
    for (const entry of xpLog) {
      const amt = entry.amount || 0;
      if (
        (entry.action && entry.action.startsWith('quiz')) ||
        entry.action === 'objective_complete'
      ) {
        xpBreakdown.quiz += amt;
      } else if (entry.action && entry.action.startsWith('exercise')) {
        xpBreakdown.exercise += amt;
      } else if (entry.action === 'checkin') {
        xpBreakdown.checkin += amt;
      } else if (entry.action === 'page_visit') {
        xpBreakdown.visit += amt;
      } else {
        xpBreakdown.bonus += amt;
      }
    }

    const badges = (g.badges || []).map((b) => ({
      id: b.badgeId,
      name: b.name,
      earnedAt: b.earnedAt,
    }));

    const completedStats = {
      count: (g.completedObjectives || []).length,
      items: (g.completedObjectives || []).slice(-10).map((o) => ({
        slug: o.slug,
        completedAt: o.completedAt,
      })),
    };

    res.json({
      xp: g.xp,
      level,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      streak: g.streak || 0,
      lastCheckin: g.lastCheckin || null,
      badges,
      completedObjectives: completedStats,
      xpBreakdown,
    });
  } catch (err) {
    logger.error('[gamification] profile error:', err.message);
    res.status(500).json({ error: 'Profil konnte nicht geladen werden' });
  }
});

router.get('/api/gamification/badges', requireAuth, async (req, res) => {
  try {
    const badgeStatus = getBadgeStatus(req.user.id);

    const infoMap = {};
    for (const info of BADGE_INFO) infoMap[info.id] = info;

    const badges = badgeStatus.map((b) => {
      const info = infoMap[b.id] || {};
      return {
        id: b.id,
        name: info.name || b.name,
        description: info.description || '',
        icon: info.icon || '',
        condition: info.condition || '',
        earned: b.earned,
        earnedDate: b.earnedAt || null,
      };
    });

    res.json({ badges });
  } catch (err) {
    logger.error('[gamification] badges error:', err.message);
    res.status(500).json({ error: 'Abzeichen konnten nicht geladen werden' });
  }
});

export default router;
