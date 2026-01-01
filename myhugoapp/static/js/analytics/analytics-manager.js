/**
 * Analytics Manager
 * Tracks user learning progress and provides insights
 */

const AnalyticsManager = {
  // Storage keys
  STORAGE_KEYS: {
    PROGRESS: 'analytics_progress',
    SESSIONS: 'analytics_sessions',
    ACHIEVEMENTS: 'analytics_achievements',
    MISTAKES: 'analytics_mistakes',
    STATS: 'analytics_stats'
  },

  // Current session data
  currentSession: {
    startTime: null,
    calculations: [],
    practiceProblems: [],
    mistakes: []
  },

  /**
   * Initialize analytics manager
   */
  init() {
    this.startSession();
    this.loadAchievements();
  },

  /**
   * Start a new study session
   */
  startSession() {
    this.currentSession = {
      startTime: Date.now(),
      calculations: [],
      practiceProblems: [],
      mistakes: []
    };
  },

  /**
   * End current session and save it
   */
  endSession() {
    if (!this.currentSession.startTime) return;

    const session = {
      ...this.currentSession,
      endTime: Date.now(),
      duration: Date.now() - this.currentSession.startTime
    };

    const sessions = this.getSessions();
    sessions.push(session);
    this.saveData(this.STORAGE_KEYS.SESSIONS, sessions);

    // Update overall stats
    this.updateStats(session);
  },

  /**
   * Track a calculation attempt
   */
  trackCalculation(data) {
    const calculation = {
      timestamp: Date.now(),
      type: data.type,
      inputs: data.inputs,
      result: data.result,
      correct: data.correct !== undefined ? data.correct : true,
      timeSpent: data.timeSpent || 0,
      attempts: data.attempts || 1
    };

    this.currentSession.calculations.push(calculation);

    // Track mistakes if incorrect
    if (!calculation.correct) {
      this.trackMistake({
        type: 'calculation',
        calculationType: data.type,
        inputs: data.inputs,
        timestamp: calculation.timestamp
      });
    }

    this.updateProgress(calculation);
  },

  /**
   * Track a practice problem attempt
   */
  trackPracticeProblem(data) {
    const problem = {
      timestamp: Date.now(),
      type: data.type,
      difficulty: data.difficulty || 'medium',
      correct: data.correct,
      timeSpent: data.timeSpent || 0,
      attempts: data.attempts || 1,
      hintsUsed: data.hintsUsed || 0
    };

    this.currentSession.practiceProblems.push(problem);

    // Track mistakes if incorrect
    if (!problem.correct) {
      this.trackMistake({
        type: 'practice',
        problemType: data.type,
        difficulty: problem.difficulty,
        timestamp: problem.timestamp
      });
    }

    this.updateProgress(problem);
  },

  /**
   * Track a mistake for pattern analysis
   */
  trackMistake(mistake) {
    const enrichedMistake = {
      ...mistake,
      id: `mistake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.currentSession.mistakes.push(enrichedMistake);

    // Save to persistent storage
    const mistakes = this.getMistakes();
    mistakes.push(enrichedMistake);
    this.saveData(this.STORAGE_KEYS.MISTAKES, mistakes);
  },

  /**
   * Update user progress
   */
  updateProgress(activity) {
    const progress = this.getProgress();

    // Update category progress
    const category = activity.type || 'general';
    if (!progress.categories[category]) {
      progress.categories[category] = {
        totalAttempts: 0,
        correctAttempts: 0,
        totalTime: 0,
        lastActivity: activity.timestamp
      };
    }

    progress.categories[category].totalAttempts++;
    if (activity.correct) {
      progress.categories[category].correctAttempts++;
    }
    progress.categories[category].totalTime += activity.timeSpent || 0;
    progress.categories[category].lastActivity = activity.timestamp;

    // Update overall stats
    progress.totalAttempts++;
    if (activity.correct) {
      progress.correctAttempts++;
    }
    progress.totalTime += activity.timeSpent || 0;
    progress.lastActivity = activity.timestamp;

    // Check for level up
    this.checkLevelUp(progress);

    this.saveData(this.STORAGE_KEYS.PROGRESS, progress);
  },

  /**
   * Update overall statistics
   */
  updateStats(session) {
    const stats = this.getStats();

    stats.totalSessions++;
    stats.totalTime += session.duration;

    // Calculate averages
    const calculations = session.calculations.length;
    const practice = session.practiceProblems.length;

    stats.totalCalculations += calculations;
    stats.totalPracticeProblems += practice;

    stats.avgSessionLength = stats.totalTime / stats.totalSessions;

    this.saveData(this.STORAGE_KEYS.STATS, stats);
  },

  /**
   * Check if user should level up
   */
  checkLevelUp(progress) {
    const currentLevel = progress.level || 1;
    const currentXP = progress.xp || 0;
    const xpNeeded = this.getXPForLevel(currentLevel + 1);

    if (currentXP >= xpNeeded) {
      progress.level = currentLevel + 1;
      this.unlockAchievement('level_up', { level: progress.level });
    }
  },

  /**
   * Get XP required for a level
   */
  getXPForLevel(level) {
    // Exponential curve: 100 * 1.5^(level-1)
    return Math.floor(100 * Math.pow(1.5, level - 1));
  },

  /**
   * Calculate XP for an activity
   */
  calculateXP(activity) {
    let xp = 10; // Base XP

    // Bonus for correctness
    if (activity.correct) {
      xp += 20;
    }

    // Bonus for speed
    if (activity.timeSpent && activity.timeSpent < 60) {
      xp += 5;
    }

    // Bonus for difficulty
    if (activity.difficulty === 'hard') {
      xp += 15;
    } else if (activity.difficulty === 'medium') {
      xp += 5;
    }

    // Penalty for multiple attempts
    if (activity.attempts > 1) {
      xp -= (activity.attempts - 1) * 5;
    }

    return Math.max(0, xp);
  },

  /**
   * Unlock an achievement
   */
  unlockAchievement(achievementId, data = {}) {
    const achievements = this.getAchievements();

    // Check if already unlocked
    if (achievements.find(a => a.id === achievementId)) {
      return false;
    }

    const achievement = {
      id: achievementId,
      title: this.getAchievementTitle(achievementId),
      description: this.getAchievementDescription(achievementId, data),
      timestamp: Date.now(),
      data
    };

    achievements.push(achievement);
    this.saveData(this.STORAGE_KEYS.ACHIEVEMENTS, achievements);

    // Dispatch event for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievementUnlocked', {
        detail: achievement
      }));
    }

    return true;
  },

  /**
   * Get achievement title
   */
  getAchievementTitle(achievementId) {
    const titles = {
      first_calculation: 'First Steps',
      perfect_score: 'Perfect Score',
      streak_10: 'On Fire',
      streak_50: 'Unstoppable',
      master_calculator: 'Master Calculator',
      fast_solver: 'Fast Solver',
      level_up: 'Level Up!',
      category_master: 'Category Master',
      session_marathon: 'Session Marathon'
    };
    return titles[achievementId] || 'Achievement Unlocked';
  },

  /**
   * Get achievement description
   */
  getAchievementDescription(achievementId, data) {
    const descriptions = {
      first_calculation: 'Completed your first calculation',
      perfect_score: 'Got a perfect score on a practice set',
      streak_10: 'Got 10 correct answers in a row',
      streak_50: 'Got 50 correct answers in a row',
      master_calculator: 'Completed 100 calculations',
      fast_solver: 'Solved a problem in under 30 seconds',
      level_up: `Reached level ${data.level || 2}`,
      category_master: `Mastered the ${data.category || ''} category`,
      session_marathon: 'Studied for over an hour in one session'
    };
    return descriptions[achievementId] || 'Achievement unlocked!';
  },

  /**
   * Check for achievements based on progress
   */
  checkAchievements() {
    const progress = this.getProgress();
    const stats = this.getStats();

    // First calculation
    if (progress.totalAttempts === 1) {
      this.unlockAchievement('first_calculation');
    }

    // Master calculator
    if (progress.totalAttempts >= 100) {
      this.unlockAchievement('master_calculator');
    }

    // Session marathon
    const sessionDuration = Date.now() - this.currentSession.startTime;
    if (sessionDuration > 3600000) { // 1 hour
      this.unlockAchievement('session_marathon');
    }

    // Check category mastery
    for (const [category, data] of Object.entries(progress.categories)) {
      if (data.totalAttempts >= 50 && data.correctAttempts / data.totalAttempts >= 0.9) {
        this.unlockAchievement('category_master', { category });
      }
    }
  },

  /**
   * Get learning insights and recommendations
   */
  getInsights() {
    const progress = this.getProgress();
    const mistakes = this.getMistakes();

    const insights = {
      strongAreas: [],
      weakAreas: [],
      recommendations: [],
      summary: ''
    };

    // Analyze category performance
    for (const [category, data] of Object.entries(progress.categories)) {
      const accuracy = data.correctAttempts / data.totalAttempts;

      if (accuracy >= 0.9 && data.totalAttempts >= 10) {
        insights.strongAreas.push({
          category,
          accuracy: (accuracy * 100).toFixed(1)
        });
      } else if (accuracy < 0.7 && data.totalAttempts >= 10) {
        insights.weakAreas.push({
          category,
          accuracy: (accuracy * 100).toFixed(1),
          attempts: data.totalAttempts
        });
      }
    }

    // Generate recommendations based on weak areas
    insights.recommendations = this.generateRecommendations(insights.weakAreas, mistakes);

    // Generate summary
    insights.summary = this.generateSummary(progress);

    return insights;
  },

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(weakAreas, mistakes) {
    const recommendations = [];

    // Analyze mistake patterns
    const mistakePatterns = this.analyzeMistakes(mistakes);

    // Recommend practice for weak areas
    weakAreas.forEach(area => {
      recommendations.push({
        type: 'practice',
        priority: 'high',
        category: area.category,
        title: `Practice ${area.category} calculations`,
        description: `Your accuracy is ${area.accuracy}%. Focus on ${area.category} to improve.`
      });
    });

    // Recommend specific topics based on mistake patterns
    mistakePatterns.forEach(pattern => {
      recommendations.push({
        type: 'review',
        priority: pattern.frequency > 5 ? 'high' : 'medium',
        category: pattern.category,
        title: `Review ${pattern.topic}`,
        description: `You frequently make mistakes with ${pattern.topic}.`
      });
    });

    // Recommend study sessions
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'explore',
        priority: 'low',
        title: 'Explore new topics',
        description: 'You\'re doing great! Try learning a new calculator feature.'
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5
  },

  /**
   * Analyze mistakes for patterns
   */
  analyzeMistakes(mistakes) {
    const patterns = [];

    // Group mistakes by type and calculate
    const mistakeGroups = {};
    mistakes.forEach(mistake => {
      const key = `${mistake.type}_${mistake.calculationType || mistake.problemType}`;
      if (!mistakeGroups[key]) {
        mistakeGroups[key] = {
          type: mistake.type,
          category: mistake.calculationType || mistake.problemType,
          count: 0,
          topic: mistake.calculationType || mistake.problemType
        };
      }
      mistakeGroups[key].count++;
    });

    // Convert to array and filter high-frequency mistakes
    Object.values(mistakeGroups).forEach(group => {
      if (group.count >= 3) {
        patterns.push({
          ...group,
          frequency: group.count
        });
      }
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  },

  /**
   * Generate progress summary
   */
  generateSummary(progress) {
    const overallAccuracy = progress.totalAttempts > 0
      ? ((progress.correctAttempts / progress.totalAttempts) * 100).toFixed(1)
      : 0;

    const summaries = [];

    if (overallAccuracy >= 90) {
      summaries.push('Excellent work! You\'re mastering the material.');
    } else if (overallAccuracy >= 70) {
      summaries.push('Good progress! Keep practicing to improve further.');
    } else {
      summaries.push('Keep working at it! Practice makes perfect.');
    }

    if (progress.totalAttempts >= 50) {
      summaries.push(` You've completed ${progress.totalAttempts} calculations!`);
    }

    return summaries.join('');
  },

  /**
   * Get streak information
   */
  getStreak() {
    const progress = this.getProgress();
    const sessions = this.getSessions();

    // Calculate current streak from recent sessions
    let currentStreak = 0;
    const recentSessions = sessions.slice(-10).reverse();

    for (const session of recentSessions) {
      const dayCorrect = session.practiceProblems.filter(p => p.correct).length;
      const dayTotal = session.practiceProblems.length;

      if (dayTotal > 0 && dayCorrect === dayTotal) {
        currentStreak += dayCorrect;
      } else {
        break;
      }
    }

    return {
      current: currentStreak,
      best: progress.bestStreak || 0
    };
  },

  /**
   * Get progress data
   */
  getProgress() {
    return this.getData(this.STORAGE_KEYS.PROGRESS, {
      totalAttempts: 0,
      correctAttempts: 0,
      totalTime: 0,
      lastActivity: null,
      level: 1,
      xp: 0,
      categories: {}
    });
  },

  /**
   * Get sessions
   */
  getSessions() {
    return this.getData(this.STORAGE_KEYS.SESSIONS, []);
  },

  /**
   * Get achievements
   */
  getAchievements() {
    return this.getData(this.STORAGE_KEYS.ACHIEVEMENTS, []);
  },

  /**
   * Get mistakes
   */
  getMistakes() {
    return this.getData(this.STORAGE_KEYS.MISTAKES, []);
  },

  /**
   * Get statistics
   */
  getStats() {
    return this.getData(this.STORAGE_KEYS.STATS, {
      totalSessions: 0,
      totalTime: 0,
      totalCalculations: 0,
      totalPracticeProblems: 0,
      avgSessionLength: 0
    });
  },

  /**
   * Generic data getter
   */
  getData(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Error loading analytics data:', error);
      return defaultValue;
    }
  },

  /**
   * Save data to localStorage
   */
  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving analytics data:', error);
      return false;
    }
  },

  /**
   * Load achievements
   */
  loadAchievements() {
    // Load and validate achievements
    let achievements = this.getAchievements();

    // Ensure first_calculation achievement exists if user has progress
    const progress = this.getProgress();
    if (progress.totalAttempts > 0 && !achievements.find(a => a.id === 'first_calculation')) {
      this.unlockAchievement('first_calculation');
    }
  },

  /**
   * Export all analytics data
   */
  exportData() {
    return {
      progress: this.getProgress(),
      sessions: this.getSessions(),
      achievements: this.getAchievements(),
      mistakes: this.getMistakes(),
      stats: this.getStats(),
      exportDate: new Date().toISOString()
    };
  },

  /**
   * Clear all analytics data
   */
  clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    this.currentSession = {
      startTime: null,
      calculations: [],
      practiceProblems: [],
      mistakes: []
    };
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnalyticsManager.init());
  } else {
    AnalyticsManager.init();
  }

  // Save session when leaving page
  window.addEventListener('beforeunload', () => {
    AnalyticsManager.endSession();
  });

  // Expose to global scope
  window.AnalyticsManager = AnalyticsManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsManager;
}
