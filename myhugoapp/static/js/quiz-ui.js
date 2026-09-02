/**
 * QuizUI — Renders quiz cards, feedback, results screens
 * Keyboard navigation: 1-4 for options, Enter to confirm
 */
(function () {
  'use strict';

  var TEMPLATE_PROGRESS =
    '<div class="quiz-progress-bar" data-quiz-progress>' +
    '<div class="quiz-progress-fill" data-quiz-progress-fill style="width: {{percent}}%"></div>' +
    '</div>' +
    '<div class="quiz-progress-text">{{current}} / {{total}} &middot; {{score}} Punkte</div>';

  var TEMPLATE_TIMER = '<div class="quiz-timer {{class}}" data-quiz-timer>{{time}}</div>';

  function QuizUI(containerEl, options) {
    if (!containerEl) {
      throw new Error('QuizUI requires a container element');
    }
    this.container = containerEl;
    this.options = options || {};
    this.engine = null;
    this.keyboardEnabled = this.options.keyboard !== false;
    this._keyHandler = null;
    this.selectedOption = null;
    this.multiSelect = [];
    this.fillBlankValue = '';
  }

  /**
   * Start a quiz session
   */
  QuizUI.prototype.start = function (engine) {
    this.engine = engine;
    this.selectedOption = null;
    this.multiSelect = [];
    this.fillBlankValue = '';

    var self = this;

    // Set up callbacks on engine
    if (!engine.onQuestionChange) {
      engine.onQuestionChange = function (q, e) {
        self.renderQuestion(q, e);
      };
    }
    if (!engine.onComplete) {
      engine.onComplete = function (results) {
        self.renderResults(results);
      };
    }

    this.renderQuestion(engine.getCurrentQuestion(), engine);
    this._enableKeyboard();
  };

  /**
   * Render current question card
   */
  QuizUI.prototype.renderQuestion = function (question, engine) {
    if (!question) {
      this.renderEmpty();
      return;
    }

    var progress = engine.getProgress();
    var html = '';

    // Progress bar
    var pct = Math.round(((progress.current - 1) / progress.total) * 100);
    html += TEMPLATE_PROGRESS.replace('{{percent}}', pct)
      .replace('{{current}}', progress.current)
      .replace('{{total}}', progress.total)
      .replace('{{score}}', progress.score);

    // Timer display
    if (engine.questionTimeLimit > 0) {
      var qTime = this._formatTime(engine.questionTimeLeft);
      html += TEMPLATE_TIMER.replace('{{time}}', '⏱ ' + qTime).replace(
        '{{class}}',
        engine.questionTimeLeft <= 10 ? 'quiz-timer-warning' : ''
      );
    }
    if (engine.overallTimeLimit > 0) {
      var oTime = this._formatTime(engine.overallTimeLeft);
      html += TEMPLATE_TIMER.replace('{{time}}', '⏳ ' + oTime).replace(
        '{{class}}',
        engine.overallTimeLeft <= 30 ? 'quiz-timer-warning' : ''
      );
    }

    // Topic badge
    var topicLabel = question.topic || '';
    html += '<div class="quiz-topic-badge">' + this._escapeHtml(topicLabel) + '</div>';

    // Question text
    html += '<h3 class="quiz-question-text">' + this._escapeHtml(question.question) + '</h3>';

    // Question type label
    var typeLabels = {
      'multiple-choice': 'Einfachauswahl',
      'multiple-select': 'Mehrfachauswahl',
      'true-false': 'Richtig/Falsch',
      'fill-in-blank': 'Lückentext',
    };
    html +=
      '<div class="quiz-type-label">' + (typeLabels[question.type] || question.type) + '</div>';

    // Options
    html += '<div class="quiz-options" data-quiz-options>';
    if (question.type === 'fill-in-blank') {
      html +=
        '<input type="text" class="quiz-fill-input" data-quiz-fill-input ' +
        'placeholder="Antwort eingeben..." value="' +
        this._escapeHtml(this.fillBlankValue) +
        '" />';
    } else if (question.type === 'multiple-select') {
      for (var i = 0; i < question.options.length; i++) {
        var checked = this.multiSelect.indexOf(i) !== -1;
        html +=
          '<label class="quiz-option quiz-option-multi" data-option-index="' +
          i +
          '">' +
          '<input type="checkbox" class="quiz-checkbox" ' +
          (checked ? 'checked' : '') +
          ' /> ' +
          '<span>' +
          this._escapeHtml(question.options[i]) +
          '</span>' +
          '</label>';
      }
    } else {
      for (var j = 0; j < question.options.length; j++) {
        var selected = this.selectedOption === j;
        html +=
          '<button class="quiz-option' +
          (selected ? ' quiz-option-selected' : '') +
          '" ' +
          'data-option-index="' +
          j +
          '" type="button" ' +
          'aria-label="' +
          this._escapeHtml(question.options[j]) +
          '">' +
          '<span class="quiz-option-key">' +
          (j + 1) +
          '</span> ' +
          this._escapeHtml(question.options[j]) +
          '</button>';
      }
    }
    html += '</div>';

    // Action buttons
    html += '<div class="quiz-actions">';
    html +=
      '<button class="quiz-btn quiz-btn-primary" data-quiz-submit type="button" ' +
      (this.selectedOption === null && this.multiSelect.length === 0 && this.fillBlankValue === ''
        ? 'disabled'
        : '') +
      '>Bestätigen (Enter)</button>';
    html +=
      '<button class="quiz-btn quiz-btn-skip" data-quiz-skip type="button">Überspringen</button>';
    html += '</div>';

    this.container.innerHTML = html;
    this._bindQuestionEvents(question, engine);
  };

  /**
   * Bind event handlers for the current question
   */
  QuizUI.prototype._bindQuestionEvents = function (question, engine) {
    var self = this;

    // Single-select options (click or keyboard)
    var options = this.container.querySelectorAll('.quiz-option[data-option-index]');
    for (var i = 0; i < options.length; i++) {
      (function (idx) {
        options[idx].addEventListener('click', function () {
          if (question.type === 'multiple-select') {
            var cb = this.querySelector('.quiz-checkbox');
            if (cb) cb.checked = !cb.checked;
            self.multiSelect = [];
            var checkedBoxes = self.container.querySelectorAll('.quiz-checkbox:checked');
            for (var ci = 0; ci < checkedBoxes.length; ci++) {
              var parent = checkedBoxes[ci].closest('[data-option-index]');
              if (parent) {
                self.multiSelect.push(parseInt(parent.getAttribute('data-option-index'), 10));
              }
            }
            self._updateSubmitButton();
          } else {
            // Remove selection from others
            var allOpts = self.container.querySelectorAll('.quiz-option');
            for (var oi = 0; oi < allOpts.length; oi++) {
              allOpts[oi].classList.remove('quiz-option-selected');
            }
            this.classList.add('quiz-option-selected');
            self.selectedOption = idx;
            self._updateSubmitButton();
          }
        });
      })(i);
    }

    // Fill-in-blank input
    var fillInput = this.container.querySelector('[data-quiz-fill-input]');
    if (fillInput) {
      fillInput.addEventListener('input', function () {
        self.fillBlankValue = this.value;
        self._updateSubmitButton();
      });
      fillInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          self._submitAnswer(question, engine);
        }
      });
    }

    // Submit button
    var submitBtn = this.container.querySelector('[data-quiz-submit]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        self._submitAnswer(question, engine);
      });
    }

    // Skip button
    var skipBtn = this.container.querySelector('[data-quiz-skip]');
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        engine.skipQuestion();
      });
    }
  };

  /**
   * Submit answer and show feedback
   */
  QuizUI.prototype._submitAnswer = function (question, engine) {
    var answer;

    if (question.type === 'fill-in-blank') {
      answer = this.fillBlankValue;
    } else if (question.type === 'multiple-select') {
      answer = this.multiSelect.slice();
    } else {
      answer = this.selectedOption;
    }

    var result = engine.submitAnswer(answer);
    if (!result) return;

    this._showFeedback(result, engine);

    // After a delay, move to next question or results
    var delay = result.correct ? 1000 : 2500;
    var self = this;
    setTimeout(function () {
      if (engine.isFinished) {
        self.renderResults(engine.getResults());
      } else {
        self.renderQuestion(engine.getCurrentQuestion(), engine);
      }
    }, delay);
  };

  /**
   * Show feedback overlay on current question
   */
  QuizUI.prototype._showFeedback = function (result, engine) {
    var feedbackEl = document.createElement('div');
    feedbackEl.className =
      'quiz-feedback ' + (result.correct ? 'quiz-feedback-correct' : 'quiz-feedback-wrong');

    var icon = result.correct ? '✓' : '✗';
    var label = result.correct ? 'Richtig!' : 'Falsch';
    var pts = result.partial ? ' (' + Math.round(result.score * 100) + ' %)' : '';

    var html = '<div class="quiz-feedback-icon">' + icon + '</div>';
    html +=
      '<div class="quiz-feedback-label">' +
      label +
      pts +
      ' &middot; ' +
      engine.score +
      '/' +
      engine.totalQuestions +
      ' Punkte</div>';

    if (result.explanation) {
      html +=
        '<div class="quiz-feedback-explanation">' + this._escapeHtml(result.explanation) + '</div>';
    }

    feedbackEl.innerHTML = html;
    this.container.appendChild(feedbackEl);

    // Disable submit button during feedback
    var submitBtn = this.container.querySelector('[data-quiz-submit]');
    if (submitBtn) submitBtn.disabled = true;
  };

  /**
   * Render results screen
   */
  QuizUI.prototype.renderResults = function (results) {
    var html = '';

    // Header
    html += '<div class="quiz-results-header">';
    html += '<h2>Quiz beendet!</h2>';
    html += '</div>';

    // Score circle
    var circleClass = 'quiz-score-circle';
    if (results.percentage >= 80) circleClass += ' quiz-score-great';
    else if (results.percentage >= 50) circleClass += ' quiz-score-good';
    else circleClass += ' quiz-score-poor';

    html += '<div class="' + circleClass + '">';
    html += '<div class="quiz-score-pct">' + results.percentage + '%</div>';
    html +=
      '<div class="quiz-score-detail">' +
      results.score +
      ' / ' +
      results.total +
      ' Punkte' +
      '</div>';
    html += '</div>';

    // Stats
    html += '<div class="quiz-results-stats">';
    html +=
      '<div class="quiz-stat"><span class="quiz-stat-label">Richtig</span><span class="quiz-stat-value quiz-stat-correct">' +
      results.correctCount +
      '</span></div>';
    html +=
      '<div class="quiz-stat"><span class="quiz-stat-label">Falsch</span><span class="quiz-stat-value quiz-stat-wrong">' +
      results.wrongCount +
      '</span></div>';
    html +=
      '<div class="quiz-stat"><span class="quiz-stat-label">Übersprungen</span><span class="quiz-stat-value quiz-stat-skipped">' +
      results.skippedCount +
      '</span></div>';
    html +=
      '<div class="quiz-stat"><span class="quiz-stat-label">Zeit</span><span class="quiz-stat-value">' +
      this._formatTime(Math.floor(results.timeTaken / 1000)) +
      '</span></div>';
    html += '</div>';

    // Review section for wrong answers
    if (results.reviewItems.length > 0) {
      html += '<div class="quiz-review-section">';
      html += '<h3>Überprüfe deine Antworten</h3>';
      for (var i = 0; i < results.reviewItems.length; i++) {
        var item = results.reviewItems[i];
        html += '<div class="quiz-review-item">';
        html +=
          '<div class="quiz-review-question">' +
          this._escapeHtml(item.question.question) +
          '</div>';

        if (item.skipped) {
          html += '<div class="quiz-review-answer quiz-review-skipped">Übersprungen</div>';
        } else {
          var userAnswer = Array.isArray(item.userAnswer)
            ? item.userAnswer
                .map(function (idx) {
                  return item.question.options[idx] !== undefined
                    ? item.question.options[idx]
                    : '?';
                })
                .join(', ')
            : item.question.options[item.userAnswer] !== undefined
              ? item.question.options[item.userAnswer]
              : item.userAnswer || '—';
          html +=
            '<div class="quiz-review-answer">Deine Antwort: ' +
            this._escapeHtml(String(userAnswer)) +
            '</div>';
        }

        var correctAnswer;
        if (item.question.type === 'fill-in-blank') {
          correctAnswer = item.question.correctAnswer || '—';
        } else if (item.question.type === 'multiple-select') {
          correctAnswer = (item.question.correctIndices || [])
            .map(function (idx) {
              return item.question.options[idx];
            })
            .join(', ');
        } else {
          correctAnswer =
            item.question.options[item.question.correctIndex] !== undefined
              ? item.question.options[item.question.correctIndex]
              : '—';
        }
        html +=
          '<div class="quiz-review-correct">Richtig: ' + this._escapeHtml(correctAnswer) + '</div>';

        if (item.question.explanation) {
          html +=
            '<div class="quiz-review-explanation">' +
            this._escapeHtml(item.question.explanation) +
            '</div>';
        }

        html += '</div>';
      }
      html += '</div>';
    }

    // UXF-023: Ergebnis teilen/kopieren
    html +=
      '<button class="quiz-btn quiz-btn-secondary" data-quiz-share type="button" data-quiz-title="' +
      this._escapeHtml((this.options && this.options.quizTitle) || '') +
      '">' +
      '🔗 Ergebnis kopieren</button>';

    // Retry / topic selection buttons
    html += '<div class="quiz-results-actions">';
    html +=
      '<button class="quiz-btn quiz-btn-primary" data-quiz-retry type="button">Erneut versuchen</button>';
    html +=
      '<button class="quiz-btn quiz-btn-secondary" data-quiz-wiederholen type="button">Wiederholen (nur falsche)</button>';
    html += '</div>';

    this.container.innerHTML = html;

    // a11y: move focus to the results heading after submit
    var resultsHeader = this.container.querySelector('.quiz-results-header');
    if (resultsHeader) {
      resultsHeader.setAttribute('tabindex', '-1');
      resultsHeader.focus();
    }

    // Bind retry events
    var self = this;
    var retryBtn = this.container.querySelector('[data-quiz-retry]');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        if (self.options.onRetry) {
          self.options.onRetry();
        }
      });
    }

    var wiederholenBtn = this.container.querySelector('[data-quiz-wiederholen]');
    if (wiederholenBtn) {
      wiederholenBtn.addEventListener('click', function () {
        if (self.options.onWiederholen) {
          self.options.onWiederholen(results.reviewItems);
        }
      });
    }

    // UXF-023: Ergebnis-Text in die Zwischenablage
    var shareBtn = this.container.querySelector('[data-quiz-share]');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        // UXF-028: echter Thema-Name aus der Option (Fallback: Seiten-h1)
        // Achtung: im click-Handler zeigt this auf den Button — self ist
        // die QuizUI-Instanz (var self = this in renderResults).
        var quizTitle =
          (self.options && self.options.quizTitle ? String(self.options.quizTitle).trim() : '') ||
          (document.querySelector('.quiz-title, h1') &&
          document.querySelector('.quiz-title, h1').textContent
            ? document.querySelector('.quiz-title, h1').textContent.trim()
            : '') ||
          'Chemie-Quiz';
        var text =
          'Quiz „' +
          quizTitle +
          '": ' +
          results.percentage +
          '% (' +
          results.score +
          '/' +
          results.total +
          ' Punkte) — ' +
          window.location.origin +
          '/quiz/';
        var restore = shareBtn.textContent;
        var done = function () {
          shareBtn.textContent = '✓ Kopiert!';
          if (window.UIToast && window.UIToast.success) {
            window.UIToast.success('Ergebnis in die Zwischenablage kopiert');
          }
          setTimeout(function () {
            shareBtn.textContent = restore;
          }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(text)
            .then(done)
            .catch(function () {
              window.prompt('Ergebnis zum Kopieren (Strg+C):', text);
            });
        } else {
          window.prompt('Ergebnis zum Kopieren (Strg+C):', text);
        }
      });
    }

    this._disableKeyboard();
  };

  /**
   * Render empty state
   */
  QuizUI.prototype.renderEmpty = function () {
    this.container.innerHTML =
      '<div class="quiz-empty">' + '<p>Keine Fragen verfügbar.</p>' + '</div>';
  };

  /**
   * Enable keyboard navigation
   */
  QuizUI.prototype._enableKeyboard = function () {
    var self = this;
    if (!this.keyboardEnabled) return;

    this._keyHandler = function (e) {
      var engine = self.engine;
      if (!engine || engine.isFinished) return;

      var question = engine.getCurrentQuestion();
      if (!question) return;

      // 1-4 for selecting options
      var num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && question.options && num <= question.options.length) {
        if (question.type === 'multiple-select') {
          var idx = num - 1;
          var checkbox = self.container.querySelector(
            '.quiz-option[data-option-index="' + idx + '"] .quiz-checkbox'
          );
          if (checkbox) {
            checkbox.click();
          }
        } else {
          self.selectedOption = num - 1;
          var allOpts = self.container.querySelectorAll('.quiz-option');
          for (var i = 0; i < allOpts.length; i++) {
            allOpts[i].classList.remove('quiz-option-selected');
          }
          var opt = self.container.querySelector(
            '.quiz-option[data-option-index="' + self.selectedOption + '"]'
          );
          if (opt) opt.classList.add('quiz-option-selected');
          self._updateSubmitButton();
        }
        e.preventDefault();
      }

      // Enter to confirm
      if (e.key === 'Enter') {
        var submitBtn = self.container.querySelector('[data-quiz-submit]');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', this._keyHandler);
  };

  /**
   * Disable keyboard navigation
   */
  QuizUI.prototype._disableKeyboard = function () {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  };

  /**
   * Update submit button disabled state
   */
  QuizUI.prototype._updateSubmitButton = function () {
    var submitBtn = this.container.querySelector('[data-quiz-submit]');
    if (!submitBtn) return;

    var hasSelection =
      this.selectedOption !== null ||
      this.multiSelect.length > 0 ||
      this.fillBlankValue.trim() !== '';

    submitBtn.disabled = !hasSelection;
  };

  /**
   * Format seconds to MM:SS
   */
  QuizUI.prototype._formatTime = function (seconds) {
    if (seconds === null || seconds === undefined) return '—';
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  /**
   * Escape HTML entities
   */
  QuizUI.prototype._escapeHtml = function (str) {
    if (typeof str !== 'string') return String(str || '');
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  /**
   * Clean up
   */
  QuizUI.prototype.destroy = function () {
    this._disableKeyboard();
    this.engine = null;
    this.container.innerHTML = '';
  };

  // Export as browser global (also assign for tests)
  window.QuizUI = QuizUI;

  // For Node.js tests, also export via module.exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizUI: QuizUI };
  }
})();
