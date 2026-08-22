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

/**
 * Show a badge unlock toast notification
 * Creates a floating toast bottom-right with badge icon, name, and XP bonus
 * Auto-dismisses after 5 seconds. Triggers from gamification events.
 *
 * @param {Object} badge - { name, xpBonus, icon?, earnedAt? }
 */
function showBadgeToast(badge) {
  if (typeof document === 'undefined') return;
  if (!badge || !badge.name) return;

  var container = document.getElementById('badge-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'badge-toast-container';
    container.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:10001;' +
      'display:flex;flex-direction:column;gap:10px;max-width:380px;' +
      'pointer-events:none;';
    document.body.appendChild(container);
  }

  var toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.style.cssText =
    'display:flex;align-items:center;gap:14px;padding:14px 18px;' +
    'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);' +
    'color:#fff;border-radius:12px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,0.3);' +
    'border-left:4px solid #f1c40f;' +
    'transform:translateX(120%);opacity:0;' +
    'transition:transform 0.4s cubic-bezier(0.22,1,0.36,1),opacity 0.3s ease;' +
    'pointer-events:auto;cursor:pointer;';

  var iconChar = badge.icon || 'fa-star';
  var iconHtml = '<i class="fa ' + iconChar + '" style="font-size:1.4rem"></i>';
  var xpText = badge.xpBonus
    ? '<div class="badge-toast-xp" style="font-size:0.8rem;color:#f1c40f;font-weight:600;">+' +
      badge.xpBonus +
      ' XP</div>'
    : '';

  toast.innerHTML =
    '<div class="badge-toast-icon" style="font-size:2rem;flex-shrink:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(241,196,15,0.15);border-radius:50%;">' +
    iconHtml +
    '</div>' +
    '<div class="badge-toast-body" style="flex:1;min-width:0;">' +
    '<div class="badge-toast-title" style="font-size:0.95rem;font-weight:700;">' +
    '🎉 ' +
    escapeHtml(badge.name) +
    '</div>' +
    xpText +
    '</div>' +
    '<button class="badge-toast-close" style="font-size:1rem;color:rgba(255,255,255,0.5);flex-shrink:0;padding:4px;border:none;background:none;cursor:pointer;" aria-label="Schließen">&times;</button>';

  container.appendChild(toast);

  /* Slide in */
  requestAnimationFrame(function () {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  /* Click to dismiss */
  toast.addEventListener('click', function () {
    dismissBadgeToast(toast);
  });

  /* Close button stops propagation */
  var closeBtn = toast.querySelector('.badge-toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dismissBadgeToast(toast);
    });
  }

  /* Auto-dismiss after 5 seconds */
  var dismissTimer = setTimeout(function () {
    dismissBadgeToast(toast);
  }, 5000);

  toast._dismissTimer = dismissTimer;
}

function dismissBadgeToast(toast) {
  if (toast._dismissing) return;
  toast._dismissing = true;

  if (toast._dismissTimer) {
    clearTimeout(toast._dismissTimer);
  }

  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
  toast.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease';

  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

function initExerciseHints() {
  var headings = document.querySelectorAll('h2, h3');
  for (var h = 0; h < headings.length; h++) {
    var heading = headings[h];
    if (!heading.textContent.match(/Übung/i)) continue;

    var next = heading.nextElementSibling;
    while (next) {
      if (next.tagName === 'OL' || next.tagName === 'UL') {
        addHintButtonsToList(next);
        break;
      }
      next = next.nextElementSibling;
    }
  }
}

function addHintButtonsToList(list) {
  var items = list.querySelectorAll('li');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.querySelector('.hint-button')) continue;

    var btn = document.createElement('button');
    btn.className = 'hint-button';
    btn.textContent = 'Hinweis';
    btn.dataset.problem = item.textContent.trim();
    btn.dataset.topic = '';

    (function (button) {
      button.addEventListener('click', function () {
        var problem = button.dataset.problem;
        var topic = button.dataset.topic || '';
        var hintArea = button.nextElementSibling;

        if (!hintArea || !hintArea.classList.contains('hint-content')) {
          hintArea = document.createElement('div');
          hintArea.className = 'hint-content';
          button.parentNode.insertBefore(hintArea, button.nextSibling);
        }

        hintArea.innerHTML = '<p class="hint-loading">Hinweis wird generiert...</p>';
        button.disabled = true;

        fetch('/api/chat/hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem: problem, topic: topic }),
          credentials: 'same-origin',
        })
          .then(function (res) {
            if (!res.ok) throw new Error('Hint request failed');
            return res.json();
          })
          .then(function (data) {
            var hintText = data.hint || data.text || 'Kein Hinweis verfügbar.';
            hintArea.innerHTML =
              '<div class="hint-result">' + hintText.replace(/\n/g, '<br>') + '</div>';
          })
          .catch(function () {
            hintArea.innerHTML = '<p class="hint-error">Hinweis konnte nicht geladen werden.</p>';
          })
          .finally(function () {
            button.disabled = false;
          });
      });
    })(btn);

    item.appendChild(btn);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExerciseHints);
  } else {
    initExerciseHints();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml,
    showToast: showToast,
    showBadgeToast: showBadgeToast,
    initExerciseHints: initExerciseHints,
  };
}

if (typeof window !== 'undefined') {
  window.UIUtils = {
    showError: showError,
    formatNumber: formatNumber,
    darkenColor: darkenColor,
    escapeHtml: escapeHtml,
    showToast: showToast,
    showBadgeToast: showBadgeToast,
    initExerciseHints: initExerciseHints,
  };
}
