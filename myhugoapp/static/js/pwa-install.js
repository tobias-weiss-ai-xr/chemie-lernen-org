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

    banner.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;background:#fff;' +
      'box-shadow:0 -2px 12px rgba(0,0,0,0.12);z-index:10000;' +
      'transform:translateY(100%);transition:transform 0.3s ease;' +
      'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';

    var style = document.createElement('style');
    style.textContent =
      '#pwa-install-banner .pwa-install-content{' +
      'display:flex;align-items:center;gap:12px;padding:12px 16px;max-width:1200px;margin:0 auto;' +
      '}' +
      '#pwa-install-banner .pwa-install-icon{flex-shrink:0}' +
      '#pwa-install-banner .pwa-install-text{flex:1;display:flex;flex-direction:column;gap:2px}' +
      '#pwa-install-banner .pwa-install-text strong{color:#1a1a1a;font-size:14px}' +
      '#pwa-install-banner .pwa-install-text span{color:#666;font-size:12px}' +
      '#pwa-install-banner .pwa-install-btn{' +
      'background:#2d6a4f;color:#fff;border:none;padding:8px 16px;border-radius:6px;' +
      'cursor:pointer;font-size:13px;font-weight:500;white-space:nowrap}' +
      '#pwa-install-banner .pwa-install-btn:hover{background:#245a40}' +
      '#pwa-install-banner .pwa-install-close{' +
      'background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:4px 8px;' +
      'line-height:1}' +
      '#pwa-install-banner .pwa-install-close:hover{color:#333}' +
      '#pwa-install-banner.visible{transform:translateY(0)}' +
      '@media(max-width:600px){' +
      '#pwa-install-banner .pwa-install-content{padding:10px 12px;gap:8px}' +
      '#pwa-install-banner .pwa-install-text span{display:none}' +
      '}';

    document.head.appendChild(style);
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
