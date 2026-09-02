/**
 * apply-search-keyboard.mjs — UX-004: Tastaturnavigation für Suche
 *
 * Erweitert search-init.js um:
 * - Pfeiltasten-Navigation (↑/↓) durch Suchergebnisse
 * - Enter zum Öffnen des markierten Ergebnisses
 * - Escape zum Schließen der Ergebnisse
 * - aria-activedescendant für Screenreader
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/search-init.js');

function applySearchKeyboard() {
  let src = fs.readFileSync(FILE, 'utf-8');

  if (src.includes('handleKeyboardNavigation')) {
    console.log('[UX-004] Keyboard navigation already present');
    return;
  }

  // Inject keyboard navigation module after the debounce definition
  const keyboardModule = `
    // UX-004: Tastaturnavigation durch Suchergebnisse
    var activeIndex = -1;

    function getVisibleResults() {
      return Array.prototype.slice.call(
        searchResults.querySelectorAll('.search-result-item')
      );
    }

    function setActive(index) {
      var items = getVisibleResults();
      if (!items.length) return;
      if (index >= items.length) index = items.length - 1;
      if (index < 0) index = items.length - 1;
      activeIndex = index;
      items.forEach(function (item, i) {
        item.classList.toggle('active', i === activeIndex);
        if (i === activeIndex) {
          item.setAttribute('aria-selected', 'true');
          searchInput.setAttribute('aria-activedescendant', item.id || '');
        } else {
          item.removeAttribute('aria-selected');
        }
      });
    }

    function handleKeyboardNavigation(e) {
      var items = getVisibleResults();
      if (!items.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActive(activeIndex + 1 >= items.length ? 0 : activeIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActive(activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1);
          break;
        case 'Enter':
          if (activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            var link = items[activeIndex].querySelector('a');
            if (link) link.click();
          }
          break;
        case 'Escape':
          hideResults();
          searchInput.blur();
          break;
      }
    }
`;

  // Insert after the debounce function definition
  const debounceEnd = src.indexOf('var debouncedSearch = debounce(performSearch, 300);');
  if (debounceEnd === -1) {
    console.log('[UX-004] Could not find insertion point');
    return;
  }
  src = src.slice(0, debounceEnd) + keyboardModule + '\n    ' + src.slice(debounceEnd);

  // Attach keydown listener to search input
  const initAnchor = "searchInput.addEventListener('input'";
  if (src.includes(initAnchor)) {
    src = src.replace(
      initAnchor,
      "searchInput.addEventListener('keydown', handleKeyboardNavigation);\n    " + initAnchor
    );
    console.log('[UX-004] keydown listener attached to search input');
  } else {
    console.log('[UX-004] WARNING: input listener anchor not found — check manually');
  }

  // Reset activeIndex when results are re-rendered (after displayResults)
  const hideFn = 'function hideResults()';
  if (src.includes(hideFn)) {
    src = src.replace(
      hideFn,
      'function resetActiveIndex() { activeIndex = -1; }\n\n    ' + hideFn
    );
  }

  fs.writeFileSync(FILE, src);
  console.log('[UX-004] ✓ Search keyboard navigation applied');
}

applySearchKeyboard();
