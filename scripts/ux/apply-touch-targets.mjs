/**
 * apply-touch-targets.mjs — UX-006: Touch-Targets für Mobile
 *
 * Stellt sicher, dass alle interaktiven Elemente mindestens 44x44px
 * Touch-Target haben (WCAG 2.5.5 Target Size).
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const CSS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');

const TOUCH_CSS = `/* UX-006: Touch-Targets für Mobile (WCAG 2.5.5)
 * Mindestgröße 44x44px für alle interaktiven Elemente auf Touch-Geräten.
 */
@media (max-width: 768px) {
  /* Buttons */
  .btn,
  .search-submit,
  .search-clear,
  .quiz-widget-controls .btn,
  .theme-option input[type='radio'] {
    min-height: 44px;
    min-width: 44px;
  }

  /* Nav links */
  .navbar-nav > li > a,
  .dropdown-menu > li > a {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  /* Theme switcher radios */
  .theme-option {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }

  /* Form inputs */
  .form-control,
  .search-input,
  input[type='text'],
  input[type='search'],
  input[type='number'],
  select,
  textarea {
    min-height: 44px;
  }

  /* Card links */
  #card-grid .card .index-anchor,
  .card a {
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  /* Footer links */
  .footer-link,
  .footer-legal-links a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 8px 4px;
  }

  /* Quiz answer buttons */
  .quiz-answer-btn,
  .quiz-option {
    min-height: 44px;
    padding: 12px 16px;
  }

  /* Tab navigation */
  .nav-tabs > li > a,
  .nav-pills > li > a {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 10px 15px;
  }
}
`;

function applyTouchTargets() {
  let existing = '';
  if (fs.existsSync(CSS_FILE)) {
    existing = fs.readFileSync(CSS_FILE, 'utf-8');
  }

  if (existing.includes('UX-006')) {
    console.log('[UX-006] Touch targets already present');
    return;
  }

  fs.writeFileSync(CSS_FILE, existing + '\n' + TOUCH_CSS);
  console.log('[UX-006] ✓ Touch targets CSS added');
}

applyTouchTargets();
