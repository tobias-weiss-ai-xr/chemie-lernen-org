/**
 * Unit Tests für practice-quiz.js — Aufgaben-Generatoren.
 *
 * Die vier Generatoren (mol-mol, mass-mass, limiting, yield) sind das
 * Herz des Übungsgenerators: jede erzeugte Aufgabe muss rechnerisch
 * konsistent sein (Antwort aus den gestellten Werten nachrechenbar),
 * sonst üben Schüler an kaputten Aufgaben. Zufallsinvarianz: 200 Draws
 * pro Typ werden gegen die jeweilige Formel verifiziert.
 */

const quiz = require('../myhugoapp/static/js/calculators/practice-quiz.js');
const { getState } = quiz.__test;

global.showToast = jest.fn();
global.confirm = jest.fn(() => true);

const DOM_IDS = [
  'problem-content',
  'problem-number',
  'practice-answer',
  'feedback-section',
  'correct-count',
  'incorrect-count',
  'practice-problem',
  'practice-setup',
  'practice-score',
  'practice-type',
  'practice-difficulty',
];

beforeEach(() => {
  document.body.innerHTML = DOM_IDS.map((id) => `<div id="${id}"></div>`).join('');
  // practiceState ist modul-global und lebt über Tests hinaus —
  // sauber zurücksetzen (confirm-Stub steht bereits auf true).
  quiz.resetPractice();
});

const DIFFICULTIES = ['easy', 'medium', 'hard'];

describe('generateMolMolProblem — n₂ = n₁ × (ν₂/ν₁)', () => {
  test.each(DIFFICULTIES)('%s: Antwort ist für jeden Draw nachrechenbar (200×)', (difficulty) => {
    for (let i = 0; i < 200; i++) {
      quiz.generateMolMolProblem(difficulty);
      const p = getState().currentProblem;
      expect(p.type).toBe('mol-mol');
      expect(p.n1).toBeGreaterThan(0);
      expect(p.v1).toBeGreaterThanOrEqual(1);
      expect(p.v2).toBeGreaterThanOrEqual(1);
      expect(p.answer).toBeCloseTo(p.n1 * (p.v2 / p.v1), 10);
      expect(p.tolerance).toBe(0.01);
    }
  });

  test('Aufgabentext wird ins DOM geschrieben, Antwortfeld geleert', () => {
    document.getElementById('practice-answer').value = 'alt';
    quiz.generateMolMolProblem('easy');
    expect(document.getElementById('problem-content').innerHTML).toContain('Aufgabe');
    expect(document.getElementById('practice-answer').value).toBe('');
  });

  test('easy: n1 ganzzahlig ≤ 10, Koeffizienten ≤ 3', () => {
    for (let i = 0; i < 100; i++) {
      quiz.generateMolMolProblem('easy');
      const p = getState().currentProblem;
      expect(Number.isInteger(p.n1)).toBe(true);
      expect(p.n1).toBeLessThanOrEqual(10);
      expect(p.v1).toBeLessThanOrEqual(3);
      expect(p.v2).toBeLessThanOrEqual(3);
    }
  });
});

describe('generateMassMassProblem — m₂ = m₁/M₁ × (ν₂/ν₁) × M₂', () => {
  test.each(DIFFICULTIES)('%s: Massenweg stimmt für jeden Draw (200×)', (difficulty) => {
    for (let i = 0; i < 200; i++) {
      quiz.generateMassMassProblem(difficulty);
      const p = getState().currentProblem;
      expect(p.type).toBe('mass-mass');
      expect(p.m1).toBeGreaterThan(0);
      expect(p.M1).toBeGreaterThan(0);
      expect(p.M2).toBeGreaterThan(0);
      const expected = (p.m1 / p.M1) * (p.v2 / p.v1) * p.M2;
      expect(p.answer).toBeCloseTo(expected, 10);
    }
  });
});

describe('generateLimitingProblem — Grenzreaktor korrekt bestimmt', () => {
  test.each(DIFFICULTIES)('%s: answer ∈ {1,2} und matches n = m/M (200×)', (difficulty) => {
    for (let i = 0; i < 200; i++) {
      quiz.generateLimitingProblem(difficulty);
      const p = getState().currentProblem;
      expect(p.type).toBe('limiting');
      expect(p.m1).toBeGreaterThan(0);
      expect(p.m2).toBeGreaterThan(0);
      const limiting = p.m1 / p.M1 < p.m2 / p.M2 ? 1 : 2;
      expect(p.answer).toBe(limiting);
      expect(p.tolerance).toBe(0);
    }
  });
});

describe('generateYieldProblem — Ausbeute% = actual/theoretisch × 100', () => {
  test.each(DIFFICULTIES)(
    '%s: Antwort ist die gesuchte Prozentzahl, Werte konsistent (200×)',
    (difficulty) => {
      for (let i = 0; i < 200; i++) {
        quiz.generateYieldProblem(difficulty);
        const p = getState().currentProblem;
        expect(p.type).toBe('yield');
        // Die Aufgabe stellt theoretisch + actual; gesucht ist die Prozentzahl.
        expect(p.theoretical).toBeGreaterThan(0);
        expect(p.actual).toBeGreaterThan(0);
        expect(p.answer).toBeGreaterThan(0);
        expect(p.answer).toBeLessThanOrEqual(100);
        expect(p.actual).toBeCloseTo((p.theoretical * p.answer) / 100, 10);
        expect(p.tolerance).toBe(1);
      }
    }
  );
});

describe('generateProblem — Dispatcher', () => {
  test('jeder explizite Typ setzt den passenden currentProblem.type', () => {
    for (const type of ['mol-mol', 'mass-mass', 'limiting', 'yield']) {
      quiz.generateProblem(type, 'easy');
      expect(getState().currentProblem.type).toBe(type);
    }
  });

  test('"random" liefert über viele Draws alle vier Typen', () => {
    const seen = new Set();
    for (let i = 0; i < 400; i++) {
      quiz.generateProblem('random', 'medium');
      seen.add(getState().currentProblem.type);
    }
    expect(seen).toEqual(new Set(['mol-mol', 'mass-mass', 'limiting', 'yield']));
  });

  test('unbekannter Typ lässt den Zustand unverändert (kein Crash)', () => {
    quiz.generateMolMolProblem('easy');
    const before = getState().currentProblem;
    expect(() => quiz.generateProblem('nichtda', 'easy')).not.toThrow();
    expect(getState().currentProblem).toBe(before);
  });
});

describe('checkAnswer — Bewertungsfluss', () => {
  test('NaN-Eingabe → Toast, keine Wertung', () => {
    quiz.generateMolMolProblem('easy');
    document.getElementById('practice-answer').value = 'keine-zahl';
    global.showToast.mockClear();
    quiz.checkAnswer();
    expect(global.showToast).toHaveBeenCalled();
    expect(getState().correct).toBe(0);
    expect(getState().incorrect).toBe(0);
  });

  test('exakt richtige Antwort (innerhalb Toleranz) → Richtig-Feedback, +10', () => {
    quiz.generateMolMolProblem('easy');
    document.getElementById('practice-answer').value = String(getState().currentProblem.answer);
    quiz.checkAnswer();
    const fb = document.getElementById('feedback-section');
    expect(fb.style.display).toBe('block');
    expect(fb.innerHTML).toContain('Richtig');
    expect(getState().correct).toBe(1);
    expect(getState().score).toBe(10);
    expect(document.getElementById('correct-count').textContent).toBe('1');
  });

  test('deutlich falsche Antwort → falsch, Score nie unter 0', () => {
    quiz.generateMolMolProblem('easy');
    document.getElementById('practice-answer').value = '999';
    quiz.checkAnswer();
    expect(getState().incorrect).toBe(1);
    // Noch zwei Fehler: Score 10-5-5-5 → clamp bei 0
    quiz.checkAnswer();
    quiz.checkAnswer();
    quiz.checkAnswer();
    expect(getState().score).toBe(0);
    expect(document.getElementById('incorrect-count').textContent).toBe('4');
  });

  test('relative Toleranz: 1%-Abweichung zählt als richtig', () => {
    quiz.generateMolMolProblem('easy');
    const p = getState().currentProblem; // tolerance 0.01
    document.getElementById('practice-answer').value = String(p.answer * 1.005);
    quiz.checkAnswer();
    expect(getState().correct).toBe(1);
  });
});

describe('skipProblem / resetPractice', () => {
  test('Skip kostet 2 Punkte (mind. 0), zählt als incorrect, generiert weiter', () => {
    quiz.generateMolMolProblem('easy');
    document.getElementById('practice-type').value = 'mol-mol';
    document.getElementById('practice-difficulty').value = 'easy';
    getState().score = 5;
    quiz.skipProblem();
    expect(getState().score).toBe(3);
    expect(getState().incorrect).toBe(1);
    expect(getState().problemNumber).toBe(2);
    expect(getState().currentProblem.type).toBe('mol-mol');
  });

  test('resetPractice setzt alles zurück (confirm=true)', () => {
    quiz.generateMolMolProblem('easy');
    document.getElementById('practice-answer').value = String(getState().currentProblem.answer);
    quiz.checkAnswer();
    expect(getState().score).toBe(10);
    quiz.resetPractice();
    expect(getState().score).toBe(0);
    expect(getState().correct).toBe(0);
    expect(getState().currentProblem).toBeNull();
    expect(document.getElementById('practice-score').textContent).toBe('0');
    expect(document.getElementById('practice-setup').style.display).toBe('block');
  });
});

describe('problemDetailHTML — lösungswegspezifisches Feedback pro Typ', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM_IDS.map((id) => `<div id="${id}"></div>`).join('');
    quiz.resetPractice();
  });

  test('mol-mol: Feedback enthält n₂-Formel und den Lösungsweg', () => {
    quiz.generateMolMolProblem('easy');
    const p = getState().currentProblem;
    document.getElementById('practice-answer').value = String(p.answer);
    quiz.checkAnswer();
    const fb = document.getElementById('feedback-section').innerHTML;
    expect(fb).toContain('Richtig');
    expect(fb).toContain('n₂');
    expect(fb).toContain(String(p.v1));
  });

  test('mass-mass: Feedback zeigt den Massenweg', () => {
    quiz.generateMassMassProblem('medium');
    const p = getState().currentProblem;
    document.getElementById('practice-answer').value = String(p.answer);
    quiz.checkAnswer();
    const fb = document.getElementById('feedback-section').innerHTML;
    expect(fb).toContain('Richtig');
    expect(fb).toContain('Lösungsweg');
    expect(fb).toContain(p.M1.toFixed(2));
  });

  test('limiting: Feedback nennt den Grenzreaktor', () => {
    quiz.generateLimitingProblem('easy');
    const p = getState().currentProblem;
    document.getElementById('practice-answer').value = String(p.answer);
    quiz.checkAnswer();
    const fb = document.getElementById('feedback-section').innerHTML;
    expect(fb).toContain('Richtig');
    expect(fb).toContain('limitierend');
  });

  test('yield: Feedback zeigt die prozentuale Ausbeute', () => {
    quiz.generateYieldProblem('hard');
    const p = getState().currentProblem;
    document.getElementById('practice-answer').value = String(p.answer);
    quiz.checkAnswer();
    const fb = document.getElementById('feedback-section').innerHTML;
    expect(fb).toContain('Richtig');
    expect(fb).toContain('%');
  });

  test('falsche Antwort zeigt Differenz in Prozent', () => {
    quiz.generateMolMolProblem('easy');
    document.getElementById('practice-answer').value = '999';
    quiz.checkAnswer();
    const fb = document.getElementById('feedback-section').innerHTML;
    expect(fb).toContain('falsch');
  });
});

describe('startPractice — Initialisierung', () => {
  beforeEach(() => {
    document.body.innerHTML = DOM_IDS.map((id) => `<div id="${id}"></div>`).join('');
    quiz.resetPractice();
  });

  test('liest Typ & Schwierigkeit, aktiviert, generiert erste Aufgabe', () => {
    document.getElementById('practice-type').value = 'mass-mass';
    document.getElementById('practice-difficulty').value = 'hard';
    document.getElementById('practice-setup').style.display = 'block';
    document.getElementById('practice-problem').style.display = 'none';
    quiz.startPractice();
    expect(getState().active).toBe(true);
    expect(getState().problemNumber).toBe(1);
    expect(getState().currentProblem.type).toBe('mass-mass');
    expect(document.getElementById('practice-setup').style.display).toBe('none');
    expect(document.getElementById('practice-problem').style.display).toBe('block');
  });
});
