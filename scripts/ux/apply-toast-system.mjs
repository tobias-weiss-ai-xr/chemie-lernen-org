/**
 * apply-toast-system.mjs — UX-002: Toast-Notification-System
 *
 * Erstellt ein allgemeines Toast-System für Erfolg-/Fehler-/Info-Meldungen.
 * Ergänzt das bestehende Badge-Toast (Gamification) um ein generisches
 * Utility für alle dynamischen Feedback-Meldungen.
 *
 * Nutzung (Browser):
 *   window.UIToast.show('Gespeichert!', { type: 'success' });
 *   window.UIToast.show('Fehler beim Speichern', { type: 'error', duration: 8000 });
 *   window.UIToast.show('Hinweis', { type: 'info' });
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const JS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/js/utils/toast.js');
const CSS_FILE = path.join(REPO_ROOT, 'myhugoapp/static/css/ux-enhancements.css');
const BASEOF_FILE = path.join(REPO_ROOT, 'myhugoapp/layouts/_default/baseof.html');

const TOAST_JS = `/**
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
    info: 'fa-info-circle'
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
    success: function (msg, opts) { return show(msg, Object.assign({}, opts, { type: 'success' })); },
    error: function (msg, opts) { return show(msg, Object.assign({}, opts, { type: 'error', duration: 8000 })); },
    warning: function (msg, opts) { return show(msg, Object.assign({}, opts, { type: 'warning' })); },
    info: function (msg, opts) { return show(msg, Object.assign({}, opts, { type: 'info' })); }
  };
})();
`;

const TOAST_CSS = `/* UX-002: Toast-Notification-System */
.ux-toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 360px;
  pointer-events: none;
}

.ux-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background-color: #fff;
  color: #2c3e50;
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: auto;
}

.ux-toast.visible {
  opacity: 1;
  transform: translateX(0);
}

.ux-toast.dismissing {
  opacity: 0;
  transform: translateX(100%);
}

.ux-toast i {
  font-size: 1.2rem;
  margin-top: 2px;
}

.ux-toast-success i { color: #2e7d32; }
.ux-toast-error i { color: #c62828; }
.ux-toast-warning i { color: #f57c00; }
.ux-toast-info i { color: #1565c0; }

.ux-toast-success { border-left: 4px solid #2e7d32; }
.ux-toast-error { border-left: 4px solid #c62828; }
.ux-toast-warning { border-left: 4px solid #f57c00; }
.ux-toast-info { border-left: 4px solid #1565c0; }

.ux-toast-body {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.4;
}

.ux-toast-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  color: #999;
  padding: 0 2px;
}
.ux-toast-close:hover { color: #333; }

/* Dark theme */
[data-theme='dark'] .ux-toast {
  background-color: var(--bg-tertiary, #123d25);
  color: var(--text-primary, #c8e6c9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
[data-theme='dark'] .ux-toast-close { color: var(--text-muted, #81c784); }
[data-theme='dark'] .ux-toast-close:hover { color: var(--text-primary, #c8e6c9); }

/* Contrast theme */
[data-theme='contrast'] .ux-toast {
  background-color: #000;
  color: #fff;
  border: 2px solid #ffeb3b;
}

/* Mobile: full-width toast at bottom */
@media (max-width: 640px) {
  .ux-toast-container {
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-width: none;
  }
  .ux-toast {
    transform: translateY(100%);
  }
  .ux-toast.visible {
    transform: translateY(0);
  }
  .ux-toast.dismissing {
    transform: translateY(100%);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ux-toast {
    transition: opacity 0.01ms;
    transform: none;
  }
}
`;

function applyToastSystem() {
  // 1. Write toast.js
  if (fs.existsSync(JS_FILE)) {
    console.log('[UX-002] toast.js already exists');
  } else {
    fs.writeFileSync(JS_FILE, TOAST_JS);
    console.log('[UX-002] toast.js created');
  }

  // 2. Add CSS
  let css = '';
  if (fs.existsSync(CSS_FILE)) {
    css = fs.readFileSync(CSS_FILE, 'utf-8');
  }
  if (css.includes('UX-002')) {
    console.log('[UX-002] Toast CSS already present');
  } else {
    fs.writeFileSync(CSS_FILE, css + '\n' + TOAST_CSS);
    console.log('[UX-002] Toast CSS added');
  }

  // 3. Load toast.js in baseof.html (after ui-utils.js)
  let baseof = fs.readFileSync(BASEOF_FILE, 'utf-8');
  if (baseof.includes('utils/toast.js')) {
    console.log('[UX-002] toast.js already loaded in baseof.html');
  } else {
    const anchor = '<script defer src="/js/utils/ui-utils.js"></script>';
    if (baseof.includes(anchor)) {
      baseof = baseof.replace(
        anchor,
        anchor + '\n  <!-- UX-002: Toast notification system -->\n  <script defer src="/js/utils/toast.js"></script>'
      );
      fs.writeFileSync(BASEOF_FILE, baseof);
      console.log('[UX-002] toast.js wired into baseof.html');
    } else {
      console.log('[UX-002] WARNING: ui-utils.js anchor not found in baseof.html');
    }
  }

  console.log('[UX-002] ✓ Toast system applied');
}

applyToastSystem();
