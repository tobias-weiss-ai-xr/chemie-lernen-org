// Dark Mode Toggle Script - Fixed Version
(function () {
  'use strict';

  const THEME_KEY = 'chemie-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  // Check for saved theme preference or system preference
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK_THEME;
    }
    // Default to light mode
    return LIGHT_THEME;
  };

  // Apply theme immediately (before DOM ready to prevent flash)
  const applyTheme = (theme) => {
    if (theme === DARK_THEME) {
      document.documentElement.setAttribute('data-theme', DARK_THEME);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Set the theme
  const setTheme = (theme) => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleIcon(theme === DARK_THEME);
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
          toggleBtn.setAttribute('aria-label', 'Zu hell wechseln');
        } else {
          icon.classList.remove('fa-sun-o');
          icon.classList.add('fa-moon-o');
          toggleBtn.setAttribute('title', 'Zu dunkel wechseln');
          toggleBtn.setAttribute('aria-label', 'Zu dunkel wechseln');
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

  // Initialize theme
  const initTheme = () => {
    const preferredTheme = getPreferredTheme();
    applyTheme(preferredTheme);
    updateToggleIcon(preferredTheme === DARK_THEME);

    // Add event listener to theme toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }

    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't set a preference
        if (!localStorage.getItem(THEME_KEY)) {
          const newTheme = e.matches ? DARK_THEME : LIGHT_THEME;
          applyTheme(newTheme);
          updateToggleIcon(e.matches);
        }
      });
    }
  };

  // Apply theme immediately to prevent flash
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme(DARK_THEME);
  }

  // Wait for DOM to be ready for icon update
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Expose toggleTheme globally for inline onclick handlers
  window.toggleTheme = toggleTheme;
})();
