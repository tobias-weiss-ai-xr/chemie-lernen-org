// PWA Service Worker Registration + Update Prompt
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js')
        .then(function (registration) {
          console.log('[PWA] SW registered');

          // Check for updates on each page load
          registration.update();

          // Detect waiting service worker (new version)
          if (registration.waiting) {
            showUpdatePrompt(registration);
          }

          // Listen for new installing workers
          registration.addEventListener('updatefound', function () {
            var newWorker = registration.installing;
            newWorker.addEventListener('statechange', function () {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdatePrompt(registration);
              }
            });
          });
        })
        .catch(function (err) {
          console.log('[PWA] SW registration failed:', err);
        });

      // Listen for SW postMessage (version info)
      navigator.serviceWorker.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('[PWA] SW updated to', event.data.version);
        }
      });
    });

    function showUpdatePrompt(registration) {
      // Dispatch custom event for the update banner component
      var evt = new CustomEvent('pwa-update-ready', {
        detail: {
          registration: registration,
          message: 'Neue Version verfügbar — Seite aktualisieren?',
        },
      });
      document.dispatchEvent(evt);
    }
  }
})();
