/**
 * Rechner ↔ Quiz verknüpfen — integration test.
 *
 * Every calculator page carries a `teilgebiet` (Themenbereich slug) in its
 * front matter. The quiz widget mounted on calculator pages (baseof.html)
 * filters quiz-questions.js by that slug, so each calculator must map to at
 * least one quiz question — otherwise the embedded widget would be empty.
 * Calculators whose teilgebiet has no dedicated quiz legitimately fall back
 * to the intro quiz ('einfuehrung-chemie'), so that slug must exist.
 *
 * This test asserts that mapping holds for all calculator pages.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..');

function loadQuizQuestions() {
  const file = path.join(REPO, 'myhugoapp/static/js/quiz-questions.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  // Intentional: load the browser global quiz DB into a sandbox.
  // eslint-disable-next-line sonarjs/code-eval
  vm.runInContext(code, sandbox);
  return sandbox.window.quizQuestions.questions;
}

function getCalculatorTeilgebiete() {
  const contentDir = path.join(REPO, 'myhugoapp/content');
  const teilgebiete = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/rechner/i.test(full) || !entry.name.endsWith('.md')) continue;
      const text = fs.readFileSync(full, 'utf8');
      const m = text.match(/teilgebiet:\s*(\[[^\]]*\]|['"][^'"]*['"])/);
      if (!m) continue;
      const raw = m[1];
      if (raw.startsWith('[')) {
        const arr = raw.slice(1, -1).match(/['"]([^'"]+)['"]/g) || [];
        arr.forEach((a) => teilgebiete.add(a.replace(/['"]/g, '')));
      } else {
        teilgebiete.add(raw.replace(/['"]/g, ''));
      }
    }
  };
  walk(contentDir);
  return [...teilgebiete];
}

describe('Rechner ↔ Quiz mapping', () => {
  test('quiz database loads with substantial question set', () => {
    const qs = loadQuizQuestions();
    expect(Array.isArray(qs)).toBe(true);
    expect(qs.length).toBeGreaterThan(50);
  });

  test('every calculator teilgebiet maps to >=1 quiz question (or the intro fallback)', () => {
    const qs = loadQuizQuestions();
    const slugs = new Set(qs.map((q) => q.slug).filter(Boolean));
    // The quiz widget falls back to 'einfuehrung-chemie' when a calculator's
    // teilgebiet has no dedicated quiz, so that slug must exist.
    expect(slugs.has('einfuehrung-chemie')).toBe(true);
    const teilgebiete = getCalculatorTeilgebiete();
    expect(teilgebiete.length).toBeGreaterThan(0);
    const missing = teilgebiete.filter((t) => !slugs.has(t) && !slugs.has('einfuehrung-chemie'));
    expect(missing).toEqual([]);
  });
});
