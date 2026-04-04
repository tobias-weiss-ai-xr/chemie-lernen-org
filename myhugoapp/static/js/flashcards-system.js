/**
 * Flashcards System for chemie-lernen.org
 * Interactive flashcards with spaced repetition algorithm
 */

class FlashcardsSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-flashcards';
    this.decks = {};
    this.currentDeckId = null;
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.reviewsToday = 0;
    this.lastReviewDate = null;
    this.fallbackData = null; // In-memory fallback when localStorage fails

    // Initialize review tracking
    const today = new Date().toDateString();
    if (this.lastReviewDate !== today) {
      this.reviewsToday = 0;
      this.lastReviewDate = today;
    }
  }

  /**
   * Register a flashcard deck
   */
  registerDeck(deckId, deckData) {
    this.decks[deckId] = {
      id: deckId,
      title: deckData.title,
      description: deckData.description || '',
      cards: deckData.cards || [],
      category: deckData.category || 'Allgemein',
    };

    // Initialize card progress if not exists
    this.decks[deckId].cards.forEach((card) => {
      if (!card.progress) {
        card.progress = this.getDefaultCardProgress();
      }
    });

    this.saveProgress();
  }

  /**
   * Get default card progression state
   */
  getDefaultCardProgress() {
    return {
      nextReview: Date.now(), // Due immediately
      easeFactor: 2.5, // Leitner algorithm starter
      reviewCount: 0,
      lastReviewDate: null,
      streak: 0,
      mastered: false,
    };
  }

  /**
   * Load card progress from localStorage
   */
  loadProgress() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, using in-memory fallback');
      return this.fallbackData || {};
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded:', error);
        // Use fallback data if available
        if (this.fallbackData) {
          console.warn('Using saved fallback data due to quota exceeded');
          return this.fallbackData;
        }
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
      } else {
        console.error('Error loading flashcards progress:', error);
      }
      return {};
    }
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, saving to in-memory fallback');
      this.fallbackData = {
        decks: this.decks,
        reviewsToday: this.reviewsToday,
        lastReviewDate: this.lastReviewDate,
      };
      return;
    }

    try {
      const data = {
        decks: this.decks,
        reviewsToday: this.reviewsToday,
        lastReviewDate: this.lastReviewDate,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Update fallback data on successful save
      this.fallbackData = JSON.parse(JSON.stringify(data));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error(
          'Storage quota exceeded. Clearing old data or using in-memory fallback:',
          error
        );

        // Attempt to clear old data and retry
        try {
          const currentData = localStorage.getItem(this.storageKey);
          if (currentData) {
            localStorage.removeItem(this.storageKey);
            // Retry with simpler data structure
            const minimalData = {
              decks: {},
              reviewsToday: this.reviewsToday,
              lastReviewDate: this.lastReviewDate,
            };
            localStorage.setItem(this.storageKey, JSON.stringify(minimalData));
            console.warn('Successfully saved minimal data after clearing old data');
          }
        } catch (retryError) {
          console.error('Retry failed, using in-memory fallback:', retryError);
          this.fallbackData = {
            decks: this.decks,
            reviewsToday: this.reviewsToday,
            lastReviewDate: this.lastReviewDate,
          };
        }
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        // Use in-memory fallback
        this.fallbackData = {
          decks: this.decks,
          reviewsToday: this.reviewsToday,
          lastReviewDate: this.lastReviewDate,
        };
      } else {
        console.error('Error saving flashcards progress:', error);
        // Update fallback even on other errors
        this.fallbackData = {
          decks: this.decks,
          reviewsToday: this.reviewsToday,
          lastReviewDate: this.lastReviewDate,
        };
      }
    }
  }

  /**
   * Start a deck
   */
  startDeck(deckId) {
    const deck = this.decks[deckId];
    if (!deck) {
      console.error(`Flashcard deck ${deckId} not found`);
      return false;
    }

    this.currentDeckId = deckId;
    this.currentCardIndex = 0;
    this.isFlipped = false;

    // Find first due card
    const dueIndex = this.findDueCardIndex();
    if (dueIndex !== -1) {
      this.currentCardIndex = dueIndex;
    }

    return true;
  }

  /**
   * Find index of next due card
   */
  findDueCardIndex() {
    const deck = this.decks[this.currentDeckId];
    if (!deck) return -1;

    const now = Date.now();
    for (let i = 0; i < deck.cards.length; i++) {
      if (deck.cards[i].progress.nextReview <= now) {
        return i;
      }
    }
    return 0; // Return first card if none due
  }

  /**
   * Get current card
   */
  getCurrentCard() {
    const deck = this.decks[this.currentDeckId];
    if (!deck || deck.cards.length === 0) return null;
    return deck.cards[this.currentCardIndex];
  }

  /**
   * Check if current card is due for review
   */
  isCardDue() {
    const card = this.getCurrentCard();
    if (!card) return false;
    return card.progress.nextReview <= Date.now();
  }

  /**
   * Flip current card
   */
  flipCard() {
    this.isFlipped = !this.isFlipped;
    return this.isFlipped;
  }

  /**
   * Rate current card (spaced repetition)
   * @param {number} quality - 0-4 rating (0=forget, 4=perfect)
   */
  rateCard(quality) {
    const card = this.getCurrentCard();
    const deck = this.decks[this.currentDeckId];

    if (!card || !deck) return false;

    // Validate quality parameter (must be 0-4)
    if (typeof quality !== 'number' || !Number.isFinite(quality) || quality < 0 || quality > 4) {
      console.warn('rateCard: quality must be a number between 0 and 4, got:', quality);
      return false;
    }

    // Get or create progress
    const progress = card.progress || this.getDefaultCardProgress();

    // Update progress based on quality (Leitner algorithm)
    const easeFactorChange = this.calculateEaseFactorChange(quality);
    progress.easeFactor = Math.max(1.3, progress.easeFactor + easeFactorChange);

    progress.reviewCount++;
    progress.lastReviewDate = new Date().toISOString();

    if (quality >= 3) {
      progress.streak++;
      progress.mastered = progress.streak >= 10;
    } else {
      progress.streak = 0;
      progress.mastered = false;
    }

    // Calculate next review interval (in milliseconds)
    const nextReviewTime = this.calculateNextReview(progress, quality);
    progress.nextReview = Date.now() + nextReviewTime;

    // Update review tracking
    const today = new Date().toDateString();
    if (this.lastReviewDate !== today) {
      this.reviewsToday = 0;
      this.lastReviewDate = today;
    }
    this.reviewsToday++;

    this.saveProgress();

    return {
      success: true,
      nextReview: new Date(progress.nextReview),
      easeFactor: progress.easeFactor,
      reviewCount: progress.reviewCount,
      streak: progress.streak,
      mastered: progress.mastered,
    };
  }

  /**
   * Calculate ease factor change based on rating
   */
  calculateEaseFactorChange(quality) {
    switch (quality) {
      case 0: // Forgot completely
        return -0.3;
      case 1: // Very difficult
        return -0.1;
      case 2: // Difficult
        return 0;
      case 3: // Good
        return 0.1;
      case 4: // Perfect
        return 0.15;
      default:
        return 0;
    }
  }

  /**
   * Calculate next review time based on quality
   */
  calculateNextReview(progress, quality) {
    const baseInterval = 1; // Days

    if (quality <= 1) {
      // Reset to immediate review
      return baseInterval * 24 * 60 * 60 * 1000; // 2 days
    }

    // SM-2 inspired algorithm
    let interval = baseInterval;
    if (progress.reviewCount > 0) {
      interval = this.getNextInterval(progress, quality);
    } else {
      interval = baseInterval;
    }

    // Round to nearest hour
    interval = Math.round(interval / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000;

    return interval;
  }

  /**
   * Get next review interval in days
   */
  getNextInterval(progress, quality) {
    if (quality === 0) {
      return 1; // 1 day
    }

    const interval = progress.reviewCount > 0 ? progress.reviewCount * progress.easeFactor : 1;

    return Math.max(1, Math.round(interval));
  }

  /**
   * Move to next card
   */
  nextCard() {
    const deck = this.decks[this.currentDeckId];
    if (!deck || deck.cards.length === 0) return false;

    if (this.currentCardIndex < deck.cards.length - 1) {
      this.currentCardIndex++;
      this.isFlipped = false;
      return true;
    }

    // Reached end - loop back to first due card
    const dueIndex = this.findDueCardIndex();
    if (dueIndex !== -1) {
      this.currentCardIndex = dueIndex;
      this.isFlipped = false;
      return true;
    }

    return false;
  }

  /**
   * Move to previous card
   */
  previousCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      this.isFlipped = false;
      return true;
    }
    return false;
  }

  /**
   * Add new card to deck
   */
  addCard(deckId, cardData) {
    const deck = this.decks[deckId];
    if (!deck) return false;

    const newCard = {
      id: cardData.id || `card-${Date.now()}`,
      front: cardData.front,
      back: cardData.back,
      category: cardData.category || deck.category,
      progress: this.getDefaultCardProgress(),
      createdAt: new Date().toISOString(),
    };

    deck.cards.push(newCard);
    this.saveProgress();

    return newCard;
  }

  /**
   * Remove card from deck
   */
  removeCard(deckId, cardId) {
    const deck = this.decks[deckId];
    if (!deck) return false;

    const index = deck.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      deck.cards.splice(index, 1);

      // Adjust current index if needed
      if (this.currentDeckId === deckId && this.currentCardIndex >= deck.cards.length) {
        this.currentCardIndex = Math.max(0, deck.cards.length - 1);
      }

      this.saveProgress();
      return true;
    }
    return false;
  }

  /**
   * Get deck statistics
   */
  getDeckStats(deckId) {
    const deck = this.decks[deckId];
    if (!deck || deck.cards.length === 0) {
      return {
        total: 0,
        due: 0,
        new: 0,
        learning: 0,
        mastered: 0,
      };
    }

    const now = Date.now();
    let due = 0;
    let newCards = 0;
    let learning = 0;
    let mastered = 0;

    deck.cards.forEach((card) => {
      if (card.progress.reviewCount === 0) {
        newCards++;
      } else if (card.progress.nextReview <= now) {
        due++;
      }

      if (card.progress.mastered) {
        mastered++;
      } else if (card.progress.reviewCount > 0) {
        learning++;
      }
    });

    return {
      total: deck.cards.length,
      due,
      new: newCards,
      learning,
      mastered,
    };
  }

  /**
   * Get due cards for deck
   */
  getDueCards(deckId) {
    const deck = this.decks[deckId];
    if (!deck) return [];

    const now = Date.now();
    return deck.cards
      .filter((card) => card.progress.nextReview <= now)
      .map((card) => ({
        ...card,
        streak: card.progress.streak,
      }));
  }

  /**
   * Reset deck progress
   */
  resetDeck(deckId) {
    const deck = this.decks[deckId];
    if (!deck) return false;

    deck.cards.forEach((card) => {
      card.progress = this.getDefaultCardProgress();
    });

    this.saveProgress();
    return true;
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    let totalCards = 0;
    let totalDue = 0;
    let totalMastered = 0;
    let cardsWithProgress = 0;

    Object.values(this.decks).forEach((deck) => {
      totalCards += deck.cards.length;

      deck.cards.forEach((card) => {
        if (card.progress.reviewCount > 0) {
          cardsWithProgress++;
        }
        if (card.progress.mastered) {
          totalMastered++;
        }
        if (card.progress.nextReview <= Date.now()) {
          totalDue++;
        }
      });
    });

    return {
      totalCards,
      cardsWithProgress,
      due: totalDue,
      mastered: totalMastered,
      progressPercentage: totalCards > 0 ? Math.round((cardsWithProgress / totalCards) * 100) : 0,
    };
  }

  /**
   * Get all decks
   */
  getDecks() {
    return Object.values(this.decks);
  }

  /**
   * Search cards in all decks
   */
  searchCards(query) {
    const results = [];
    const searchLower = query.toLowerCase();

    Object.values(this.decks).forEach((deck) => {
      deck.cards.forEach((card) => {
        if (
          card.front.toLowerCase().includes(searchLower) ||
          card.back.toLowerCase().includes(searchLower)
        ) {
          results.push({
            ...card,
            deckTitle: deck.title,
          });
        }
      });
    });

    return results;
  }

  /**
   * Export deck as JSON
   */
  exportDeck(deckId) {
    const deck = this.decks[deckId];
    if (!deck) return null;

    return {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      category: deck.category,
      cards: deck.cards.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        category: card.category,
      })),
    };
  }

  /**
   * Import deck from JSON
   */
  importDeck(json) {
    try {
      const deckData = {
        title: json.title,
        description: json.description || '',
        category: json.category || 'Imported',
        cards: json.cards.map((card) => ({
          ...card,
          progress: this.getDefaultCardProgress(),
        })),
      };

      const deckId = `imported-${Date.now()}`;
      this.registerDeck(deckId, deckData);

      return { success: true, deckId };
    } catch (e) {
      console.error('Error importing deck:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Clear all progress
   */
  clearAllProgress() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        if (error.name === 'SecurityError') {
          console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        } else {
          console.error('Error clearing flashcards progress:', error);
        }
      }
    }

    this.decks = {};
    this.reviewsToday = 0;
    this.lastReviewDate = null;
    this.fallbackData = null;
  }
}

// Global flashcards instance
const chemieFlashcards = new FlashcardsSystem({
  storageKey: 'chemie-lernen-flashcards',
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FlashcardsSystem, chemieFlashcards };
}
