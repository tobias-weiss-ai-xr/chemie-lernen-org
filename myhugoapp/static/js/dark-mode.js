(function () {
  'use strict';

  const THEME_KEY = 'theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  window.addEventListener('error', function (e) {
    console.error('Dark mode script error:', e.message);
  });

  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    return DARK_THEME;
  };

  const setTheme = (theme) => {
    if (theme === DARK_THEME) {
      document.documentElement.setAttribute('data-theme', DARK_THEME);
      localStorage.setItem(THEME_KEY, DARK_THEME);
      updateToggleIcon(true);
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, LIGHT_THEME);
      updateToggleIcon(false);
    }
  };

  const updateToggleIcon = (isDark) => {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        if (isDark) {
          icon.classList.remove('fa-moon-o');
          icon.classList.add('fa-sun-o');
          toggleBtn.setAttribute('title', 'Zu hell wechseln');
        } else {
          icon.classList.remove('fa-sun-o');
          icon.classList.add('fa-moon-o');
          toggleBtn.setAttribute('title', 'Zu dunkel wechseln');
        }
      }
    }
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(newTheme);
  };

  const initTheme = () => {
    const preferredTheme = getPreferredTheme();
    if (preferredTheme === DARK_THEME) {
      document.documentElement.setAttribute('data-theme', DARK_THEME);
    }
    updateToggleIcon(preferredTheme === DARK_THEME);
  };

  const setupThemeToggle = () => {
    initTheme();

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toggleTheme();
        },
        { capture: true }
      );
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    setupThemeToggle();
  }

  window.toggleTheme = toggleTheme;
})();
