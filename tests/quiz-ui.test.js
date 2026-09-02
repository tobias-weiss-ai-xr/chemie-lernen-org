/**
 * tests/quiz-ui.test.js — Tests für QuizUI
 * (Konstruktor-Guard, Frage-Rendering, Ergebnis-Share UXF-028,
 * Keyboard-Handler Lifecycle).
 * Quelle: myhugoapp/static/js/quiz-ui.js
 */
const { QuizUI } = require('../myhugoapp/static/js/quiz-ui.js');

function makeEngine(overrides) {
  return Object.assign(
    {
      getCurrentQuestion: () => ({
        question: 'Was beschreibt der pH-Wert?',
        type: 'multiple-choice',
        topic: 'Säure-Base',
        options: [
          { text: 'H⁺-Konzentration', correct: true },
          { text: 'Temperatur', correct: false },
        ],
      }),
      getProgress: () => ({ current: 1, total: 5, score: 10 }),
      isFinished: false,
      questionTimeLimit: 0,
      overallTimeLimit: 0,
    },
    overrides
  );
}

describe('QuizUI Konstruktor', () => {
  test('ohne Container → Fehler', () => {
    expect(() => new QuizUI(null, {})).toThrow('container element');
  });

  test('mit Container → Instanz mit Defaults', () => {
    const el = document.createElement('div');
    const ui = new QuizUI(el, {});
    expect(ui.container).toBe(el);
    expect(ui.keyboardEnabled).toBe(true);
    expect(ui.engine).toBeNull();
    expect(ui.multiSelect).toEqual([]);
  });

  test('keyboard: false deaktiviert Tastatur', () => {
    const el = document.createElement('div');
    const ui = new QuizUI(el, { keyboard: false });
    expect(ui.keyboardEnabled).toBe(false);
  });
});

describe('QuizUI.renderQuestion', () => {
  let container;
  let ui;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    ui = new QuizUI(container, {});
  });

  test('null-Frage → Empty-State (deutsch)', () => {
    ui.renderQuestion(null, makeEngine());
    expect(container.querySelector('.quiz-empty')).not.toBeNull();
    expect(container.textContent).toContain('Keine Fragen verfügbar');
  });

  test('Frage mit Topic, Text und Optionen gerendert', () => {
    ui.renderQuestion(makeEngine().getCurrentQuestion(), makeEngine());
    expect(container.querySelector('.quiz-topic-badge').textContent).toBe('Säure-Base');
    expect(container.querySelector('.quiz-question-text').textContent).toContain('pH-Wert');
    expect(container.querySelectorAll('[data-quiz-options] .quiz-option').length).toBeGreaterThan(
      0
    );
  });

  test('XSS im Fragetext wird escaped', () => {
    const q = makeEngine().getCurrentQuestion();
    q.question = '<img src=x onerror=alert(1)>';
    ui.renderQuestion(q, makeEngine());
    const h3 = container.querySelector('.quiz-question-text');
    // Kein <img> als Element — nur Text:
    expect(h3.querySelector('img')).toBeNull();
    expect(h3.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});

describe('QuizUI.renderResults + Share (UXF-023/028)', () => {
  let container;
  let ui;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    ui = new QuizUI(container, { quizTitle: 'Säure-Base-Quiz' });
  });

  function results(overrides) {
    return Object.assign(
      {
        percentage: 85,
        score: 17,
        total: 20,
        correctCount: 6,
        wrongCount: 1,
        skippedCount: 0,
        timeTaken: 65000,
        reviewItems: [],
      },
      overrides
    );
  }

  test('Ergebnis-Screen mit Score-Kreis und Statistiken', () => {
    ui.renderResults(results());
    expect(container.textContent).toContain('Quiz beendet!');
    expect(container.querySelector('.quiz-score-circle').textContent).toContain('85%');
    expect(container.querySelector('.quiz-stat-correct').textContent).toBe('6');
  });

  test('Share-Button vorhanden und Text enthält quizTitle (UXF-028)', () => {
    ui.renderResults(results());
    const btn = container.querySelector('[data-quiz-share]');
    expect(btn).not.toBeNull();
    // UXF-028: echter Thema-Name statt „Chemie-Quiz"
    expect(btn.getAttribute('data-quiz-title')).toBe('Säure-Base-Quiz');
  });

  test('ohne quizTitle-Option → Fallback data-quiz-title leer (JS fällt auf h1 zurück)', () => {
    const ui2 = new QuizUI(container, {});
    ui2.renderResults(results());
    const btn = ui2.container.querySelector('[data-quiz-share]');
    expect(btn.getAttribute('data-quiz-title')).toBe('');
  });
});

describe('QuizUI.start / destroy', () => {
  test('start setzt Engine, rendert Frage, aktiviert Keyboard', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ui = new QuizUI(container, {});
    const engine = makeEngine();
    ui.start(engine);
    expect(ui.engine).toBe(engine);
    expect(engine.onQuestionChange).toBeInstanceOf(Function);
    expect(engine.onComplete).toBeInstanceOf(Function);
    expect(container.querySelector('.quiz-question-text')).not.toBeNull();
    expect(typeof ui._keyHandler).toBe('function');
    ui.destroy();
  });

  test('destroy entfernt Keyboard-Handler', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ui = new QuizUI(container, {});
    ui.start(makeEngine());
    const before = ui._keyHandler;
    ui.destroy();
    expect(ui._keyHandler).toBeNull();
    expect(ui._keyHandler).not.toBe(before);
  });

  test('bestehende Engine-Callbacks werden nicht überschrieben', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ui = new QuizUI(container, {});
    const mine = () => {};
    const engine = makeEngine({ onQuestionChange: mine, onComplete: mine });
    ui.start(engine);
    expect(engine.onQuestionChange).toBe(mine);
    expect(engine.onComplete).toBe(mine);
  });
});
