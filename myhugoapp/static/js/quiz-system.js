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
    };
  }

  /**
   * Register a quiz for a topic with support for mixed sources.
   * Adds AI question injection (see aiQuestionsEnabled).
   */
  registerQuiz(topicId, quizData) {
    this.quizzes[topicId] = {
      id: topicId,
      title: quizData.title,
      questions: quizData.questions,
      passingScore: quizData.passingScore || 70,
      defaultTimePerQuestion: quizData.timePerQuestion || null,
      defaultTotalTime: quizData.totalTime || null,
      aiQuestionsEnabled: quizData.aiQuestionsEnabled !== false, // default: enabled
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
    };
  }

  /**
   * Fetch AI-generated questions for a topic from the backend API.
   * Mixes them with hand-authored questions.
   * @param {string} topicId - Topic slug
   * @param {number} [count=3] - Number of AI questions to request
   * @returns {Promise<Array>} Array of question objects with source: 'ai'
   */
  async fetchAiQuestions(topicId) {
    try {
      var res = await fetch('/api/exercises/generate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          topicSlug: topicId,
          difficulty: this.getAdaptiveDifficulty(topicId),
          type: 'mcq',
          includeFsrsContext: true,
        }),
      });
      if (!res.ok) return [];
      var data = await res.json();
      // Convert AI exercise to quiz question format.
      // Keep the option ids (aiOptions) so AI MCQ answers — which the UI
      // submits as a 0-based index — can be mapped back to the generator's
      // lettered correctAnswer and reported to the backend for grading.
      var aiOptions = data.options || [];
      var question = {
        id: data.id,
        type: 'multiple-choice',
        question: data.question,
        options: aiOptions.map(function (o) {
          return o.text;
        }),
        correctAnswer: data.correctAnswer,
        aiOptions: aiOptions,
        explanation: data.explanation || '',
        source: 'ai',
        aiGenerated: true,
        learningObjective: data.learningObjective,
        topic: topicId,
      };
      return [question];
    } catch (e) {
      console.warn('[quiz-system] Failed to fetch AI questions:', e);
      return [];
    }
  }

  /**
   * Fire-and-forget report of an AI-graded quiz answer to the backend
   * grading endpoint. Keeps the learner/teacher dashboards and the
   * knowledge-graph persistence populated even though the quiz itself
   * grades locally for instant feedback. Best-effort: failures are silent.
   * @param {object} question - The AI question (source === 'ai')
   * @param {string|number} userAnswer - The 0-based selected option index
   */
  reportGradeToBackend(question, userAnswer) {
    if (!question || question.source !== 'ai' || !question.id) return;
    if (typeof window.fetch !== 'function') return;

    // Map the submitted index back to the letter id so the backend's
    // deterministic MC-grader can grade it identically to the quiz.
    var chosen = question.aiOptions && question.aiOptions[parseInt(userAnswer)];
    var answer = chosen ? chosen.id : String(userAnswer);

    try {
      fetch('/api/exercises/grade', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ exerciseId: question.id, answer: answer }),
      }).catch(function () {});
    } catch (e) {
      // Best-effort; never break the quiz on a network/JSON error.
    }
  }

  /**
   * Determine adaptive difficulty based on FSRS stability from localStorage.
   * @param {string} topicId
   * @returns {'easy'|'medium'|'hard'}
   */
  getAdaptiveDifficulty(topicId) {
    try {
      // Check FSRS data in localStorage (set by spaced-repetition.js)
      var fsrsData = localStorage.getItem('chemie-lernen-fsrs-cache');
      if (!fsrsData) return 'medium';
      var fsrs = JSON.parse(fsrsData);
      var stability = fsrs[topicId]?.stability || fsrs.global?.stability || null;
      if (stability === null) return 'medium';
      if (stability < 7) return 'easy';
      if (stability > 30) return 'hard';
      return 'medium';
    } catch (e) {
      return 'medium';
    }
  }

  /**
   * Start a quiz with optional AI-generated questions mixed in.
   */
  async startQuiz(topicId, settings) {
    settings = settings || {};
    var quiz = this.quizzes[topicId];
    if (!quiz) {
      console.error('Quiz for topic ' + topicId + ' not found');
      return false;
    }

    // Apply settings
    this.configureQuiz(settings);

    // Get adaptive difficulty recommendation for tooltip
    var adaptiveDifficulty = this.getAdaptiveDifficulty(topicId);
    this._adaptiveDifficulty = adaptiveDifficulty;

    // Fetch AI questions if enabled
    var aiQuestions = [];
    if (quiz.aiQuestionsEnabled) {
      try {
        aiQuestions = await this.fetchAiQuestions(topicId);
      } catch (e) {
        // Silent fail — continue with hand-authored only
      }
    }

    // Merge hand-authored + AI questions
    var allQuestions = [].concat(quiz.questions || []).concat(aiQuestions);

    // Randomize if configured
    var questions = this.quizSettings.randomizeQuestions
      ? this.shuffleArray(allQuestions)
      : allQuestions;

    this.currentQuiz = {
      id: quiz.id,
      title: quiz.title,
      questions: questions,
      passingScore: quiz.passingScore || 70,
    };
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.answers = [];
    this.hintsUsed = 0;

    // Initialize timer if timed mode is enabled
    if (this.quizSettings.timedMode) {
      var timeLimit = this.quizSettings.totalTime || this.quizSettings.timePerQuestion;
      if (timeLimit) {
        this.timeRemaining = timeLimit;
        this.startTimer();
      }
    }

    return true;
  }

  /**
   * Get adaptive difficulty label for display.
   */
  getAdaptiveDifficultyLabel() {
    var labels = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' };
    return labels[this._adaptiveDifficulty] || 'Mittel';
  }

  /**
   * Get the source type of the current question.
   * @returns {'hand-authored'|'ai'}
   */
  getCurrentQuestionSource() {
    var q = this.getCurrentQuestion();
    if (!q) return 'hand-authored';
    return q.source === 'ai' ? 'ai' : 'hand-authored';
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

    // Persist AI-graded answers to the backend so the auto-grading,
    // individualized feedback and learner/teacher dashboards have data.
    this.reportGradeToBackend(question, answer);

    if (isCorrect) {
      this.score++;
    }

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  /**
   * Check if answer is correct. Supports both hand-authored and AI-generated questions.
   */
  checkAnswer(question, userAnswer) {
    // AI-generated questions are 'multiple-choice', answered by 0-based index.
    if (question.type === 'multiple-choice' || question.type === 'mcq') {
      // AI questions: correctAnswer is the correct option's letter ID (e.g.
      // 'C'); the UI submits the option's 0-based index, so map index → id
      // before comparing. Previously a letter correctAnswer could never be
      // matched against the index-based userAnswer — AI MCQ grading always
      // came back wrong in the quiz.
      if (question.source === 'ai' && question.correctAnswer) {
        var chosen = question.aiOptions && question.aiOptions[parseInt(userAnswer)];
        var chosenLetter = chosen && String(chosen.id).trim().toUpperCase();
        var correctLetter = String(question.correctAnswer).trim().toUpperCase();
        if (chosenLetter) return chosenLetter === correctLetter;

        // No id mapping available — fall back to numeric (index) or letter.
        var userIdx = parseInt(userAnswer);
        var correctAsNum = parseInt(question.correctAnswer);
        if (!isNaN(correctAsNum)) return userIdx === correctAsNum;
        return String(userAnswer).trim().toUpperCase() === correctLetter;
      }
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

// Enable swipe gestures on quiz containers
function enableQuizSwipes(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var startX = 0;
  var threshold = 60;
  container.addEventListener(
    'touchstart',
    function (e) {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  container.addEventListener(
    'touchend',
    function (e) {
      var diffX = e.changedTouches[0].clientX - startX;
      if (Math.abs(diffX) < threshold) return;
      var prevBtn = container.querySelector('.quiz-button-secondary:not([style*="display: none"])');
      var nextBtn = container.querySelector(
        '.quiz-button-primary:not([style*="display: none"]):not([onclick])'
      );
      if (diffX < 0 && nextBtn) nextBtn.click();
      else if (diffX > 0 && prevBtn) prevBtn.click();
    },
    { passive: true }
  );
}

// Auto-init swipe on all quiz containers after DOM ready
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.quiz-container[id^="quiz-"]').forEach(function (el) {
    enableQuizSwipes(el.id);
  });
});

// Global quiz instance
const chemieQuiz = new QuizSystem({
  storageKey: 'chemie-lernen-quiz-progress',
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizSystem, chemieQuiz };
}
