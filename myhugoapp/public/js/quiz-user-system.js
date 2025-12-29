/**
 * User Account and High Scores System for chemie-lernen.org
 * Client-side user management with LocalStorage persistence
 */

class QuizUserSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-users';
    this.currentUser = null;
    this.users = this.loadUsers();
    this.highScores = this.loadHighScores();
  }

  /**
   * Load all users from localStorage
   */
  loadUsers() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading users:', e);
      return {};
    }
  }

  /**
   * Save users to localStorage
   */
  saveUsers() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }

  /**
   * Load high scores from localStorage
   */
  loadHighScores() {
    try {
      const data = localStorage.getItem(this.storageKey + '-highscores');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading high scores:', e);
      return [];
    }
  }

  /**
   * Save high scores to localStorage
   */
  saveHighScores() {
    try {
      localStorage.setItem(this.storageKey + '-highscores', JSON.stringify(this.highScores));
    } catch (e) {
      console.error('Error saving high scores:', e);
    }
  }

  /**
   * Register a new user
   */
  register(username, password, displayName = null) {
    // Validate username
    if (!username || username.length < 3) {
      return { success: false, message: 'Benutzername muss mindestens 3 Zeichen lang sein' };
    }

    if (this.users[username]) {
      return { success: false, message: 'Benutzername bereits vergeben' };
    }

    // Create user
    this.users[username] = {
      username: username,
      password: this.hashPassword(password), // Simple hash for client-side only
      displayName: displayName || username,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      totalScore: 0,
      quizzesCompleted: 0,
      achievements: []
    };

    this.saveUsers();
    return { success: true, message: 'Registrierung erfolgreich!' };
  }

  /**
   * Login user
   */
  login(username, password) {
    const user = this.users[username];

    if (!user) {
      return { success: false, message: 'Benutzer nicht gefunden' };
    }

    if (user.password !== this.hashPassword(password)) {
      return { success: false, message: 'Falsches Passwort' };
    }

    this.currentUser = user;
    user.lastLogin = new Date().toISOString();
    this.saveUsers();

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('userLogin', {
      detail: { username: user.username, displayName: user.displayName }
    }));

    return { success: true, message: 'Erfolgreich eingeloggt!' };
  }

  /**
   * Logout current user
   */
  logout() {
    if (this.currentUser) {
      const username = this.currentUser.username;
      this.currentUser = null;

      window.dispatchEvent(new CustomEvent('userLogout', {
        detail: { username: username }
      }));

      return { success: true, message: 'Erfolgreich ausgeloggt!' };
    }
    return { success: false, message: 'Kein Benutzer eingeloggt' };
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Update user profile
   */
  updateProfile(displayName) {
    if (!this.currentUser) {
      return { success: false, message: 'Nicht eingeloggt' };
    }

    this.currentUser.displayName = displayName;
    this.users[this.currentUser.username] = this.currentUser;
    this.saveUsers();

    return { success: true, message: 'Profil aktualisiert!' };
  }

  /**
   * Simple password hash (for client-side only - not secure!)
   */
  hashPassword(password) {
    // This is a simple hash for demonstration only
    // In a real app, use proper server-side authentication
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Submit quiz score for current user
   */
  submitScore(topicId, score, percentage, timeSpent = null, hintsUsed = 0) {
    if (!this.currentUser) {
      return { success: false, message: 'Nicht eingeloggt' };
    }

    const scoreEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username: this.currentUser.username,
      displayName: this.currentUser.displayName,
      topicId: topicId,
      score: score,
      percentage: percentage,
      timeSpent: timeSpent,
      hintsUsed: hintsUsed,
      timestamp: new Date().toISOString()
    };

    // Add to high scores
    this.highScores.push(scoreEntry);

    // Sort by percentage (descending), then by time spent (ascending), then by hints used (ascending)
    this.highScores.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      if (a.timeSpent && b.timeSpent && a.timeSpent !== b.timeSpent) {
        return a.timeSpent - b.timeSpent;
      }
      return a.hintsUsed - b.hintsUsed;
    });

    // Keep only top 100 scores per topic
    const topicScores = this.highScores.filter(s => s.topicId === topicId);
    const otherScores = this.highScores.filter(s => s.topicId !== topicId);
    this.highScores = [
      ...otherScores,
      ...topicScores.slice(0, 100)
    ];

    this.saveHighScores();

    // Update user stats
    this.currentUser.totalScore += score;
    this.currentUser.quizzesCompleted++;

    // Check for achievements
    this.checkAchievements();

    this.saveUsers();

    return { success: true, message: 'Ergebnis gespeichert!', rank: this.getRank(topicId, scoreEntry) };
  }

  /**
   * Get rank for a score
   */
  getRank(topicId, scoreEntry) {
    const topicScores = this.highScores
      .filter(s => s.topicId === topicId)
      .sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        if (a.timeSpent && b.timeSpent && a.timeSpent !== b.timeSpent) return a.timeSpent - b.timeSpent;
        return a.hintsUsed - b.hintsUsed;
      });

    return topicScores.findIndex(s => s.id === scoreEntry.id) + 1;
  }

  /**
   * Get high scores for a topic
   */
  getHighScores(topicId, limit = 10) {
    return this.highScores
      .filter(s => s.topicId === topicId)
      .slice(0, limit);
  }

  /**
   * Get all high scores for current user
   */
  getUserScores(username = null) {
    const user = username || this.currentUser?.username;
    if (!user) return [];

    return this.highScores.filter(s => s.username === user);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(topicId = null, limit = 10) {
    let scores = topicId
      ? this.highScores.filter(s => s.topicId === topicId)
      : this.highScores;

    // Group by user and calculate total score
    const userTotals = {};
    scores.forEach(score => {
      if (!userTotals[score.username]) {
        userTotals[score.username] = {
          username: score.username,
          displayName: score.displayName,
          totalScore: 0,
          quizzesCompleted: 0,
          averagePercentage: 0,
          totalPercentage: 0
        };
      }
      userTotals[score.username].totalScore += score.score;
      userTotals[score.username].quizzesCompleted++;
      userTotals[score.username].totalPercentage += score.percentage;
    });

    // Calculate averages
    Object.values(userTotals).forEach(user => {
      user.averagePercentage = Math.round(user.totalPercentage / user.quizzesCompleted);
    });

    // Sort by total score
    return Object.values(userTotals)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  /**
   * Check and award achievements
   */
  checkAchievements() {
    if (!this.currentUser) return;

    const achievements = this.currentUser.achievements || [];
    const newAchievements = [];

    // First quiz completed
    if (this.currentUser.quizzesCompleted === 1 && !achievements.includes('first-quiz')) {
      newAchievements.push({
        id: 'first-quiz',
        title: 'Erste Schritte',
        description: 'Erstes Quiz abgeschlossen',
        icon: '🎯'
      });
    }

    // 10 quizzes completed
    if (this.currentUser.quizzesCompleted >= 10 && !achievements.includes('quiz-master')) {
      newAchievements.push({
        id: 'quiz-master',
        title: 'Quiz-Meister',
        description: '10 Quizze abgeschlossen',
        icon: '🏆'
      });
    }

    // Perfect score (100%)
    const recentPerfectScores = this.getUserScores()
      .filter(s => s.percentage === 100)
      .length;
    if (recentPerfectScores > 0 && !achievements.includes('perfect-score')) {
      newAchievements.push({
        id: 'perfect-score',
        title: 'Perfektionist',
        description: 'Ein Quiz mit 100% abgeschlossen',
        icon: '💯'
      });
    }

    // Speed demon (completed under time limit)
    const fastScores = this.getUserScores()
      .filter(s => s.timeSpent && s.timeSpent < 300 && s.percentage >= 80); // Under 5 minutes
    if (fastScores.length > 0 && !achievements.includes('speed-demon')) {
      newAchievements.push({
        id: 'speed-demon',
        title: 'Geschwindigkeitsdämon',
        description: 'Quiz in unter 5 Minuten mit 80%+ abgeschlossen',
        icon: '⚡'
      });
    }

    // No hints used
    const noHintsScores = this.getUserScores()
      .filter(s => s.hintsUsed === 0 && s.percentage >= 90);
    if (noHintsScores.length > 0 && !achievements.includes('no-hints')) {
      newAchievements.push({
        id: 'no-hints',
        title: 'Alleinunternehmer',
        description: 'Quiz ohne Hinweise mit 90%+ abgeschlossen',
        icon: '🧠'
      });
    }

    // Add new achievements
    if (newAchievements.length > 0) {
      this.currentUser.achievements = [
        ...achievements,
        ...newAchievements.map(a => a.id)
      ];

      window.dispatchEvent(new CustomEvent('achievementsUnlocked', {
        detail: { achievements: newAchievements }
      }));
    }
  }

  /**
   * Get user achievements
   */
  getAchievements(username = null) {
    const user = username || this.currentUser?.username;
    if (!user) return [];

    const allAchievements = {
      'first-quiz': {
        title: 'Erste Schritte',
        description: 'Erstes Quiz abgeschlossen',
        icon: '🎯'
      },
      'quiz-master': {
        title: 'Quiz-Meister',
        description: '10 Quizze abgeschlossen',
        icon: '🏆'
      },
      'perfect-score': {
        title: 'Perfektionist',
        description: 'Ein Quiz mit 100% abgeschlossen',
        icon: '💯'
      },
      'speed-demon': {
        title: 'Geschwindigkeitsdämon',
        description: 'Quiz in unter 5 Minuten mit 80%+ abgeschlossen',
        icon: '⚡'
      },
      'no-hints': {
        title: 'Alleinunternehmer',
        description: 'Quiz ohne Hinweise mit 90%+ abgeschlossen',
        icon: '🧠'
      }
    };

    const userData = this.users[user];
    if (!userData) return [];

    return (userData.achievements || []).map(id => allAchievements[id]).filter(Boolean);
  }

  /**
   * Delete user account
   */
  deleteAccount() {
    if (!this.currentUser) {
      return { success: false, message: 'Nicht eingeloggt' };
    }

    const username = this.currentUser.username;

    // Remove user
    delete this.users[username];

    // Remove user's high scores
    this.highScores = this.highScores.filter(s => s.username !== username);

    this.saveUsers();
    this.saveHighScores();

    this.currentUser = null;

    window.dispatchEvent(new CustomEvent('userAccountDeleted', {
      detail: { username: username }
    }));

    return { success: true, message: 'Konto gelöscht!' };
  }
}

// Global user system instance
const quizUserSystem = new QuizUserSystem({
  storageKey: 'chemie-lernen-users'
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizUserSystem, quizUserSystem };
}
