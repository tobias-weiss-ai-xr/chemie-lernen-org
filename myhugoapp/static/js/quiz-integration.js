/**
 * Quiz Integration Script for Articles
 * Loads and quizzes from quiz database and initializes them
 */
(function () {
  'use strict';

  const quizDatabase = window.quizDatabase || {};

  function loadQuiz(quizId) {
    for (const topic in quizDatabase) {
      if (quizDatabase[topic] && quizDatabase[topic][quizId]) {
        return quizDatabase[topic][quizId];
      }
    }
    return null;
  }

  /**
   * Render a badge indicating question source (AI vs hand-authored).
   */
  function renderSourceBadge(questionData) {
    if (questionData.source === 'ai' || questionData.aiGenerated) {
      return '<span class="label label-info quiz-ai-badge" title="KI-generierte Frage">KI-generiert</span>';
    }
    return '';
  }

  /**
   * Render the adaptive difficulty tooltip.
   */
  function renderDifficultyTooltip(difficulty) {
    var labels = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' };
    var label = labels[difficulty] || 'Mittel';
    return (
      '<span class="label label-default quiz-difficulty-tooltip" title="Basierend auf Ihren bisherigen Antworten">' +
      'Schwierigkeit: ' +
      label +
      '</span>'
    );
  }

  function initializeQuiz(quizId) {
    var quizData = loadQuiz(quizId);
    if (!quizData) {
      // Fallback: try to load from chemieQuiz (which may have AI questions)
      if (window.chemieQuiz) {
        var topicQuiz = window.chemieQuiz.quizzes[quizId];
        if (topicQuiz) {
          // Use the registered quiz data directly
          window.chemieQuiz.startQuiz(quizId).then(function (started) {
            if (started) renderAiQuiz(quizId);
          });
          return;
        }
      }
      console.warn('Quiz not found:', quizId);
      return;
    }

    var quizContainer = document.getElementById('quiz-' + quizId);
    if (!quizContainer) {
      console.warn('Quiz container not found:', quizId);
      return;
    }

    // Show adaptive difficulty recommendation
    if (window.chemieQuiz) {
      var diffLabel = window.chemieQuiz.getAdaptiveDifficultyLabel();
      var diffTooltip = document.getElementById('quiz-difficulty-' + quizId);
      if (diffTooltip) {
        diffTooltip.innerHTML = renderDifficultyTooltip(
          window.chemieQuiz._adaptiveDifficulty || 'medium'
        );
      }
    }

    // Show "KI-generiert" badge if any AI questions are mixed in
    var badgeContainer = document.getElementById('quiz-badge-' + quizId);
    if (badgeContainer) {
      var hasAiQuestions = (quizData.questions || []).some(function (q) {
        return q.source === 'ai' || q.aiGenerated;
      });
      if (hasAiQuestions) {
        badgeContainer.innerHTML = renderSourceBadge({ source: 'ai' });
      }
    }

    quizContainer.style.display = 'block';

    let currentQuestion = 0;
    let score = 0;

    const titleElement = document.getElementById(`quiz-title-${quizId}`);
    if (titleElement) {
      titleElement.textContent = quizData.title;
    }

    function renderQuestion() {
      const questionData = quizData.questions[currentQuestion];
      const questionNumber = currentQuestion + 1;

      var badgeHtml = renderSourceBadge(questionData);
      var questionHTML = [
        '<div class="quiz-question" data-question-id="' + questionData.id + '">',
        '<div class="quiz-progress">',
        '<span>Frage ' + questionNumber + ' von ' + quizData.questions.length + '</span>',
        badgeHtml,
        '</div>',
        '<p class="question-text">' + questionData.question + '</p>',
        '<div class="quiz-options">',
      ].join('');

      for (var i = 0; i < questionData.options.length; i++) {
        questionHTML += [
          '<button class="quiz-option" data-option="' + i + '">',
          questionData.options[i],
          '</button>',
        ].join('');
      }

      questionHTML += '</div></div>';
      return questionHTML;
    }

    /**
     * Render a quiz from AI-generated questions (no pre-existing quiz-database entry).
     */
    function renderAiQuiz(quizId) {
      var quizContainer = document.getElementById('quiz-' + quizId);
      if (!quizContainer) return;
      quizContainer.style.display = 'block';

      var currentQuiz = window.chemieQuiz.currentQuiz;
      if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
        quizContainer.innerHTML = '<p class="text-center">Keine Fragen verfügbar.</p>';
        return;
      }

      // Set up the quiz HTML structure
      var badgeHtml =
        window.chemieQuiz.getCurrentQuestionSource() === 'ai'
          ? '<span class="label label-info quiz-ai-badge">KI-generiert</span>'
          : '';

      quizContainer.innerHTML = [
        '<div class="quiz-content">',
        '<div class="quiz-header">',
        '<h3>' + (currentQuiz.title || 'Quiz') + '</h3>',
        badgeHtml,
        '</div>',
        '<div class="quiz-body"></div>',
        '<div class="quiz-footer">',
        '<button class="btn btn-primary" id="quiz-submit-' + quizId + '">Antwort prüfen</button>',
        '</div>',
        '</div>',
      ].join('');

      renderAiQuestion(quizId, 0);
    }

    function renderAiQuestion(quizId, index) {
      var currentQuiz = window.chemieQuiz.currentQuiz;
      if (!currentQuiz || index >= currentQuiz.questions.length) return;

      var question = currentQuiz.questions[index];
      var body = document.querySelector('#quiz-' + quizId + ' .quiz-body');
      if (!body) return;

      var badge =
        question.source === 'ai'
          ? '<span class="label label-info quiz-ai-badge">KI-generiert</span>'
          : '';
      body.innerHTML = [
        '<div class="quiz-progress">',
        '<span>Frage ' + (index + 1) + ' von ' + currentQuiz.questions.length + '</span>',
        badge,
        '</div>',
        '<p><strong>' + question.question + '</strong></p>',
        '<div class="quiz-options">',
      ].join('');

      var options = question.options || [];
      for (var i = 0; i < options.length; i++) {
        body.innerHTML += [
          '<button class="quiz-option btn btn-default" data-option="' +
            i +
            '" onclick="selectAiOption(this, \'' +
            quizId +
            "', " +
            i +
            ')">',
          options[i],
          '</button>',
        ].join('');
      }
      body.innerHTML += '</div>';
    }

    // Export selectAiOption for use in onclick
    window.selectAiOption = function (btn, quizId, selectedIdx) {
      var allOptions = document.querySelectorAll('#quiz-' + quizId + ' .quiz-option');
      allOptions.forEach(function (opt) {
        opt.classList.remove('selected');
      });
      btn.classList.add('selected');
      btn.dataset.selected = 'true';
    };

    const quizContent = quizContainer.querySelector('.quiz-content');
    if (quizContent) {
      quizContent.innerHTML = renderQuestion();

      const options = quizContent.querySelectorAll('.quiz-option');
      options.forEach((option) => {
        option.addEventListener('click', function () {
          const selectedOption = parseInt(this.dataset.option);
          const questionData = quizData.questions[currentQuestion];

          const allOptions = quizContent.querySelectorAll('.quiz-option');
          allOptions.forEach((opt) => {
            opt.disabled = true;
            if (parseInt(opt.dataset.option) === questionData.correct) {
              opt.classList.add('correct');
            } else if (
              parseInt(opt.dataset.option) === selectedOption &&
              selectedOption !== questionData.correct
            ) {
              opt.classList.add('incorrect');
            }
          });

          const feedbackHTML = `
            <div class="quiz-feedback">
              <p class="feedback-text">${selectedOption === questionData.correct ? '✅ Korrekt!' : '❌ Falsch!'}</p>
              <p class="feedback-explanation">${questionData.explanation}</p>
            </div>
          `;

          if (selectedOption === questionData.correct) {
            score++;
          }

          quizContent.insertAdjacentHTML('beforeend', feedbackHTML);

          if (currentQuestion < quizData.questions.length - 1) {
            const nextButton = document.createElement('button');
            nextButton.className = 'quiz-next-button';
            nextButton.textContent = 'Nächste Frage';
            nextButton.addEventListener('click', function () {
              currentQuestion++;
              quizContent.innerHTML = renderQuestion();
              initializeOptionsListeners();
            });
            quizContent.appendChild(nextButton);
          } else {
            const scoreHTML = `
              <div class="quiz-score">
                <h3>Ergebnis</h3>
                <p>Ihr Ergebnis: ${score} von ${quizData.questions.length} richtig (${Math.round((score / quizData.questions.length) * 100)}%)</p>
                <button class="quiz-restart-button" id="restart-${quizId}">Quiz wiederholen</button>
              </div>
            `;
            quizContent.insertAdjacentHTML('beforeend', scoreHTML);

            document.getElementById(`restart-${quizId}`).addEventListener('click', function () {
              currentQuestion = 0;
              score = 0;
              quizContent.innerHTML = renderQuestion();
              initializeOptionsListeners();
            });
          }
        });
      });
    }

    function initializeOptionsListeners() {
      const options = quizContent.querySelectorAll('.quiz-option');
      options.forEach((option) => {
        option.addEventListener('click', function () {
          const selectedOption = parseInt(this.dataset.option);
          const questionData = quizData.questions[currentQuestion];

          const allOptions = quizContent.querySelectorAll('.quiz-option');
          allOptions.forEach((opt) => {
            opt.disabled = true;
            if (parseInt(opt.dataset.option) === questionData.correct) {
              opt.classList.add('correct');
            } else if (
              parseInt(opt.dataset.option) === selectedOption &&
              selectedOption !== questionData.correct
            ) {
              opt.classList.add('incorrect');
            }
          });

          const feedbackHTML = `
            <div class="quiz-feedback">
              <p class="feedback-text">${selectedOption === questionData.correct ? '✅ Korrekt!' : '❌ Falsch!'}</p>
              <p class="feedback-explanation">${questionData.explanation}</p>
            </div>
          `;

          if (selectedOption === questionData.correct) {
            score++;
          }

          quizContent.insertAdjacentHTML('beforeend', feedbackHTML);

          if (currentQuestion < quizData.questions.length - 1) {
            const nextButton = document.createElement('button');
            nextButton.className = 'quiz-next-button';
            nextButton.textContent = 'Nächste Frage';
            nextButton.addEventListener('click', function () {
              currentQuestion++;
              quizContent.innerHTML = renderQuestion();
              initializeOptionsListeners();
            });
            quizContent.appendChild(nextButton);
          } else {
            const scoreHTML = `
              <div class="quiz-score">
                <h3>Ergebnis</h3>
                <p>Ihr Ergebnis: ${score} von ${quizData.questions.length} richtig (${Math.round((score / quizData.questions.length) * 100)}%)</p>
                <button class="quiz-restart-button" id="restart-${quizId}">Quiz wiederholen</button>
              </div>
            `;
            quizContent.insertAdjacentHTML('beforeend', scoreHTML);

            document.getElementById(`restart-${quizId}`).addEventListener('click', function () {
              currentQuestion = 0;
              score = 0;
              quizContent.innerHTML = renderQuestion();
              initializeOptionsListeners();
            });
          }
        });
      });
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    const quizContainers = document.querySelectorAll('.quiz-container[id^="quiz-"]');
    quizContainers.forEach((container) => {
      const quizId = container.id.replace('quiz-', '');
      initializeQuiz(quizId);
    });
  });
})();
