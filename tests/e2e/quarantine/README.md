# E2E-Quarantäne — Specs für Features, die (noch) nicht live sind

Diese Specs laufen standardmäßig **nicht** mit (`playwright.config.mjs`:
`testIgnore: ['**/quarantine/**']`).

**Warum hier?** Der TDD-Workflow hat Specs VOR den Features geschrieben
(test-first). Einige Features wurden nie gebaut oder deployed — die Specs
failen daher dauerhaft gegen Production (Audit 2026-09-08: 125 failed /
420). Das sind **keine App-Bugs**, sondern Specs für nicht-existente
Features. Sie blockieren hier das Signal der gesunden Suite nicht.

| Spec                                | Grund                                                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `interactive-experiments.spec.js`   | `.molar-mass-visualizer`, pH-Visualizer-Indicators etc. existieren nicht auf Production (`curl`-verifiziert)                                                                                           |
| `curricula-ux.spec.js`              | Testet die ALTE Curricula-UX (Karten-Grid, Subtree-Klick) — durch UXF-043-Dropdown ersetzt; neue UX deckt `curricula-dropdown.spec.js` ab                                                              |
| `test-dark-mode.spec.js`            | Erwartet `#theme-toggle`-Button + `data-theme`-Attribut — Production nutzt jetzt die `theme-switcher`-Radiogroup im Header (`header.html`); `dark-mode.js` wurde als unreferenced gelöscht. 7/9 failed |
| `test-titrations-simulator.spec.js` | `/titrations-simulator/` ist ein Platzhalter — kein `calculator-container`, keine Simulator-Komponente (`curl`-verifiziert). 7/10 failed                                                               |

**Features wieder aktivieren:**

```bash
E2E_INCLUDE_QUARANTINE=1 npx playwright test tests/e2e/quarantine/
```

(`playwright.config.mjs` hebt `testIgnore` bei `E2E_INCLUDE_QUARANTINE=1` auf.)

**Regel:** Sobald ein Feature gebaut wird, kommt seine Spec zurück nach
`tests/e2e/` und muss dort grün laufen. Quarantäne ist kein Friedhof —
jede Datei hier ist eine offene UX-Baufstelle.
