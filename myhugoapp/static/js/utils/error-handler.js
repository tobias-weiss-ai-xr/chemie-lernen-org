/**
 * Global Error Handler
 * Catches uncaught JS errors and shows a user-friendly hint.
 * Errors are logged to console for debugging.
 */
(function () {
  'use strict';

  const ERROR_STORAGE_KEY = 'chemie_errors';

  function getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  function storeError(err) {
    try {
      var errors = getStoredErrors();
      errors.push({
        msg: err.message || String(err),
        url: err.filename || window.location.href,
        line: err.lineno,
        col: err.colno,
        stack: (err.error && err.error.stack) || null,
        time: new Date().toISOString(),
        page: window.location.pathname
      });
      // Keep last 50 errors
      if (errors.length > 50) errors = errors.slice(-50);
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
    } catch (_) { /* localStorage full — ignore */ }
  }

  function showErrorBanner(msg) {
    var banner = document.createElement('div');
    banner.id = 'error-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#e74c3c;color:#fff;padding:10px 20px;font-size:14px;z-index:9999;text-align:center;font-family:sans-serif;';
    banner.innerHTML = 'Ein unerwarteter Fehler ist aufgetreten. '
      + '<button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.3);color:#fff;border:1px solid rgba(255,255,255,0.5);border-radius:4px;padding:4px 12px;margin-left:12px;cursor:pointer;">Schließen</button>';
    // Don't show banner for script loading errors on missing resources
    if (msg && msg.indexOf('Script error') !== -1) return;
    if (msg && msg.indexOf('Not allowed to load local resource') !== -1) return;
    // Only show banner for runtime errors from our own scripts
    if (msg && msg.indexOf('load') === -1 && msg.indexOf('network') === -1) {
      document.body.appendChild(banner);
      setTimeout(function () { if (banner.parentNode) banner.remove(); }, 10000);
    }
  }

  // Capture global errors
  window.addEventListener('error', function (e) {
    storeError({
      message: e.message || 'Unknown error',
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      error: e.error || null
    });
    showErrorBanner(e.message);
    return false; // Let default handler run too
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function (e) {
    var msg = e.reason && e.reason.message ? e.reason.message : String(e.reason || 'Unknown Promise rejection');
    storeError({ message: 'Promise: ' + msg, filename: window.location.href, lineno: 0, colno: 0, error: e.reason || null });
    showErrorBanner(msg);
  });

  // Expose stored errors for debug overlay
  window.__chemieErrors = {
    getAll: getStoredErrors,
    clear: function () { try { localStorage.removeItem(ERROR_STORAGE_KEY); } catch (_) {} }
  };

})();
