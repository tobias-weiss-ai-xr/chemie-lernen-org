/**
 * ux8b-taskfleet-config.mjs — TaskFleet-Konfiguration Runde 8b
 * (Virtuelles Labor „black plane" Hotfix, TDD)
 *
 *   UXF-037  init() lud kein initiales Experiment → leere dunkle Szene
 *            („black plane"): Ø-RGB(26,27,47), 0.3 % helle Pixel.
 *            Jetzt lädt init das vorausgewählte Experiment (Select-Wert,
 *            Fallback „freestyle").
 *   UXF-038  reset() leerte die Szene ohne Wiederherstellung → nach
 *            Reset erneut black plane. Jetzt reload des aktuellen
 *            Experiments.
 *   UXF-039  Dual-Export des LabEngine-Moduls für Tests.
 *   TDD: 7 Tests (RED 7/7 fail → GREEN 7/7 pass).
 *   Spoke-Anomalien (Traefik-Middleware-Fenster 01:28, WDS-Dev-Client im
 *   Spoke-Bundle) dokumentiert — letzteres ohne Host-Rebuild nicht fixbar.
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r8b-lab',
    name: 'UXF-037/038/039: Labor black-plane Fix (initiales Experiment, Reset-Restore)',
    group: 'fix-ux8b',
    command: 'node scripts/ux/apply-r8b-lab.mjs',
    description:
      'lab-engine.js: init lädt vorausgewähltes Experiment, reset stellt es wieder her, Dual-Export',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'r8b-verify',
    name: 'Verifikation Runde 8b: Labor-Tests, Voll-Suite, Lint, Hugo',
    group: 'verify8b',
    command: 'node scripts/ux/verify-r8b.mjs',
    description: '7 Labor-Tests + Voll-Suite + Lint + Hugo-Build',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r8b-lab'],
  },
];

export default TASKS;
export { TASKS };
