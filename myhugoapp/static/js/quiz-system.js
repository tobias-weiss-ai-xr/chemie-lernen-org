/**
 * Quiz System for chemie-lernen.org
 * Interactive quiz functionality for topics
 * Enhanced with timed mode, hints, and randomization
 */

class QuizSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-quiz-progress';
    this.quizzes = {};
    this.progress = this.loadProgress();
    this.currentQuiz = null;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.answers = [];
    this.timer = null;
    this.timeRemaining = 0;
    this.hintsUsed = 0;
    this.quizSettings = {
      timedMode: false,
      timePerQuestion: null, // seconds
      totalTime: null, // seconds
      allowHints: true,
      randomizeQuestions: false,
      showExplanations: true,
      // Difficulty scaling
      difficulty: 'medium', // easy, medium, hard
      scoreMultiplier: 1.5, // medium default
      timeMultiplier: 1, // medium default
    };
    this.fallbackData = null; // In-memory fallback when localStorage fails
  }

  /**
   * Register a quiz for a topic
   */
  registerQuiz(topicId, quizData) {
    this.quizzes[topicId] = {
      id: topicId,
      title: quizData.title,
      questions: quizData.questions,
      passingScore: quizData.passingScore || 70,
      defaultTimePerQuestion: quizData.timePerQuestion || null,
      defaultTotalTime: quizData.totalTime || null,
    };
  }

  /**
   * Configure quiz settings
   */
  configureQuiz(settings = {}) {
    this.quizSettings = {
      timedMode:
        settings.timedMode !== undefined ? settings.timedMode : this.quizSettings.timedMode,
      timePerQuestion: settings.timePerQuestion || this.quizSettings.timePerQuestion,
      totalTime: settings.totalTime || this.quizSettings.totalTime,
      allowHints:
        settings.allowHints !== undefined ? settings.allowHints : this.quizSettings.allowHints,
      randomizeQuestions:
        settings.randomizeQuestions !== undefined
          ? settings.randomizeQuestions
          : this.quizSettings.randomizeQuestions,
      showExplanations:
        settings.showExplanations !== undefined
          ? settings.showExplanations
          : this.quizSettings.showExplanations,
      difficulty: settings.difficulty || this.quizSettings.difficulty,
      scoreMultiplier:
        settings.scoreMultiplier !== undefined
          ? settings.scoreMultiplier
          : this.quizSettings.scoreMultiplier,
      timeMultiplier:
        settings.timeMultiplier !== undefined
          ? settings.timeMultiplier
          : this.quizSettings.timeMultiplier,
    };

    // Validate difficulty level
    if (!['easy', 'medium', 'hard'].includes(this.quizSettings.difficulty)) {
      this.quizSettings.difficulty = 'medium';
      this.quizSettings.scoreMultiplier = 1.5;
      this.quizSettings.timeMultiplier = 1;
    }

    return this.quizSettings;
  }

  /**
   * Set difficulty level with pre-defined configurations
   */
  setDifficulty(difficulty) {
    const difficultyConfig = {
      easy: {
        label: '🌱 Grundlagen',
        scoreMultiplier: 1,
        timeMultiplier: 1.25, // +25% time
        description: 'Einfache Fragen, mehr Zeit',
      },
      medium: {
        label: '🌿 Mittelstufe',
        scoreMultiplier: 1.5,
        timeMultiplier: 1, // standard time
        description: 'Ausgewogene Fragen, normale Zeit',
      },
      hard: {
        label: '🌳 Fortgeschritten',
        scoreMultiplier: 2,
        timeMultiplier: 0.75, // -25% time
        description: 'Komplexe Fragen, weniger Zeit',
      },
    };

    const config = difficultyConfig[difficulty];
    if (!config) {
      console.error(`Invalid difficulty level: ${difficulty}`);
      return null;
    }

    this.quizSettings.difficulty = difficulty;
    this.quizSettings.scoreMultiplier = config.scoreMultiplier;
    this.quizSettings.timeMultiplier = config.timeMultiplier;

    return {
      ...config,
      multiplier: config.scoreMultiplier,
      timeAdjustment:
        config.timeMultiplier === 1.25 ? '+25%' : config.timeMultiplier === 0.75 ? '-25%' : '0%',
    };
  }

  /**
   * Get current difficulty info
   */
  getCurrentDifficulty() {
    return {
      level: this.quizSettings.difficulty,
      label: this.getDifficultyLabel(this.quizSettings.difficulty),
      multiplier: this.quizSettings.scoreMultiplier,
      timeMultiplier: this.quizSettings.timeMultiplier,
    };
  }

  /**
   * Get difficulty label
   */
  getDifficultyLabel(level) {
    const labels = {
      easy: '🌱 Grundlage',
      medium: '🌿 Mittelstufe',
      hard: '🌳 Fortgeschritten',
    };
    return labels[level] || '🌿 Mittelstufe';
  }

  /**
   * Apply difficulty time adjustment to timer
   */
  applyDifficultyTimeAdjustment(baseTime) {
    const adjustedTime = Math.round(baseTime * this.quizSettings.timeMultiplier);
    return {
      original: baseTime,
      adjusted: adjustedTime,
      adjustment: this.quizSettings.timeMultiplier,
    };
  }

  /**
   * Get timer display with difficulty indicator
   */
  getTimerDisplay(includeDifficulty = true) {
    if (!this.quizSettings.timedMode) return { display: 'Off' };

    const timeDisplay = this.getFormattedTime(this.timeRemaining);
    const difficultyDisplay = includeDifficulty ? ` (${this.getCurrentDifficulty().label})` : '';

    return {
      display: `${timeDisplay}${difficultyDisplay}`,
      timeRemaining: this.timeRemaining,
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Start a quiz
   */
  startQuiz(topicId, settings = {}) {
    const quiz = this.quizzes[topicId];
    if (!quiz) {
      console.error(`Quiz for topic ${topicId} not found`);
      return false;
    }

    // Apply settings
    this.configureQuiz(settings);

    // Create a working copy of questions (may be randomized)
    const questions = this.quizSettings.randomizeQuestions
      ? this.shuffleArray(quiz.questions)
      : quiz.questions;

    this.currentQuiz = {
      ...quiz,
      questions: questions,
    };
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.answers = [];
    this.hintsUsed = 0;

    // Initialize timer if timed mode is enabled
    if (this.quizSettings.timedMode) {
      const timeLimit = this.quizSettings.totalTime || this.quizSettings.timePerQuestion;
      if (timeLimit) {
        this.timeRemaining = timeLimit;
        this.startTimer();
      }
    }

    return true;
  }

  /**
   * Start countdown timer
   */
  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.timeRemaining--;

      // Dispatch custom event for UI updates
      window.dispatchEvent(
        new CustomEvent('quizTimerUpdate', {
          detail: { timeRemaining: this.timeRemaining },
        })
      );

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        window.dispatchEvent(new CustomEvent('quizTimeUp', {}));
      }
    }, 1000);
  }

  /**
   * Stop timer
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Get remaining time
   */
  getTimeRemaining() {
    return this.timeRemaining;
  }

  /**
   * Get formatted time string
   */
  getFormattedTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get hint for current question
   */
  getHint() {
    if (!this.quizSettings.allowHints) {
      return { success: false, message: 'Hints are not enabled for this quiz' };
    }

    const question = this.getCurrentQuestion();
    if (!question) {
      return { success: false, message: 'No current question' };
    }

    if (!question.hint) {
      return { success: false, message: 'No hint available for this question' };
    }

    this.hintsUsed++;
    return {
      success: true,
      hint: question.hint,
      hintsUsed: this.hintsUsed,
    };
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (!this.currentQuiz) return null;
    return this.currentQuiz.questions[this.currentQuestionIndex];
  }

  /**
   * Submit answer for current question
   */
  submitAnswer(answer) {
    const question = this.getCurrentQuestion();
    if (!question) return null;

    const isCorrect = this.checkAnswer(question, answer);
    this.answers.push({
      question: question,
      userAnswer: answer,
      correct: isCorrect,
    });

    if (isCorrect) {
      this.score++;
    }

    // Apply difficulty score multiplier
    const adjustedScore = this.calculateAdjustedScore();

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      scoreMultiplier: this.quizSettings.scoreMultiplier,
      adjustedScore: adjustedScore,
      difficulty: this.quizSettings.difficulty,
    };
  }

  /**
   * Calculate adjusted score with difficulty multiplier
   */
  calculateAdjustedScore() {
    // Base score is number of correct answers
    // Adjusted score applies difficulty multiplier for display/reporting
    const baseScore = this.score;
    const adjusted = Math.round(baseScore * this.quizSettings.scoreMultiplier);
    return {
      base: baseScore,
      adjusted: adjusted,
      multiplier: this.quizSettings.scoreMultiplier,
    };
  }

  /**
   * Check if answer is correct
   */
  checkAnswer(question, userAnswer) {
    if (question.type === 'multiple-choice') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'multiple-select') {
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];

      // Check if arrays are equal regardless of order
      return JSON.stringify(userAnswers.sort()) === JSON.stringify(correctAnswers.sort());
    } else if (question.type === 'true-false') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'fill-blank') {
      // Case-insensitive comparison, trim whitespace
      return (
        userAnswer.toString().toLowerCase().trim() ===
        question.correctAnswer.toString().toLowerCase().trim()
      );
    }
    return false;
  }

  /**
   * Move to next question
   */
  nextQuestion() {
    if (!this.currentQuiz) return false;
    if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
      this.currentQuestionIndex++;

      // Reset timer for next question if using per-question timing
      if (this.quizSettings.timedMode && this.quizSettings.timePerQuestion) {
        this.timeRemaining = this.quizSettings.timePerQuestion;
        this.startTimer();
      }

      return true;
    }
    // Quiz completed - stop timer
    this.stopTimer();
    return false;
  }

  /**
   * End quiz and stop timer
   */
  endQuiz() {
    this.stopTimer();
  }

  /**
   * Get quiz results
   */
  getResults() {
    if (!this.currentQuiz) return null;

    const totalQuestions = this.currentQuiz.questions.length;
    const percentage = Math.round((this.score / totalQuestions) * 100);
    const passed = percentage >= this.currentQuiz.passingScore;

    return {
      score: this.score,
      totalQuestions: totalQuestions,
      percentage: percentage,
      passed: passed,
      answers: this.answers,
      passingScore: this.currentQuiz.passingScore,
      hintsUsed: this.hintsUsed,
      timeSpent: this.quizSettings.timedMode
        ? (this.quizSettings.totalTime || this.quizSettings.timePerQuestion || 0) -
          this.timeRemaining
        : null,
    };
  }

  /**
   * Save progress and results
   */
  saveResults(topicId, results) {
    if (!this.progress[topicId]) {
      this.progress[topicId] = {
        attempts: 0,
        bestScore: 0,
        lastAttempt: null,
        completed: false,
      };
    }

    this.progress[topicId].attempts++;
    this.progress[topicId].lastAttempt = new Date().toISOString();

    if (results.percentage > this.progress[topicId].bestScore) {
      this.progress[topicId].bestScore = results.percentage;
    }

    if (results.passed) {
      this.progress[topicId].completed = true;
    }

    this.saveToStorage();
  }

  /**
   * Get progress for a topic
   */
  getProgress(topicId) {
    return (
      this.progress[topicId] || {
        attempts: 0,
        bestScore: 0,
        lastAttempt: null,
        completed: false,
      }
    );
  }

  /**
   * Get overall progress
   */
  getOverallProgress() {
    const totalTopics = Object.keys(this.quizzes).length;
    const completedTopics = Object.values(this.progress).filter((p) => p.completed).length;
    const totalAttempts = Object.values(this.progress).reduce((sum, p) => sum + p.attempts, 0);
    const averageScore = Object.values(this.progress)
      .filter((p) => p.bestScore > 0)
      .reduce((sum, p, _, arr) => sum + p.bestScore / arr.length, 0);

    return {
      totalTopics: totalTopics,
      completedTopics: completedTopics,
      completionPercentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      totalAttempts: totalAttempts,
      averageScore: Math.round(averageScore),
    };
  }

  /**
   * Load progress from localStorage
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
        if (this.fallbackData) {
          console.warn('Using saved fallback data due to quota exceeded');
          return this.fallbackData;
        }
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        if (this.fallbackData) {
          return this.fallbackData;
        }
      } else {
        console.error('Error loading progress:', error);
      }
      return {};
    }
  }

  /**
   * Save progress to localStorage
   */
  saveToStorage() {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, saving to in-memory fallback');
      this.fallbackData = { ...this.progress };
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
      this.fallbackData = JSON.parse(JSON.stringify(this.progress));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Using in-memory fallback:', error);
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
      } else {
        console.error('Error saving quiz progress:', error);
      }
      this.fallbackData = { ...this.progress };
    }
  }

  /**
   * Reset all progress
   */
  resetAllProgress() {
    this.progress = {};
    this.saveToStorage();
  }
}

// Global quiz instance
const chemieQuiz = new QuizSystem({
  storageKey: 'chemie-lernen-quiz-progress',
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizSystem, chemieQuiz };
}
