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

var _toastContainer = null;

function showToast(message, type) {
  if (typeof document === 'undefined') {
    return;
  }

  var toastType = type || 'info';
  var colors = {
    error: { bg: '#dc3545', border: '#bd2130' },
    warning: { bg: '#ffc107', border: '#d39e00' },
    success: { bg: '#28a745', border: '#1e7e34' },
    info: { bg: '#17a2b8', border: '#117a8b' }
  };

  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'toast-container';
    _toastContainer.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;max-width:400px;';
    document.body.appendChild(_toastContainer);
  }

  var palette = colors[toastType] || colors.info;
  var toast = document.createElement('div');
  toast.style.cssText =
    'padding:12px 20px;border-radius:8px;color:#fff;font-size:14px;font-family:sans-serif;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateX(100%);' +
    'transition:opacity 0.3s,transform 0.3s;background:' +
    palette.bg +
    ';border-left:4px solid ' +
    palette.border +
    ';';
  toast.textContent = message;
  _toastContainer.appendChild(toast);

  requestAnimationFrame(function () {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml,
    showToast: showToast
  };
}

if (typeof window !== 'undefined') {
  window.UIUtils = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml,
    showToast: showToast
  };
}
