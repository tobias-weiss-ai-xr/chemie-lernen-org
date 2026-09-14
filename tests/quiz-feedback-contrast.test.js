/**
 * UXF-057 — Quiz-Feedback-Kontrast im OS-Dark-Media-Block (quiz.html).
 *
 * Anlass: Der @media (prefers-color-scheme: dark)-Block im Quiz-Layout
 * dunkelte das Quiz ab und stellte .quiz-feedback-label auf Hellgrau
 * (#e0e0e0), ließ aber den hellen Box-Hintergrund (#fff5f5/#e8f5e9)
 * stehen → ~1.5:1 bei „Falsch · 0/10 Punkte“.
 *
 * Der Test parst die Inline-Styles aus quiz.html, extrahiert den
 * prefers-color-scheme: dark-Block und prüft rechnerisch (WCAG 2.1),
 * dass Label/Erklärung/Icons auf den gedunkelten Boxen AA erfüllen.
 */

const fs = require('fs');
const path = require('path');

const quizHtml = fs.readFileSync(
  path.join(__dirname, '..', 'myhugoapp', 'layouts', '_default', 'quiz.html'),
  'utf8'
);

function relLum(hex) {
  const c = hex.replace('#', '');
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * f(parseInt(c.slice(0, 2), 16)) +
    0.7152 * f(parseInt(c.slice(2, 4), 16)) +
    0.0722 * f(parseInt(c.slice(4, 6), 16))
  );
}
function contrast(a, b) {
  const l1 = relLum(a);
  const l2 = relLum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Extrahiert CSS-Regeln aus dem prefers-color-scheme: dark-Block von quiz.html */
function darkRules() {
  const marker = quizHtml.lastIndexOf('.quiz-feedback-label {'); // die im Dark-Block (letzte Instanz)
  // das @media direkt vor dem Marker (letztes VOR Marker), nicht das erste im Dokument
  const blockStart = quizHtml.lastIndexOf('@media (prefers-color-scheme: dark)', marker);
  let depth = 0;
  let i = quizHtml.indexOf('{', blockStart);
  const blockBegin = i;
  for (; i < quizHtml.length; i++) {
    if (quizHtml[i] === '{') depth++;
    if (quizHtml[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  // UXF-058: Theme-Präfixe strippen, damit die Regel-Keys wieder klassisch sind
  const block = quizHtml
    .slice(blockBegin + 1, i)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/html:not\(\[data-theme\]\)\s*/g, '')
    .replace(/\[data-theme='dark'\]\s*/g, '');
  const rules = {};
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(block))) {
    const sel = m[1].trim();
    const body = m[2];
    const bg = (body.match(/background:\s*(#[0-9a-fA-F]{6})/) || [])[1];
    const color = (body.match(/color:\s*(#[0-9a-fA-F]{6})/) || [])[1];
    if (bg || color)
      rules[sel] = { ...(rules[sel] || {}), ...(bg && { bg }), ...(color && { color }) };
  }
  return rules;
}

describe('UXF-057: Quiz-Feedback im OS-Dark-Block (AA)', () => {
  const rules = darkRules();

  test('Feedback-Boxen sind im Dark-Block abgedunkelt', () => {
    expect(rules['.quiz-feedback-wrong']).toBeDefined();
    expect(rules['.quiz-feedback-wrong'].bg).toBe('#3d1a1a');
    expect(rules['.quiz-feedback-correct']).toBeDefined();
    expect(rules['.quiz-feedback-correct'].bg).toBe('#1b3a1e');
  });

  test.each([
    ['Label (falsch)', '.quiz-feedback-label', '#e0e0e0', '.quiz-feedback-wrong', 4.5],
    ['Label (richtig)', '.quiz-feedback-label', '#e0e0e0', '.quiz-feedback-correct', 4.5],
    ['Erklärung (falsch)', '.quiz-feedback-explanation', '#cfd8dc', '.quiz-feedback-wrong', 4.5],
    ['Erklärung (richtig)', '.quiz-feedback-explanation', '#cfd8dc', '.quiz-feedback-correct', 4.5],
    [
      'Icon (falsch)',
      '.quiz-feedback-wrong .quiz-feedback-icon',
      '#ff8a80',
      '.quiz-feedback-wrong',
      3,
    ],
    [
      'Icon (richtig)',
      '.quiz-feedback-correct .quiz-feedback-icon',
      '#81c784',
      '.quiz-feedback-correct',
      3,
    ],
  ])('%s ≥ %s:1 auf dunkler Box', (_name, fgSel, fgColor, bgSel, min) => {
    expect(rules[fgSel]).toBeDefined();
    expect(rules[fgSel].color).toBe(fgColor);
    const ratio = contrast(fgColor, rules[bgSel].bg);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
