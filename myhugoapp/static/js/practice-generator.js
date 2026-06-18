/**
 * Practice Generator
 * Dynamic chemistry exercise generator with 5 exercise types
 */


(function () {
  'use strict';

  var state = {
    topic: 'random',
    difficulty: 2,
    inputMode: 'multiple-choice',
    currentQuestion: null,
    totalQuestions: 0,
    correctAnswers: 0,
    answered: false
  };

  var elements = {};

  function init() {
    elements = {
      topicSelect: document.getElementById('topic-select'),
      difficultySlider: document.getElementById('difficulty-slider'),
      inputMode: document.getElementById('input-mode'),
      generateBtn: document.getElementById('generate-btn'),
      resetBtn: document.getElementById('reset-score-btn'),
      printBtn: document.getElementById('print-btn'),
      questionSection: document.getElementById('question-section'),
      initialState: document.getElementById('initial-state'),
      questionText: document.getElementById('question-text'),
      questionData: document.getElementById('question-data'),
      mcSection: document.getElementById('mc-answer-section'),
      mcOptions: document.getElementById('mc-options'),
      freeSection: document.getElementById('free-input-section'),
      freeInput: document.getElementById('free-input-answer'),
      submitFree: document.getElementById('submit-free-input'),
      feedbackSection: document.getElementById('feedback-section'),
      feedbackCard: document.getElementById('feedback-card'),
      feedbackTitle: document.getElementById('feedback-title'),
      feedbackMessage: document.getElementById('feedback-message'),
      feedbackExplanation: document.getElementById('feedback-explanation'),
      nextSection: document.getElementById('next-section'),
      nextBtn: document.getElementById('next-btn'),
      totalSpan: document.getElementById('total-questions'),
      correctSpan: document.getElementById('correct-answers'),
      incorrectSpan: document.getElementById('incorrect-answers'),
      percentSpan: document.getElementById('score-percentage'),
      topicBadge: document.getElementById('topic-badge'),
      difficultyBadge: document.getElementById('difficulty-badge'),
      questionNumber: document.getElementById('question-number')
    };

    loadScore();
    bindEvents();
    updateScoreDisplay();
  }

  function bindEvents() {
    elements.generateBtn.addEventListener('click', generateNewQuestion);
    elements.nextBtn.addEventListener('click', generateNewQuestion);
    elements.resetBtn.addEventListener('click', resetScore);
    elements.printBtn.addEventListener('click', function () { window.print(); });
    elements.submitFree.addEventListener('click', submitFreeInput);
    elements.freeInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') submitFreeInput();
    });
    elements.difficultySlider.addEventListener('input', updateDifficultyDisplay);
  }

  function updateDifficultyDisplay() {
    var val = parseInt(elements.difficultySlider.value, 10);
    var labels = ['Leicht', 'Mittel', 'Schwer'];
    elements.difficultySlider.setAttribute('data-label', labels[val - 1]);
  }

  function generateNewQuestion() {
    state.topic = elements.topicSelect.value;
    state.difficulty = parseInt(elements.difficultySlider.value, 10);
    state.inputMode = elements.inputMode.value;
    state.answered = false;

    state.currentQuestion = createQuestion(state.topic, state.difficulty);
    state.currentQuestion.questionNumber = state.totalQuestions + 1;

    displayQuestion(state.currentQuestion);

    elements.feedbackSection.style.display = 'none';
    elements.nextSection.style.display = 'none';
  }

  // --- Question Generation ---

  function createQuestion(topic, difficulty) {
    var topics = ['stoichiometry', 'balancing', 'molar-mass', 'ph-calculations', 'redox'];
    var selectedTopic = topic === 'random'
      ? topics[Math.floor(Math.random() * topics.length)]
      : topic;

    switch (selectedTopic) {
      case 'stoichiometry': return createStoichiometryQuestion(difficulty);
      case 'balancing': return createBalancingQuestion(difficulty);
      case 'molar-mass': return createMolarMassQuestion(difficulty);
      case 'ph-calculations': return createPhQuestion(difficulty);
      case 'redox': return createRedoxQuestion(difficulty);
      default: return createStoichiometryQuestion(difficulty);
    }
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function roundTo(v, decimals) {
    var f = Math.pow(10, decimals);
    return Math.round(v * f) / f;
  }

  function _unitStr(topic) {
    switch (topic) {
      case 'stoichiometry': return 'mol';
      case 'molar-mass': return 'g/mol';
      case 'ph-calculations': return '';
      default: return '';
    }
  }

  // ------- STOICHIOMETRY -------

  function createStoichiometryQuestion(diff) {
    var _compounds, _question, _answer, _unit;
    var templates = [];

    if (diff >= 1) {
      templates.push({
        gen: function () {
          var metals = ['Na', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn'];
          var nonMetals = ['Cl', 'O', 'S', 'N', 'F'];
          var metal = pick(metals);
          var nonMetal = pick(nonMetals);
          var mf = rand(1, 2);
          var nf = rand(1, 3);
          var formula = metal + mf + nonMetal + nf;
          var m = rand(1, 10);
          var n = rand(2, 5);
          var result = m * n;
          return {
            text: 'Wie viel ' + formula + ' (in mol) entstehen aus ' + m +
              ' mol ' + metal + '? (Reaktionsgleichung: 2' + metal + ' + ' +
              nonMetal + nf + ' → 2' + formula + ')',
            answer: result,
            unit: 'mol'
          };
        }
      });
    }

    if (diff >= 2) {
      templates.push({
        gen: function () {
          var element = pick(['C', 'O', 'Fe', 'Cu', 'S', 'N']);
          var mass = (diff === 2) ? rand(10, 100) : rand(1, 20);
          var gmol = getMolarMassOf(element);
          var mol = mass / gmol;
          return {
            text: 'Wie viele mol sind ' + mass + ' g ' + element + '? (M(' + element + ') = ' + gmol + ' g/mol)',
            answer: roundTo(mol, 2),
            unit: 'mol'
          };
        }
      });
    }

    if (diff >= 3) {
      templates.push({
        gen: function () {
          var element = pick(['Fe', 'Cu', 'Al', 'Ag', 'Au', 'Pb']);
          var mass1 = rand(20, 200);
          var gmol1 = getMolarMassOf(element);
          var mol1 = mass1 / gmol1;
          var compound = element + 'O';
          var gmol2 = gmol1 + 16;
          var mass2 = roundTo(mol1 * gmol2, 1);
          return {
            text: element + ' reagiert mit Sauerstoff zu ' + compound +
              '. Wie viel g ' + compound + ' entstehen aus ' + mass1 +
              ' g ' + element + '? (2' + element + ' + O₂ → 2' + compound + ')',
            answer: mass2,
            unit: 'g'
          };
        }
      });
    }

    var q = pick(templates).gen();
    return formatQuestion(q.text, q.answer, q.unit, 'Stöchiometrie');
  }

  function getMolarMassOf(el) {
    var masses = {
      H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.811, C: 12.011,
      N: 14.007, O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305,
      Al: 26.982, Si: 28.086, P: 30.974, S: 32.065, Cl: 35.453, Ar: 39.948,
      K: 39.098, Ca: 40.078, Ti: 47.867, Cr: 51.996, Mn: 54.938, Fe: 55.845,
      Cu: 63.546, Zn: 65.380, Br: 79.904, Ag: 107.868, I: 126.904, Ba: 137.327,
      Pt: 195.084, Au: 196.967, Pb: 207.200
    };
    return masses[el] || 50;
  }

  // ------- BALANCING -------

  function createBalancingQuestion(diff) {
    var reactions = [
      { eq: 'H₂ + O₂ → H₂O', coeffs: [2, 1, 2], display: '2 H₂ + O₂ → 2 H₂O' },
      { eq: 'N₂ + H₂ → NH₃', coeffs: [1, 3, 2], display: 'N₂ + 3 H₂ → 2 NH₃' },
      { eq: 'Fe + O₂ → Fe₂O₃', coeffs: [4, 3, 2], display: '4 Fe + 3 O₂ → 2 Fe₂O₃' },
      { eq: 'CH₄ + O₂ → CO₂ + H₂O', coeffs: [1, 2, 1, 2], display: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O' },
      { eq: 'Na + Cl₂ → NaCl', coeffs: [2, 1, 2], display: '2 Na + Cl₂ → 2 NaCl' }
    ];

    if (diff >= 2) {
      reactions.push(
        { eq: 'C₂H₆ + O₂ → CO₂ + H₂O', coeffs: [2, 7, 4, 6], display: '2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O' },
        { eq: 'Al + O₂ → Al₂O₃', coeffs: [4, 3, 2], display: '4 Al + 3 O₂ → 2 Al₂O₃' }
      );
    }

    if (diff >= 3) {
      reactions.push(
        { eq: 'C₃H₈ + O₂ → CO₂ + H₂O', coeffs: [1, 5, 3, 4], display: 'C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O' },
        { eq: 'Fe₂O₃ + CO → Fe + CO₂', coeffs: [1, 3, 2, 3], display: 'Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂' }
      );
    }

    var rxn = pick(reactions);
    var answerStr = rxn.coeffs.join(' : ');
    var dataStr = rxn.eq + '\nFaktor: ' + answerStr;

    return formatQuestion(
      'Balancere die folgende Reaktionsgleichung: ' + rxn.eq,
      answerStr,
      '',
      'Reaktionsgleichungen',
      dataStr,
      rxn.display
    );
  }

  // ------- MOLAR MASS -------

  function createMolarMassQuestion(diff) {
    var compounds;
    if (diff === 1) {
      compounds = [
        { formula: 'H₂O', mass: 18.015 },
        { formula: 'NaCl', mass: 58.44 },
        { formula: 'CO₂', mass: 44.01 },
        { formula: 'NH₃', mass: 17.031 },
        { formula: 'CH₄', mass: 16.043 }
      ];
    } else if (diff === 2) {
      compounds = [
        { formula: 'CaCO₃', mass: 100.087 },
        { formula: 'NaOH', mass: 39.997 },
        { formula: 'H₂SO₄', mass: 98.079 },
        { formula: 'C₂H₅OH', mass: 46.069 },
        { formula: 'KMnO₄', mass: 158.034 }
      ];
    } else {
      compounds = [
        { formula: 'C₆H₁₂O₆', mass: 180.156 },
        { formula: 'Ca(OH)₂', mass: 74.093 },
        { formula: 'Fe₂O₃', mass: 159.688 },
        { formula: '(NH₄)₂SO₄', mass: 132.141 },
        { formula: 'C₁₂H₂₂O₁₁', mass: 342.297 }
      ];
    }

    var cp = pick(compounds);
    var accepted = roundTo(cp.mass, 1);

    return formatQuestion(
      'Berechne die molare Masse von ' + cp.formula + ' (in g/mol)',
      accepted,
      'g/mol',
      'Molare Massen',
      'Atommassen: H=1.008, C=12.011, N=14.007, O=15.999, Na=22.990, S=32.065, Cl=35.453, K=39.098, Ca=40.078, Fe=55.845',
      cp.formula + ' = ' + cp.mass.toFixed(2) + ' g/mol'
    );
  }

  // ------- PH CALCULATIONS -------

  function createPhQuestion(diff) {
    var q;

    if (diff === 1) {
      var conc = pick([0.1, 0.01, 0.001, 0.0001]);
      var ph = -Math.log10(conc);
      q = {
        text: 'Berechne den pH-Wert einer ' + conc + ' M HCl-Lösung (starke Säure)',
        answer: roundTo(ph, 2),
        unit: '',
        data: 'pH = -log₁₀[' + conc + ']',
        explain: 'pH = -log(' + conc + ') = ' + ph.toFixed(2)
      };
    } else if (diff === 2) {
      var concWeak = pick([0.05, 0.1, 0.2]);
      var ka = pick([1.8e-5, 1.5e-5, 1.3e-4, 4.2e-7]);
      var h = Math.sqrt(ka * concWeak);
      var pH2 = -Math.log10(h);
      var pka = -Math.log10(ka);
      q = {
        text: 'Berechne den pH-Wert einer ' + concWeak + ' M Essigsäure (Kₐ = ' + ka.toExponential(1) + ')',
        answer: roundTo(pH2, 2),
        unit: '',
        data: 'pKₐ = ' + pka.toFixed(2) + '\n[H⁺] = √(Kₐ · c) = √(' + ka.toExponential(1) + ' · ' + concWeak + ')',
        explain: 'pH = ½(pKₐ - log c) = ' + pH2.toFixed(2)
      };
    } else {
      var concBase = pick([0.01, 0.02, 0.05, 0.1]);
      var kb = pick([1.8e-5, 3.4e-4, 9.5e-4]);
      var oh = Math.sqrt(kb * concBase);
      var pOH = -Math.log10(oh);
      var pH3 = 14 - pOH;
      q = {
        text: 'Berechne den pH-Wert einer ' + concBase + ' M NH₃-Lösung (K_b = ' + kb.toExponential(1) + ')',
        answer: roundTo(pH3, 2),
        unit: '',
        data: 'K_b = ' + kb.toExponential(1) + '\n[OH⁻] = √(K_b · c) ',
        explain: 'pOH = ½(pK_b - log c), pH = 14 - pOH = ' + pH3.toFixed(2)
      };
    }

    return formatQuestion(q.text, q.answer, q.unit, 'pH-Berechnungen', q.data, q.explain);
  }

  // ------- REDOX -------

  function createRedoxQuestion(diff) {
    if (diff <= 2) {
      var simple = pick([
        { eq: 'Zn + CuSO₄ → ZnSO₄ + Cu', answer: 'Zn → Zn²⁺ + 2e⁻ (Oxidation)', display: 'Zn wird oxidiert, Cu²⁺ wird reduziert' },
        { eq: 'Mg + O₂ → MgO', answer: 'Mg → Mg²⁺ + 2e⁻', display: 'Mg wird oxidiert, O wird reduziert' },
        { eq: 'Fe + CuSO₄ → FeSO₄ + Cu', answer: 'Fe → Fe²⁺ + 2e⁻', display: 'Fe wird oxidiert, Cu²⁺ wird reduziert' }
      ]);

      return formatQuestion(
        'Welche Teilreaktion läuft bei der Redoxreaktion ab? ' + simple.eq,
        simple.answer,
        '',
        'Redox-Gleichungen',
        simple.eq,
        simple.display
      );
    }

    var halfRxns = pick([
      {
        eq: 'MnO₄⁻ + Fe²⁺ → Mn²⁺ + Fe³⁺',
        reduction: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O',
        oxidation: 'Fe²⁺ → Fe³⁺ + e⁻',
        balanced: 'MnO₄⁻ + 8H⁺ + 5Fe²⁺ → Mn²⁺ + 4H₂O + 5Fe³⁺',
        answer: 'Oxidation: Fe²⁺ → Fe³⁺ + e⁻'
      },
      {
        eq: 'Cr₂O₇²⁻ + Fe²⁺ → Cr³⁺ + Fe³⁺',
        reduction: 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O',
        oxidation: 'Fe²⁺ → Fe³⁺ + e⁻',
        balanced: 'Cr₂O₇²⁻ + 14H⁺ + 6Fe²⁺ → 2Cr³⁺ + 7H₂O + 6Fe³⁺',
        answer: 'Oxidation: Fe²⁺ → Fe³⁺ + e⁻'
      }
    ]);

    return formatQuestion(
      'Gib die Oxidationsteilreaktion an für: ' + halfRxns.eq,
      halfRxns.answer,
      '',
      'Redox-Gleichungen',
      halfRxns.eq,
      halfRxns.balanced
    );
  }

  // ------- Question Display -------

  function formatQuestion(text, answer, unit, topic, data, explanation) {
    return {
      text: text,
      answer: String(answer),
      unit: unit,
      topic: topic,
      data: data || '',
      explanation: explanation || '',
      tolerance: unit === 'g/mol' ? 1.0 : (unit === 'mol' || unit === 'g' ? 0.1 : 0.05)
    };
  }

  function displayQuestion(q) {
    elements.initialState.style.display = 'none';
    elements.questionSection.style.display = 'block';

    elements.topicBadge.textContent = q.topic;
    var diffLabels = ['Leicht', 'Mittel', 'Schwer'];
    elements.difficultyBadge.textContent = diffLabels[state.difficulty - 1];
    elements.questionNumber.textContent = 'Aufgabe ' + q.questionNumber;

    elements.questionText.innerHTML = q.text;
    elements.questionData.textContent = q.data;

    if (state.inputMode === 'multiple-choice') {
      showMultipleChoice(q);
    } else {
      showFreeInput(q);
    }
  }

  function showMultipleChoice(q) {
    elements.mcSection.style.display = 'block';
    elements.freeSection.style.display = 'none';

    var correctAns = q.answer;
    var options = generateDistractors(correctAns, q.unit);

    elements.mcOptions.innerHTML = '';
    options.forEach(function (opt, _i) {
      var btn = document.createElement('button');
      btn.className = 'mc-option-btn';
      btn.textContent = opt;
      btn.dataset.value = opt;
      btn.addEventListener('click', function () {
        if (!state.answered) {
          handleMcAnswer(btn, q);
        }
      });
      elements.mcOptions.appendChild(btn);
    });
  }

  function generateDistractors(correctAns, unit) {
    var correctNum = parseFloat(correctAns);
    var distractorSet;

    if (unit === 'g/mol') {
      distractorSet = [
        correctAns,
        roundTo(correctNum * 0.5, 1) + ' g/mol',
        roundTo(correctNum * 1.5, 1) + ' g/mol',
        roundTo(correctNum * 2, 1) + ' g/mol'
      ];
    } else if (unit === 'g') {
      distractorSet = [
        correctAns + ' g',
        roundTo(correctNum * 0.5, 1) + ' g',
        roundTo(correctNum * 2, 1) + ' g',
        roundTo(correctNum * 1.2, 1) + ' g'
      ];
    } else if (unit === 'mol') {
      distractorSet = [
        correctAns + ' mol',
        roundTo(correctNum * 0.5, 2) + ' mol',
        roundTo(correctNum * 2, 2) + ' mol',
        roundTo(correctNum * 1.5, 2) + ' mol'
      ];
    } else {
      distractorSet = [
        correctAns,
        roundTo(correctNum * (1 + Math.random() * 0.5), 1),
        roundTo(correctNum * (1 - Math.random() * 0.3), 1),
        roundTo(correctNum * 0.5, 1)
      ];
    }

    for (var i = distractorSet.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = distractorSet[i];
      distractorSet[i] = distractorSet[j];
      distractorSet[j] = temp;
    }

    return distractorSet;
  }

  function handleMcAnswer(btn, q) {
    state.answered = true;
    var selected = btn.textContent.trim();
    var correct = isAnswerCorrect(selected, q.answer, q.tolerance);

    var allBtns = elements.mcOptions.querySelectorAll('.mc-option-btn');
    allBtns.forEach(function (b) { b.disabled = true; });

    if (correct) {
      btn.classList.add('correct');
      state.correctAnswers++;
    } else {
      btn.classList.add('incorrect');
      allBtns.forEach(function (b) {
        if (isAnswerCorrect(b.textContent.trim(), q.answer, q.tolerance)) {
          b.classList.add('reveal-correct');
        }
      });
    }

    state.totalQuestions++;
    showFeedback(correct, q);
    updateScoreDisplay();
  }

  function showFreeInput(_q) {
    elements.mcSection.style.display = 'none';
    elements.freeSection.style.display = 'block';
    elements.freeInput.value = '';
    elements.freeInput.focus();
  }

  function submitFreeInput() {
    if (state.answered) return;
    var val = elements.freeInput.value.trim();
    if (!val) return;

    state.answered = true;
    var correct = isAnswerCorrect(val, state.currentQuestion.answer, state.currentQuestion.tolerance);

    if (correct) {
      state.correctAnswers++;
    }

    state.totalQuestions++;
    elements.submitFree.disabled = true;
    elements.freeInput.disabled = true;

    showFeedback(correct, state.currentQuestion);
    updateScoreDisplay();
  }

  function isAnswerCorrect(input, expected, tolerance) {
    var a = parseFloat(input.replace(',', '.'));
    if (isNaN(a)) {
      return input.trim().toLowerCase() === expected.trim().toLowerCase();
    }
    var e = parseFloat(expected);
    return !isNaN(e) && Math.abs(a - e) <= (tolerance || 0.05);
  }

  function showFeedback(correct, q) {
    elements.feedbackSection.style.display = 'block';
    elements.nextSection.style.display = 'block';

    elements.feedbackCard.className = 'feedback-card';
    elements.feedbackCard.classList.add(correct ? 'correct' : 'incorrect');
    elements.feedbackTitle.textContent = correct ? '✓ Richtig!' : '✗ Leider falsch';
    elements.feedbackMessage.textContent = correct
      ? 'Deine Antwort ist korrekt.'
      : 'Die richtige Antwort ist: ' + q.answer + (q.unit ? ' ' + q.unit : '');

    elements.feedbackExplanation.innerHTML = q.explanation
      ? '<strong>Erklärung:</strong> ' + q.explanation
      : '';

    setTimeout(function () {
      elements.feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // ------- Score -------

  function loadScore() {
    try {
      var saved = localStorage.getItem('practice-generator-score');
      if (saved) {
        var data = JSON.parse(saved);
        state.totalQuestions = data.total || 0;
        state.correctAnswers = data.correct || 0;
      }
    } catch (_e) { /* localStorage unavailable */ }
  }

  function saveScore() {
    try {
      localStorage.setItem('practice-generator-score', JSON.stringify({
        total: state.totalQuestions,
        correct: state.correctAnswers
      }));
    } catch (_e) { /* localStorage unavailable */ }
    if (typeof ProgressTracker !== 'undefined') {
      ProgressTracker.saveExerciseProgress('uebungsgenerator', 'overview', {
        total: state.totalQuestions,
        correct: state.correctAnswers,
        completed: state.totalQuestions > 0
      });
    }
  }

  function updateScoreDisplay() {
    elements.totalSpan.textContent = state.totalQuestions;
    elements.correctSpan.textContent = state.correctAnswers;
    var incorrect = state.totalQuestions - state.correctAnswers;
    elements.incorrectSpan.textContent = incorrect;
    var pct = state.totalQuestions > 0
      ? Math.round((state.correctAnswers / state.totalQuestions) * 100)
      : 0;
    elements.percentSpan.textContent = pct + '%';
    saveScore();
  }

  function resetScore() {
    if (confirm('Punktzahl wirklich zurücksetzen?')) {
      state.totalQuestions = 0;
      state.correctAnswers = 0;
      updateScoreDisplay();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
