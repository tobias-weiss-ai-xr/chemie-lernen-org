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
      timePerQuestion: null,  // seconds
      totalTime: null,        // seconds
      allowHints: true,
      randomizeQuestions: false,
      showExplanations: true
    };
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
      defaultTotalTime: quizData.totalTime || null
    };
  }

  /**
   * Configure quiz settings
   */
  configureQuiz(settings = {}) {
    this.quizSettings = {
      timedMode: settings.timedMode !== undefined ? settings.timedMode : this.quizSettings.timedMode,
      timePerQuestion: settings.timePerQuestion || this.quizSettings.timePerQuestion,
      totalTime: settings.totalTime || this.quizSettings.totalTime,
      allowHints: settings.allowHints !== undefined ? settings.allowHints : this.quizSettings.allowHints,
      randomizeQuestions: settings.randomizeQuestions !== undefined ? settings.randomizeQuestions : this.quizSettings.randomizeQuestions,
      showExplanations: settings.showExplanations !== undefined ? settings.showExplanations : this.quizSettings.showExplanations
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
      questions: questions
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
      window.dispatchEvent(new CustomEvent('quizTimerUpdate', {
        detail: { timeRemaining: this.timeRemaining }
      }));

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
      hintsUsed: this.hintsUsed
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
      correct: isCorrect
    });

    if (isCorrect) {
      this.score++;
    }

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
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
      return userAnswer.toString().toLowerCase().trim() ===
             question.correctAnswer.toString().toLowerCase().trim();
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
        ? (this.quizSettings.totalTime || this.quizSettings.timePerQuestion || 0) - this.timeRemaining
        : null
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
        completed: false
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
    return this.progress[topicId] || {
      attempts: 0,
      bestScore: 0,
      lastAttempt: null,
      completed: false
    };
  }

  /**
   * Get overall progress
   */
  getOverallProgress() {
    const totalTopics = Object.keys(this.quizzes).length;
    const completedTopics = Object.values(this.progress)
      .filter(p => p.completed).length;
    const totalAttempts = Object.values(this.progress)
      .reduce((sum, p) => sum + p.attempts, 0);
    const averageScore = Object.values(this.progress)
      .filter(p => p.bestScore > 0)
      .reduce((sum, p, _, arr) => sum + p.bestScore / arr.length, 0);

    return {
      totalTopics: totalTopics,
      completedTopics: completedTopics,
      completionPercentage: totalTopics > 0
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0,
      totalAttempts: totalAttempts,
      averageScore: Math.round(averageScore)
    };
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error loading progress:', e);
      return {};
    }
  }

  /**
   * Save progress to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  /**
   * Reset progress for a topic
   */
  resetProgress(topicId) {
    delete this.progress[topicId];
    this.saveToStorage();
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
  storageKey: 'chemie-lernen-quiz-progress'
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizSystem, chemieQuiz };
}
