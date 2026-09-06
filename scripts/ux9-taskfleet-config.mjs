/**
 * ux9-taskfleet-config.mjs — TaskFleet-Konfiguration für UXF Runde 9
 * (Lehrplan-Menü: 16 Bundesland-Einträge → 1 aggregierter Eintrag)
 * Memory: mem_mtmm6728_mtmnbc5k (2026-09-03)
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'lehrplan-menu',
    name: 'UXF-042: Bundesland-Menu-Einträge → Aggregiert (15→1)',
    group: 'fix-ux9',
    command: 'node scripts/ux/apply-lehrplan-menu.mjs',
    description:
      'Alle 15 Bundesland-Lehrplan-Seiten haben eigene Menu-Einträge unter "Lehrende". → Entfernt. Jetzt: 1 zentraler Eintrag "Lehrpläne & Curricula" (weight 80) mit Card-Grid auf der Landing-Page.',
    timeout: 30000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'lehrplan-verify',
    name: 'Verify UXF-042: Keine State-Menu-Einträge, Gewicht stimmt, Hugo OK',
    group: 'verify9',
    command: 'node scripts/ux/verify-lehrplan-menu.mjs',
    description: 'Kein "menu: parent: lehrende" in den 15 State-Pages, curricula/_index.md weight=80, Hugo-Build erfolgreich',
    timeout: 60000,
    retries: 1,
    priority: 10,
    dependencies: ['lehrplan-menu'],
  },
];

export default TASKS;
export { TASKS };
