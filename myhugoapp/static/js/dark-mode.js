// Dark Mode Toggle Script
(function () {
  'use strict';

  console.log('Dark mode script starting...');

  const THEME_KEY = 'theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  // Error handler
  window.addEventListener('error', function (e) {
    console.error('Dark mode script error:', e.message);
  });

  // Check for saved theme preference or default to dark
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    // Default to dark mode
    return DARK_THEME;
  };

  // Set theme
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

  // Update toggle button icon
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

  // Toggle theme
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(newTheme);
  };

  // Initialize theme on page load
  const initTheme = () => {
    const preferredTheme = getPreferredTheme();
    console.log('initTheme called, preferredTheme:', preferredTheme);
    if (preferredTheme === DARK_THEME) {
      document.documentElement.setAttribute('data-theme', DARK_THEME);
    }
    updateToggleIcon(preferredTheme === DARK_THEME);
  };

  // Wait for DOM to be ready
  const setupThemeToggle = () => {
    console.log('setupThemeToggle called');
    initTheme();

    const toggleBtn = document.getElementById('theme-toggle');
    console.log('toggleBtn element:', toggleBtn);
    if (toggleBtn) {
      toggleBtn.addEventListener(
        'click',
        (e) => {
          console.log('Button clicked!');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toggleTheme();
          console.log('Theme toggled:', document.documentElement.getAttribute('data-theme'));
        },
        { capture: true }
      );
      console.log('Dark mode event listener attached');
    } else {
      console.warn('Theme toggle button not found');
    }
  };

  console.log('document.readyState:', document.readyState);
  if (document.readyState === 'loading') {
    console.log('Waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    console.log('Calling setupThemeToggle immediately');
    setupThemeToggle();
  }

  // Expose toggleTheme globally for inline onclick handlers
  window.toggleTheme = toggleTheme;
  console.log('Dark mode script loaded');
})();
