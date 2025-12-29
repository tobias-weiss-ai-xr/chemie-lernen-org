// Dark Mode Toggle Script
(function() {
  'use strict';

  const THEME_KEY = 'theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  // Check for saved theme preference or default to dark
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    // Default to dark mode
    return DARK_THEME;
  };

  // Set the theme
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
    if (preferredTheme === DARK_THEME) {
      document.documentElement.setAttribute('data-theme', DARK_THEME);
    }
    updateToggleIcon(preferredTheme === DARK_THEME);
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();

      // Add event listener to theme toggle button
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          toggleTheme();
        });
      }
    });
  } else {
    initTheme();

    // Add event listener to theme toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }
  }

  // Expose toggleTheme globally for inline onclick handlers
  window.toggleTheme = toggleTheme;
})();
