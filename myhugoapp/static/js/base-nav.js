/**
 * Vanilla JS Dropdown Implementation
 * Replaces jQuery-based dropdown behavior for better performance
 */
(function() {
  'use strict';

  // Initialize dropdowns when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeDropdowns();
  });

  function initializeDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(function(toggle) {
      // Add click handler
      toggle.addEventListener('click', function(e) {
        // Custom mobile behavior
        if (window.innerWidth < 768) {
          e.preventDefault();
          const parent = this.parentElement;

          // Close all other open dropdowns
          document.querySelectorAll('.dropdown.open').forEach(function(dropdown) {
            if (dropdown !== parent) {
              dropdown.classList.remove('open');
            }
          });

          // Toggle the current dropdown
          parent.classList.toggle('open');
        }
      });

      // Set up Bootstrap-like behavior for desktop
      if (window.innerWidth >= 768) {
        // Bootstrap dropdown behavior already handled by Bootstrap CSS/JS
        // No additional vanilla JS needed for desktop
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      // If click is outside all dropdowns
      const isOutsideDropdown = !e.target.closest('.dropdown');

      if (isOutsideDropdown) {
        document.querySelectorAll('.dropdown.open').forEach(function(dropdown) {
          dropdown.classList.remove('open');
        });
      }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
      // Clean up open dropdowns on significant resize
      if (window.innerWidth >= 768) {
        document.querySelectorAll('.dropdown.open').forEach(function(dropdown) {
          dropdown.classList.toggle('open', false);
        });
      }
    });
  }

})();