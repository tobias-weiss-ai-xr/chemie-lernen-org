/**
 * Badges & Achievements System for chemie-lernen.org
 * Gamification to motivate learners through milestones and rewards
 */

class BadgesSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-badges';
    this.badges = {};
    this.achievements = [];
    this.stats = {
      quizzesTaken: 0,
      correctAnswers: 0,
      calculationsDone: 0,
      cardsReviewed: 0,
      daysStreak: 0,
      lastLoginDate: null,
      totalStudyTime: 0, // in seconds
    };
    this.fallbackData = null; // In-memory fallback when localStorage fails

    // Initialize daily streak
    this.checkDailyStreak();
  }

  /**
   * Check and update daily login streak
   */
  checkDailyStreak() {
    const today = new Date().toDateString();
    const lastLogin = this.stats.lastLoginDate;

    if (lastLogin === today) {
      // Already logged in today
      return;
    }

    const lastLoginDate = lastLogin ? new Date(lastLogin) : null;
    const todayDate = new Date();

    if (!lastLoginDate) {
      // First login
      this.stats.daysStreak = 1;
    } else {
      const daysSinceLastLogin = Math.floor((todayDate - lastLoginDate) / (24 * 60 * 60 * 1000));

      if (daysSinceLastLogin === 1) {
        // Continue streak
        this.stats.daysStreak++;
      } else if (daysSinceLastLogin > 1) {
        // Streak broken, reset
        this.stats.daysStreak = 1;
      }
    }

    this.stats.lastLoginDate = today;
    this.save();
  }

  /**
   * Check if user should receive a badge
   * @param {string} badgeId - Badge identifier
   * @param {Object} criteria - Badge criteria
   */
  checkBadge(badgeId, _criteria) {
    const badge = this.getBadgeDefinition(badgeId);
    if (!badge) return false;

    // Already earned?
    if (this.badges[badgeId]) {
      return false;
    }

    // Check criteria
    let earned = false;

    switch (badgeId) {
      case 'first-quizzes':
        earned = this.stats.quizzesTaken >= 1;
        break;
      case 'quiz-master':
        earned = this.stats.quizzesTaken >= 10;
        break;
      case 'scholar':
        earned = this.stats.quizzesTaken >= 25;
        break;
      case 'knowledge-warrior':
        earned = this.stats.quizzesTaken >= 50;
        break;
      case 'perfect-score':
        earned = this.stats.correctAnswers >= 100;
        break;
      case 'calculation-expert':
        earned = this.stats.calculationsDone >= 100;
        break;
      case 'flashcard-warrior':
        earned = this.stats.cardsReviewed >= 50;
        break;
      case 'daily-practitioner':
        earned = this.stats.daysStreak >= 7;
        break;
      case 'week-warrior':
        earned = this.stats.daysStreak >= 30;
        break;
      case 'master-student':
        earned = this.stats.daysStreak >= 100;
        break;
      case 'study-buddy':
        earned = this.stats.totalStudyTime >= 3600; // 1 hour
        break;
      case 'dedicated-learner':
        earned = this.stats.totalStudyTime >= 14400; // 4 hours
        break;
      case 'all-rounder':
        earned =
          this.stats.quizzesTaken >= 5 &&
          this.stats.calculationsDone >= 20 &&
          this.stats.cardsReviewed >= 10;
        break;
    }

    if (earned) {
      this.earnBadge(badgeId);
      return true;
    }

    return false;
  }

  /**
   * Earn a badge
   * @param {string} badgeId - Badge identifier
   */
  earnBadge(badgeId) {
    const badge = this.getBadgeDefinition(badgeId);
    if (!badge) return;

    this.badges[badgeId] = {
      ...badge,
      earnedAt: new Date().toISOString(),
      streak: this.stats.daysStreak,
    };

    this.save();

    // Dispatch event for UI updates (browser only)
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('badgeEarned', {
          detail: { badge: this.badges[badgeId] },
        })
      );
    }
  }

  /**
   * Get badge definition
   * @param {string} badgeId - Badge identifier
   * @returns {Object|null} Badge definition
   */
  getBadgeDefinition(badgeId) {
    const badges = {
      // Quiz badges
      'first-quizzes': {
        id: 'first-quizzes',
        title: '🎯 Erste Schritte',
        description: 'Nimm an deinem ersten Quiz teil',
        icon: '🎯',
        category: 'Quizzes',
        rarity: 'common',
        unlockPercentage: 100,
        criteria: { quizzesTaken: 1 },
      },
      'quiz-master': {
        id: 'quiz-master',
        title: '📝 Quiz-Meister',
        description: 'Nimm an 10 Quizzes teil',
        icon: '📝',
        category: 'Quizzes',
        rarity: 'uncommon',
        unlockPercentage: 100,
        criteria: { quizzesTaken: 10 },
      },
      scholar: {
        id: 'scholar',
        title: '🎓 Wissensdurstiger',
        description: 'Nimm an 25 Quizzes teil',
        icon: '🎓',
        category: 'Quizzes',
        rarity: 'rare',
        unlockPercentage: 100,
        criteria: { quizzesTaken: 25 },
      },
      'knowledge-warrior': {
        id: 'knowledge-warrior',
        title: '⚔️ Wissens-Krieger',
        description: 'Nimm an 50 Quizzes teil',
        icon: '⚔️',
        category: 'Quizzes',
        rarity: 'epic',
        unlockPercentage: 100,
        criteria: { quizzesTaken: 50 },
      },
      'perfect-score': {
        id: 'perfect-score',
        title: '✨ Perfekter Punktkontroller',
        description: 'Beantworte 100 Fragen richtig',
        icon: '✨',
        category: 'Leistungen',
        rarity: 'rare',
        unlockPercentage: 100,
        criteria: { correctAnswers: 100 },
      },

      // Calculator badges
      'calculation-expert': {
        id: 'calculation-expert',
        title: '🧮 Rechen-Experte',
        description: 'Führe 100 Berechnungen durch',
        icon: '🧮',
        category: 'Rechner',
        rarity: 'uncommon',
        unlockPercentage: 100,
        criteria: { calculationsDone: 100 },
      },

      // Flashcard badges
      'flashcard-warrior': {
        id: 'flashcard-warrior',
        title: '📇 Karteikarten-Krieger',
        description: 'Überprüfe 50 Karteikarten',
        icon: '📇',
        category: 'Karteikarten',
        rarity: 'uncommon',
        unlockPercentage: 100,
        criteria: { cardsReviewed: 50 },
      },

      // Streak badges
      'daily-practitioner': {
        id: 'daily-practitioner',
        title: '📅 Täglich Praktizierend',
        description: 'Habe 7 Tage in Folge eingeloggt',
        icon: '📅',
        category: 'Streaks',
        rarity: 'rare',
        unlockPercentage: 100,
        criteria: { daysStreak: 7 },
      },
      'week-warrior': {
        id: 'week-warrior',
        title: '🗓️ Wochen-Kämpfer',
        description: 'Habe 30 Tage in Folge eingeloggt',
        icon: '🗓️',
        category: 'Streaks',
        rarity: 'epic',
        unlockPercentage: 100,
        criteria: { daysStreak: 30 },
      },
      'master-student': {
        id: 'master-student',
        title: '🏆 Meister-Student',
        description: 'Habe 100 Tage in Folge eingeloggt',
        icon: '🏆',
        category: 'Streaks',
        rarity: 'legendary',
        unlockPercentage: 100,
        criteria: { daysStreak: 100 },
      },

      // Study time badges
      'study-buddy': {
        id: 'study-buddy',
        title: '📚 Studierkamerad',
        description: 'Lerne insgesamt 1 Stunde',
        icon: '📚',
        category: 'Lernzeit',
        rarity: 'common',
        unlockPercentage: 100,
        criteria: { totalStudyTime: 3600 },
      },
      'dedicated-learner': {
        id: 'dedicated-learner',
        title: '🔥 Engagierter Lernender',
        description: 'Lerne insgesamt 4 Stunden',
        icon: '🔥',
        category: 'Lernzeit',
        rarity: 'rare',
        unlockPercentage: 100,
        criteria: { totalStudyTime: 14400 },
      },

      // All-rounder badge
      'all-rounder': {
        id: 'all-rounder',
        title: '🌟 Allrounder',
        description: 'Nutze alle Lernfunktionen',
        icon: '🌟',
        category: 'Besondere',
        rarity: 'legendary',
        unlockPercentage: 100,
        criteria: { quizzesTaken: 5, calculationsDone: 20, cardsReviewed: 10 },
      },
    };

    return badges[badgeId] || null;
  }

  /**
   * Get all earned badges
   */
  getEarnedBadges() {
    return Object.values(this.badges);
  }

  /**
   * Get unearned badge progress using centralized definitions
   * @returns {Array} Badges that haven't been earned yet
   */
  getUnearnedBadges() {
    const allBadgeIds = [
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
    const earnedIds = Object.keys(this.badges);

    return allBadgeIds
      .filter((id) => !earnedIds.includes(id))
      .map((id) => {
        const badgeDef = this.getBadgeDefinition(id);
        if (!badgeDef) return null;
        return {
          ...badgeDef,
          progress: this.calculateBadgeProgress(badgeDef),
        };
      })
      .filter(Boolean);
  }

  /**
   * Calculate progress toward a badge
   */
  calculateBadgeProgress(badge) {
    const criteria = badge.criteria;
    let current = 0;
    let required = 0;

    for (const [key, value] of Object.entries(criteria)) {
      current = this.stats[key] || 0;
      required = value;
    }

    return {
      current,
      required,
      percentage: Math.min(100, Math.round((current / required) * 100)),
    };
  }

  /**
   * Track quiz participation
   */
  trackQuizTaken() {
    this.stats.quizzesTaken++;
    this.checkBadge('first-quizzes');
    this.checkBadge('quiz-master');
    this.checkBadge('scholar');
    this.checkBadge('knowledge-warrior');
    this.save();

    return this.stats.quizzesTaken;
  }

  /**
   * Track correct answer
   */
  trackCorrectAnswer() {
    this.stats.correctAnswers++;
    this.checkBadge('perfect-score');
    this.checkBadge('all-rounder');
    this.save();

    return this.stats.correctAnswers;
  }

  /**
   * Track calculation
   */
  trackCalculation() {
    this.stats.calculationsDone++;
    this.checkBadge('calculation-expert');
    this.checkBadge('all-rounder');
    this.save();

    return this.stats.calculationsDone;
  }

  /**
   * Track flashcard review
   */
  trackFlashcardReview() {
    this.stats.cardsReviewed++;
    this.checkBadge('flashcard-warrior');
    this.checkBadge('all-rounder');
    this.save();

    return this.stats.cardsReviewed;
  }

  /**
   * Track study time
   * @param {number} seconds - Seconds to add (must be positive)
   * @returns {number} Total study time in seconds
   */
  trackStudyTime(seconds) {
    if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0) {
      console.warn('trackStudyTime: Invalid seconds value, must be a positive number');
      return this.stats.totalStudyTime;
    }

    this.stats.totalStudyTime += seconds;
    this.checkBadge('study-buddy');
    this.checkBadge('dedicated-learner');
    this.save();

    return this.stats.totalStudyTime;
  }

  /**
   * Add study session (convenience method)
   * @param {number} minutes - Minutes to add (must be positive)
   * @returns {number} Total study time in seconds
   */
  addStudySession(minutes) {
    if (typeof minutes !== 'number' || !isFinite(minutes) || minutes < 0) {
      console.warn('addStudySession: Invalid minutes value, must be a positive number');
      return this.stats.totalStudyTime;
    }
    return this.trackStudyTime(minutes * 60);
  }

  /**
   * Get user statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get earned badge count
   */
  getEarnedCount() {
    return Object.keys(this.badges).length;
  }

  /**
   * Get total badges available
   */
  getTotalBadgesCount() {
    return 17; // Count of all badge definitions
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage() {
    const total = this.getTotalBadgesCount();
    const earned = this.getEarnedCount();
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  }

  /**
   * Reset all progress
   */
  resetAll() {
    this.badges = {};
    this.achievements = [];
    this.stats = {
      quizzesTaken: 0,
      correctAnswers: 0,
      calculationsDone: 0,
      cardsReviewed: 0,
      daysStreak: 0,
      lastLoginDate: null,
      totalStudyTime: 0,
    };
    this.save();
  }

  /**
   * Reset streak
   */
  resetStreak() {
    this.stats.daysStreak = 0;
    this.save();
  }

  /**
   * Save to localStorage
   */
  save() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, saving to in-memory fallback');
      this.fallbackData = {
        badges: this.badges,
        stats: { ...this.stats },
      };
      return;
    }

    try {
      const data = {
        badges: this.badges,
        stats: this.stats,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Update fallback data on successful save
      this.fallbackData = {
        badges: JSON.parse(JSON.stringify(this.badges)),
        stats: { ...this.stats },
      };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Using in-memory fallback:', error);
        this.fallbackData = {
          badges: this.badges,
          stats: { ...this.stats },
        };
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        this.fallbackData = {
          badges: this.badges,
          stats: { ...this.stats },
        };
      } else {
        console.error('Error saving badges:', error);
        this.fallbackData = {
          badges: this.badges,
          stats: { ...this.stats },
        };
      }
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, using in-memory fallback');
      if (this.fallbackData) {
        this.badges = this.fallbackData.badges || {};
        this.stats = { ...this.stats, ...this.fallbackData.stats };
      }
      return;
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.badges = parsed.badges || {};
        this.stats = { ...this.stats, ...parsed.stats };
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded:', error);
        if (this.fallbackData) {
          console.warn('Using saved fallback data due to quota exceeded');
          this.badges = this.fallbackData.badges || {};
          this.stats = { ...this.stats, ...this.fallbackData.stats };
        }
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        if (this.fallbackData) {
          this.badges = this.fallbackData.badges || {};
          this.stats = { ...this.stats, ...this.fallbackData.stats };
        }
      } else {
        console.error('Error loading badges:', error);
      }
    }
  }

  /**
   * Export progress
   */
  exportProgress() {
    return {
      badges: this.badges,
      stats: { ...this.stats },
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import progress
   */
  importProgress(json) {
    try {
      this.badges = json.badges || {};
      this.stats = json.stats || this.stats;
      this.save();
      return { success: true };
    } catch (e) {
      console.error('Error importing progress:', e);
      return { success: false, error: e.message };
    }
  }
}

// Global badges instance
const chemieBadges = new BadgesSystem({
  storageKey: 'chemie-lernen-badges',
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BadgesSystem, chemieBadges };
}

// Initialize on load
chemieBadges.load();
