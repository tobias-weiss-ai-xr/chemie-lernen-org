/**
 * ux7-taskfleet-config.mjs — TaskFleet-Konfiguration für UXF Runde 7
 * (Security-Fix + Test-Abdeckung + bun.lock-Reparatur)
 *
 *   UXF-029  formatFormula XSS-Fix: DOM-XSS in molare-masse /
 *            loeslichkeitsprodukt / reaktionsgleichungen (rohe User-Eingabe
 *            via innerHTML). Escape vor <sub>-Ersetzung; lokale Kopie in
 *            reaktionsgleichungen-ausgleichen.js mitgefixt.
 *   UXF-030  Test-Abdeckung: +37 Tests (chemistry-calculator-framework,
 *            lazy-loader, quiz-ui inkl. Share/UXF-028-Regression) + 5
 *            XSS-Regressionstests in chemistry-utils.test.js
 *   R7-LOCK  bun.lock: 20 Stash-Konfliktblöcke (aus 8462cc01) aufgelöst —
 *            Upstream-Seite (= aktuelles package.json). bun 1.4.0 kann
 *            file:*.tgz nicht auflösen (Registry-404), daher Hand-Lösung.
 *
 * Neue Testdateien sind direkte Commits (kein Apply-Skript nötig);
 * der r7-verify-Task läuft als Regression-Tor.
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r7-formula',
    name: 'UXF-029: formatFormula-XSS-Fix (utils + lokale Kopie)',
    group: 'sec-ux7',
    command: 'node scripts/ux/apply-r7-formula.mjs',
    description:
      'Escape vor <sub>-Ersetzung in chemistry-utils.js + reaktionsgleichungen-ausgleichen.js (DOM-XSS über Rechner-Eingabefelder)',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'r7-lock',
    name: 'R7-LOCK: bun.lock-Konfliktblöcke auflösen + validieren',
    group: 'sec-ux7',
    command: 'node scripts/ux/apply-r7-lock.mjs',
    description:
      'Entfernt committe Stash-Konfliktmarker (Upstream-Seite) und validiert JSONC-Syntax + Kern-Dependencies',
    timeout: 60000,
    retries: 1,
    priority: 25,
  },
  {
    id: 'r7-verify',
    name: 'Verifikation Runde 7: Tests, Lint, Hugo',
    group: 'verify7',
    command: 'node scripts/ux/verify-r7.mjs',
    description:
      'Syntax + eslint (Quellen) + neue Testsuiten + XSS-Regression + Voll-Suite + Hugo-Build',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r7-formula', 'r7-lock'],
  },
];

export default TASKS;
export { TASKS };
