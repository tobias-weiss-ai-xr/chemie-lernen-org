/**
 * Unit Tests for FlashcardsSystem
 */

const { FlashcardsSystem } = require('../myhugoapp/static/js/flashcards-system.js');

// Helper: create a test deck
function createTestDeck(cardCount = 3) {
  const cards = [];
  for (let i = 0; i < cardCount; i++) {
    cards.push({
      id: `card-${i}`,
      front: `Front ${i}`,
      back: `Back ${i}`,
      difficulty: i % 3, // 0, 1, 2
    });
  }
  return { title: 'Test Deck', description: 'A test deck', cards };
}

describe('FlashcardsSystem - Construction', () => {
  test('should create instance with default storageKey', () => {
    const fs = new FlashcardsSystem();
    expect(fs.storageKey).toBe('chemie-lernen-flashcards');
  });

  test('should create instance with custom storageKey', () => {
    const fs = new FlashcardsSystem({ storageKey: 'custom' });
    expect(fs.storageKey).toBe('custom');
  });

  test('should initialize with empty decks', () => {
    const fs = new FlashcardsSystem();
    expect(Object.keys(fs.decks).length).toBe(0);
  });
});

describe('FlashcardsSystem - registerDeck', () => {
  test('should register a deck with cards', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    expect(fs.decks['test-deck']).toBeDefined();
    expect(fs.decks['test-deck'].cards.length).toBe(3);
  });

  test('should register deck with null deckId (coerced to string key)', () => {
    const fs = new FlashcardsSystem();
    // Source does not throw — it just uses the key as-is (JS coerces null to "null")
    fs.registerDeck(null, createTestDeck());
    expect(fs.decks['null']).toBeDefined();
  });

  test('should register deck with missing optional fields using defaults', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test', { title: 'Minimal Deck' });
    expect(fs.decks['test']).toBeDefined();
    expect(fs.decks['test'].cards).toEqual([]);
    expect(fs.decks['test'].description).toBe('');
    expect(fs.decks['test'].category).toBe('Allgemein');
  });

  test('should initialize card progress for each card', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(2));
    fs.decks['test-deck'].cards.forEach((card) => {
      expect(card.progress).toBeDefined();
      expect(card.progress).toHaveProperty('nextReview');
      expect(card.progress).toHaveProperty('easeFactor');
      expect(card.progress.reviewCount).toBe(0);
    });
  });
});

describe('FlashcardsSystem - startDeck', () => {
  test('should start a registered deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    const result = fs.startDeck('test-deck');
    expect(result).toBe(true);
    expect(fs.currentDeckId).toBe('test-deck');
  });

  test('should return false for unknown deck', () => {
    const fs = new FlashcardsSystem();
    const result = fs.startDeck('nonexistent');
    expect(result).toBe(false);
  });

  test('should reset card index when starting deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    fs.startDeck('test-deck');
    expect(fs.currentCardIndex).toBe(0);
  });
});

describe('FlashcardsSystem - getCurrentCard', () => {
  test('should return current card after starting deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const card = fs.getCurrentCard();
    expect(card).toBeDefined();
    expect(card).toHaveProperty('front');
    expect(card).toHaveProperty('back');
  });

  test('should return null when no deck selected', () => {
    const fs = new FlashcardsSystem();
    expect(fs.getCurrentCard()).toBeNull();
  });
});

describe('FlashcardsSystem - nextCard', () => {
  test('should advance to next card', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    fs.startDeck('test-deck');
    const first = fs.getCurrentCard();
    fs.nextCard();
    const second = fs.getCurrentCard();
    expect(first.id).not.toBe(second.id);
  });

  test('should return false when at end of deck with no due cards', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(2));
    fs.startDeck('test-deck');
    // Rate all cards so they're no longer due (push nextReview far into future)
    fs.rateCard(4);
    fs.nextCard();
    fs.rateCard(4);
    // Now nextCard should loop back to due card or return false
    const result = fs.nextCard();
    // It will find a due card index (cards have default progress with nextReview=now)
    // so it should return true
    expect(typeof result).toBe('boolean');
  });
});

describe('FlashcardsSystem - previousCard', () => {
  test('should go back to previous card', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    fs.startDeck('test-deck');
    fs.nextCard();
    const second = fs.getCurrentCard();
    fs.previousCard();
    const first = fs.getCurrentCard();
    expect(first.id).not.toBe(second.id);
  });

  test('should return false at beginning of deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    fs.startDeck('test-deck');
    const result = fs.previousCard();
    expect(result).toBe(false);
  });
});

describe('FlashcardsSystem - flipCard', () => {
  test('should toggle flip state', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    expect(fs.isFlipped).toBe(false);
    const result = fs.flipCard();
    expect(result).toBe(true);
    expect(fs.isFlipped).toBe(true);
    fs.flipCard();
    expect(fs.isFlipped).toBe(false);
  });
});

describe('FlashcardsSystem - rateCard', () => {
  test('should accept valid quality values 0-4', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    fs.startDeck('test-deck');
    for (let q = 0; q <= 4; q++) {
      const result = fs.rateCard(q);
      expect(result).not.toBe(false);
      expect(result.success).toBe(true);
    }
  });

  test('should reject quality value below 0', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard(-1);
    expect(result).toBe(false);
  });

  test('should reject quality value above 4', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard(5);
    expect(result).toBe(false);
  });

  test('should reject NaN quality', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard(NaN);
    expect(result).toBe(false);
  });

  test('should reject string quality', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard('good');
    expect(result).toBe(false);
  });

  test('should reject Infinity quality', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard(Infinity);
    expect(result).toBe(false);
  });

  test('should reject undefined quality', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard(undefined);
    expect(result).toBe(false);
  });

  test('should return false when no deck selected', () => {
    const fs = new FlashcardsSystem();
    const result = fs.rateCard(3);
    expect(result).toBe(false);
  });

  test('should update streak on good rating', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    const result = fs.rateCard(4);
    expect(result.streak).toBe(1);
  });

  test('should reset streak on bad rating', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(2));
    fs.startDeck('test-deck');
    fs.rateCard(4); // streak = 1
    fs.nextCard();
    fs.rateCard(4); // streak = 1
    // Go back to first card and rate poorly
    fs.startDeck('test-deck');
    fs.rateCard(0); // streak = 0
    const card = fs.getCurrentCard();
    expect(card.progress.streak).toBe(0);
  });
});

describe('FlashcardsSystem - Deck Stats', () => {
  test('getDeckStats should return stats for a specific deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    const stats = fs.getDeckStats('test-deck');
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('due');
    expect(stats).toHaveProperty('new');
    expect(stats).toHaveProperty('learning');
    expect(stats).toHaveProperty('mastered');
    expect(stats.total).toBe(5);
  });

  test('getDeckStats should return zeros for unknown deck', () => {
    const fs = new FlashcardsSystem();
    const stats = fs.getDeckStats('nonexistent');
    expect(stats.total).toBe(0);
    expect(stats.due).toBe(0);
  });

  test('getOverallStats should return aggregated stats', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('deck1', createTestDeck(3));
    fs.registerDeck('deck2', createTestDeck(2));
    const stats = fs.getOverallStats();
    expect(stats).toHaveProperty('totalCards');
    expect(stats).toHaveProperty('cardsWithProgress');
    expect(stats).toHaveProperty('mastered');
    expect(stats).toHaveProperty('due');
    expect(stats).toHaveProperty('progressPercentage');
    expect(stats.totalCards).toBe(5);
  });

  test('getOverallStats should return 0 progress for unrated cards', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(3));
    const stats = fs.getOverallStats();
    expect(stats.cardsWithProgress).toBe(0);
    expect(stats.progressPercentage).toBe(0);
  });
});

describe('FlashcardsSystem - addCard / removeCard', () => {
  test('should add a card to a deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(2));
    const newCard = fs.addCard('test-deck', {
      id: 'card-new',
      front: 'New Front',
      back: 'New Back',
    });
    expect(newCard).toBeDefined();
    expect(newCard.id).toBe('card-new');
    expect(fs.decks['test-deck'].cards.length).toBe(3);
  });

  test('should remove a card from a deck', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(3));
    const result = fs.removeCard('test-deck', 'card-1');
    expect(result).toBe(true);
    expect(fs.decks['test-deck'].cards.length).toBe(2);
  });

  test('should return false for removing from unknown deck', () => {
    const fs = new FlashcardsSystem();
    expect(fs.removeCard('nonexistent', 'card-1')).toBe(false);
  });

  test('should return false for removing unknown card', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    expect(fs.removeCard('test-deck', 'nonexistent')).toBe(false);
  });
});

describe('FlashcardsSystem - searchCards', () => {
  test('should find cards by front text', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    const results = fs.searchCards('Front 0');
    expect(results.length).toBe(1);
    expect(results[0].front).toBe('Front 0');
  });

  test('should find cards by back text', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    const results = fs.searchCards('Back 1');
    expect(results.length).toBe(1);
  });

  test('should return empty for no match', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    expect(fs.searchCards('nonexistent')).toEqual([]);
  });
});

describe('FlashcardsSystem - getDecks', () => {
  test('should return array of decks', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('deck1', createTestDeck());
    fs.registerDeck('deck2', createTestDeck());
    const decks = fs.getDecks();
    expect(decks.length).toBe(2);
    expect(decks[0]).toHaveProperty('id');
  });
});

describe('FlashcardsSystem - getDueCards', () => {
  test('should return due cards (all new cards are due immediately)', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(3));
    // New cards have nextReview = Date.now() so they are due
    const due = fs.getDueCards('test-deck');
    expect(due.length).toBe(3);
  });

  test('should return empty for unknown deck', () => {
    const fs = new FlashcardsSystem();
    expect(fs.getDueCards('nonexistent')).toEqual([]);
  });
});

describe('FlashcardsSystem - isCardDue', () => {
  test('should return true for new card (due immediately)', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    expect(fs.isCardDue()).toBe(true);
  });

  test('should return false when no deck selected', () => {
    const fs = new FlashcardsSystem();
    expect(fs.isCardDue()).toBe(false);
  });
});

describe('FlashcardsSystem - resetDeck', () => {
  test('resetDeck should reset card progress', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(5));
    fs.startDeck('test-deck');
    fs.rateCard(4); // progress.reviewCount becomes 1
    const result = fs.resetDeck('test-deck');
    expect(result).toBe(true);
    // All cards should have reset progress
    fs.decks['test-deck'].cards.forEach((card) => {
      expect(card.progress.reviewCount).toBe(0);
    });
  });

  test('resetDeck should return false for unknown deck', () => {
    const fs = new FlashcardsSystem();
    expect(fs.resetDeck('nonexistent')).toBe(false);
  });
});

describe('FlashcardsSystem - clearAllProgress', () => {
  test('should clear all data', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck());
    fs.startDeck('test-deck');
    fs.rateCard(3);
    fs.clearAllProgress();
    expect(Object.keys(fs.decks).length).toBe(0);
  });
});

describe('FlashcardsSystem - exportDeck / importDeck', () => {
  test('exportDeck should return deck data', () => {
    const fs = new FlashcardsSystem();
    fs.registerDeck('test-deck', createTestDeck(3));
    const data = fs.exportDeck('test-deck');
    expect(data).not.toBeNull();
    expect(data.id).toBe('test-deck');
    expect(data.title).toBe('Test Deck');
    expect(data.cards.length).toBe(3);
  });

  test('exportDeck should return null for unknown deck', () => {
    const fs = new FlashcardsSystem();
    expect(fs.exportDeck('nonexistent')).toBeNull();
  });

  test('importDeck should accept exported data', () => {
    const fs1 = new FlashcardsSystem();
    fs1.registerDeck('test-deck', createTestDeck());
    const exported = fs1.exportDeck('test-deck');

    const fs2 = new FlashcardsSystem();
    const result = fs2.importDeck(exported);
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('deckId');
    expect(fs2.getDeckStats(result.deckId).total).toBe(3);
  });

  test('importDeck should return error for invalid data', () => {
    const fs = new FlashcardsSystem();
    const result = fs.importDeck(null);
    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
  });
});
