/**
 * Spaced Repetition System for chemie-lernen.org
 * FSRS (Free Spaced Repetition Scheduler) based algorithm
 * Optimized memory retention with adaptive scheduling
 */

class SpacedRepetitionSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-fsrs-data';
    this.successKey = options.successKey || 'chemie-lernen-quiz-success';
    this.failureKey = options.failureKey || 'chemie-lernen-quiz-failure';

    // FSRS parameters (default values from original algorithm)
    this.params = {
      request_retention: 0.9,    // Target retention rate (0.7-0.9)
      maximum_interval: 36500,   // Max interval in days (100 years)
      w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05,
          0.34, 1.26, 0.29, 2.61] // Weights for memory calculations
    };

    this.loadData();
    this.successData = this.loadQuizData(this.successKey);
    this.failureData = this.loadQuizData(this.failureKey);
  }

  /**
   * Load FSRS data from localStorage
   */
  loadData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.cards = data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading FSRS data:', e);
      this.cards = {};
    }
  }

  /**
   * Save FSRS data to localStorage
   */
  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cards));
    } catch (e) {
      console.error('Error saving FSRS data:', e);
    }
  }

  /**
   * Load quiz success/failure data
   */
  loadQuizData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error(`Error loading quiz data (${key}):`, e);
      return {};
    }
  }

  /**
   * Save quiz success/failure data
   */
  saveQuizData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving quiz data (${key}):`, e);
    }
  }

  /**
   * Calculate FSRS stability based on card history
   * St = stability (how long memory lasts before forgetting)
   */
  calculateStability(card, quality) {
    const w = this.params.w;
    const lastStability = card.stability || 1;
    const lastDifficulty = card.difficulty || 5;

    // Simplified FSRS calculation
    let newStability;
    if (quality >= 3) {
      // Success
      newStability = lastStability * (1 + (w[8] * (11 - lastDifficulty) * lastStability ** -0.47 +
                   w[9] * (quality - 3) * Math.exp((2 - lastDifficulty) * 0.4) +
                   w[10] * (11 - lastDifficulty) * lastStability ** -0.55 *
                   Math.exp((2 - quality) * 0.4)));
    } else {
      // Failure
      newStability = w[11] * lastDifficulty ** -0.49 * lastStability ** -0.32;
    }

    return Math.max(newStability, 0.1);
  }

  /**
   * Calculate FSRS difficulty based on card history
   * D = difficulty (how hard the card is)
   */
  calculateDifficulty(card, quality) {
    const w = this.params.w;
    const lastDifficulty = card.difficulty || 5;

    let newDifficulty = lastDifficulty - w[5] * (quality - 3);
    newDifficulty = Math.max(1, Math.min(10, newDifficulty));

    return newDifficulty;
  }

  /**
   * Calculate next review interval based on stability
   * I = interval (days until next review)
   */
  calculateInterval(stability) {
    const w = this.params.w;
    const interval = 9 * stability * (1 / this.params.request_retention - 1);
    return Math.min(Math.max(Math.round(interval), 1), this.params.maximum_interval);
  }

  /**
   * Update card with new review data
   * quality: 0-5 (0=blackout, 1=incorrect, 2=difficult, 3=good, 4=easy, 5=perfect)
   */
  updateCard(cardId, quality, timeTaken = null) {
    // Initialize card if doesn't exist
    if (!this.cards[cardId]) {
      this.cards[cardId] = {
        id: cardId,
        stability: 1,
        difficulty: 5,
        dueDate: new Date().toISOString(),
        interval: 0,
        reviews: 0,
        lapses: 0,
        lastReview: null
      };
    }

    const card = this.cards[cardId];
    const dueDate = new Date(card.dueDate);
    const now = new Date();
    const overdueDays = Math.max(0, (now - dueDate) / (1000 * 60 * 60 * 24));

    // Update stability and difficulty
    card.stability = this.calculateStability(card, quality);
    card.difficulty = this.calculateDifficulty(card, quality);

    // Calculate new interval
    card.interval = this.calculateInterval(card.stability);

    // Set next due date
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + card.interval);
    card.dueDate = nextDue.toISOString();

    // Update counts
    card.reviews++;
    if (quality < 3) {
      card.lapses++;
    }

    // Update last review
    card.lastReview = now.toISOString();

    // Track time taken if available
    if (timeTaken) {
      card.timeTaken = timeTaken;
    }

    this.saveData();
    return card;
  }

  /**
   * Get cards due for review
   */
  getDueCards(limit = null) {
    const now = new Date();
    const dueCards = [];

    for (const [cardId, card] of Object.entries(this.cards)) {
      if (new Date(card.dueDate) <= now) {
        dueCards.push({ id: cardId, ...card });
      }
    }

    // Sort by due date (oldest first)
    dueCards.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return limit ? dueCards.slice(0, limit) : dueCards;
  }

  /**
   * Get card statistics
   */
  getCardStats() {
    const totalCards = Object.keys(this.cards).length;
    const dueCards = this.getDueCards();
    const learnedCards = Object.values(this.cards).filter(c => c.interval > 0).length;
    const mastery = totalCards > 0 ? (learnedCards / totalCards) * 100 : 0;

    return {
      total: totalCards,
      due: dueCards.length,
      learned: learnedCards,
      mastery: mastery.toFixed(1),
      lapses: Object.values(this.cards).reduce((sum, c) => sum + c.lapses, 0),
      totalReviews: Object.values(this.cards).reduce((sum, c) => sum + c.reviews, 0)
    };
  }

  /**
   * Convert quiz results to FSRS quality rating
   * Maps quiz performance to FSRS quality scale (0-5)
   */
  quizToQuality(isCorrect, timeTaken, hintsUsed = 0) {
    if (!isCorrect) {
      // Incorrect answers get lower quality based on time taken
      if (timeTaken > 60000) return 0; // Blackout (took >1 min and still wrong)
      if (timeTaken > 30000) return 1; // Incorrect (took >30s)
      return 2; // Difficulty
    } else {
      // Correct answers get higher quality
      if (hintsUsed > 0) return 3; // Good (needed hints)
      if (timeTaken > 10000) return 4; // Easy (took some time)
      return 5; // Perfect (quick correct)
    }
  }

  /**
   * Integrate with quiz system
   * Call this when a user completes a quiz question
   */
  recordQuizResult(quizId, questionId, isCorrect, timeTaken, hintsUsed = 0) {
    const cardId = `${quizId}-${questionId}`;
    const quality = this.quizToQuality(isCorrect, timeTaken, hintsUsed);

    // Update FSRS card
    const updatedCard = this.updateCard(cardId, quality, timeTaken);

    // Also track in legacy quiz success/failure data
    if (isCorrect) {
      if (!this.successData[cardId]) {
        this.successData[cardId] = {
          count: 0,
          lastSuccess: null,
          timeSpent: [],
          streak: 0
        };
      }
      this.successData[cardId].count++;
      this.successData[cardId].lastSuccess = new Date().toISOString();
      this.successData[cardId].timeSpent.push(timeTaken);
      this.saveQuizData(this.successKey, this.successData);
    } else {
      if (!this.failureData[cardId]) {
        this.failureData[cardId] = {
          count: 0,
          lastFailure: null,
          timeSpent: []
        };
      }
      this.failureData[cardId].count++;
      this.failureData[cardId].lastFailure = new Date().toISOString();
      this.failureData[cardId].timeSpent.push(timeTaken);
      this.saveQuizData(this.failureKey, this.failureData);
    }

    return updatedCard;
  }

  /**
   * Get practice suggestions based on due cards
   */
  getPracticeSuggestions(limit = 10) {
    const dueCards = this.getDueCards(limit);

    return dueCards.map(card => ({
      cardId: card.id,
      quizId: card.id.split('-')[0],
      questionId: card.id.split('-').slice(1).join('-'),
      dueDate: new Date(card.dueDate),
      interval: card.interval,
      difficulty: card.difficulty,
      priority: this.calculatePriority(card)
    })).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate review priority for a card
   * Considers difficulty, interval, and lapses
   */
  calculatePriority(card) {
    // Higher priority for more difficult cards
    const difficultyFactor = card.difficulty / 10;

    // Higher priority for cards that haven't been reviewed recently
    const urgencyFactor = 1 / (card.interval + 1);

    // Higher priority for cards with many lapses
    const lapseFactor = Math.min(card.lapses / 5, 1);

    return (difficultyFactor * 0.4) + (urgencyFactor * 0.3) + (lapseFactor * 0.3);
  }

  /**
   * Reset card data
   */
  resetCard(cardId) {
    delete this.cards[cardId];
    this.saveData();
  }

  /**
   * Reset all data
   */
  resetAll() {
    this.cards = {};
    this.saveData();
  }

  /**
   * Export data for backup
   */
  exportData() {
    return {
      fsrsData: this.cards,
      successData: this.successData,
      failureData: this.failureData,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import data from backup
   */
  importData(data) {
    if (data.fsrsData) {
      this.cards = data.fsrsData;
      this.saveData();
    }
    if (data.successData) {
      this.successData = data.successData;
      this.saveQuizData(this.successKey, this.successData);
    }
    if (data.failureData) {
    if (data.fsrsData) {
      this.cards = data.fsrsData;
      this.saveData();
    }
      this.saveQuizData(this.failureKey, this.failureData);
    }
  }

  /**
   * Get learning streak (consecutive days with reviews)
   */
  getStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasReviews = Object.values(this.cards).some(card => {
        if (!card.lastReview) return false;
        const reviewDate = card.lastReview.split('T')[0];
        return reviewDate === dateStr;
      });

      if (hasReviews) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get retention statistics
   */
  getRetentionStats() {
    const totalReviews = Object.values(this.cards).reduce((sum, c) => sum + c.reviews, 0);
    const totalLapses = Object.values(this.cards).reduce((sum, c) => sum + c.lapses, 0);
    const retentionRate = totalReviews > 0 ?
      ((totalReviews - totalLapses) / totalReviews) * 100 : 100;

    return {
      totalReviews,
      totalLapses,
      retentionRate: retentionRate.toFixed(1),
      averageInterval: totalReviews > 0 ?
        (Object.values(this.cards).reduce((sum, c) => sum + c.interval, 0) / Object.keys(this.cards).length).toFixed(1) : 0
    };
  }
}

// Global FSRS instance
const fsrs = new SpacedRepetitionSystem();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpacedRepetitionSystem, fsrs };
}