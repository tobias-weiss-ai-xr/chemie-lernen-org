/**
 * Quiz-Engine-Logik (static/js/quiz-engine.js) — Unit-Tests.
 *
 * Ergänzt die Datenqualitäts-Tests (quiz-coverage.test.js) um die
 * Verhaltensseite: Shuffle-Permutation, Scoring, Skip, Results.
 * Die Engine ist ein Browser-IIFE (window.QuizEngine) und wird hier
 * in einer vm-Sandbox geladen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ENGINE = path.join(__dirname, '..', 'myhugoapp', 'static', 'js', 'quiz-engine.js');

function loadEngine() {
  const src = fs.readFileSync(ENGINE, 'utf8');
  const sandbox = { window: {}, Math, setInterval, clearInterval, setTimeout, clearTimeout, Date };
  // Bewusst: Browser-IIFE in isolierter Sandbox ausführen.
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInNewContext(src, sandbox, { filename: 'quiz-engine.js' });
  return sandbox.window.QuizEngine;
}

const QUESTIONS = [
  {
    id: 'q1',
    type: 'multiple-choice',
    slug: 't',
    question: 'F1?',
    options: ['a', 'b'],
    correctIndex: 0,
    explanation: 'weil',
  },
  {
    id: 'q2',
    type: 'multiple-choice',
    slug: 't',
    question: 'F2?',
    options: ['a', 'b'],
    correctIndex: 1,
    explanation: 'weil',
  },
  {
    id: 'q3',
    type: 'true-false',
    slug: 't',
    question: 'F3?',
    options: ['Richtig', 'Falsch'],
    correctIndex: 0,
    explanation: 'weil',
  },
  {
    id: 'q4',
    type: 'multiple-select',
    slug: 't',
    question: 'F4?',
    options: ['a', 'b', 'c'],
    correctIndices: [0, 2],
    explanation: 'weil',
  },
];

describe('QuizEngine.shuffle', () => {
  const QuizEngine = loadEngine();

  test('ist eine Permutation (gleiche Länge, gleiche Elemente)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = QuizEngine.shuffle(arr.slice());
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.slice().sort()).toEqual(arr.slice().sort());
  });

  test('ändert das Original in-place (Fisher-Yates, dokumentiertes Verhalten)', () => {
    const arr = [1, 2, 3];
    const ret = QuizEngine.shuffle(arr);
    expect(ret).toBe(arr);
  });
});

describe('QuizEngine-Spielablauf', () => {
  const QuizEngine = loadEngine();

  function newEngine() {
    const e = new QuizEngine();
    e.loadQuestions(QUESTIONS.slice(), { shuffle: false });
    return e;
  }

  test('loadQuestions initialisiert Zähler ohne Shuffle', () => {
    const e = newEngine();
    expect(e.totalQuestions).toBe(4);
    expect(e.currentQuestionIndex).toBe(0);
    expect(e.score).toBe(0);
    expect(e.getCurrentQuestion().id).toBe('q1');
  });

  test('loadQuestions mit Shuffle liefert dieselben Fragen (ggf. umsortiert)', () => {
    const e = new QuizEngine();
    e.loadQuestions(QUESTIONS.slice()); // shuffle per Default an
    expect(e.questions).toHaveLength(4);
    expect(e.questions.map((q) => q.id).sort()).toEqual(['q1', 'q2', 'q3', 'q4']);
  });

  test('richtige Antwort: score 1, correct true, weiterzählen', () => {
    const e = newEngine();
    const r = e.submitAnswer(0); // q1 correctIndex 0
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
    expect(e.score).toBe(1);
    expect(e.getProgress().answered).toBe(1);
    expect(e.getCurrentQuestion().id).toBe('q2');
  });

  test('falsche Antwort: score 0, Fragendurchlauf läuft weiter', () => {
    const e = newEngine();
    const r = e.submitAnswer(1); // falsch für q1
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
    expect(e.score).toBe(0);
    expect(e.getProgress().answered).toBe(1);
  });

  test('multiple-select mit Teiltreffe wird korrekt bewertet (keine Exception)', () => {
    const e = newEngine();
    e.submitAnswer(0); // q1 richtig
    e.submitAnswer(1); // q2 richtig
    e.submitAnswer(1); // q3 falsch
    expect(() => e.submitAnswer([0, 2])).not.toThrow(); // q4 exakt richtig
    expect(e.isFinished).toBe(true);
    expect(e.score).toBeGreaterThan(0);
  });

  test('skipQuestion: zählt als unbeantwortet (skipped) und geht weiter', () => {
    const e = newEngine();
    e.skipQuestion();
    expect(e.getProgress().answered).toBe(1);
    expect(e.answers[0].skipped).toBe(true);
    expect(e.answers[0].score).toBe(0);
    expect(e.getCurrentQuestion().id).toBe('q2');
  });

  test('Quiz-Ende: isFinished, keine Antworten mehr, getResults vollständig', () => {
    const e = newEngine();
    e.submitAnswer(0);
    e.submitAnswer(1);
    e.submitAnswer(0);
    e.skipQuestion(); // q4 wird übersprungen → damit beendet
    expect(e.isFinished).toBe(true);
    expect(e.submitAnswer(0)).toBeNull(); // nach Ende

    const res = e.getResults();
    expect(res.total).toBe(4);
    expect(res.correctCount).toBe(3);
    expect(res.skippedCount).toBe(1);
    expect(res.score).toBe(3);
    expect(res.percentage).toBe(75);
    expect(res.reviewItems).toHaveLength(1); // nur der Skip
    expect(res.questions).toHaveLength(4);
  });

  test('getProgress-Vertrag (von quiz-ui gelesen)', () => {
    const e = newEngine();
    e.submitAnswer(1);
    const p = e.getProgress();
    expect(p).toMatchObject({ current: 2, total: 4, answered: 1, score: 0 });
    expect(p).toHaveProperty('questionTimeLeft');
    expect(p).toHaveProperty('overallTimeLeft');
  });
});
