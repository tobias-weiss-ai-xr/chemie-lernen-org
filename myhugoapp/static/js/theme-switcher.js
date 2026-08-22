/*
 * theme-switcher.js — accessible 3-theme chooser (Hell / Dunkel / Kontrast).
 *
 * The actual data-theme attribute is set pre-paint by the inline FOUC script in
 * <head> (head.html), so this module only (a) persists the choice, (b) keeps the
 * radiogroup UI in sync, and (c) reacts to user changes. Default theme = 'dark'
 * to preserve the site's existing appearance for returning visitors.
 *
 * Themes:
 *   light    — warm paper light theme (custom.css :root / [data-theme='light'])
 *   dark     — existing greenish dark theme (dark-mode.css [data-theme='dark'])
 *   contrast — WCAG AAA high-contrast black/yellow (dark-mode.css [data-theme='contrast'])
 */
(function () {
  'use strict';

  var THEME_KEY = 'theme';
  var THEMES = ['light', 'dark', 'contrast'];
  var DEFAULT_THEME = 'dark';

  function isValid(theme) {
    return THEMES.indexOf(theme) !== -1;
  }

  function currentTheme() {
    var saved;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (_e) {
      saved = null;
    }
    return isValid(saved) ? saved : DEFAULT_THEME;
  }

  function applyTheme(theme) {
    if (!isValid(theme)) theme = DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_e) {
      /* storage may be unavailable (private mode) — non-fatal */
    }
  }

  function syncRadios(theme) {
    var radios = document.querySelectorAll('input[name="theme"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = radios[i].value === theme;
    }
  }

  function bindRadios() {
    var radios = document.querySelectorAll('input[name="theme"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function (e) {
        applyTheme(e.target.value);
        syncRadios(e.target.value);
      });
    }
  }

  function init() {
    var theme = currentTheme();
    applyTheme(theme);
    syncRadios(theme);
    bindRadios();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
