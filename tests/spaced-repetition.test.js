/**
 * Unit tests for spaced-repetition.js - FSRS-based spaced repetition system
 * Tests algorithm implementation, data management, and integration
 */

// Mock window object for browser localStorage
global.window = {
  localStorage: {},
};
global.Storage = class Storage {
  constructor() {
    this.items = {};
  }
  getItem(key) {
    return this.items[key] || null;
  }
  setItem(key, value) {
    this.items[key] = String(value);
  }
  removeItem(key) {
    delete this.items[key];
  }
  clear() {
    this.items = {};
  }
};

global.localStorage = new global.Storage();

// Import the SpacedRepetitionSystem
const { SpacedRepetitionSystem } = require('../myhugoapp/static/js/spaced-repetition.js');

describe('Spaced Repetition System', () => {
  let fsrs;
  const mockStorageKey = 'test-fsrs-data';

  beforeEach(() => {
    localStorage.clear();
    fsrs = new SpacedRepetitionSystem({
      storageKey: mockStorageKey,
      successKey: 'test-quiz-success',
      failureKey: 'test-quiz-failure',
    });
  });

  describe('Initialization and Storage', () => {
    test('should initialize with default parameters', () => {
      expect(fsrs.params.request_retention).toBe(0.9);
      expect(fsrs.params.maximum_interval).toBe(36500);
      expect(fsrs.params.w).toHaveLength(17);
      expect(fsrs.cards).toEqual({});
    });

    test('should save and load data from localStorage', () => {
      const testCard = {
        id: 'test-quiz-1',
        stability: 5,
        difficulty: 6,
        dueDate: new Date('2026-01-10').toISOString(),
        interval: 5,
        reviews: 2,
        lapses: 0,
        lastReview: new Date('2026-01-05').toISOString(),
      };

      fsrs.cards['test-quiz-1'] = testCard;
      fsrs.saveData();

      const fsrs2 = new SpacedRepetitionSystem({ storageKey: mockStorageKey });
      expect(fsrs2.cards['test-quiz-1']).toEqual(testCard);
    });

    test('should handle localStorage errors gracefully', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => fsrs.saveData()).not.toThrow();
      expect(() => fsrs.saveQuizData('test-key', {})).not.toThrow();
    });
  });

  describe('FSRS Algorithm', () => {
    test('should calculate stability increase for correct answers', () => {
      const card = { stability: 10, difficulty: 5 };
      const newStability = fsrs.calculateStability(card, 4);
      expect(newStability).toBeGreaterThan(card.stability);
    });

    test('should calculate stability decrease for incorrect answers', () => {
      const card = { stability: 10, difficulty: 5 };
      const newStability = fsrs.calculateStability(card, 2);
      expect(newStability).toBeLessThan(card.stability);
    });

    test('should adjust difficulty based on performance', () => {
      const card = { difficulty: 5 };
      const newDifficultyEasy = fsrs.calculateDifficulty(card, 4);
      expect(newDifficultyEasy).toBeLessThan(card.difficulty);

      const newDifficultyHard = fsrs.calculateDifficulty(card, 2);
      expect(newDifficultyHard).toBeGreaterThan(card.difficulty);
    });

    test('should keep difficulty within bounds [1, 10]', () => {
      const cardExtreme = { difficulty: 1 };
      const maxDifficulty = fsrs.calculateDifficulty(cardExtreme, 0);
      expect(maxDifficulty).toBeLessThanOrEqual(10);

      const cardEasy = { difficulty: 10 };
      const minDifficulty = fsrs.calculateDifficulty(cardEasy, 5);
      expect(minDifficulty).toBeGreaterThanOrEqual(1);
    });

    test('should calculate interval based on stability', () => {
      const interval1 = fsrs.calculateInterval(5);
      const interval2 = fsrs.calculateInterval(10);

      expect(interval2).toBeGreaterThan(interval1);
      expect(interval1).toBeGreaterThan(0);
    });

    test('should cap interval at maximum_interval', () => {
      const hugeStability = 999999;
      const interval = fsrs.calculateInterval(hugeStability);
      expect(interval).toBe(fsrs.params.maximum_interval);
    });

    test('should ensure minimum interval of 1 day', () => {
      const tinyStability = 0.01;
      const interval = fsrs.calculateInterval(tinyStability);
      expect(interval).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Card Management', () => {
    test('should create new card on first update', () => {
      const cardId = 'quiz-1-question-1';
      const updatedCard = fsrs.updateCard(cardId, 4, 15000);

      expect(fsrs.cards[cardId]).toBeDefined();
      expect(fsrs.cards[cardId].id).toBe(cardId);
      expect(fsrs.cards[cardId].reviews).toBe(1);
      expect(fsrs.cards[cardId].lapses).toBe(0);
    });

    test('should update existing card with new review data', () => {
      const cardId = 'quiz-1-question-1';
      const timeTaken = 12000;

      fsrs.updateCard(cardId, 3, timeTaken);
      const reviews1 = fsrs.cards[cardId].reviews;

      fsrs.updateCard(cardId, 5, timeTaken);
      const reviews2 = fsrs.cards[cardId].reviews;

      expect(reviews2).toBe(reviews1 + 1);
      expect(fsrs.cards[cardId].timeTaken).toBe(timeTaken);
    });

    test('should track lapses for low quality reviews', () => {
      const cardId = 'quiz-1-question-2';

      fsrs.updateCard(cardId, 2); // Quality < 3 = lapse
      expect(fsrs.cards[cardId].lapses).toBe(1);

      fsrs.updateCard(cardId, 4); // Quality >= 3 = no lapse
      expect(fsrs.cards[cardId].lapses).toBe(1);
    });

    test('should set due date based on interval', () => {
      const cardId = 'quiz-1-question-3';
      const now = new Date();

      fsrs.updateCard(cardId, 4, 10000);
      const dueDate = new Date(fsrs.cards[cardId].dueDate);
      const interval = fsrs.cards[cardId].interval;

      const diffDays = Math.round((dueDate - now) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(interval);
    });

    test('should reset card when requested', () => {
      const cardId = 'quiz-1-question-4';
      fsrs.updateCard(cardId, 4, 10000);

      expect(fsrs.cards[cardId]).toBeDefined();

      fsrs.resetCard(cardId);
      expect(fsrs.cards[cardId]).toBeUndefined();
    });

    test('should reset all cards', () => {
      fsrs.updateCard('quiz-1-q1', 4, 10000);
      fsrs.updateCard('quiz-2-q1', 3, 15000);
      fsrs.updateCard('quiz-3-q1', 5, 8000);

      expect(Object.keys(fsrs.cards)).toHaveLength(3);

      fsrs.resetAll();
      expect(fsrs.cards).toEqual({});
    });
  });

  describe('Due Cards Management', () => {
    beforeEach(() => {
      const now = new Date();

      fsrs.updateCard('due-now', 4, 10000);
      fsrs.cards['due-now'].dueDate = now.toISOString();

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      fsrs.updateCard('overdue', 3, 15000);
      fsrs.cards['overdue'].dueDate = yesterday.toISOString();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      fsrs.updateCard('future', 5, 8000);
      fsrs.cards['future'].dueDate = tomorrow.toISOString();
    });

    test('should identify cards due for review', () => {
      const dueCards = fsrs.getDueCards();
      expect(dueCards).toHaveLength(2);
      expect(dueCards.find((c) => c.id === 'future')).toBeUndefined();
    });

    test('should sort due cards by date (oldest first)', () => {
      const dueCards = fsrs.getDueCards();
      expect(dueCards[0].id).toBe('overdue');
      expect(dueCards[1].id).toBe('due-now');
    });

    test('should limit number of returned cards', () => {
      const limitedCards = fsrs.getDueCards(1);
      expect(limitedCards).toHaveLength(1);
    });
  });

  describe('Quiz Integration', () => {
    test('should convert correct fast answer to quality 5', () => {
      const quality = fsrs.quizToQuality(true, 5000, 0);
      expect(quality).toBe(5);
    });

    test('should convert correct slow answer to quality 4', () => {
      const quality = fsrs.quizToQuality(true, 15000, 0);
      expect(quality).toBe(4);
    });

    test('should convert correct answer with hints to quality 3', () => {
      const quality = fsrs.quizToQuality(true, 5000, 2);
      expect(quality).toBe(3);
    });

    test('should convert fast incorrect to quality 2', () => {
      const quality = fsrs.quizToQuality(false, 20000, 0);
      expect(quality).toBe(2);
    });

    test('should convert slow incorrect to quality 1', () => {
      const quality = fsrs.quizToQuality(false, 45000, 0);
      expect(quality).toBe(1);
    });

    test('should convert very slow incorrect to quality 0', () => {
      const quality = fsrs.quizToQuality(false, 70000, 0);
      expect(quality).toBe(0);
    });

    test('should record quiz result and update FSRS data', () => {
      const quizId = 'saeuren-basen';
      const questionId = 'q1';
      const timeTaken = 12000;

      const result = fsrs.recordQuizResult(quizId, questionId, true, timeTaken, 0);

      expect(result).toBeDefined();
      expect(result.id).toBe(`${quizId}-${questionId}`);
      expect(result.timeTaken).toBe(timeTaken);
      expect(fsrs.successData[`${quizId}-${questionId}`]).toBeDefined();
    });

    test('should track both success and failure data', () => {
      const quizId = 'test-quiz';
      const questionId = 'q1';

      fsrs.recordQuizResult(quizId, questionId, true, 10000, 0);
      expect(fsrs.successData[`${quizId}-${questionId}`].count).toBe(1);

      fsrs.recordQuizResult(quizId, questionId + 'b', false, 15000, 0);
      expect(fsrs.failureData[`${quizId}-${questionId}b`].count).toBe(1);
    });
  });

  describe('Statistics and Reporting', () => {
    beforeEach(() => {
      fsrs.updateCard('card1', 4, 10000);
      fsrs.updateCard('card2', 3, 15000);
      fsrs.updateCard('card3', 2, 12000);

      fsrs.cards['card1'].interval = 10;

      fsrs.cards['card2'].dueDate = new Date('2026-01-01').toISOString();
    });

    test('should calculate card statistics', () => {
      const stats = fsrs.getCardStats();

      expect(stats.total).toBe(3);
      expect(stats.learned).toBeGreaterThanOrEqual(1);
      expect(parseFloat(stats.mastery)).toBeGreaterThan(0);
      expect(stats.totalReviews).toBe(3);
    });

    test('should calculate learning streak', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      fsrs.cards['card1'].lastReview = today.toISOString();
      fsrs.cards['card2'].lastReview = yesterday.toISOString();

      const streak = fsrs.getStreak();
      expect(streak).toBeGreaterThanOrEqual(1);
    });

    test('should calculate retention statistics', () => {
      fsrs.cards['card1'].lapses = 0;
      fsrs.cards['card2'].lapses = 0;
      fsrs.cards['card3'].lapses = 2;

      const stats = fsrs.getRetentionStats();

      expect(stats.totalReviews).toBe(3);
      expect(stats.totalLapses).toBe(2);
      expect(parseFloat(stats.retentionRate)).toBeGreaterThan(0);
    });
  });

  describe('Practice Suggestions', () => {
    beforeEach(() => {
      fsrs.updateCard('hard-overdue', 2, 20000);
      fsrs.cards['hard-overdue'].dueDate = new Date('2026-01-01').toISOString();
      fsrs.cards['hard-overdue'].difficulty = 9;

      fsrs.updateCard('medium-overdue', 3, 15000);
      fsrs.cards['medium-overdue'].dueDate = new Date('2026-01-05').toISOString();
      fsrs.cards['medium-overdue'].difficulty = 6;

      fsrs.updateCard('easy-overdue', 5, 8000);
      fsrs.cards['easy-overdue'].dueDate = new Date('2026-01-08').toISOString();
      fsrs.cards['easy-overdue'].difficulty = 3;
    });

    test('should generate practice suggestions prioritized correctly', () => {
      const suggestions = fsrs.getPracticeSuggestions(10);

      expect(suggestions).toHaveLength(3);
      expect(suggestions.every((s) => s.cardId)).toBe(true);
      expect(suggestions.every((s) => s.dueDate)).toBe(true);
    });

    test('should limit practice suggestions', () => {
      const suggestions = fsrs.getPracticeSuggestions(2);

      expect(suggestions).toHaveLength(2);
    });
  });

  describe('Data Management', () => {
    test('should export data for backup', () => {
      fsrs.updateCard('card1', 4, 10000);

      const exported = fsrs.exportData();

      expect(exported.fsrsData).toBeDefined();
      expect(exported.successData).toBeDefined();
      expect(exported.failureData).toBeDefined();
      expect(exported.exportDate).toBeDefined();
    });

    test('should import data from backup', () => {
      const backupData = {
        fsrsData: {
          'imported-card': {
            id: 'imported-card',
            stability: 8,
            difficulty: 4,
            dueDate: new Date().toISOString(),
            interval: 12,
            reviews: 5,
            lapses: 0,
            lastReview: new Date().toISOString(),
          },
        },
        successData: {},
        failureData: {},
      };

      fsrs.importData(backupData);

      expect(fsrs.cards['imported-card']).toBeDefined();
    });
  });
});
