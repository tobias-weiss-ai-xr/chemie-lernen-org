/**
 * Quiz Integration Script for Articles
 * Loads and quizzes from quiz database and initializes them
 */
(function() {
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

  function initializeQuiz(quizId) {
    const quizData = loadQuiz(quizId);
    if (!quizData) {
      console.warn('Quiz not found:', quizId);
      return;
    }

    const quizContainer = document.getElementById(`quiz-${quizId}`);
    if (!quizContainer) {
      console.warn('Quiz container not found:', quizId);
      return;
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

      const questionHTML = `
        <div class="quiz-question" data-question-id="${questionData.id}">
          <div class="quiz-progress">
            <span>Frage ${questionNumber} von ${quizData.questions.length}</span>
          </div>
          <p class="question-text">${questionData.question}</p>
          <div class="quiz-options">
            ${questionData.options.map((option, index) => `
              <button class="quiz-option" data-option="${index}">
                ${option}
              </button>
            `).join('')}
          </div>
        </div>
      `;

      return questionHTML;
    }

    const quizContent = quizContainer.querySelector('.quiz-content');
    if (quizContent) {
      quizContent.innerHTML = renderQuestion();

      const options = quizContent.querySelectorAll('.quiz-option');
      options.forEach(option => {
        option.addEventListener('click', function() {
          const selectedOption = parseInt(this.dataset.option);
          const questionData = quizData.questions[currentQuestion];

          const allOptions = quizContent.querySelectorAll('.quiz-option');
          allOptions.forEach(opt => {
            opt.disabled = true;
            if (parseInt(opt.dataset.option) === questionData.correct) {
              opt.classList.add('correct');
            } else if (parseInt(opt.dataset.option) === selectedOption && selectedOption !== questionData.correct) {
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
            nextButton.addEventListener('click', function() {
              currentQuestion++;
              quizContent.innerHTML = renderQuestion();
              initializeOptionsListeners();
            });
            quizContent.appendChild(nextButton);
          } else {
            const scoreHTML = `
              <div class="quiz-score">
                <h3>Ergebnis</h3>
                <p>Ihr Ergebnis: ${score} von ${quizData.questions.length} richtig (${Math.round(score/quizData.questions.length * 100)}%)</p>
                <button class="quiz-restart-button" id="restart-${quizId}">Quiz wiederholen</button>
              </div>
            `;
            quizContent.insertAdjacentHTML('beforeend', scoreHTML);

            document.getElementById(`restart-${quizId}`).addEventListener('click', function() {
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
      options.forEach(option => {
        option.addEventListener('click', function() {
          const selectedOption = parseInt(this.dataset.option);
          const questionData = quizData.questions[currentQuestion];

          const allOptions = quizContent.querySelectorAll('.quiz-option');
          allOptions.forEach(opt => {
            opt.disabled = true;
            if (parseInt(opt.dataset.option) === questionData.correct) {
              opt.classList.add('correct');
            } else if (parseInt(opt.dataset.option) === selectedOption && selectedOption !== questionData.correct) {
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
            nextButton.addEventListener('click', function() {
              currentQuestion++;
              quizContent.innerHTML = renderQuestion();
              initializeOptionsListeners();
            });
            quizContent.appendChild(nextButton);
          } else {
            const scoreHTML = `
              <div class="quiz-score">
                <h3>Ergebnis</h3>
                <p>Ihr Ergebnis: ${score} von ${quizData.questions.length} richtig (${Math.round(score/quizData.questions.length * 100)}%)</p>
                <button class="quiz-restart-button" id="restart-${quizId}">Quiz wiederholen</button>
              </div>
            `;
            quizContent.insertAdjacentHTML('beforeend', scoreHTML);

            document.getElementById(`restart-${quizId}`).addEventListener('click', function() {
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

  window.addEventListener('DOMContentLoaded', function() {
    const quizContainers = document.querySelectorAll('.quiz-container[id^="quiz-"]');
    quizContainers.forEach(container => {
      const quizId = container.id.replace('quiz-', '');
      initializeQuiz(quizId);
    });
  });

})();