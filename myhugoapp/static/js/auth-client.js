// ============================================================
// auth-client.js — Client-side auth helpers for Lehrenden-Premium
// Browser global (sourceType: 'script'), loaded via <script> tag
// ============================================================
(function () {
  'use strict';

  var AUTH_API = '/api/auth';

  // ══ Utility ══════════════════════════════════════════════════
  function apiUrl(path) {
    return AUTH_API + path;
  }

  function apiFetch(method, path, body) {
    return fetch(apiUrl(path), {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) {
          var err = new Error(data.error || 'Anfrage fehlgeschlagen');
          err.status = r.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  // ══ Public API ══════════════════════════════════════════════
  window.AuthClient = {
    /** Register a new user */
    register: function (email, password, name) {
      return apiFetch('POST', '/register', { email: email, password: password, name: name || '' });
    },

    /** Login */
    login: function (email, password) {
      return apiFetch('POST', '/login', { email: email, password: password });
    },

    /** Logout */
    logout: function () {
      return apiFetch('POST', '/logout').then(function () {
        window.location.href = '/';
      });
    },

    /** Get current user (null if not logged in) */
    me: function () {
      return apiFetch('GET', '/me')
        .then(function (data) {
          return data.user || null;
        })
        .catch(function () {
          return null;
        });
    },

    /** Upgrade current user to premium */
    upgrade: function () {
      return apiFetch('POST', '/upgrade');
    },

    /** Check if user is logged in and return their info */
    getUser: function () {
      return apiFetch('GET', '/me')
        .then(function (data) {
          return data.user || null;
        })
        .catch(function () {
          return null;
        });
    },
  };

  // ══ Auto-init: add auth UI to header ═══════════════════════
  function addAuthUI(user) {
    var nav = document.querySelector('.navbar-nav');
    if (!nav) return;

    // Remove existing auth items
    var existing = nav.querySelector('.auth-menu-item');
    if (existing) existing.remove();

    var li = document.createElement('li');
    li.className = 'auth-menu-item dropdown';

    if (user) {
      // Logged in — show user email + dropdown
      var tierLabel = user.isPremium ? '\u2B50 Premium' : '\uD83D\uDC4A Kostenlos';
      li.innerHTML =
        '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">' +
        '<span class="auth-email">' +
        escapeHtml(user.email) +
        '</span> ' +
        '<span class="auth-tier-label">' +
        tierLabel +
        '</span> ' +
        '<span class="caret"></span>' +
        '</a>' +
        '<ul class="dropdown-menu" role="menu">' +
        (!user.isPremium
          ? '<li><a href="/premium/" class="auth-upgrade-link">\u2B50 Zu Premium upgraden</a></li>'
          : '') +
        '<li><a href="#" id="auth-logout-link">Abmelden</a></li>' +
        '</ul>';
      li.querySelector('#auth-logout-link').addEventListener('click', function (e) {
        e.preventDefault();
        window.AuthClient.logout();
      });
    } else {
      // Not logged in — show login/register links
      li.innerHTML =
        '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" aria-label="Anmelden">' +
        '<i class="fa fa-user" aria-hidden="true"></i> Anmelden <span class="caret"></span>' +
        '</a>' +
        '<ul class="dropdown-menu" role="menu">' +
        '<li><a href="/login/">Anmelden</a></li>' +
        '<li><a href="/register/">Registrieren</a></li>' +
        '</ul>';
    }

    nav.appendChild(li);
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    window.AuthClient.getUser().then(function (user) {
      if (user) {
        addAuthUI(user);
      } else {
        addAuthUI(null);
      }
    });
    // Also try again in 100ms (for dynamic nav loading)
    setTimeout(function () {
      window.AuthClient.getUser().then(function (user) {
        addAuthUI(user);
      });
    }, 200);
  }
})();
