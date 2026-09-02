/**
 * apply-quiz-loading.mjs — UX-008: Quiz-Widget Loading-State
 *
 * Verbessert den Loading-State des Quiz-Widgets mit Skeleton-Placeholder.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const CSS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');
const QUIZ_WIDGET_FILE = path.join(REPO_ROOT, 'myhugoapp/layouts/partials/quiz-widget.html');

const QUIZ_CSS = `/* UX-008: Quiz-Widget Loading-State
 * Skeleton-Placeholder statt einfachem Spinner-Text.
 */
.quiz-skeleton-card {
  background: var(--bg-surface, #efede6);
  border-radius: 8px;
  height: 60px;
  margin-bottom: 12px;
  width: 100%;
}

.quiz-skeleton-line {
  background: var(--bg-surface, #efede6);
  border-radius: 4px;
  height: 16px;
  margin-bottom: 8px;
  width: 80%;
}

.quiz-skeleton-line.short {
  width: 50%;
}

.quiz-loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

.quiz-loading-state .quiz-skeleton-card {
  display: flex;
  align-items: center;
  padding: 16px;
  height: auto;
  min-height: 60px;
}

.quiz-loading-state .quiz-skeleton-card .quiz-skeleton-line {
  margin-bottom: 0;
}
`;

function applyQuizLoading() {
  // 1. Add CSS
  let existing = '';
  if (fs.existsSync(CSS_FILE)) {
    existing = fs.readFileSync(CSS_FILE, 'utf-8');
  }

  if (existing.includes('UX-008')) {
    console.log('[UX-008] Quiz loading CSS already present');
  } else {
    fs.writeFileSync(CSS_FILE, existing + '\n' + QUIZ_CSS);
    console.log('[UX-008] Quiz loading CSS added');
  }

  // 2. Update quiz-widget.html: replace spinner placeholder with skeleton
  let quizWidget = fs.readFileSync(QUIZ_WIDGET_FILE, 'utf-8');

  const oldPlaceholder = `<div class="quiz-placeholder">
      <p><i class="fa fa-spinner fa-spin"></i> Lade Quiz-Fragen...</p>
    </div>`;

  const newPlaceholder = `<div class="quiz-loading-state" aria-label="Quiz wird geladen">
      <div class="quiz-skeleton-card"><div class="quiz-skeleton-line"></div></div>
      <div class="quiz-skeleton-card"><div class="quiz-skeleton-line"></div><div class="quiz-skeleton-line short"></div></div>
      <div class="quiz-skeleton-card"><div class="quiz-skeleton-line short"></div></div>
    </div>`;

  if (quizWidget.includes('quiz-loading-state')) {
    console.log('[UX-008] Quiz loading state already applied');
  } else if (quizWidget.includes(oldPlaceholder)) {
    quizWidget = quizWidget.replace(oldPlaceholder, newPlaceholder);
    fs.writeFileSync(QUIZ_WIDGET_FILE, quizWidget);
    console.log('[UX-008] Quiz widget placeholder updated with skeleton');
  } else {
    console.log('[UX-008] Quiz widget placeholder not found (may have been modified)');
  }

  console.log('[UX-008] ✓ Quiz loading state applied');
}

applyQuizLoading();
