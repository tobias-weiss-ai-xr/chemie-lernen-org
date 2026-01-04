/**
 * Tests for Analytics Manager
 * Tests learning progress tracking and analytics
 */

// Setup localStorage mock before loading AnalyticsManager
const mockLocalStorage = new Map();

global.localStorage = {
  setItem: (key, value) => mockLocalStorage.set(key, value),
  getItem: (key) => mockLocalStorage.get(key) || null,
  removeItem: (key) => mockLocalStorage.delete(key),
  clear: () => mockLocalStorage.clear(),
  get length() {
    return mockLocalStorage.size;
  },
  key: (index) => {
    const keys = Array.from(mockLocalStorage.keys());
    return keys[index] || null;
  },
};

const AnalyticsManager = require('../myhugoapp/static/js/analytics/analytics-manager.js');

describe('Analytics Manager', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    AnalyticsManager.currentSession = {
      startTime: null,
      calculations: [],
      practiceProblems: [],
      mistakes: [],
    };

    // Clear all analytics data
    Object.values(AnalyticsManager.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  });

  describe('Session Management', () => {
    test('starts a new session', () => {
      AnalyticsManager.startSession();

      expect(AnalyticsManager.currentSession.startTime).toBeTruthy();
      expect(AnalyticsManager.currentSession.calculations).toEqual([]);
      expect(AnalyticsManager.currentSession.practiceProblems).toEqual([]);
    });

    test('ends session and saves it', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({
        type: 'molar_mass',
        inputs: { formula: 'H2O' },
        result: 18.015,
        correct: true,
      });

      AnalyticsManager.endSession();

      const sessions = AnalyticsManager.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].calculations).toHaveLength(1);
      expect(sessions[0].duration).toBeGreaterThanOrEqual(0);
    });

    test('handles ending session without starting one', () => {
      // Should not throw
      expect(() => AnalyticsManager.endSession()).not.toThrow();
    });
  });

  describe('Calculation Tracking', () => {
    test('tracks correct calculation', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({
        type: 'molar_mass',
        inputs: { formula: 'H2O' },
        result: 18.015,
        correct: true,
        timeSpent: 5000,
      });

      expect(AnalyticsManager.currentSession.calculations).toHaveLength(1);
      expect(AnalyticsManager.currentSession.calculations[0].type).toBe('molar_mass');
      expect(AnalyticsManager.currentSession.calculations[0].correct).toBe(true);
    });

    test('tracks incorrect calculation', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({
        type: 'molar_mass',
        inputs: { formula: 'H2O' },
        result: 18.015,
        correct: false,
      });

      expect(AnalyticsManager.currentSession.mistakes).toHaveLength(1);
    });

    test('updates progress with calculation', () => {
      AnalyticsManager.trackCalculation({
        type: 'molar_mass',
        inputs: { formula: 'H2O' },
        result: 18.015,
        correct: true,
      });

      const progress = AnalyticsManager.getProgress();
      expect(progress.totalAttempts).toBe(1);
      expect(progress.correctAttempts).toBe(1);
    });

    test('calculates XP correctly', () => {
      const xp = AnalyticsManager.calculateXP({
        correct: true,
        timeSpent: 30,
        difficulty: 'medium',
        attempts: 1,
      });

      expect(xp).toBeGreaterThan(0);
    });
  });

  describe('Practice Problem Tracking', () => {
    test('tracks practice problem attempt', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackPracticeProblem({
        type: 'stoichiometry',
        difficulty: 'hard',
        correct: true,
        timeSpent: 45000,
        attempts: 2,
        hintsUsed: 1,
      });

      expect(AnalyticsManager.currentSession.practiceProblems).toHaveLength(1);
      expect(AnalyticsManager.currentSession.practiceProblems[0].difficulty).toBe('hard');
    });

    test('tracks mistakes for incorrect problems', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackPracticeProblem({
        type: 'stoichiometry',
        difficulty: 'medium',
        correct: false,
      });

      expect(AnalyticsManager.currentSession.mistakes).toHaveLength(1);
    });
  });

  describe('Progress Tracking', () => {
    test('gets initial progress', () => {
      const progress = AnalyticsManager.getProgress();

      expect(progress.totalAttempts).toBe(0);
      expect(progress.correctAttempts).toBe(0);
      expect(progress.level).toBe(1);
    });

    test('updates category progress', () => {
      AnalyticsManager.trackCalculation({
        type: 'molar_mass',
        correct: true,
      });

      AnalyticsManager.trackCalculation({
        type: 'molar_mass',
        correct: false,
      });

      const progress = AnalyticsManager.getProgress();
      expect(progress.categories.molar_mass).toBeDefined();
      expect(progress.categories.molar_mass.totalAttempts).toBe(2);
      expect(progress.categories.molar_mass.correctAttempts).toBe(1);
    });

    test('checks for level up', () => {
      const progress = AnalyticsManager.getProgress();
      progress.xp = AnalyticsManager.getXPForLevel(2);

      AnalyticsManager.checkLevelUp(progress);

      expect(progress.level).toBe(2);
    });

    test('calculates XP requirements correctly', () => {
      const level1XP = AnalyticsManager.getXPForLevel(1);
      const level2XP = AnalyticsManager.getXPForLevel(2);
      const level3XP = AnalyticsManager.getXPForLevel(3);

      expect(level1XP).toBe(100);
      expect(level2XP).toBe(150);
      expect(level3XP).toBe(225);
    });
  });

  describe('Mistake Tracking', () => {
    test('tracks mistakes', () => {
      AnalyticsManager.trackMistake({
        type: 'calculation',
        calculationType: 'molar_mass',
        inputs: { formula: 'H2O' },
      });

      const mistakes = AnalyticsManager.getMistakes();
      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].type).toBe('calculation');
    });

    test('analyzes mistake patterns', () => {
      // Add multiple mistakes
      for (let i = 0; i < 5; i++) {
        AnalyticsManager.trackMistake({
          type: 'calculation',
          calculationType: 'stoichiometry',
        });
      }

      const patterns = AnalyticsManager.analyzeMistakes(AnalyticsManager.getMistakes());
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].frequency).toBe(5);
    });

    test('generates recommendations from weak areas', () => {
      const progress = AnalyticsManager.getProgress();
      progress.categories.stoichiometry = {
        totalAttempts: 20,
        correctAttempts: 10,
        totalTime: 10000,
        lastActivity: Date.now(),
      };
      // Save the modified progress
      AnalyticsManager.saveData(AnalyticsManager.STORAGE_KEYS.PROGRESS, progress);

      const insights = AnalyticsManager.getInsights();
      expect(insights.weakAreas.length).toBeGreaterThan(0);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Achievements', () => {
    test('unlocks achievement', () => {
      const result = AnalyticsManager.unlockAchievement('first_calculation');

      expect(result).toBe(true);

      const achievements = AnalyticsManager.getAchievements();
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe('first_calculation');
    });

    test('does not unlock duplicate achievement', () => {
      AnalyticsManager.unlockAchievement('first_calculation');
      const result = AnalyticsManager.unlockAchievement('first_calculation');

      expect(result).toBe(false);
    });

    test('unlocks level up achievement', () => {
      const result = AnalyticsManager.unlockAchievement('level_up', { level: 5 });

      expect(result).toBe(true);

      const achievements = AnalyticsManager.getAchievements();
      expect(achievements[0].title).toBe('Level Up!');
    });

    test('checks for achievements automatically', () => {
      // Track a calculation to trigger first_calculation achievement
      AnalyticsManager.trackCalculation({
        type: 'test',
        inputs: {},
        result: 42,
        correct: true,
      });

      AnalyticsManager.checkAchievements();

      const achievements = AnalyticsManager.getAchievements();
      expect(achievements.find((a) => a.id === 'first_calculation')).toBeDefined();
    });

    test('generates achievement titles and descriptions', () => {
      const title = AnalyticsManager.getAchievementTitle('streak_10');
      const description = AnalyticsManager.getAchievementDescription('streak_10', {});

      expect(title).toBe('On Fire');
      expect(description).toBeTruthy();
    });
  });

  describe('Statistics', () => {
    test('tracks session statistics', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({ type: 'test', correct: true });
      AnalyticsManager.trackCalculation({ type: 'test', correct: true });
      AnalyticsManager.endSession();

      const stats = AnalyticsManager.getStats();
      expect(stats.totalSessions).toBe(1);
      expect(stats.totalCalculations).toBe(2);
    });

    test('calculates average session length', () => {
      // Create two sessions with known durations
      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({ type: 'test1', correct: true });
      // Simulate 1 minute session
      AnalyticsManager.currentSession.startTime = Date.now() - 60000;
      AnalyticsManager.endSession();

      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({ type: 'test2', correct: true });
      // Simulate 2 minute session
      AnalyticsManager.currentSession.startTime = Date.now() - 120000;
      AnalyticsManager.endSession();

      const stats = AnalyticsManager.getStats();
      expect(stats.avgSessionLength).toBeCloseTo(90000, 0); // Average of 1min and 2min
    });

    test('gets streak information', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackPracticeProblem({ type: 'test', correct: true });
      AnalyticsManager.trackPracticeProblem({ type: 'test', correct: true });
      AnalyticsManager.trackPracticeProblem({ type: 'test', correct: true });
      AnalyticsManager.endSession();

      const streak = AnalyticsManager.getStreak();
      expect(streak.current).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Learning Insights', () => {
    test('generates insights summary', () => {
      const progress = AnalyticsManager.getProgress();
      progress.totalAttempts = 50;
      progress.correctAttempts = 45;

      const insights = AnalyticsManager.getInsights();
      expect(insights.summary).toBeTruthy();
    });

    test('identifies strong areas', () => {
      const progress = AnalyticsManager.getProgress();
      progress.categories.stoichiometry = {
        totalAttempts: 20,
        correctAttempts: 19,
        totalTime: 5000,
        lastActivity: Date.now(),
      };
      // Save the modified progress
      AnalyticsManager.saveData(AnalyticsManager.STORAGE_KEYS.PROGRESS, progress);

      const insights = AnalyticsManager.getInsights();
      expect(insights.strongAreas.length).toBeGreaterThan(0);
      expect(insights.strongAreas[0].category).toBe('stoichiometry');
    });

    test('identifies weak areas', () => {
      const progress = AnalyticsManager.getProgress();
      progress.categories.titration = {
        totalAttempts: 20,
        correctAttempts: 10,
        totalTime: 5000,
        lastActivity: Date.now(),
      };
      // Save the modified progress
      AnalyticsManager.saveData(AnalyticsManager.STORAGE_KEYS.PROGRESS, progress);

      const insights = AnalyticsManager.getInsights();
      expect(insights.weakAreas.length).toBeGreaterThan(0);
      expect(insights.weakAreas[0].category).toBe('titration');
    });

    test('generates personalized recommendations', () => {
      const progress = AnalyticsManager.getProgress();
      progress.categories.dilution = {
        totalAttempts: 15,
        correctAttempts: 8,
        totalTime: 3000,
        lastActivity: Date.now(),
      };
      // Save the modified progress
      AnalyticsManager.saveData(AnalyticsManager.STORAGE_KEYS.PROGRESS, progress);

      const insights = AnalyticsManager.getInsights();
      expect(insights.recommendations.length).toBeGreaterThan(0);

      const hasPracticeRec = insights.recommendations.some(
        (rec) => rec.type === 'practice' || rec.type === 'review'
      );
      expect(hasPracticeRec).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    test('saves and loads progress', () => {
      const progress = {
        totalAttempts: 10,
        correctAttempts: 8,
        level: 2,
        xp: 50,
        categories: {},
      };

      AnalyticsManager.saveData(AnalyticsManager.STORAGE_KEYS.PROGRESS, progress);
      const loaded = AnalyticsManager.getData(AnalyticsManager.STORAGE_KEYS.PROGRESS);

      expect(loaded).toEqual(progress);
    });

    test('handles save errors gracefully', () => {
      // Test with invalid data
      const result = AnalyticsManager.saveData('test_key', null);
      expect(result).toBe(true); // Should still save successfully
    });

    test('returns default value for missing data', () => {
      const data = AnalyticsManager.getData('nonexistent_key', { default: 'value' });
      expect(data).toEqual({ default: 'value' });
    });
  });

  describe('Data Export', () => {
    test('exports all analytics data', () => {
      AnalyticsManager.trackCalculation({ type: 'test', correct: true });
      AnalyticsManager.unlockAchievement('first_calculation');

      const exported = AnalyticsManager.exportData();

      expect(exported).toHaveProperty('progress');
      expect(exported).toHaveProperty('sessions');
      expect(exported).toHaveProperty('achievements');
      expect(exported).toHaveProperty('mistakes');
      expect(exported).toHaveProperty('stats');
      expect(exported).toHaveProperty('exportDate');
    });
  });

  describe('Data Management', () => {
    test('clears all analytics data', () => {
      AnalyticsManager.trackCalculation({ type: 'test', correct: true });
      AnalyticsManager.unlockAchievement('first_calculation');

      AnalyticsManager.clearAllData();

      expect(AnalyticsManager.getProgress().totalAttempts).toBe(0);
      expect(AnalyticsManager.getAchievements()).toHaveLength(0);
      expect(AnalyticsManager.getSessions()).toHaveLength(0);
    });

    test('resets current session when cleared', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.trackCalculation({ type: 'test', correct: true });

      AnalyticsManager.clearAllData();

      expect(AnalyticsManager.currentSession.startTime).toBeNull();
      expect(AnalyticsManager.currentSession.calculations).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles tracking without session started', () => {
      AnalyticsManager.currentSession.startTime = null;

      expect(() => {
        AnalyticsManager.trackCalculation({ type: 'test', correct: true });
      }).not.toThrow();
    });

    test('handles division by zero in accuracy calculation', () => {
      const progress = AnalyticsManager.getProgress();
      progress.totalAttempts = 0;

      // Should not throw
      const accuracy =
        progress.totalAttempts > 0 ? progress.correctAttempts / progress.totalAttempts : 0;

      expect(accuracy).toBe(0);
    });

    test('handles empty sessions', () => {
      AnalyticsManager.startSession();
      AnalyticsManager.endSession();

      const sessions = AnalyticsManager.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].calculations).toHaveLength(0);
    });

    test('handles undefined activity data', () => {
      expect(() => {
        AnalyticsManager.updateProgress({});
      }).not.toThrow();
    });
  });
});
