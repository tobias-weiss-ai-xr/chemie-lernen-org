/**
 * apply-skeleton-shimmer.mjs — UX-001: Skeleton-Shimmer-Animation
 *
 * Fügt eine Shimmer-Animation zu allen Skeleton-Loadern hinzu.
 * Betrifft: curricula-index, curricula-state, entity-index, modulhandbuch.
 *
 * Erstellt myhugoapp/static/css/ux-enhancements.css ( falls nicht vorhanden )
 * und erweitert baseof.html um das Stylesheet.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const CSS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');
// UX CSS gehört ins <head> — der steht im head.html-Partial, nicht in baseof.html
const HEAD_FILE = path.join(REPO_ROOT, 'myhugoapp/layouts/partials/head.html');

const SHIMMER_CSS = `/* ==== UX Enhancements — applied by TaskFleet ==== */

/* UX-001: Skeleton-Shimmer-Animation
 * Fügt allen Skeleton-Loadern eine Shimmer-Animation hinzu.
 * WCAG 2.2.2: Animation kann via prefers-reduced-motion deaktiviert werden.
 */
@keyframes ux-skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.curricula-skeleton-card,
.entity-skeleton-card,
.quiz-skeleton-card,
.ux-skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface, #efede6) 25%,
    var(--bg-primary, #f4f2ec) 50%,
    var(--bg-surface, #efede6) 75%
  ) !important;
  background-size: 200% 100% !important;
  animation: ux-skeleton-shimmer 1.5s ease-in-out infinite !important;
  border-radius: 8px;
}

/* Dark theme skeleton */
[data-theme='dark'] .curricula-skeleton-card,
[data-theme='dark'] .entity-skeleton-card,
[data-theme='dark'] .quiz-skeleton-card,
[data-theme='dark'] .ux-skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary, #0d2a1a) 25%,
    var(--bg-tertiary, #123d25) 50%,
    var(--bg-secondary, #0d2a1a) 75%
  ) !important;
  background-size: 200% 100% !important;
}

/* Contrast theme skeleton */
[data-theme='contrast'] .curricula-skeleton-card,
[data-theme='contrast'] .entity-skeleton-card,
[data-theme='contrast'] .quiz-skeleton-card,
[data-theme='contrast'] .ux-skeleton {
  background: linear-gradient(
    90deg,
    #1a1a1a 25%,
    #333 50%,
    #1a1a1a 75%
  ) !important;
  background-size: 200% 100% !important;
}

/* Reduced motion: disable shimmer */
@media (prefers-reduced-motion: reduce) {
  .curricula-skeleton-card,
  .entity-skeleton-card,
  .quiz-skeleton-card,
  .ux-skeleton {
    animation: none !important;
  }
}
`;

function applySkeletonShimmer() {
  // 1. Write CSS file (create or append)
  let existing = '';
  if (fs.existsSync(CSS_FILE)) {
    existing = fs.readFileSync(CSS_FILE, 'utf-8');
  }

  if (existing.includes('ux-skeleton-shimmer')) {
    console.log('[UX-001] Skeleton shimmer already present in ux-enhancements.css');
  } else {
    fs.writeFileSync(CSS_FILE, SHIMMER_CSS + '\n' + existing);
    console.log('[UX-001] Skeleton shimmer CSS added to ux-enhancements.css');
  }

  // 2. Add stylesheet to head.html (after a11y-reduced-motion.css)
  let head = fs.readFileSync(HEAD_FILE, 'utf-8');
  const LINK_TAG = '<link rel="stylesheet" href="{{ "/css/ux-enhancements.css" | relURL }}">';

  if (head.includes('ux-enhancements.css')) {
    console.log('[UX-001] ux-enhancements.css already linked in head.html');
  } else {
    const anchor = '<link rel="stylesheet" href="{{ "/css/a11y-reduced-motion.css" | relURL }}">';
    if (head.includes(anchor)) {
      head = head.replace(
        anchor,
        anchor + '\n<!-- UX Enhancements: Skeleton-Shimmer, Toast, Touch-Targets, Focus-Rings (TaskFleet UX-001/002/006/007) -->\n' + LINK_TAG
      );
      fs.writeFileSync(HEAD_FILE, head);
      console.log('[UX-001] ux-enhancements.css linked in head.html');
    } else {
      throw new Error('[UX-001] anchor (a11y-reduced-motion.css link) not found in head.html — insert CSS link manually');
    }
  }

  console.log('[UX-001] ✓ Skeleton shimmer applied');
}

applySkeletonShimmer();
