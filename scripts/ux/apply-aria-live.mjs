/**
 * apply-aria-live.mjs — UX-005: ARIA-Live-Regions für dynamische Inhalte
 *
 * Fügt aria-live="polite" zu dynamischen Content-Containern hinzu,
 * damit Screenreader Änderungen ansagen.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

const FIXES = [
  {
    file: 'myhugoapp/layouts/_default/curricula-index.html',
    subs: [
      {
        // Grid-Container für dynamische Karten
        from: '<div id="curricula-grid" class="curricula-grid" aria-label="Bundesländer-Lehrpläne">',
        to: '<div id="curricula-grid" class="curricula-grid" aria-label="Bundesländer-Lehrpläne" aria-live="polite" aria-relevant="additions removals">',
      },
    ],
  },
  {
    file: 'myhugoapp/layouts/_default/curricula-state.html',
    subs: [
      {
        from: 'id="curricula-state-app"',
        to: 'id="curricula-state-app" aria-live="polite"',
      },
    ],
  },
  {
    file: 'myhugoapp/layouts/_default/modulhandbuch-index.html',
    subs: [
      {
        from: '<div id="mh-app">',
        to: '<div id="mh-app" aria-live="polite">',
      },
    ],
  },
];

// JS-rendered containers: ensure aria-live on elements that innerHTML is written to
const JS_FIXES = [
  {
    file: 'myhugoapp/static/js/search-init.js',
    // searchResults container is in header.html — patch layout instead
    skip: true,
  },
  {
    file: 'myhugoapp/layouts/partials/header.html',
    subs: [
      {
        from: '<div id="search-results" class="search-results hidden"></div>',
        to: '<div id="search-results" class="search-results hidden" role="region" aria-live="polite" aria-label="Suchergebnisse"></div>',
      },
    ],
  },
];

function applyFix({ file, subs, skip }) {
  if (skip) return;
  const fullPath = path.join(REPO_ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`[UX-005] ${file}: not found, skipped`);
    return;
  }
  let src = fs.readFileSync(fullPath, 'utf-8');
  let changed = false;
  for (const { from, to } of subs) {
    if (src.includes(to)) {
      console.log(`[UX-005] ${file}: already has aria-live for "${from}"`);
      continue;
    }
    if (src.includes(from)) {
      src = src.replace(from, to);
      changed = true;
      console.log(`[UX-005] ${file}: aria-live added to "${from}"`);
    } else {
      console.log(`[UX-005] ${file}: pattern "${from}" not found`);
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, src);
  }
}

FIXES.forEach(applyFix);
JS_FIXES.forEach(applyFix);
console.log('[UX-005] ✓ ARIA live regions applied');
