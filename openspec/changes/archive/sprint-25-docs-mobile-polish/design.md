## Docs & Mobile Polish Architecture

### Documentation Refresh

| Document                               | Current State                                         | Action                                                             |
| -------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| `docs/DEPLOYMENT.md`                   | References Neo4j 4.x, missing Docker Compose, Traefik | Full rewrite                                                       |
| `tests/README.md`                      | Missing                                               | Create: test structure, how to run Jest vs Playwright, fixtures    |
| `scripts/README.md`                    | Missing                                               | Create: each script's purpose, usage, dependencies                 |
| `myhugoapp/layouts/partials/README.md` | Missing                                               | Create: partial inventory, data dependencies, intended usage       |
| `static/js/calculators/README.md`      | Missing                                               | Create: calculator framework, shared utils, adding new calculators |
| `CONTRIBUTING.md`                      | Exists (from sprint-completion)                       | Verify up-to-date, add PWA/testing sections                        |

### PWA Offline Quiz Queue (Background Sync)

```
Service Worker flow:

1. User submits quiz offline
   → SW detects navigator.onLine === false
   → Store submission in IndexedDB: { id, quizId, answers, timestamp }
   → Register sync: navigator.serviceWorker.ready.then(r => r.sync.register('sync-quiz'))

2. Network restored
   → SW fires 'sync' event for 'sync-quiz'
   → Read pending submissions from IndexedDB
   → POST /api/quiz/:topicId/submit for each
   → On success: remove from IndexedDB, show notification
   → On failure: retry next sync event (backoff: 30s → 60s → 120s → max 3 tries)
```

### PWA Install Banner

```javascript
// In baseof.html or dedicated pwa-install.js
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner(); // "App installieren" banner at bottom of page
});
installButton.addEventListener('click', async () => {
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    hideInstallBanner();
    trackAnalytics();
  }
  deferredPrompt = null;
});
```

### Lighthouse Targets

| Page               | Performance | Accessibility | Best Practices | SEO |
| ------------------ | ----------- | ------------- | -------------- | --- |
| `/` (Home)         | ≥95         | ≥95           | ≥95            | 100 |
| `/themenbereiche/` | ≥90         | ≥95           | ≥95            | 100 |
| `/quiz/`           | ≥95         | ≥95           | ≥95            | 100 |
| `/app/assistent/`  | ≥90         | ≥95           | ≥95            | 100 |
| `/periodensystem/` | ≥85         | ≥90           | ≥95            | 95  |

### systemd Service Units

```
/etc/systemd/system/
├── chemie-hugo-server.service    # Hugo build + serve (or nginx)
├── chemie-chat-api.service       # Node Express chat API
├── chemie-neo4j.service          # Neo4j container (docker run)
└── chemie-traefik.service        # Traefik reverse proxy

scripts/install-systemd.sh:
  1. Copy unit files to /etc/systemd/system/
  2. systemctl daemon-reload
  3. systemctl enable --now chemie-traefik.service
  4. systemctl enable --now chemie-neo4j.service
  5. systemctl enable --now chemie-chat-api.service
  6. systemctl enable --now chemie-hugo-server.service
```
