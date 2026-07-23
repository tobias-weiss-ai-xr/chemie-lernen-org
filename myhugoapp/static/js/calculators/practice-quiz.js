let practiceState = {
  score: 0,
  correct: 0,
  incorrect: 0,
  currentProblem: null,
  problemNumber: 1,
  active: false,
};

function startPractice() {
  const type = document.getElementById('practice-type').value;
  const difficulty = document.getElementById('practice-difficulty').value;

  practiceState.active = true;
  practiceState.problemNumber = 1;

  document.getElementById('practice-setup').style.display = 'none';
  document.getElementById('practice-problem').style.display = 'block';

  generateProblem(type, difficulty);
}

function generateProblem(type, difficulty) {
  let problemType = type;

  if (type === 'random') {
    const types = ['mol-mol', 'mass-mass', 'limiting', 'yield'];
    problemType = types[Math.floor(Math.random() * types.length)];
  }

  switch (problemType) {
    case 'mol-mol':
      generateMolMolProblem(difficulty);
      break;
    case 'mass-mass':
      generateMassMassProblem(difficulty);
      break;
    case 'limiting':
      generateLimitingProblem(difficulty);
      break;
    case 'yield':
      generateYieldProblem(difficulty);
      break;
  }
}

function generateMolMolProblem(difficulty) {
  let n1, v1, v2;

  if (difficulty === 'easy') {
    v1 = Math.floor(Math.random() * 3) + 1;
    v2 = Math.floor(Math.random() * 3) + 1;
    n1 = Math.floor(Math.random() * 10) + 1;
  } else if (difficulty === 'medium') {
    v1 = Math.floor(Math.random() * 5) + 1;
    v2 = Math.floor(Math.random() * 5) + 1;
    n1 = (Math.floor(Math.random() * 50) + 1) / 2;
  } else {
    v1 = Math.floor(Math.random() * 6) + 2;
    v2 = Math.floor(Math.random() * 6) + 2;
    n1 = (Math.floor(Math.random() * 200) + 10) / 10;
  }

  const answer = n1 * (v2 / v1);

  practiceState.currentProblem = {
    type: 'mol-mol',
    n1: n1,
    v1: v1,
    v2: v2,
    answer: answer,
    tolerance: 0.01,
  };

  const problemHTML =
    '<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">' +
    '<p><strong>Aufgabe:</strong> Berechne die Stoffmenge des Produkts.</p>' +
    '<p style="font-size: 18px; margin: 15px 0;">' +
    'Gegeben: ' +
    n1 +
    ' mol Edukt (Koeffizient: ' +
    v1 +
    ')<br>' +
    'Koeffizient des Produkts: ' +
    v2 +
    '</p>' +
    '<p><strong>Frage:</strong> Wie viel Mol Produkt werden gebildet?</p>' +
    '<p style="color: #666; font-size: 14px; margin-top: 10px;">' +
    '<i class="fa fa-lightbulb-o"></i> Tipp: Verwende die Formel n\u2082 = n\u2081 \u00d7 (\u03bd\u2082/\u03bd\u2081)' +
    '</p>' +
    '</div>';

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

function generateMassMassProblem(difficulty) {
  let m1, M1, M2, v1, v2;

  const elements = [
    { symbol: 'H\u2082', M: 2.016 },
    { symbol: 'O\u2082', M: 32.0 },
    { symbol: 'N\u2082', M: 28.02 },
    { symbol: 'Cl\u2082', M: 70.9 },
    { symbol: 'CO\u2082', M: 44.01 },
    { symbol: 'H\u2082O', M: 18.02 },
    { symbol: 'NH\u2083', M: 17.03 },
    { symbol: 'CH\u2084', M: 16.04 },
    { symbol: 'NaCl', M: 58.44 },
    { symbol: 'CaCO\u2083', M: 100.09 },
  ];

  if (difficulty === 'easy') {
    v1 = v2 = 1;
    M1 = elements[Math.floor(Math.random() * 5)].M;
    M2 = elements[Math.floor(Math.random() * 5)].M;
    m1 = Math.floor(Math.random() * 10) + 1;
  } else if (difficulty === 'medium') {
    v1 = Math.floor(Math.random() * 2) + 1;
    v2 = Math.floor(Math.random() * 2) + 1;
    M1 = elements[Math.floor(Math.random() * 7)].M;
    M2 = elements[Math.floor(Math.random() * 7)].M;
    m1 = (Math.floor(Math.random() * 50) + 5) / 2;
  } else {
    v1 = Math.floor(Math.random() * 3) + 1;
    v2 = Math.floor(Math.random() * 3) + 1;
    M1 = elements[Math.floor(Math.random() * 10)].M;
    M2 = elements[Math.floor(Math.random() * 10)].M;
    m1 = (Math.floor(Math.random() * 200) + 10) / 4;
  }

  const n1 = m1 / M1;
  const n2 = n1 * (v2 / v1);
  const answer = n2 * M2;

  practiceState.currentProblem = {
    type: 'mass-mass',
    m1: m1,
    M1: M1,
    M2: M2,
    v1: v1,
    v2: v2,
    answer: answer,
    tolerance: 0.02,
  };

  const problemHTML =
    '<div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">' +
    '<p><strong>Aufgabe:</strong> Berechne die Masse des Produkts.</p>' +
    '<p style="font-size: 16px; margin: 15px 0;">' +
    'Edukt: ' +
    m1.toFixed(2) +
    ' g (molare Masse: ' +
    M1.toFixed(2) +
    ' g/mol, Koeffizient: ' +
    v1 +
    ')<br>' +
    'Produkt: molare Masse = ' +
    M2.toFixed(2) +
    ' g/mol (Koeffizient: ' +
    v2 +
    ')' +
    '</p>' +
    '<p><strong>Frage:</strong> Wie viel Gramm Produkt werden gebildet?</p>' +
    '<p style="color: #666; font-size: 14px; margin-top: 10px;">' +
    '<i class="fa fa-lightbulb-o"></i> Tipp: Gehe in 3 Schritten vor (Masse \u2192 Mol \u2192 Mol \u2192 Masse)' +
    '</p>' +
    '</div>';

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

function generateLimitingProblem(difficulty) {
  let m1, m2;

  const elements = [
    { symbol: 'H\u2082', M: 2.016 },
    { symbol: 'O\u2082', M: 32.0 },
    { symbol: 'N\u2082', M: 28.02 },
    { symbol: 'Na', M: 22.99 },
    { symbol: 'K', M: 39.1 },
  ];

  const M1 = elements[Math.floor(Math.random() * elements.length)].M;
  const M2 = elements[Math.floor(Math.random() * elements.length)].M;

  if (difficulty === 'easy') {
    m1 = Math.floor(Math.random() * 20) + 5;
    m2 = Math.floor(Math.random() * 20) + 5;
  } else if (difficulty === 'medium') {
    m1 = (Math.floor(Math.random() * 100) + 10) / 2;
    m2 = (Math.floor(Math.random() * 100) + 10) / 2;
  } else {
    m1 = (Math.floor(Math.random() * 200) + 10) / 4;
    m2 = (Math.floor(Math.random() * 200) + 10) / 4;
  }

  const n1 = m1 / M1;
  const n2_2 = m2 / M2;
  const answer = n1 < n2_2 ? 1 : 2;

  practiceState.currentProblem = {
    type: 'limiting',
    m1: m1,
    M1: M1,
    m2: m2,
    M2: M2,
    answer: answer,
    tolerance: 0,
  };

  const problemHTML =
    '<div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800;">' +
    '<p><strong>Aufgabe:</strong> Bestimme das limitierende Reagenz.</p>' +
    '<p style="font-size: 16px; margin: 15px 0;">' +
    'Reagenz 1: ' +
    m1.toFixed(2) +
    ' g (molare Masse: ' +
    M1.toFixed(2) +
    ' g/mol)<br>' +
    'Reagenz 2: ' +
    m2.toFixed(2) +
    ' g (molare Masse: ' +
    M2.toFixed(2) +
    ' g/mol)<br>' +
    '<small>Beide Reagenzien reagieren im 1:1 Verh\u00e4ltnis</small>' +
    '</p>' +
    '<p><strong>Frage:</strong> Welches Reagenz ist limitierend? (Antworte mit 1 oder 2)</p>' +
    '<p style="color: #666; font-size: 14px; margin-top: 10px;">' +
    '<i class="fa fa-lightbulb-o"></i> Tipp: Vergleiche die Stoffmengen in Mol' +
    '</p>' +
    '</div>';

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

function generateYieldProblem(difficulty) {
  let theoretical, yieldPct;

  if (difficulty === 'easy') {
    yieldPct = Math.floor(Math.random() * 30) + 70;
    theoretical = Math.floor(Math.random() * 20) + 10;
  } else if (difficulty === 'medium') {
    yieldPct = (Math.floor(Math.random() * 50) + 50) / 2;
    theoretical = (Math.floor(Math.random() * 100) + 10) / 2;
  } else {
    yieldPct = (Math.floor(Math.random() * 80) + 10) / 2;
    theoretical = (Math.floor(Math.random() * 150) + 5) / 4;
  }

  const actual = (theoretical * yieldPct) / 100;
  const answer = yieldPct;

  practiceState.currentProblem = {
    type: 'yield',
    theoretical: theoretical,
    actual: actual,
    answer: answer,
    tolerance: 1,
  };

  const problemHTML =
    '<div style="background: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #9C27B0;">' +
    '<p><strong>Aufgabe:</strong> Berechne die prozentuale Ausbeute.</p>' +
    '<p style="font-size: 16px; margin: 15px 0;">' +
    'Theoretische Ausbeute: ' +
    theoretical.toFixed(2) +
    ' g<br>' +
    'Praktische Ausbeute: ' +
    actual.toFixed(2) +
    ' g' +
    '</p>' +
    '<p><strong>Frage:</strong> Wie hoch ist die prozentuale Ausbeute?</p>' +
    '<p style="color: #666; font-size: 14px; margin-top: 10px;">' +
    '<i class="fa fa-lightbulb-o"></i> Tipp: Ausbeute = (Praktisch / Theoretisch) \u00d7 100%' +
    '</p>' +
    '</div>';

  document.getElementById('problem-content').innerHTML = problemHTML;
  document.getElementById('problem-number').textContent = practiceState.problemNumber;
  document.getElementById('practice-answer').value = '';
  document.getElementById('feedback-section').style.display = 'none';
}

function checkAnswer() {
  const userAnswer = parseFloat(document.getElementById('practice-answer').value);

  if (isNaN(userAnswer)) {
    showToast('Bitte gib eine Zahl ein', 'error');
    return;
  }

  const problem = practiceState.currentProblem;
  const correctAnswer = problem.answer;
  const tolerance = problem.tolerance || 0.01;

  const isCorrect = Math.abs((userAnswer - correctAnswer) / correctAnswer) <= tolerance;

  showFeedback(isCorrect, correctAnswer, userAnswer, tolerance);
  updateScore(isCorrect);
}

function showFeedback(isCorrect, correctAnswer, userAnswer, tolerance) {
  const feedbackDiv = document.getElementById('feedback-section');
  feedbackDiv.style.display = 'block';

  if (isCorrect) {
    feedbackDiv.innerHTML =
      '<div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px;">' +
      '<h4 style="margin-top: 0;"><i class="fa fa-check-circle"></i> Richtig! \ud83c\udf89</h4>' +
      '<p>Deine Antwort (' +
      userAnswer.toFixed(4) +
      ') ist korrekt!</p>' +
      problemDetailHTML(correctAnswer) +
      '</div>';
  } else {
    const diffPercent = (((userAnswer - correctAnswer) / correctAnswer) * 100).toFixed(1);
    feedbackDiv.innerHTML =
      '<div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px;">' +
      '<h4 style="margin-top: 0;"><i class="fa fa-times-circle"></i> Leider falsch</h4>' +
      '<p>Deine Antwort: ' +
      userAnswer.toFixed(4) +
      '</p>' +
      '<p>Korrekte Antwort: <strong>' +
      correctAnswer.toFixed(4) +
      '</strong></p>' +
      '<p>Abweichung: ' +
      diffPercent +
      '%</p>' +
      problemDetailHTML(correctAnswer) +
      '</div>';
  }

  setTimeout(() => {
    if (isCorrect) {
      practiceState.problemNumber++;
      const type = document.getElementById('practice-type').value;
      const difficulty = document.getElementById('practice-difficulty').value;
      generateProblem(type, difficulty);
    }
  }, 2000);
}

function problemDetailHTML(answer) {
  const problem = practiceState.currentProblem;

  switch (problem.type) {
    case 'mol-mol':
      return (
        '<div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">' +
        '<strong>L\u00f6sungsweg:</strong><br>' +
        'n\u2082 = ' +
        problem.n1 +
        ' \u00d7 (' +
        problem.v2 +
        '/' +
        problem.v1 +
        ') = ' +
        answer.toFixed(4) +
        ' mol' +
        '</div>'
      );
    case 'mass-mass': {
      const n1 = problem.m1 / problem.M1;
      const n2 = n1 * (problem.v2 / problem.v1);
      return (
        '<div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">' +
        '<strong>L\u00f6sungsweg:</strong><br>' +
        'Schritt 1: n\u2081 = ' +
        problem.m1.toFixed(2) +
        ' / ' +
        problem.M1.toFixed(2) +
        ' = ' +
        n1.toFixed(4) +
        ' mol<br>' +
        'Schritt 2: n\u2082 = ' +
        n1.toFixed(4) +
        ' \u00d7 (' +
        problem.v2 +
        '/' +
        problem.v1 +
        ') = ' +
        n2.toFixed(4) +
        ' mol<br>' +
        'Schritt 3: m\u2082 = ' +
        n2.toFixed(4) +
        ' \u00d7 ' +
        problem.M2.toFixed(2) +
        ' = ' +
        answer.toFixed(2) +
        ' g' +
        '</div>'
      );
    }
    case 'limiting': {
      const n1_lim = problem.m1 / problem.M1;
      const n2_lim = problem.m2 / problem.M2;
      const name = answer === 1 ? 'Reagenz 1' : 'Reagenz 2';
      return (
        '<div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">' +
        '<strong>L\u00f6sungsweg:</strong><br>' +
        'Reagenz 1: ' +
        n1_lim.toFixed(4) +
        ' mol<br>' +
        'Reagenz 2: ' +
        n2_lim.toFixed(4) +
        ' mol<br>' +
        name +
        ' hat weniger Mol und ist daher limitierend.' +
        '</div>'
      );
    }
    case 'yield':
      return (
        '<div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">' +
        '<strong>L\u00f6sungsweg:</strong><br>' +
        'Ausbeute = (' +
        problem.actual.toFixed(2) +
        ' / ' +
        problem.theoretical.toFixed(2) +
        ') \u00d7 100% = ' +
        answer.toFixed(1) +
        '%' +
        '</div>'
      );
    default:
      return '';
  }
}

function updateScore(isCorrect) {
  if (isCorrect) {
    practiceState.correct++;
    practiceState.score += 10;
  } else {
    practiceState.incorrect++;
    practiceState.score = Math.max(0, practiceState.score - 5);
  }

  document.getElementById('practice-score').textContent = practiceState.score;
  document.getElementById('correct-count').textContent = practiceState.correct;
  document.getElementById('incorrect-count').textContent = practiceState.incorrect;
}

function skipProblem() {
  practiceState.incorrect++;
  practiceState.score = Math.max(0, practiceState.score - 2);

  document.getElementById('practice-score').textContent = practiceState.score;
  document.getElementById('correct-count').textContent = practiceState.correct;
  document.getElementById('incorrect-count').textContent = practiceState.incorrect;

  practiceState.problemNumber++;
  const type = document.getElementById('practice-type').value;
  const difficulty = document.getElementById('practice-difficulty').value;
  generateProblem(type, difficulty);
}

function resetPractice() {
  if (
    confirm(
      'M\u00f6chtest du den \u00dcbungsmodus wirklich neustarten? Dein Punktestand wird zur\u00fcckgesetzt.'
    )
  ) {
    practiceState = {
      score: 0,
      correct: 0,
      incorrect: 0,
      currentProblem: null,
      problemNumber: 1,
      active: false,
    };

    document.getElementById('practice-score').textContent = '0';
    document.getElementById('correct-count').textContent = '0';
    document.getElementById('incorrect-count').textContent = '0';
    document.getElementById('practice-setup').style.display = 'block';
    document.getElementById('practice-problem').style.display = 'none';
  }
}
