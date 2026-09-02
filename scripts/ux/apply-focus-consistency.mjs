/**
 * apply-focus-consistency.mjs — UX-007: Fokus-Konsistenz
 *
 * Einheitliche Focus-Rings für alle interaktiven Elemente.
 * WCAG 2.4.7 Focus Visible + 2.4.11 Focus Not Obscured.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const CSS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

const FOCUS_CSS = `/* UX-007: Fokus-Konsistenz
 * Einheitliche Focus-Rings für Tastaturnavigation.
 * WCAG 2.4.7 (Focus Visible) + 2.4.11 (Focus Not Obscured).
 */
:focus-visible {
  outline: 3px solid var(--accent-color, #007bff);
  outline-offset: 2px;
  border-radius: 3px;
}

/* Remove default outline only when :focus-visible is supported */
:focus:not(:focus-visible) {
  outline: none;
}

/* Links */
a:focus-visible,
.navbar-nav > li > a:focus-visible,
.dropdown-menu > li > a:focus-visible,
.footer-link:focus-visible,
.card a:focus-visible {
  outline: 3px solid var(--accent-color, #007bff);
  outline-offset: 2px;
  border-radius: 3px;
  background-color: rgba(0, 123, 255, 0.08);
}

/* Buttons */
.btn:focus-visible,
.search-submit:focus-visible,
.search-clear:focus-visible,
.quiz-widget-controls .btn:focus-visible,
.quiz-answer-btn:focus-visible,
.quiz-option:focus-visible {
  outline: 3px solid var(--accent-color, #007bff);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.3);
}

/* Form inputs */
.form-control:focus-visible,
.search-input:focus-visible,
input[type='text']:focus-visible,
input[type='search']:focus-visible,
input[type='number']:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--accent-color, #007bff);
  outline-offset: 2px;
  border-color: var(--accent-color, #007bff);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

/* Theme switcher */
.theme-option input[type='radio']:focus-visible + .theme-option-text {
  outline: 3px solid var(--accent-color, #007bff);
  outline-offset: 2px;
  border-radius: 3px;
}

/* Tabs */
.nav-tabs > li > a:focus-visible,
.nav-pills > li > a:focus-visible {
  outline: 3px solid var(--accent-color, #007bff);
  outline-offset: 2px;
}

/* Dark theme */
[data-theme='dark'] :focus-visible {
  outline-color: var(--accent-color, #4caf50);
}
[data-theme='dark'] a:focus-visible,
[data-theme='dark'] .btn:focus-visible {
  background-color: rgba(76, 175, 80, 0.12);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

/* Contrast theme */
[data-theme='contrast'] :focus-visible {
  outline: 4px solid #ffeb3b;
  outline-offset: 2px;
}
[data-theme='contrast'] a:focus-visible,
[data-theme='contrast'] .btn:focus-visible {
  background-color: rgba(255, 235, 59, 0.15);
  box-shadow: 0 0 0 3px rgba(255, 235, 59, 0.4);
}

/* Ensure focus is not obscured by sticky headers */
html {
  scroll-padding-top: 80px;
}
`;

function applyFocusConsistency() {
  let existing = '';
  if (fs.existsSync(CSS_FILE)) {
    existing = fs.readFileSync(CSS_FILE, 'utf-8');
  }

  if (existing.includes('UX-007')) {
    console.log('[UX-007] Focus consistency already present');
    return;
  }

  fs.writeFileSync(CSS_FILE, existing + '\n' + FOCUS_CSS);
  console.log('[UX-007] ✓ Focus consistency CSS added');
}

applyFocusConsistency();
