/* cloze-exercises.js — Cloze deletion exercises */
let clozeScore = { correct: 0, incorrect: 0, open: 0 };
let currentExercises = [];
let currentExerciseIndex = 0;

const CLOZE_EXERCISES = {
  atom: {
    leicht: [
      {
        title: 'Aufbau eines Atoms',
        text: 'Ein Atom besteht aus einem positiv geladenen ___ und einer negativ geladenen ___.',
        blanks: [
          { answer: 'Kern', alternatives: ['Atomkern'], hint: 'Zentraler Bestandteil' },
          { answer: 'Hülle', alternatives: ['Elektronenhülle', 'Atomhülle'], hint: 'Äußerer Bereich' }
        ]
      },
      {
        title: 'Kernbausteine',
        text: 'Der Atomkern enthält ___ (positive Ladung) und ___ (neutrale Ladung).',
        blanks: [
          { answer: 'Protonen', alternatives: ['Proton'], hint: 'Positiv geladen' },
          { answer: 'Neutronen', alternatives: ['Neutron'], hint: 'Neutral' }
        ]
      },
      {
        title: 'Isotope',
        text: 'Isotope unterscheiden sich in der Anzahl der ___. Sie haben die gleiche Anzahl an ___, aber eine unterschiedliche ___zahl.',
        blanks: [
          { answer: 'Neutronen', alternatives: ['Neutron'], hint: 'Neutrale Teilchen' },
          { answer: 'Protonen', alternatives: ['Proton'], hint: 'Kernladung' },
          { answer: 'Massen', alternatives: ['Nukleonen', 'Massenzahl'], hint: 'Kernbausteine gesamt' }
        ]
      }
    ],
    mittel: [
      {
        title: 'Schalenmodell',
        text: 'Elektronen verteilen sich auf verschiedene ___schalen. Die erste Schale fasst maximal ___ Elektronen, die zweite Schale maximal ___ Elektronen.',
        blanks: [
          { answer: 'Energie', alternatives: ['Elektronen', 'Atom'], hint: 'Energiezustand' },
          { answer: '2', alternatives: ['zwei'], hint: 'S-Orbital' },
          { answer: '8', alternatives: ['acht'], hint: 'S- und P-Orbital' }
        ]
      },
      {
        title: 'Radioaktivität',
        text: 'Beim α-Zerfall wird ein ___kern ausgesendet. Beim β-Zerfall wandelt sich ein ___ in ein Proton um. γ-Strahlung ist ___.',
        blanks: [
          { answer: 'Helium', alternatives: ['He', 'α'], hint: 'Edelgas' },
          { answer: 'Neutron', alternatives: ['Neutronen'], hint: 'Neutraler Kernbaustein' },
          { answer: 'elektromagnetisch', alternatives: ['elektromagnetische Strahlung', 'Photonen', 'Hochenergiestrahlung'], hint: 'Wellen' }
        ]
      }
    ],
    schwer: [
      {
        title: 'Quantenzahlen',
        text: 'Die Hauptquantenzahl n beschreibt die ___. Der Bahndrehimpuls ℓ nimmt Werte von ___ bis n-1 an. Die magnetische Quantenzahl mℓ gibt die ___ im Raum an.',
        blanks: [
          { answer: 'Schale', alternatives: ['Energiestufe', 'Hauptschale', 'Energieniveau'], hint: 'Entfernung vom Kern' },
          { answer: '0', alternatives: ['null'], hint: 'Kleinster Wert' },
          { answer: 'Orientierung', alternatives: ['Ausrichtung', 'Richtung'], hint: 'Räumliche Lage' }
        ]
      }
    ]
  },
  bindungen: {
    leicht: [
      {
        title: 'Ionenbindung',
        text: 'Bei der Ionenbindung gibt ein Atom ___ ab und wird zum Kation. Ein anderes Atom nimmt Elektronen auf und wird zum ___.',
        blanks: [
          { answer: 'Elektronen', alternatives: ['Elektron', 'e-'], hint: 'Negativ geladene Teilchen' },
          { answer: 'Anion', alternatives: ['negativen Ion'], hint: 'Negativ geladenes Ion' }
        ]
      },
      {
        title: 'Eigenschaften',
        text: 'Salze haben eine hohe ___ und leiten im festen Zustand den elektrischen Strom ___.',
        blanks: [
          { answer: 'Schmelztemperatur', alternatives: ['Schmelzpunkt', 'Schmelztemperatur'], hint: 'Hohe Temperatur' },
          { answer: 'nicht', alternatives: ['schlecht', 'kaum'], hint: 'Gegenteil von gut' }
        ]
      }
    ]
  }
};

function loadClozeExercises() {
  const topic = document.getElementById('topic-select').value;
  const difficulty = document.getElementById('difficulty-select').value;
  const area = document.getElementById('cloze-exercise-area');

  const available = CLOZE_EXERCISES[topic];
  if (!available || !available[difficulty]) {
    area.innerHTML = '<div class="alert alert-warning"><i class="fa fa-warning"></i> Keine Übungen für dieses Thema und diesen Schwierigkeitsgrad verfügbar.</div>';
    return;
  }

  currentExercises = [...available[difficulty]];
  currentExerciseIndex = 0;
  clozeScore.correct = 0;
  clozeScore.incorrect = 0;
  clozeScore.open = currentExercises.reduce((sum, ex) => sum + ex.blanks.length, 0);
  updateScore();

  area.innerHTML = currentExercises.map((ex, idx) => renderExercise(ex, idx)).join('');
}

function renderExercise(exercise, index) {
  const parts = exercise.text.split(/(___)/g);
  let blankIdx = 0;
  const renderedParts = parts.map(part => {
    if (part === '___') {
      const blk = exercise.blanks[blankIdx];
      blankIdx++;
      const id = `cloze-blank-${index}-${blankIdx}`;
      return `<span class="cloze-blank-wrapper">
        <input type="text" class="cloze-input form-control" id="${id}"
          data-exercise="${index}" data-blank="${blankIdx}"
          placeholder="..." autocomplete="off"
          onkeydown="handleClozeKeydown(event, ${index}, ${blankIdx})"/>
        <span class="cloze-feedback" id="${id}-feedback"></span>
        <span class="cloze-hint" onclick="showClozeHint(${index}, ${blankIdx})"
          title="Hinweis anzeigen"><i class="fa fa-question-circle"></i></span>
      </span>`;
    }
    return part;
  }).join('');

  return `<div class="cloze-exercise" id="cloze-exercise-${index}">
    <h3 class="cloze-title">${index + 1}. ${exercise.title}
      <button class="btn btn-success btn-xs pull-right" onclick="checkClozeExercise(${index})">
        <i class="fa fa-check"></i> Überprüfen
      </button>
    </h3>
    <div class="cloze-text">${renderedParts}</div>
    <div class="cloze-result" id="cloze-result-${index}"></div>
  </div>`;
}

function handleClozeKeydown(event, exIdx, blankIdx) {
  if (event.key === 'Enter') {
    const allBlanks = currentExercises[exIdx].blanks;
    if (blankIdx < allBlanks.length) {
      const next = document.getElementById(`cloze-blank-${exIdx}-${blankIdx + 1}`);
      if (next) next.focus();
    }
    checkBlank(exIdx, blankIdx);
  }
}

function checkBlank(exIdx, blankIdx) {
  const input = document.getElementById(`cloze-blank-${exIdx}-${blankIdx}`);
  if (!input) return false;
  const answer = input.value.trim();
  const blanks = currentExercises[exIdx].blanks;
  const blk = blanks[blankIdx - 1];
  if (!blk) return false;

  const allAnswers = [blk.answer.toLowerCase(), ...blk.alternatives.map(a => a.toLowerCase())];
  const isCorrect = allAnswers.includes(answer.toLowerCase());

  const feedback = document.getElementById(`cloze-blank-${exIdx}-${blankIdx}-feedback`);
  if (isCorrect) {
    input.className = 'cloze-input form-control correct';
    feedback.innerHTML = '<i class="fa fa-check cloze-icon-correct"></i>';
  } else {
    input.className = 'cloze-input form-control incorrect';
    feedback.innerHTML = `<i class="fa fa-times cloze-icon-incorrect"></i>`;
  }

  return isCorrect;
}

function checkClozeExercise(index) {
  const exercise = currentExercises[index];
  if (!exercise) return;

  let correct = 0;
  let total = exercise.blanks.length;

  exercise.blanks.forEach((blk, i) => {
    if (checkBlank(index, i + 1)) correct++;
  });

  const newlyCorrect = correct;
  clozeScore.correct += newlyCorrect;
  clozeScore.incorrect += total - newlyCorrect;
  clozeScore.open -= total;

  const resultDiv = document.getElementById(`cloze-result-${index}`);
  const pct = Math.round((correct / total) * 100);
  let label, cls;
  if (pct === 100) { label = 'Perfekt!'; cls = 'success'; }
  else if (pct >= 67) { label = 'Gut gemacht!'; cls = 'info'; }
  else if (pct >= 33) { label = 'Weiter so!'; cls = 'warning'; }
  else { label = 'Nochmal versuchen'; cls = 'danger'; }

  resultDiv.className = `cloze-result alert alert-${cls}`;
  resultDiv.innerHTML = `<strong>${label}</strong> ${correct}/${total} richtig (${pct}%)`;

  updateScore();

  if (typeof ProgressTracker !== 'undefined') {
    ProgressTracker.saveExerciseProgress('lueckentexte', exercise.title || 'exercise', {
      total: total,
      correct: correct,
      completed: correct === total
    });
  }

  if (currentExerciseIndex < currentExercises.length) {
    currentExerciseIndex++;
  }
}

function showClozeHint(exIdx, blankIdx) {
  const blk = currentExercises[exIdx].blanks[blankIdx - 1];
  if (!blk) return;
  alert(`Hinweis: ${blk.hint}`);
}

function updateScore() {
  document.getElementById('cloze-correct').textContent = clozeScore.correct;
  document.getElementById('cloze-incorrect').textContent = clozeScore.incorrect;
  document.getElementById('cloze-open').textContent = clozeScore.open;
}
