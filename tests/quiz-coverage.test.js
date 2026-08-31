/**
 * Quiz-Abdeckung — stellt sicher, dass ALLE Quizze Fragen haben.
 *
 * Anlass (2026-08-31): Das quiz-widget-Partial griff auf
 * `quizQuestions.questions` zu, obwohl quiz-questions.js die Bank als
 * *Array* expos't (window.quizQuestions = questions). Folge: JEDES
 * eingebettete Quiz zeigte "Quiz-Fragen nicht verfügbar." Zusätzlich
 * verwiesen diverse teilgebiet-Frontmatter-Werte (thermodynamik,
 * atombau, allgemein, …) auf Slugs ohne eigene Fragen — der Widget-
 * Fallback lieferte dann still falsches Thema.
 *
 * Diese Suite frißt die Verträge ein:
 *  1. quiz-questions.js expos't ein nicht-leeres Array wohlgeformter Fragen
 *  2. quiz-widget.html verträgt das Array (+ Alias-Map auf echte Slugs)
 *  3. Jeder im Content referenzierte Quiz-Topic resolviert zu ≥1 Frage
 *  4. Jeder Themenbereich hat eigene Fragen & ein Quiz-Widget
 *  5. Opt-outs (quiz: false) und Drafts sind sauber markiert
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const MYHUGO = path.join(ROOT, 'myhugoapp');
const QUESTIONS_JS = path.join(MYHUGO, 'static', 'js', 'quiz-questions.js');
const WIDGET_HTML = path.join(MYHUGO, 'layouts', 'partials', 'quiz-widget.html');
const CONTENT = path.join(MYHUGO, 'content');

const KNOWN_TYPES = new Set(['multiple-choice', 'multiple-select', 'true-false', 'fill-in-blank']);

function walk(dir, ext, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, ext, acc);
    else if (entry.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}

/** Lädt quiz-questions.js in einer Window-Sandbox und liefert die Bank. */
function loadQuestionBank() {
  const src = fs.readFileSync(QUESTIONS_JS, 'utf8');
  const sandbox = { window: {} };
  // Bewusst: quiz-questions.js ist ein Browser-IIFE und wird hier in einer
  // isolierten vm-Sandbox ausgeführt, um window.quizQuestions zu befüllen.
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInNewContext(src, sandbox, { filename: 'quiz-questions.js' });
  return sandbox.window.quizQuestions;
}

/** Alias-Map aus dem Widget-Partial parsen (einzige Source of Truth). */
function loadTopicAliases() {
  const src = fs.readFileSync(WIDGET_HTML, 'utf8');
  const m = src.match(/var TOPIC_ALIASES = \{([\s\S]*?)\};/);
  if (!m) return {};
  const aliases = {};
  // Key kann unquoted (allgemein) oder quoted ('allgemeine-chemie') sein —
  // der Doppelpunkt steht bei quoted Keys HINTER dem schließenden Quote.
  for (const pair of m[1].matchAll(/['"]?([\w-]+)['"]?:\s*'([\w-]+)'/g)) {
    aliases[pair[1]] = pair[2];
  }
  return aliases;
}

describe('Quiz-Fragenbank (quiz-questions.js)', () => {
  const bank = loadQuestionBank();

  test('exponiert ein nicht-leeres ARRAY (Datenvertrag mit quiz-widget.html)', () => {
    expect(Array.isArray(bank)).toBe(true);
    expect(bank.length).toBeGreaterThanOrEqual(80); // "120+" laut Header
  });

  test('jede Frage ist wohlgeformt (beantwortbar!)', () => {
    const ids = new Set();
    for (const q of bank) {
      const label = q && q.id ? `id=${q.id}` : 'ohne id';
      expect(typeof q.id).toBe('string');
      expect(ids.has(q.id)).toBe(false); // keine Dubletten
      ids.add(q.id);
      expect(KNOWN_TYPES.has(q.type)).toBe(true);
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(5);
      expect(typeof q.slug).toBe('string');
      expect(q.slug.length).toBeGreaterThan(0);
      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(3);

      if (q.type === 'multiple-choice' || q.type === 'multiple-select') {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        for (const opt of q.options) {
          expect(typeof opt).toBe('string');
          expect(opt.length).toBeGreaterThan(0);
        }
      }
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        expect(Number.isInteger(q.correctIndex)).toBe(true);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        if (Array.isArray(q.options)) expect(q.correctIndex).toBeLessThan(q.options.length);
      }
      if (q.type === 'multiple-select') {
        expect(Array.isArray(q.correctIndices)).toBe(true);
        expect(q.correctIndices.length).toBeGreaterThan(0);
        for (const ci of q.correctIndices) {
          expect(ci).toBeGreaterThanOrEqual(0);
          expect(ci).toBeLessThan(q.options.length);
        }
      }
      if (q.type === 'fill-in-blank') {
        const answers = q.answers || q.correctAnswers || [q.correctAnswer];
        expect(answers.filter(Boolean).length).toBeGreaterThan(0);
      }
    }
  });

  test('jeder Themenbereich (content/themenbereiche/) hat eigene Fragen', () => {
    const bankSlugs = new Set(bank.map((q) => q.slug));
    const areas = fs
      .readdirSync(path.join(CONTENT, 'themenbereiche'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect(areas.length).toBeGreaterThanOrEqual(12);
    for (const area of areas) {
      expect(bankSlugs.has(area)).toBe(true);
      expect(bank.filter((q) => q.slug === area).length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Quiz-Widget-Vertrag (layouts/partials/quiz-widget.html)', () => {
  const widget = fs.readFileSync(WIDGET_HTML, 'utf8');

  test('verträgt die Array-Form der Fragenbank (kein .questions-Zwangszugriff)', () => {
    // Der 2026-08-31-Bug: reines `quizQuestions.questions.filter(...)` auf
    // einer Array-Bank -> "Quiz-Fragen nicht verfügbar." auf JEDER Seite.
    expect(widget).toMatch(/quizQuestions\.questions\s*\|\|\s*quizQuestions/);
    expect(widget).not.toMatch(/quizQuestions\.questions\.filter/);
  });

  test('Alias-Map existiert und zeigt nur auf echte Frage-Slugs (oder "alle")', () => {
    const aliases = loadTopicAliases();
    expect(Object.keys(aliases).length).toBeGreaterThanOrEqual(10);
    const bankSlugs = new Set(loadQuestionBank().map((q) => q.slug));
    bankSlugs.add('alle');
    for (const [from, to] of Object.entries(aliases)) {
      expect(bankSlugs.has(to)).toBe(true);
    }
  });
});

describe('Content-Referenzen: jeder Quiz-Topic resolviert zu Fragen', () => {
  const bank = loadQuestionBank();
  const aliases = loadTopicAliases();
  const bankSlugs = new Set(bank.map((q) => q.slug));
  bankSlugs.add('alle'); // Sonderbedeutung: alle Fragen

  function resolves(topic) {
    return topic === 'alle' || bankSlugs.has(topic) || bankSlugs.has(aliases[topic]);
  }

  test('jeder quiz-widget-Shortcode im Content nutzt einen belegten Topic', () => {
    const bad = [];
    for (const file of walk(CONTENT, '.md')) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(/\{\{<\s*quiz-widget[^>]*topic="([^"]+)"/g)) {
        if (!resolves(m[1])) {
          bad.push(`${path.relative(CONTENT, file)}: topic="${m[1]}"`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  test('Root-Seiten mit teilgebiet resolviern — oder opten bewusst aus (quiz: false)', () => {
    // baseof.html bettet nur auf Content-Root-Seiten (Section == "") das
    // Themen-Quiz ein. Bei diesen muss der Topic Fragen liefern.
    const bad = [];
    for (const file of fs.readdirSync(CONTENT)) {
      if (!file.endsWith('.md')) continue;
      const src = fs.readFileSync(path.join(CONTENT, file), 'utf8');
      const fm = src.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      const front = fm[1];
      if (/^draft:\s*true/m.test(front)) continue; // Drafts werden nicht gebaut
      const tg = front.match(/^teilgebiet:\s*(.+)$/m);
      if (!tg) continue;
      // teilgebiet kann String ODER Liste sein (Hugo: index $tb 0 = erstes
      // Element). Erst Liste auflosen, dann Quotes pro Element strippen.
      const raw = tg[1].replace(/^\[/, '').replace(/\]$/, '');
      const topic = raw
        .split(',')[0]
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (!topic) continue;
      if (resolves(topic)) continue;
      if (/^quiz:\s*false/m.test(front)) continue; // bewusster Opt-out
      bad.push(`${file}: teilgebiet "${topic}" hat keine Fragen und kein quiz:false`);
    }
    expect(bad).toEqual([]);
  });

  test('jeder Themenbereich _index.md bindet sein EIGENES Quiz ein', () => {
    const tbDir = path.join(CONTENT, 'themenbereiche');
    const bad = [];
    for (const entry of fs.readdirSync(tbDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const idx = path.join(tbDir, entry.name, '_index.md');
      const src = fs.readFileSync(idx, 'utf8');
      const m = src.match(/\{\{<\s*quiz-widget[^>]*topic="([^"]+)"/);
      if (!m) {
        bad.push(`themenbereiche/${entry.name}/_index.md: kein quiz-widget`);
      } else if (m[1] !== entry.name) {
        bad.push(`themenbereiche/${entry.name}/_index.md: topic="${m[1]}" ≠ "${entry.name}"`);
      }
    }
    expect(bad).toEqual([]);
  });
});
