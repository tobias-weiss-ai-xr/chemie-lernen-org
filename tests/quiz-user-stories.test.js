/**
 * Quiz-User-Stories (docs/quiz-user-stories.md) — verhaltensnahe Tests.
 *
 * Jeder describe-Block mappt 1:1 auf eine User-Story und prüft deren
 * Akzeptanzkriterien gegen die echte Fragenbank (quiz-questions.js) und
 * die echte Engine (quiz-engine.js) — beide als Browser-IIFEs in einer
 * vm-Sandbox geladen (gleicher Ansatz wie quiz-coverage / quiz-engine).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BANK_JS = path.join(ROOT, 'myhugoapp', 'static', 'js', 'quiz-questions.js');
const ENGINE_JS = path.join(ROOT, 'myhugoapp', 'static', 'js', 'quiz-engine.js');

function loadBank() {
  const src = fs.readFileSync(BANK_JS, 'utf8');
  const sandbox = { window: {} };
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInNewContext(src, sandbox, { filename: 'quiz-questions.js' });
  return sandbox.window;
}

function loadEngine() {
  const src = fs.readFileSync(ENGINE_JS, 'utf8');
  const sandbox = { window: {}, Math, setInterval, clearInterval, setTimeout, clearTimeout, Date };
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInNewContext(src, sandbox, { filename: 'quiz-engine.js' });
  return sandbox.window.QuizEngine;
}

const win = loadBank();
const bank = win.quizQuestions;
const QuizEngine = loadEngine();

const byId = Object.fromEntries(bank.map((q) => [q.id, q]));
const bySlug = (slug) => bank.filter((q) => q.slug === slug);

describe('US-01: Themenbereich wählen', () => {
  const AREAS = [
    'einfuehrung-chemie',
    'aufbau-materie',
    'anorganische-verbindungen',
    'saeuren-basen',
    'redox-elektrochemie',
    'erdoel-organische-stoffklassen',
    'biochemie',
    'gleichgewicht-geschwindigkeit',
    'energetik',
    'analytische-methoden',
    'reaktionstypen-organisch',
    'produkte-organisch',
  ];

  test('AK1: jeder Themenbereich hat ≥ 10 Fragen, Tipps & Tricks ≥ 8', () => {
    for (const slug of AREAS) {
      expect(bySlug(slug).length).toBeGreaterThanOrEqual(10);
    }
    expect(bySlug('tipps-tricks').length).toBeGreaterThanOrEqual(8);
  });

  test('AK2: jeder Anzeigename aus quizTopics resolviert zu Fragen', () => {
    expect(win.quizTopics.length).toBe(13);
    const topicsWithQ = new Set(bank.map((q) => q.topic));
    for (const t of win.quizTopics) {
      expect(topicsWithQ.has(t)).toBe(true);
    }
  });
});

describe('US-02: Frisches Frageformat pro Durchlauf', () => {
  test('AK1+AK2: Standard-Shuffle ist Permutation ohne Verlust', () => {
    const subset = bySlug('saeuren-basen');
    const engine = new QuizEngine();
    engine.loadQuestions(subset); // ohne shuffle-Option → mischt
    const before = subset.map((q) => q.id).sort();
    const after = engine.questions.map((q) => q.id).sort();
    expect(after).toEqual(before);
    expect(engine.totalQuestions).toBe(subset.length);
  });
});

describe('US-03: Sofortiges Feedback mit Erklärung', () => {
  test('AK1: jede Frage hat eine nicht-leere Erklärung', () => {
    for (const q of bank) {
      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(3);
    }
  });

  test('AK2: submitAnswer liefert correct/score', () => {
    const engine = new QuizEngine();
    engine.loadQuestions([byId['ec-1']], { shuffle: false });
    const result = engine.submitAnswer(1); // Wasserstoff hat 1 Proton
    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
  });
});

describe('US-04: Multiple Choice beantworten', () => {
  const engineSetup = () => {
    const engine = new QuizEngine();
    engine.loadQuestions([byId['ec-1']], { shuffle: false });
    return engine;
  };

  test('AK1: richtiger Index → 1 Punkt', () => {
    expect(engineSetup().submitAnswer(1).score).toBe(1);
  });

  test('AK2: falscher Index → 0 Punkte', () => {
    const r = engineSetup().submitAnswer(0);
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
  });
});

describe('US-05: Mehrfachauswahl mit Teilpunkten', () => {
  const engineSetup = () => {
    const engine = new QuizEngine();
    engine.loadQuestions([byId['ec-7']], { shuffle: false }); // [0,2,4] Elemente
    return engine;
  };

  test('AK1: Volltreffer → 1 Punkt', () => {
    const r = engineSetup().submitAnswer([0, 2, 4]);
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });

  test('AK2: Teilzutreffer → Teilpunkte ohne correct-Flag', () => {
    const r = engineSetup().submitAnswer([0]); // 1 von 3 richtig, 0 falsch
    expect(r.correct).toBe(false);
    expect(r.score).toBeCloseTo(1 / 3, 5);
  });

  test('AK3: nur falsche Auswahl → 0 Punkte', () => {
    const r = engineSetup().submitAnswer([1, 3]); // Wasser/Kochsalz = Verbindungen
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
  });
});

describe('US-06: Lückentext tolerant bewerten', () => {
  const engineSetup = () => {
    const engine = new QuizEngine();
    engine.loadQuestions([byId['ec-6']], { shuffle: false });
    return engine;
  };

  test.each(['atom', 'Atom', 'ATOM', '  Atom '])('AK1: %j wird akzeptiert', (input) => {
    expect(engineSetup().submitAnswer(input).score).toBe(1);
  });

  test('AK2: falsche Antwort → 0 Punkte', () => {
    expect(engineSetup().submitAnswer('Molekül').score).toBe(0);
  });
});

describe('US-07: Richtig/Falsch-Stimmen', () => {
  test('AK: richtiger correctIndex → 1 Punkt', () => {
    const engine = new QuizEngine();
    engine.loadQuestions([byId['ec-3']], { shuffle: false });
    expect(engine.submitAnswer(0).score).toBe(1); // C ≈ 12 g/mol → richtig
  });
});

describe('US-08: Kompletter Durchlauf mit Auswertung', () => {
  test('AK1: alle richtig → 100 %', () => {
    const questions = bySlug('saeuren-basen');
    const engine = new QuizEngine();
    engine.loadQuestions(questions, { shuffle: false });
    for (const q of questions) {
      const answer =
        q.type === 'multiple-select'
          ? q.correctIndices
          : q.type === 'fill-in-blank'
            ? (q.acceptedAnswers || [q.correctAnswer])[0]
            : q.correctIndex;
      engine.submitAnswer(answer);
    }
    const results = engine.getResults();
    expect(results.percentage).toBe(100);
    expect(results.correctCount).toBe(questions.length);
  });

  test('AK2: reviewItems listet Fehler mit User-Antwort', () => {
    const engine = new QuizEngine();
    engine.loadQuestions([byId['ec-1']], { shuffle: false });
    engine.submitAnswer(0); // falsch (0 Protonen)
    const results = engine.getResults();
    expect(results.wrongCount).toBe(1);
    expect(results.reviewItems.length).toBe(1);
    expect(results.reviewItems[0].userAnswer).toBe(0);
  });
});

describe('US-09: Content-Qualität neuer Fragen', () => {
  const NEW_IDS = [
    'ec-9',
    'ec-10',
    'am-9',
    'am-10',
    'anam-9',
    'anam-10',
    'sb-9',
    'sb-10',
    're-9',
    're-10',
    'eo-9',
    'eo-10',
    'bc-9',
    'bc-10',
    'gg-9',
    'gg-10',
    'en-9',
    'en-10',
    'av-9',
    'av-10',
    'ro-9',
    'ro-10',
    'po-9',
    'po-10',
    'tt-7',
    'tt-8',
  ];

  test('AK2: alle 26 neuen Fragen existieren genau einmal', () => {
    for (const id of NEW_IDS) {
      const hits = bank.filter((q) => q.id === id);
      expect(hits.length).toBe(1);
    }
  });

  test('AK2: neue Fragen sind wohlgeformt (Typ, Optionen, Indizes)', () => {
    for (const id of NEW_IDS) {
      const q = byId[id];
      expect(['multiple-choice', 'multiple-select', 'true-false', 'fill-in-blank']).toContain(
        q.type
      );
      if (q.type === 'multiple-choice') {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
      if (q.type === 'multiple-select') {
        for (const ci of q.correctIndices) {
          expect(ci).toBeLessThan(q.options.length);
        }
      }
      if (q.type === 'fill-in-blank') {
        expect((q.acceptedAnswers || []).length).toBeGreaterThan(0);
      }
      expect(q.explanation.length).toBeGreaterThan(3);
    }
  });

  test('AK2: Stichproben der Fachinhalte', () => {
    // ec-9: Reinstoff-Definition
    expect(byId['ec-9'].correctIndex).toBe(0);
    // gg-10: Druckerhöhung verschiebt N₂+3H₂⇌2NH₃ zum Ammoniak (weniger Gasteilchen)
    expect(byId['gg-10'].correctIndex).toBe(1);
    // am-10: Kern = Protonen + Neutronen
    expect(byId['am-10'].correctIndices).toEqual([0, 2]);
    // ro-10: Additionen = Hydratisierung + Hydrierung des Ethens
    expect(byId['ro-10'].correctIndices).toEqual([0, 2]);
  });
});
