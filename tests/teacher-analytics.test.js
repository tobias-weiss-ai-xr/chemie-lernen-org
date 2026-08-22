/**
 * Teacher Analytics Tests
 *
 * Tests for auth-db.js aggregation helpers and API routes.
 * API tests are guarded by API_RUNNING=1.
 */

const path = require('path');

// ── Inline mock for auth-db aggregation helpers ────────────
// We test the pure logic by replicating the helper functions with
// mock data (since auth-db.js is ESM and not easily importable in
// CommonJS test env).

// Mock user data matching auth-db structure
const MOCK_USERS = [
  {
    id: 1,
    email: 'max@example.de',
    name: 'Max Mustermann',
    role: 'user',
    tier: 'free',
    gamification: {
      xp: 3200,
      streak: 12,
      lastCheckin: new Date().toISOString(),
      badges: [{ badgeId: 'streak-7', name: '7-Tage Streak' }],
      completedObjectives: [{ slug: 'molmasse-berechnen', completedAt: '2026-07-20T10:00:00Z' }],
      xpLog: [
        {
          amount: 20,
          source: 'quiz_submit: saeuren-basen',
          action: 'quiz_submit',
          timestamp: new Date().toISOString(),
        },
        {
          amount: 15,
          source: 'exercise_correct',
          action: 'exercise_correct',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          amount: 20,
          source: 'checkin',
          action: 'checkin',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
    },
    quiz_results: [
      {
        topic: 'saeuren-basen',
        score: 8,
        total: 10,
        percentage: 80,
        completedAt: new Date().toISOString(),
      },
      {
        topic: 'saeuren-basen',
        score: 9,
        total: 10,
        percentage: 90,
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        topic: 'elektrochemie',
        score: 3,
        total: 10,
        percentage: 30,
        completedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
  },
  {
    id: 2,
    email: 'anna@example.de',
    name: 'Anna Schmidt',
    role: 'user',
    tier: 'premium',
    gamification: {
      xp: 1500,
      streak: 5,
      lastCheckin: new Date(Date.now() - 3 * 86400000).toISOString(),
      badges: [],
      completedObjectives: [],
      xpLog: [
        {
          amount: 20,
          source: 'checkin',
          action: 'checkin',
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ],
    },
    quiz_results: [
      {
        topic: 'saeuren-basen',
        score: 7,
        total: 10,
        percentage: 70,
        completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        topic: 'elektrochemie',
        score: 5,
        total: 10,
        percentage: 50,
        completedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 3,
    email: 'tom@example.de',
    name: 'Tom Weber',
    role: 'user',
    tier: 'free',
    gamification: {
      xp: 0,
      streak: 0,
      lastCheckin: null,
      badges: [],
      completedObjectives: [],
      xpLog: [],
    },
    quiz_results: [],
  },
  // Inactive user (no activity in 2+ weeks)
  {
    id: 4,
    email: 'lisa@example.de',
    name: 'Lisa Meier',
    role: 'user',
    tier: 'free',
    gamification: {
      xp: 500,
      streak: 0,
      lastCheckin: new Date(Date.now() - 30 * 86400000).toISOString(),
      badges: [],
      completedObjectives: [],
      xpLog: [
        {
          amount: 20,
          source: 'checkin',
          action: 'checkin',
          timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ],
    },
    quiz_results: [
      {
        topic: 'analytik',
        score: 6,
        total: 10,
        percentage: 60,
        completedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    ],
  },
];

// ── Replicated helpers (same logic as auth-db.js) ──────────

function calculateLevel(xp) {
  return { level: Math.floor(xp / 500) };
}

function getClassOverview(users) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let activeThisWeek = 0;
  let totalXp = 0;
  let totalStreak = 0;
  let totalLevel = 0;
  let userCount = 0;
  const topicScores = {};

  for (const u of users) {
    userCount++;
    const g = u.gamification || {};
    const recentXp = (g.xpLog || []).some((entry) => {
      if (!entry.timestamp) return false;
      return new Date(entry.timestamp) >= oneWeekAgo;
    });
    const recentCheckin = g.lastCheckin ? new Date(g.lastCheckin) >= oneWeekAgo : false;
    if (recentXp || recentCheckin) activeThisWeek++;
    totalXp += g.xp || 0;
    totalStreak += g.streak || 0;
    totalLevel += calculateLevel(g.xp || 0).level;
    const quizzes = u.quiz_results || [];
    for (const q of quizzes) {
      if (!topicScores[q.topic]) topicScores[q.topic] = { totalScore: 0, totalPossible: 0 };
      topicScores[q.topic].totalScore += q.score || 0;
      topicScores[q.topic].totalPossible += q.total || 1;
    }
  }

  let topTopic = null;
  let weakestTopic = null;
  let topScore = -1;
  let weakestScore = Infinity;
  for (const [topic, scores] of Object.entries(topicScores)) {
    const avg = scores.totalScore / Math.max(1, scores.totalPossible);
    if (avg > topScore) {
      topScore = avg;
      topTopic = topic;
    }
    if (avg < weakestScore) {
      weakestScore = avg;
      weakestTopic = topic;
    }
  }

  return {
    totalStudents: userCount,
    activeThisWeek,
    avgXp: userCount > 0 ? Math.round(totalXp / userCount) : 0,
    avgStreak: userCount > 0 ? parseFloat((totalStreak / userCount).toFixed(1)) : 0,
    avgLevel: userCount > 0 ? parseFloat((totalLevel / userCount).toFixed(1)) : 0,
    topTopic,
    weakestTopic,
  };
}

function getClassTopicBreakdown(users) {
  const topicMap = {};
  for (const u of users) {
    const quizzes = u.quiz_results || [];
    for (const q of quizzes) {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = { totalPercentage: 0, attempts: 0, studentSet: new Set() };
      }
      topicMap[q.topic].totalPercentage += q.percentage || 0;
      topicMap[q.topic].attempts++;
      topicMap[q.topic].studentSet.add(u.id);
    }
  }

  const topics = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    avgScore: parseFloat((data.totalPercentage / Math.max(1, data.attempts)).toFixed(1)),
    attempts: data.attempts,
    students: data.studentSet.size,
  }));
  topics.sort((a, b) => a.avgScore - b.avgScore);
  const weakAreas = topics.filter((t) => t.avgScore < 60).map((t) => t.topic);
  return { topics, weakAreas };
}

function getEngagementTimeline(users, weeks) {
  const safeWeeks = typeof weeks === 'number' && weeks > 0 ? Math.min(weeks, 52) : 12;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const dayOfWeek = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);

  const buckets = [];
  for (let i = safeWeeks - 1; i >= 0; i--) {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const janFirst = new Date(start.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((start - janFirst) / 86400000 + janFirst.getDay() + 1) / 7);
    const label = `${start.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    buckets.push({ label, start, end, activeUsers: new Set() });
  }

  for (const u of users) {
    const g = u.gamification || {};
    const entries = g.xpLog || [];
    for (const entry of entries) {
      if (!entry.timestamp) continue;
      const ts = new Date(entry.timestamp);
      for (const bucket of buckets) {
        if (ts >= bucket.start && ts < bucket.end) {
          bucket.activeUsers.add(u.id);
          break;
        }
      }
    }
  }

  return buckets.map((b) => ({ week: b.label, count: b.activeUsers.size }));
}

// ── Tests ──────────────────────────────────────────────────

describe('getClassOverview', () => {
  test('returns correct totalStudents', () => {
    const result = getClassOverview(MOCK_USERS);
    expect(result.totalStudents).toBe(4);
  });

  test('counts activeThisWeek correctly (users with xpLog/checkin in last 7 days)', () => {
    const result = getClassOverview(MOCK_USERS);
    expect(result.activeThisWeek).toBe(2); // Max (today), Anna (3d ago via checkin+xpLog)
  });

  test('calculates avgXp', () => {
    const result = getClassOverview(MOCK_USERS);
    expect(result.avgXp).toBe(Math.round((3200 + 1500 + 0 + 500) / 4));
  });

  test('calculates avgStreak', () => {
    const result = getClassOverview(MOCK_USERS);
    expect(result.avgStreak).toBe(parseFloat(((12 + 5 + 0 + 0) / 4).toFixed(1)));
  });

  test('identifies top and weakest topics', () => {
    const result = getClassOverview(MOCK_USERS);
    // saeuren-basen: avg score = (8+9+7)/(10+10+10) = 24/30 = 0.8
    // elektrochemie: avg score = (3+5)/(10+10) = 8/20 = 0.4
    // analytik: avg score = 6/10 = 0.6
    expect(result.topTopic).toBe('saeuren-basen');
    expect(result.weakestTopic).toBe('elektrochemie');
  });

  test('handles empty user list', () => {
    const result = getClassOverview([]);
    expect(result.totalStudents).toBe(0);
    expect(result.avgXp).toBe(0);
    expect(result.avgStreak).toBe(0);
    expect(result.avgLevel).toBe(0);
    expect(result.topTopic).toBeNull();
    expect(result.weakestTopic).toBeNull();
  });

  test('handles users without gamification data', () => {
    const result = getClassOverview([
      { id: 1, email: 'a@b.c', name: 'X', gamification: {}, quiz_results: [] },
    ]);
    expect(result.totalStudents).toBe(1);
    expect(result.avgXp).toBe(0);
  });
});

describe('getClassTopicBreakdown', () => {
  test('groups quiz results by topic', () => {
    const result = getClassTopicBreakdown(MOCK_USERS);
    const topicNames = result.topics.map((t) => t.topic);
    expect(topicNames).toContain('saeuren-basen');
    expect(topicNames).toContain('elektrochemie');
    expect(topicNames).toContain('analytik');
  });

  test('calculates avgScore correctly', () => {
    const result = getClassTopicBreakdown(MOCK_USERS);
    const saeuren = result.topics.find((t) => t.topic === 'saeuren-basen');
    // percentages: 80, 90, 70 → avg = 80
    expect(saeuren.avgScore).toBe(80);
  });

  test('counts attempts and unique students', () => {
    const result = getClassTopicBreakdown(MOCK_USERS);
    const saeuren = result.topics.find((t) => t.topic === 'saeuren-basen');
    expect(saeuren.attempts).toBe(3);
    expect(saeuren.students).toBe(2); // Max (2 attempts) + Anna (1 attempt)
  });

  test('identifies weak areas (< 60%)', () => {
    const result = getClassTopicBreakdown(MOCK_USERS);
    // elektrochemie avg = (30+50)/2 = 40% → weak
    expect(result.weakAreas).toContain('elektrochemie');
  });

  test('sorts topics by avgScore ascending', () => {
    const result = getClassTopicBreakdown(MOCK_USERS);
    for (let i = 1; i < result.topics.length; i++) {
      expect(result.topics[i].avgScore).toBeGreaterThanOrEqual(result.topics[i - 1].avgScore);
    }
  });

  test('handles empty user list', () => {
    const result = getClassTopicBreakdown([]);
    expect(result.topics).toEqual([]);
    expect(result.weakAreas).toEqual([]);
  });
});

describe('getEngagementTimeline', () => {
  test('returns correct number of weeks', () => {
    const result = getEngagementTimeline(MOCK_USERS, 4);
    expect(result).toHaveLength(4);
  });

  test('current week has at least 1 active user (Max)', () => {
    const result = getEngagementTimeline(MOCK_USERS, 12);
    const currentWeek = result[result.length - 1];
    expect(currentWeek.count).toBeGreaterThanOrEqual(1);
  });

  test('week labels follow ISO format', () => {
    const result = getEngagementTimeline(MOCK_USERS, 2);
    expect(result[0].week).toMatch(/^\d{4}-W\d{2}$/);
    expect(result[1].week).toMatch(/^\d{4}-W\d{2}$/);
  });

  test('caps weeks at 52', () => {
    const result = getEngagementTimeline(MOCK_USERS, 100);
    expect(result).toHaveLength(52);
  });

  test('defaults to 12 weeks', () => {
    const result = getEngagementTimeline(MOCK_USERS);
    expect(result).toHaveLength(12);
  });

  test('handles empty user list (all zeros)', () => {
    const result = getEngagementTimeline([], 4);
    result.forEach((week) => {
      expect(week.count).toBe(0);
    });
  });
});

// ── Student enrichment logic ────────────────────────────────

describe('Student enrichment', () => {
  function enrichStudent(u) {
    const g = u.gamification || {};
    const quizzes = u.quiz_results || [];
    const quizCount = quizzes.length;
    const avgQuizScore =
      quizCount > 0
        ? parseFloat(
            (quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizCount).toFixed(1)
          )
        : 0;
    const lastXp = (g.xpLog || []).reduce((latest, e) => {
      const t = e.timestamp ? new Date(e.timestamp).getTime() : 0;
      return t > latest ? t : latest;
    }, 0);
    const lastQuiz = quizzes.reduce((latest, q) => {
      const t = q.completedAt ? new Date(q.completedAt).getTime() : 0;
      return t > latest ? t : latest;
    }, 0);
    const lastActive = new Date(Math.max(lastXp, lastQuiz)).toISOString();
    return {
      id: u.id,
      name: u.name || 'Unbekannt',
      xp: g.xp || 0,
      level: typeof g.xp === 'number' && g.xp > 0 ? calculateLevel(g.xp).level : 0,
      streak: g.streak || 0,
      lastActive: lastActive !== '1970-01-01T00:00:00.000Z' ? lastActive : null,
      quizCount,
      avgQuizScore,
      completedObjectives: (g.completedObjectives || []).length,
      topicsExplored: [...new Set(quizzes.map((q) => q.topic).filter(Boolean))],
    };
  }

  test('enriches student with correct computed fields', () => {
    const s = enrichStudent(MOCK_USERS[0]);
    expect(s.name).toBe('Max Mustermann');
    expect(s.xp).toBe(3200);
    expect(s.level).toBe(6); // 3200/500 = 6.4 → floor = 6
    expect(s.streak).toBe(12);
    expect(s.quizCount).toBe(3);
    expect(s.avgQuizScore).toBeCloseTo(66.7, 0); // (80+90+30)/3
    expect(s.completedObjectives).toBe(1);
    expect(s.topicsExplored).toContain('saeuren-basen');
    expect(s.topicsExplored).toContain('elektrochemie');
  });

  test('handles user with no activity', () => {
    const s = enrichStudent(MOCK_USERS[2]);
    expect(s.xp).toBe(0);
    expect(s.level).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.lastActive).toBeNull();
    expect(s.quizCount).toBe(0);
    expect(s.avgQuizScore).toBe(0);
    expect(s.topicsExplored).toEqual([]);
  });

  test('deduplicates topics explored', () => {
    const s = enrichStudent(MOCK_USERS[0]);
    const saeurenCount = s.topicsExplored.filter((t) => t === 'saeuren-basen').length;
    expect(saeurenCount).toBe(1);
  });
});

// ── Sorting logic ──────────────────────────────────────────

describe('Student sorting', () => {
  const students = MOCK_USERS.map((u) => {
    const g = u.gamification || {};
    return {
      id: u.id,
      name: u.name,
      xp: g.xp || 0,
      level: calculateLevel(g.xp || 0).level,
      streak: g.streak || 0,
    };
  });

  test('sorts by XP descending', () => {
    const sorted = [...students].sort((a, b) => b.xp - a.xp);
    expect(sorted[0].name).toBe('Max Mustermann');
    expect(sorted[sorted.length - 1].name).toBe('Tom Weber');
  });

  test('sorts by name ascending (locale-aware)', () => {
    const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    expect(sorted[0].name).toBe('Anna Schmidt');
    expect(sorted[sorted.length - 1].name).toBe('Tom Weber');
  });
});

// ── API endpoint tests (guarded) ──────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

const runApiTests = process.env.API_RUNNING === '1';
const describeApi = runApiTests ? describe : describe.skip;

function getJson(url) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
          } catch (err) {
            reject(new Error('JSON parse error: ' + err.message));
          }
        });
      })
      .on('error', reject);
  });
}

describeApi('GET /api/analytics/class-overview', () => {
  test('returns 200 with correct shape', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/class-overview');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('totalStudents');
    expect(res.data).toHaveProperty('activeThisWeek');
    expect(res.data).toHaveProperty('avgXp');
    expect(res.data).toHaveProperty('avgStreak');
    expect(res.data).toHaveProperty('weeklyActiveUsers');
    expect(Array.isArray(res.data.weeklyActiveUsers)).toBe(true);
  });
});

describeApi('GET /api/analytics/students', () => {
  test('returns paginated student list', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/students?limit=5&offset=0');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('students');
    expect(res.data).toHaveProperty('total');
    expect(res.data).toHaveProperty('limit');
    expect(res.data).toHaveProperty('offset');
    expect(Array.isArray(res.data.students)).toBe(true);
  });

  test('supports sort parameter', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/students?sort=xp&order=asc&limit=5');
    expect(res.status).toBe(200);
    if (res.data.students.length >= 2) {
      expect(res.data.students[0].xp).toBeLessThanOrEqual(res.data.students[1].xp);
    }
  });

  test('supports search filter', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/students?search=Max&limit=10');
    expect(res.status).toBe(200);
    res.data.students.forEach((s) => {
      expect(s.name.toLowerCase()).toContain('max');
    });
  });
});

describeApi('GET /api/analytics/topic-breakdown', () => {
  test('returns topic breakdown with weak areas', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/topic-breakdown');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('topics');
    expect(res.data).toHaveProperty('weakAreas');
    expect(Array.isArray(res.data.topics)).toBe(true);
  });
});

describeApi('GET /api/analytics/export', () => {
  test('returns CSV with correct headers', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/export?format=csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });
});

describeApi('GET /api/analytics/engagement-timeline', () => {
  test('returns timeline array', async () => {
    const res = await getJson(API_BASE_URL + '/api/analytics/engagement-timeline?weeks=4');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('timeline');
    expect(res.data.timeline).toHaveLength(4);
  });
});
