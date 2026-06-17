/**
 * UI Utilities
 * Shared utility functions for calculator error display, number formatting,
 * color manipulation, and HTML escaping.
 *
 * Browser global: window.UIUtils
 * Node/test: module.exports
 */

function showError(message) {
  var errorEl = document.getElementById('error-message');
  var errorSection = document.getElementById('error-section');
  var resultsSection = document.getElementById('results-section');

  if (errorEl) {
    errorEl.textContent = message;
  }
  if (errorSection) {
    errorSection.style.display = 'block';
  }
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }
}

function formatNumber(value, decimals, options) {
  if (value === null || value === undefined || isNaN(value)) {
    return String(value);
  }

  var dec = typeof decimals === 'number' ? decimals : 3;
  var opts = options || {};
  var lowerThreshold = opts.lowerThreshold !== undefined ? opts.lowerThreshold : 0.0001;
  var upperThreshold = opts.upperThreshold !== undefined ? opts.upperThreshold : 10000;
  var useScientific = opts.useScientific !== undefined ? opts.useScientific : true;

  if (useScientific && value !== 0 && (Math.abs(value) < lowerThreshold || Math.abs(value) >= upperThreshold)) {
    return value.toExponential(dec - 1);
  }

  return value.toFixed(dec);
}

function darkenColor(color, percent) {
  var rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) {
    return color;
  }

  var r = Math.max(0, Math.min(255, parseInt(rgb[0], 10) - percent));
  var g = Math.max(0, Math.min(255, parseInt(rgb[1], 10) - percent));
  var b = Math.max(0, Math.min(255, parseInt(rgb[2], 10) - percent));

  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml
  };
}

if (typeof window !== 'undefined') {
  window.UIUtils = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml
  };
}
