/**
 * QuizEngine — Core quiz logic for chemie-lernen.org
 * Question types: multiple-choice, multiple-select, true/false, fill-in-blank
 * Scoring, timers, Fisher-Yates shuffle
 */
(function () {
  'use strict';

  function QuizEngine(options) {
    options = options || {};
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.answers = [];
    this.questionTimer = null;
    this.questionTimeLeft = 0;
    this.overallTimer = null;
    this.overallTimeLeft = 0;
    this.totalQuestions = 0;
    this.isFinished = false;
    this.onComplete = options.onComplete || null;
    this.onQuestionChange = options.onQuestionChange || null;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Fisher-Yates shuffle (in-place)
   */
  QuizEngine.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  };

  /**
   * Load questions and initialize state
   */
  QuizEngine.prototype.loadQuestions = function (questions, options) {
    options = options || {};
    this.questions =
      options.shuffle !== false ? QuizEngine.shuffle(questions.slice()) : questions.slice();
    this.totalQuestions = this.questions.length;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.answers = [];
    this.isFinished = false;
    this.startTime = Date.now();
    this.endTime = null;

    if (options.questionTimeLimit) {
      this.questionTimeLimit = options.questionTimeLimit;
    } else {
      this.questionTimeLimit = 0; // no per-question limit
    }
    if (options.overallTimeLimit) {
      this.overallTimeLimit = options.overallTimeLimit;
      this.overallTimeLeft = options.overallTimeLimit;
    } else {
      this.overallTimeLimit = 0;
    }

    this._startOverallTimer();
    this._startQuestionTimer();

    return this;
  };

  /**
   * Get current question object
   */
  QuizEngine.prototype.getCurrentQuestion = function () {
    if (this.isFinished || this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  };

  /**
   * Submit an answer for the current question
   * Returns { correct, score, partial, explanation, question }
   */
  QuizEngine.prototype.submitAnswer = function (answer) {
    if (this.isFinished) {
      return null;
    }

    var question = this.getCurrentQuestion();
    if (!question) {
      return null;
    }

    var result = this._scoreAnswer(question, answer);
    result.questionIndex = this.currentQuestionIndex;
    result.question = question;

    this.answers.push({
      questionIndex: this.currentQuestionIndex,
      question: question,
      answer: answer,
      correct: result.correct,
      score: result.score,
      timeTaken: this.questionTimeLimit > 0 ? this.questionTimeLimit - this.questionTimeLeft : null,
    });

    this.score += result.score;

    // Move to next question
    this.currentQuestionIndex++;

    // Check if quiz is complete
    if (this.currentQuestionIndex >= this.questions.length) {
      this._finish();
    } else {
      this._startQuestionTimer();
      if (this.onQuestionChange) {
        this.onQuestionChange(this.getCurrentQuestion(), this);
      }
    }

    return result;
  };

  /**
   * Score a single answer
   */
  QuizEngine.prototype._scoreAnswer = function (question, answer) {
    var type = question.type || 'multiple-choice';
    var correct = false;
    var score = 0;
    var partial = false;

    switch (type) {
      case 'multiple-choice':
      case 'true-false':
        if (answer === question.correctIndex) {
          correct = true;
          score = 1;
        }
        break;

      case 'multiple-select':
        var correctSet = question.correctIndices || [];
        var selected = answer || [];
        var correctCount = 0;
        var incorrectCount = 0;

        for (var i = 0; i < selected.length; i++) {
          if (correctSet.indexOf(selected[i]) !== -1) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }

        var totalCorrect = correctSet.length;
        if (correctCount === totalCorrect && incorrectCount === 0) {
          correct = true;
          score = 1;
        } else if (correctCount > 0) {
          // Partial credit
          partial = true;
          score = Math.max(0, (correctCount - incorrectCount) / totalCorrect);
        }
        break;

      case 'fill-in-blank':
        var normalizedAnswer = String(answer || '')
          .toLowerCase()
          .trim();
        var accepted = question.acceptedAnswers || [
          String(question.correctAnswer || '')
            .toLowerCase()
            .trim(),
        ];
        for (var ai = 0; ai < accepted.length; ai++) {
          if (normalizedAnswer === accepted[ai].toLowerCase().trim()) {
            correct = true;
            score = 1;
            break;
          }
        }
        break;
    }

    return {
      correct: correct,
      score: score,
      partial: partial,
      explanation: question.explanation || '',
    };
  };

  /**
   * Skip the current question (no points)
   */
  QuizEngine.prototype.skipQuestion = function () {
    if (this.isFinished) return null;

    this.answers.push({
      questionIndex: this.currentQuestionIndex,
      question: this.getCurrentQuestion(),
      answer: null,
      correct: false,
      score: 0,
      skipped: true,
    });

    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      this._finish();
    } else {
      this._startQuestionTimer();
      if (this.onQuestionChange) {
        this.onQuestionChange(this.getCurrentQuestion(), this);
      }
    }

    return this.getCurrentQuestion();
  };

  /**
   * Get quiz results summary
   */
  QuizEngine.prototype.getResults = function () {
    var totalPossible = this.totalQuestions;
    var percentage = totalPossible > 0 ? Math.round((this.score / totalPossible) * 100) : 0;
    var timeTaken = this.startTime && this.endTime ? this.endTime - this.startTime : 0;

    var correctCount = 0;
    var wrongCount = 0;
    var skippedCount = 0;
    var reviewItems = [];

    for (var i = 0; i < this.answers.length; i++) {
      var ans = this.answers[i];
      if (ans.skipped) {
        skippedCount++;
        reviewItems.push({
          index: ans.questionIndex,
          question: ans.question,
          userAnswer: null,
          correct: false,
          skipped: true,
        });
      } else if (ans.correct) {
        correctCount++;
      } else {
        wrongCount++;
        reviewItems.push({
          index: ans.questionIndex,
          question: ans.question,
          userAnswer: ans.answer,
          correct: false,
          skipped: false,
        });
      }
    }

    return {
      score: this.score,
      total: totalPossible,
      percentage: percentage,
      correctCount: correctCount,
      wrongCount: wrongCount,
      skippedCount: skippedCount,
      timeTaken: timeTaken,
      answers: this.answers,
      reviewItems: reviewItems,
      questions: this.questions,
    };
  };

  /**
   * Get progress info
   */
  QuizEngine.prototype.getProgress = function () {
    return {
      current: this.currentQuestionIndex + 1,
      total: this.totalQuestions,
      answered: this.answers.length,
      score: this.score,
      percentage:
        this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0,
      questionTimeLeft: this.questionTimeLeft,
      overallTimeLeft: this.overallTimeLeft,
    };
  };

  /**
   * Start per-question timer
   */
  QuizEngine.prototype._startQuestionTimer = function () {
    var self = this;

    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    if (this.questionTimeLimit > 0) {
      this.questionTimeLeft = this.questionTimeLimit;
      this.questionTimer = setInterval(function () {
        self.questionTimeLeft--;
        if (self.questionTimeLeft <= 0) {
          clearInterval(self.questionTimer);
          self.questionTimer = null;
          // Auto-skip on timeout
          self.skipQuestion();
        }
      }, 1000);
    }
  };

  /**
   * Start overall quiz timer
   */
  QuizEngine.prototype._startOverallTimer = function () {
    var self = this;

    if (this.overallTimer) {
      clearInterval(this.overallTimer);
      this.overallTimer = null;
    }

    if (this.overallTimeLimit > 0) {
      this.overallTimer = setInterval(function () {
        self.overallTimeLeft--;
        if (self.overallTimeLeft <= 0) {
          clearInterval(self.overallTimer);
          self.overallTimer = null;
          self._finish();
        }
      }, 1000);
    }
  };

  /**
   * Finish the quiz
   */
  QuizEngine.prototype._finish = function () {
    this.isFinished = true;
    this.endTime = Date.now();

    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }
    if (this.overallTimer) {
      clearInterval(this.overallTimer);
      this.overallTimer = null;
    }

    if (this.onComplete) {
      this.onComplete(this.getResults());
    }
  };

  /**
   * Clean up timers
   */
  QuizEngine.prototype.destroy = function () {
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }
    if (this.overallTimer) {
      clearInterval(this.overallTimer);
      this.overallTimer = null;
    }
  };

  // Export as browser global
  window.QuizEngine = QuizEngine;
})();
