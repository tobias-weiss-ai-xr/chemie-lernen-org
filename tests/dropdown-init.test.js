/**
 * Tests for dropdown-init.js — Dropdown menu initialization.
 * Script-mode that registers a DOMContentLoaded handler for
 * touch-friendly dropdown toggling on narrow viewports.
 */

const fs = require('fs');
const path = require('path');

const MODULE_PATH = path.resolve(__dirname, '..', 'myhugoapp', 'static', 'js', 'dropdown-init.js');

/**
 * Evaluate the module's handler function directly, bypassing
 * the DOMContentLoaded wrapper. This avoids stale listener accumulation
 * across tests (each eval would add a new listener, then multiple
 * listeners would fire on dispatch, each appending a click handler
 * to the navbar).
 */
function loadModule() {
  const src = fs.readFileSync(MODULE_PATH, 'utf8');
  const match = src.match(
    /document\.addEventListener\('DOMContentLoaded',\s*function\s*\(\)\s*\{([\s\S]*)\}\);?\s*$/
  );
  if (match) {
    window.eval('(function() {' + match[1] + '})();');
  }
}

describe('dropdown-init — DOMContentLoaded handler', () => {
  let originalInnerWidth;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    document.body.innerHTML = '';
    window.innerWidth = 375;
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
  });

  function createNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    navbar.innerHTML = `
      <ul class="nav navbar-nav">
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown">Themen</a>
          <ul class="dropdown-menu">
            <li><a href="#">Säuren</a></li>
            <li class="dropdown-submenu">
              <a href="#">Unterthema</a>
              <ul class="dropdown-menu">
                <li><a href="#">Details</a></li>
              </ul>
            </li>
          </ul>
        </li>
        <li><a href="#">Hilfe</a></li>
      </ul>
    `;
    document.body.appendChild(navbar);
    return navbar;
  }

  describe('mobile viewport (< 768px)', () => {
    test('toggles .open class on dropdown-toggle click', () => {
      createNavbar();
      loadModule();
      const toggle = document.querySelector('.dropdown-toggle');
      const parent = toggle.parentElement;

      expect(parent.classList.contains('open')).toBe(false);
      toggle.click();
      expect(parent.classList.contains('open')).toBe(true);
      toggle.click();
      expect(parent.classList.contains('open')).toBe(false);
    });

    test('toggles .open on dropdown-submenu > a click', () => {
      createNavbar();
      loadModule();
      const subLink = document.querySelector('.dropdown-submenu > a');
      const parent = subLink.parentElement;

      expect(parent.classList.contains('open')).toBe(false);
      subLink.click();
      expect(parent.classList.contains('open')).toBe(true);
    });

    test('does nothing on a regular li click', () => {
      const navbar = createNavbar();
      loadModule();
      const regularLink = navbar.querySelector('li:not(.dropdown):not(.dropdown-submenu) a');

      expect(() => regularLink.click()).not.toThrow();
    });

    test('prevents default on dropdown-toggle click', () => {
      createNavbar();
      loadModule();
      const toggle = document.querySelector('.dropdown-toggle');
      const event = new MouseEvent('click', { cancelable: true, bubbles: true });
      toggle.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('desktop viewport (>= 768px)', () => {
    test('does not toggle .open on dropdown-toggle click', () => {
      window.innerWidth = 1024;
      const navbar = document.createElement('nav');
      navbar.className = 'navbar';
      navbar.innerHTML = `
        <ul class="nav navbar-nav">
          <li class="dropdown">
            <a href="#" class="dropdown-toggle">Themen</a>
          </li>
        </ul>
      `;
      document.body.appendChild(navbar);
      loadModule();

      const toggle = document.querySelector('.dropdown-toggle');
      const parent = toggle.parentElement;
      toggle.click();
      expect(parent.classList.contains('open')).toBe(false);
    });
  });

  describe('no navbar element', () => {
    test('does not throw when navbar is absent', () => {
      expect(() => loadModule()).not.toThrow();
    });
  });
});
