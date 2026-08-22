/**
 * Offline Calculator Page - Client-side logic
 * Handles connection retry and PWA installation
 */

(function () {
  'use strict';

  // Check online status and retry
  function checkOnlineStatus() {
    if (navigator.onLine) {
      window.location.reload();
    }
  }

  // Retry button
  var retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      checkOnlineStatus();
    });
  }

  // Auto-reload when back online
  window.addEventListener('online', function () {
    setTimeout(function () {
      window.location.reload();
    }, 1000);
  });

  // PWA Install button
  var installBtn = document.getElementById('install-pwa-btn');
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-block';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
          }
          deferredPrompt = null;
        });
      } else {
        // Already installed or not supported
        alert('Die PWA ist bereits installiert oder wird von diesem Browser nicht unterstützt.');
      }
    });
  }

  // Listen for PWA install success
  window.addEventListener('appinstalled', function () {
    console.log('PWA installed successfully');
    deferredPrompt = null;
  });

  // Initial online check
  if (navigator.onLine) {
    setTimeout(function () {
      window.location.reload();
    }, 2000);
  }
})();
