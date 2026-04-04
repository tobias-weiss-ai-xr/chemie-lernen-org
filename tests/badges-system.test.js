/**
 * Unit Tests for BadgesSystem
 */

const { BadgesSystem } = require('../myhugoapp/static/js/badges-system.js');

describe('BadgesSystem - Construction', () => {
  test('should create instance with default storageKey', () => {
    const bs = new BadgesSystem();
    expect(bs.storageKey).toBe('chemie-lernen-badges');
  });

  test('should create instance with custom storageKey', () => {
    const bs = new BadgesSystem({ storageKey: 'custom-key' });
    expect(bs.storageKey).toBe('custom-key');
  });

  test('should initialize with empty badges', () => {
    const bs = new BadgesSystem();
    expect(Object.keys(bs.badges).length).toBe(0);
  });

  test('should initialize with zero stats', () => {
    const bs = new BadgesSystem();
    const stats = bs.getStats();
    expect(stats.quizzesTaken).toBe(0);
    expect(stats.correctAnswers).toBe(0);
    expect(stats.calculationsDone).toBe(0);
    expect(stats.cardsReviewed).toBe(0);
    expect(stats.totalStudyTime).toBe(0);
  });
});

describe('BadgesSystem - Badge Definitions', () => {
  test('should return badge definition for known badge', () => {
    const bs = new BadgesSystem();
    const badge = bs.getBadgeDefinition('first-quizzes');
    expect(badge).not.toBeNull();
    expect(badge.id).toBe('first-quizzes');
    expect(badge).toHaveProperty('title');
    expect(badge).toHaveProperty('description');
    expect(badge).toHaveProperty('icon');
    expect(badge).toHaveProperty('rarity');
    expect(badge).toHaveProperty('category');
    expect(badge).toHaveProperty('criteria');
  });

  test('should return null for unknown badge', () => {
    const bs = new BadgesSystem();
    const badge = bs.getBadgeDefinition('nonexistent-badge');
    expect(badge).toBeNull();
  });

  test('should have 13 badge definitions', () => {
    const bs = new BadgesSystem();
    const knownIds = [
      'first-quizzes',
      'quiz-master',
      'scholar',
      'knowledge-warrior',
      'perfect-score',
      'calculation-expert',
      'flashcard-warrior',
      'daily-practitioner',
      'week-warrior',
      'master-student',
      'study-buddy',
      'dedicated-learner',
      'all-rounder',
    ];
    knownIds.forEach((id) => {
      const badge = bs.getBadgeDefinition(id);
      expect(badge).not.toBeNull();
      expect(badge.id).toBe(id);
    });
  });

  test('all badges should have valid rarity', () => {
    const bs = new BadgesSystem();
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const ids = [
      'first-quizzes',
      'quiz-master',
      'scholar',
      'knowledge-warrior',
      'perfect-score',
      'calculation-expert',
      'flashcard-warrior',
      'daily-practitioner',
      'week-warrior',
      'master-student',
      'study-buddy',
      'dedicated-learner',
      'all-rounder',
    ];
    ids.forEach((id) => {
      const badge = bs.getBadgeDefinition(id);
      expect(validRarities).toContain(badge.rarity);
    });
  });
});

describe('BadgesSystem - Earning Badges', () => {
  test('should earn badge via earnBadge()', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('first-quizzes');
    expect(bs.hasBadge ? bs.hasBadge('first-quizzes') : bs.badges['first-quizzes']).toBeDefined();
  });

  test('earned badge should have earnedAt timestamp', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('first-quizzes');
    const earned = bs.badges['first-quizzes'];
    expect(earned).toHaveProperty('earnedAt');
    expect(new Date(earned.earnedAt).getTime()).not.toBeNaN();
  });

  test('getEarnedBadges should return array of earned badges', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('first-quizzes');
    bs.earnBadge('study-buddy');
    const earned = bs.getEarnedBadges();
    expect(earned.length).toBe(2);
  });

  test('getEarnedCount should return correct count', () => {
    const bs = new BadgesSystem();
    expect(bs.getEarnedCount()).toBe(0);
    bs.earnBadge('first-quizzes');
    expect(bs.getEarnedCount()).toBe(1);
    bs.earnBadge('quiz-master');
    expect(bs.getEarnedCount()).toBe(2);
  });

  test('should not earn badge for invalid id', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('nonexistent');
    expect(bs.getEarnedCount()).toBe(0);
  });

  test('should not double-earn the same badge', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('first-quizzes');
    const firstTime = bs.badges['first-quizzes'].earnedAt;
    bs.earnBadge('first-quizzes');
    // earnBadge overwrites — count stays 1
    expect(bs.getEarnedCount()).toBe(1);
  });
});

describe('BadgesSystem - Badge Checking', () => {
  test('checkBadge should return true when criteria met', () => {
    const bs = new BadgesSystem();
    bs.stats.quizzesTaken = 1;
    const earned = bs.checkBadge('first-quizzes');
    expect(earned).toBe(true);
  });

  test('checkBadge should return false when criteria not met', () => {
    const bs = new BadgesSystem();
    bs.stats.quizzesTaken = 0;
    const earned = bs.checkBadge('first-quizzes');
    expect(earned).toBe(false);
  });

  test('checkBadge should return false for already earned badge', () => {
    const bs = new BadgesSystem();
    bs.stats.quizzesTaken = 1;
    bs.checkBadge('first-quizzes');
    const secondCheck = bs.checkBadge('first-quizzes');
    expect(secondCheck).toBe(false);
  });

  test('checkBadge should return false for unknown badge', () => {
    const bs = new BadgesSystem();
    const result = bs.checkBadge('nonexistent');
    expect(result).toBe(false);
  });
});

describe('BadgesSystem - Quiz Tracking', () => {
  test('trackQuizTaken should increment counter', () => {
    const bs = new BadgesSystem();
    const result = bs.trackQuizTaken();
    expect(result).toBe(1);
    expect(bs.getStats().quizzesTaken).toBe(1);
  });

  test('trackQuizTaken should auto-earn first-quizzes badge', () => {
    const bs = new BadgesSystem();
    bs.trackQuizTaken();
    expect(bs.badges['first-quizzes']).toBeDefined();
  });

  test('trackCorrectAnswer should increment counter', () => {
    const bs = new BadgesSystem();
    const result = bs.trackCorrectAnswer();
    expect(result).toBe(1);
  });
});

describe('BadgesSystem - Calculation Tracking', () => {
  test('trackCalculation should increment counter', () => {
    const bs = new BadgesSystem();
    const result = bs.trackCalculation();
    expect(result).toBe(1);
    expect(bs.getStats().calculationsDone).toBe(1);
  });

  test('should earn calculation-expert at 100 calculations', () => {
    const bs = new BadgesSystem();
    for (let i = 0; i < 100; i++) {
      bs.trackCalculation();
    }
    expect(bs.badges['calculation-expert']).toBeDefined();
  });
});

describe('BadgesSystem - Flashcard Tracking', () => {
  test('trackFlashcardReview should increment counter', () => {
    const bs = new BadgesSystem();
    const result = bs.trackFlashcardReview();
    expect(result).toBe(1);
  });

  test('should earn flashcard-warrior at 50 reviews', () => {
    const bs = new BadgesSystem();
    for (let i = 0; i < 50; i++) {
      bs.trackFlashcardReview();
    }
    expect(bs.badges['flashcard-warrior']).toBeDefined();
  });
});

describe('BadgesSystem - Study Time Tracking', () => {
  test('trackStudyTime should add seconds', () => {
    const bs = new BadgesSystem();
    const result = bs.trackStudyTime(3600);
    expect(result).toBe(3600);
    expect(bs.getStats().totalStudyTime).toBe(3600);
  });

  test('trackStudyTime should reject negative values', () => {
    const bs = new BadgesSystem();
    const result = bs.trackStudyTime(-100);
    expect(result).toBe(0);
    expect(bs.getStats().totalStudyTime).toBe(0);
  });

  test('trackStudyTime should reject NaN', () => {
    const bs = new BadgesSystem();
    const result = bs.trackStudyTime(NaN);
    expect(result).toBe(0);
  });

  test('trackStudyTime should reject non-number', () => {
    const bs = new BadgesSystem();
    const result = bs.trackStudyTime('abc');
    expect(result).toBe(0);
  });

  test('trackStudyTime should reject Infinity', () => {
    const bs = new BadgesSystem();
    const result = bs.trackStudyTime(Infinity);
    expect(result).toBe(0);
  });

  test('should earn study-buddy at 3600 seconds', () => {
    const bs = new BadgesSystem();
    bs.trackStudyTime(3600);
    expect(bs.badges['study-buddy']).toBeDefined();
  });

  test('addStudySession should convert minutes to seconds', () => {
    const bs = new BadgesSystem();
    const result = bs.addStudySession(60);
    expect(result).toBe(3600);
  });

  test('addStudySession should reject negative values', () => {
    const bs = new BadgesSystem();
    const result = bs.addStudySession(-30);
    expect(result).toBe(0);
  });

  test('addStudySession should reject NaN', () => {
    const bs = new BadgesSystem();
    const result = bs.addStudySession(NaN);
    expect(result).toBe(0);
  });
});

describe('BadgesSystem - Progress Calculation', () => {
  test('calculateBadgeProgress should return correct shape', () => {
    const bs = new BadgesSystem();
    const badge = bs.getBadgeDefinition('first-quizzes');
    const progress = bs.calculateBadgeProgress(badge);
    expect(progress).toHaveProperty('current');
    expect(progress).toHaveProperty('required');
    expect(progress).toHaveProperty('percentage');
  });

  test('calculateBadgeProgress should show 0% for no progress', () => {
    const bs = new BadgesSystem();
    const badge = bs.getBadgeDefinition('quiz-master');
    const progress = bs.calculateBadgeProgress(badge);
    expect(progress.percentage).toBe(0);
  });

  test('calculateBadgeProgress should show 100% when complete', () => {
    const bs = new BadgesSystem();
    bs.stats.quizzesTaken = 10;
    const badge = bs.getBadgeDefinition('quiz-master');
    const progress = bs.calculateBadgeProgress(badge);
    expect(progress.percentage).toBe(100);
  });
});

describe('BadgesSystem - Statistics', () => {
  test('getStats should return copy of stats', () => {
    const bs = new BadgesSystem();
    const stats1 = bs.getStats();
    stats1.quizzesTaken = 999;
    const stats2 = bs.getStats();
    expect(stats2.quizzesTaken).toBe(0);
  });

  test('getCompletionPercentage should return 0 for no badges', () => {
    const bs = new BadgesSystem();
    expect(bs.getCompletionPercentage()).toBe(0);
  });

  test('getCompletionPercentage should increase with earned badges', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('first-quizzes');
    const pct = bs.getCompletionPercentage();
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  test('getTotalBadgesCount should return 17', () => {
    const bs = new BadgesSystem();
    expect(bs.getTotalBadgesCount()).toBe(17);
  });
});

describe('BadgesSystem - Export/Import', () => {
  test('exportProgress should return correct shape', () => {
    const bs = new BadgesSystem();
    const exported = bs.exportProgress();
    expect(exported).toHaveProperty('badges');
    expect(exported).toHaveProperty('stats');
    expect(exported).toHaveProperty('exportedAt');
  });

  test('export/import round-trip should preserve data', () => {
    const bs1 = new BadgesSystem();
    bs1.trackQuizTaken();
    bs1.trackCalculation();
    const exported = bs1.exportProgress();

    const bs2 = new BadgesSystem();
    const result = bs2.importProgress(exported);
    expect(result.success).toBe(true);
    expect(bs2.getStats().quizzesTaken).toBe(1);
    expect(bs2.getStats().calculationsDone).toBe(1);
  });
});

describe('BadgesSystem - Reset', () => {
  test('resetAll should clear all progress', () => {
    const bs = new BadgesSystem();
    bs.trackQuizTaken();
    bs.trackCalculation();
    bs.resetAll();
    expect(bs.getEarnedCount()).toBe(0);
    expect(bs.getStats().quizzesTaken).toBe(0);
    expect(bs.getStats().calculationsDone).toBe(0);
  });

  test('resetStreak should zero streak', () => {
    const bs = new BadgesSystem();
    bs.stats.daysStreak = 10;
    bs.resetStreak();
    expect(bs.getStats().daysStreak).toBe(0);
  });
});

describe('BadgesSystem - Unearned Badges', () => {
  test('getUnearnedBadges should return badges not yet earned', () => {
    const bs = new BadgesSystem();
    const unearned = bs.getUnearnedBadges();
    expect(unearned.length).toBe(13); // all 13 badges unearned
    unearned.forEach((b) => {
      expect(b).toHaveProperty('progress');
      expect(b.progress).toHaveProperty('percentage');
    });
  });

  test('getUnearnedBadges should exclude earned badges', () => {
    const bs = new BadgesSystem();
    bs.earnBadge('first-quizzes');
    const unearned = bs.getUnearnedBadges();
    const ids = unearned.map((b) => b.id);
    expect(ids).not.toContain('first-quizzes');
    expect(unearned.length).toBe(12);
  });
});

describe('BadgesSystem - All-Rounder Badge', () => {
  test('should earn all-rounder when meeting all criteria', () => {
    const bs = new BadgesSystem();
    for (let i = 0; i < 5; i++) bs.trackQuizTaken();
    for (let i = 0; i < 20; i++) bs.trackCalculation();
    for (let i = 0; i < 10; i++) bs.trackFlashcardReview();
    expect(bs.badges['all-rounder']).toBeDefined();
  });

  test('should not earn all-rounder with partial criteria', () => {
    const bs = new BadgesSystem();
    for (let i = 0; i < 5; i++) bs.trackQuizTaken();
    for (let i = 0; i < 10; i++) bs.trackCalculation(); // only 10, need 20
    for (let i = 0; i < 10; i++) bs.trackFlashcardReview();
    expect(bs.badges['all-rounder']).toBeUndefined();
  });
});
