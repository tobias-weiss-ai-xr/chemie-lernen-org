/**
 * apply-r5-quiz.mjs — UXF-023: Quiz „Ergebnis kopieren"
 *
 * Der Quiz-Ergebnis-Screen hat Retry-Buttons, aber keinen Weg, das Ergebnis
 * zu teilen/persistieren (Lehrer:innen lassen Quizserien nachweisen; Lernende
 * teilen Erfolge). Neu: „Ergebnis kopieren"-Button unter den Stats —
 * Text „Quiz „{Titel}": {pct}% ({score}/{total}) — chemie-lernen.org/quiz/"
 * via Clipboard-API, prompt-Fallback, UIToast-Feedback wenn verfügbar.
 *
 * Datei: static/js/quiz-ui.js (renderResults)
 * Idempotent via Marker. Wirft bei fehlendem Anker.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/quiz-ui.js');

function fail(anchor) {
  throw new Error(`[UXF-023] Anker nicht gefunden: "${anchor}"`);
}

let src = fs.readFileSync(FILE, 'utf-8');
if (src.includes('UXF-023')) {
  console.log('[UXF-023] bereits angewendet');
  process.exit(0);
}

// ── 1. Button ins Ergebnis-HTML ──────────────────────────────────────
const a1 = `    // Retry / topic selection buttons
    html += '<div class="quiz-results-actions">';
    html +=
      '<button class="quiz-btn quiz-btn-primary" data-quiz-retry type="button">Erneut versuchen</button>';`;
if (!src.includes(a1)) fail(a1);
src = src.replace(
  a1,
  `    // UXF-023: Ergebnis teilen/kopieren
    html +=
      '<button class="quiz-btn quiz-btn-secondary" data-quiz-share type="button">' +
      '🔗 Ergebnis kopieren</button>';

    // Retry / topic selection buttons
    html += '<div class="quiz-results-actions">';
    html +=
      '<button class="quiz-btn quiz-btn-primary" data-quiz-retry type="button">Erneut versuchen</button>';`
);

// ── 2. Handler neben den Retry-Buttons ───────────────────────────────
const a2 = `    var wiederholenBtn = this.container.querySelector('[data-quiz-wiederholen]');
    if (wiederholenBtn) {
      wiederholenBtn.addEventListener('click', function () {
        if (self.options.onWiederholen) {
          self.options.onWiederholen(results.reviewItems);
        }
      });
    }

    this._disableKeyboard();`;
if (!src.includes(a2)) fail(a2);
src = src.replace(
  a2,
  `    var wiederholenBtn = this.container.querySelector('[data-quiz-wiederholen]');
    if (wiederholenBtn) {
      wiederholenBtn.addEventListener('click', function () {
        if (self.options.onWiederholen) {
          self.options.onWiederholen(results.reviewItems);
        }
      });
    }

    // UXF-023: Ergebnis-Text in die Zwischenablage
    var shareBtn = this.container.querySelector('[data-quiz-share]');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var quizTitle =
          document.querySelector('.quiz-title, h1') &&
          document.querySelector('.quiz-title, h1').textContent
            ? document.querySelector('.quiz-title, h1').textContent.trim()
            : 'Chemie-Quiz';
        var text =
          'Quiz „' +
          quizTitle +
          '": ' +
          results.percentage +
          '% (' +
          results.score +
          '/' +
          results.total +
          ' Punkte) — ' +
          window.location.origin +
          '/quiz/';
        var restore = shareBtn.textContent;
        var done = function () {
          shareBtn.textContent = '✓ Kopiert!';
          if (window.UIToast && window.UIToast.success) {
            window.UIToast.success('Ergebnis in die Zwischenablage kopiert');
          }
          setTimeout(function () {
            shareBtn.textContent = restore;
          }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            window.prompt('Ergebnis zum Kopieren (Strg+C):', text);
          });
        } else {
          window.prompt('Ergebnis zum Kopieren (Strg+C):', text);
        }
      });
    }

    this._disableKeyboard();`
);

fs.writeFileSync(FILE, src);
console.log('[UXF-023] ✓ 2 Edits in quiz-ui.js');
