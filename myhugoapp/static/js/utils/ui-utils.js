/**
 * UI Utilities
 * Shared utility functions for calculator error display, number formatting,
 * color manipulation, and HTML escaping.
 *
 * Browser global: window.UIUtils
 * Node/test: module.exports
 */

function showError(message) {
  const errorEl = document.getElementById('error-message');
  const errorSection = document.getElementById('error-section');
  const resultsSection = document.getElementById('results-section');

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

  const dec = typeof decimals === 'number' ? decimals : 3;
  const opts = options || {};
  const lowerThreshold = opts.lowerThreshold !== undefined ? opts.lowerThreshold : 0.0001;
  const upperThreshold = opts.upperThreshold !== undefined ? opts.upperThreshold : 10000;
  const useScientific = opts.useScientific !== undefined ? opts.useScientific : true;

  if (
    useScientific &&
    value !== 0 &&
    (Math.abs(value) < lowerThreshold || Math.abs(value) >= upperThreshold)
  ) {
    return value.toExponential(dec - 1);
  }

  return value.toFixed(dec);
}

function darkenColor(color, percent) {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) {
    return color;
  }

  const r = Math.max(0, Math.min(255, parseInt(rgb[0], 10) - percent));
  const g = Math.max(0, Math.min(255, parseInt(rgb[1], 10) - percent));
  const b = Math.max(0, Math.min(255, parseInt(rgb[2], 10) - percent));

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

let _toastContainer = null;

function showToast(message, type) {
  if (typeof document === 'undefined') {
    return;
  }

  const toastType = type || 'info';
  const colors = {
    error: { bg: '#dc3545', border: '#bd2130' },
    warning: { bg: '#ffc107', border: '#d39e00' },
    success: { bg: '#28a745', border: '#1e7e34' },
    info: { bg: '#17a2b8', border: '#117a8b' },
  };

  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'toast-container';
    _toastContainer.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;max-width:400px;';
    document.body.appendChild(_toastContainer);
  }

  const palette = colors[toastType] || colors.info;
  const toast = document.createElement('div');
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
    showToast: showToast,
  };
}

if (typeof window !== 'undefined') {
  window.UIUtils = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml,
    showToast: showToast,
  };
}
