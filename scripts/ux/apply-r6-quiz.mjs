/**
 * apply-r6-quiz.mjs — UXF-028: Quiz-Share mit echtem Thema-Namen
 *
 * Der Share-Text nutzte `document.querySelector('.quiz-title, h1')` — das
 * liefert immer „Chemie-Quiz" (statisches Seiten-h1), nie das aktuelle
 * Thema. quiz.html kennt currentTopic, übergab es aber nicht an QuizUI.
 *
 * Neu: quiz.html reicht options.quizTitle = currentTopic; quiz-ui.js nutzt
 * es mit Fallback auf das alte Verhalten (falls Option fehlt).
 *
 * Dateien: layouts/_default/quiz.html + static/js/quiz-ui.js
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const QUIZ_HTML = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/quiz.html');
const QUIZ_UI = path.join(REPO_ROOT, 'myhugoapp/static/js/quiz-ui.js');

function fail(task, anchor) {
  throw new Error(`[${task}] Anker nicht gefunden: "${anchor}"`);
}

// ── 1. quiz.html: quizTitle-Option übergeben ─────────────────────────
{
  let src = fs.readFileSync(QUIZ_HTML, 'utf-8');
  if (src.includes('UXF-028')) {
    console.log('[UXF-028] quiz.html bereits gepatcht');
  } else {
    const a1 = `    quizUI = new QuizUI(quizArea, {
      onRetry: function () {`;
    if (!src.includes(a1)) fail('UXF-028', a1);
    src = src.replace(
      a1,
      `    quizUI = new QuizUI(quizArea, {
      quizTitle: currentTopic || '', // UXF-028: echter Thema-Name für Share
      onRetry: function () {`
    );
    fs.writeFileSync(QUIZ_HTML, src);
    console.log('[UXF-028] ✓ quiz.html: quizTitle-Option');
  }
}

// ── 2. quiz-ui.js: Option im Share-Handler nutzen ────────────────────
{
  let src = fs.readFileSync(QUIZ_UI, 'utf-8');
  if (src.includes('UXF-028')) {
    console.log('[UXF-028] quiz-ui.js bereits gepatcht');
  } else {
    const a2 = `        var quizTitle =
          document.querySelector('.quiz-title, h1') &&
          document.querySelector('.quiz-title, h1').textContent
            ? document.querySelector('.quiz-title, h1').textContent.trim()
            : 'Chemie-Quiz';`;
    if (!src.includes(a2)) fail('UXF-028', a2);
    src = src.replace(
      a2,
      `        // UXF-028: echter Thema-Name aus der Option (Fallback: Seiten-h1)
        // Achtung: im click-Handler zeigt this auf den Button — self ist
        // die QuizUI-Instanz (var self = this in renderResults).
        var quizTitle =
          (self.options && self.options.quizTitle
            ? String(self.options.quizTitle).trim()
            : '') ||
          (document.querySelector('.quiz-title, h1') &&
          document.querySelector('.quiz-title, h1').textContent
            ? document.querySelector('.quiz-title, h1').textContent.trim()
            : '') ||
          'Chemie-Quiz';`
    );
    fs.writeFileSync(QUIZ_UI, src);
    console.log('[UXF-028] ✓ quiz-ui.js: quizTitle nutzen');
  }
}

console.log('[r6-quiz] ✓ abgeschlossen');
