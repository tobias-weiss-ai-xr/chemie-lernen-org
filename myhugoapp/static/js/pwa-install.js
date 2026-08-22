// chemie-lernen.org — PWA Install Banner
// Shows a native install prompt on supported browsers.
// Dismissed state persists in localStorage for 30 days.

(function () {
  'use strict';

  var DISMISS_KEY = 'pwa-install-dismissed';
  var DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  var deferredPrompt = null;

  function isDismissed() {
    try {
      var raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      return Date.now() - ts < DISMISS_DURATION;
    } catch {
      return false;
    }
  }

  function setDismissed() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable
    }
  }

  function createBanner() {
    var banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'App installieren');
    banner.innerHTML =
      '<div class="pwa-install-content">' +
      '<div class="pwa-install-icon">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M17 18H7V16H17V18ZM12 2L4 7V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V7L12 2Z" fill="#2d6a4f"/>' +
      '</svg>' +
      '</div>' +
      '<div class="pwa-install-text">' +
      '<strong>Chemie Lernen installieren</strong>' +
      '<span>Offline-Zugriff auf alle Themenbereiche und Rechner</span>' +
      '</div>' +
      '<button class="pwa-install-btn" type="button">Installieren</button>' +
      '<button class="pwa-install-close" type="button" aria-label="Schließen">&times;</button>' +
      '</div>';

    banner.style.display = 'block';
    document.body.appendChild(banner);

    var installBtn = banner.querySelector('.pwa-install-btn');
    var closeBtn = banner.querySelector('.pwa-install-close');

    installBtn.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          setDismissed();
          hideBanner();
          deferredPrompt = null;
        });
      }
    });

    closeBtn.addEventListener('click', function () {
      setDismissed();
      hideBanner();
    });

    // Show after a short delay
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('visible');
      });
    });

    return banner;
  }

  function hideBanner() {
    var banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(function () {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 300);
    }
  }

  // Listen for the browser's install prompt
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;

    if (!isDismissed() && !document.getElementById('pwa-install-banner')) {
      createBanner();
    }
  });

  // Clean up if app is already installed
  window.addEventListener('appinstalled', function () {
    hideBanner();
    deferredPrompt = null;
  });
})();
