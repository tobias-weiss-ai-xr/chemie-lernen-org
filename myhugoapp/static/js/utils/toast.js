/**
 * toast.js — General-purpose toast notification system
 *
 * Usage:
 *   window.UIToast.show('Gespeichert!', { type: 'success' });
 *   window.UIToast.show('Fehler', { type: 'error', duration: 8000 });
 *   window.UIToast.show('Info', { type: 'info' });
 *
 * Types: success | error | info | warning
 */
(function () {
  'use strict';

  var CONTAINER_ID = 'ux-toast-container';
  var DEFAULT_DURATION = 5000;
  var MAX_TOASTS = 3;

  var ICONS = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  function getContainer() {
    var el = document.getElementById(CONTAINER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.className = 'ux-toast-container';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }

  function show(message, opts) {
    opts = opts || {};
    var type = opts.type || 'info';
    var duration = typeof opts.duration === 'number' ? opts.duration : DEFAULT_DURATION;

    var container = getContainer();

    // Limit concurrent toasts
    while (container.children.length >= MAX_TOASTS) {
      container.removeChild(container.firstChild);
    }

    var toast = document.createElement('div');
    toast.className = 'ux-toast ux-toast-' + type;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    var icon = document.createElement('i');
    icon.className = 'fa ' + (ICONS[type] || ICONS.info);
    icon.setAttribute('aria-hidden', 'true');

    var body = document.createElement('div');
    body.className = 'ux-toast-body';
    body.textContent = message; // textContent — XSS-safe

    var close = document.createElement('button');
    close.className = 'ux-toast-close';
    close.setAttribute('aria-label', 'Meldung schließen');
    close.innerHTML = '&times;';
    close.addEventListener('click', function () {
      dismiss(toast);
    });

    toast.appendChild(icon);
    toast.appendChild(body);
    toast.appendChild(close);
    container.appendChild(toast);

    // Trigger slide-in animation
    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(function () {
        dismiss(toast);
      }, duration);
    }

    return toast;
  }

  function dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('dismissing');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // Public API
  window.UIToast = {
    show: show,
    success: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: 'success' }));
    },
    error: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: 'error', duration: 8000 }));
    },
    warning: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: 'warning' }));
    },
    info: function (msg, opts) {
      return show(msg, Object.assign({}, opts, { type: 'info' }));
    },
  };
})();
