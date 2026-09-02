/**
 * ux4-taskfleet-config.mjs — TaskFleet-Konfiguration für funktionale UX (Runde 4)
 *
 * Fokus: Deep-Links, Teilbarkeit, Drucken — die Journey-Funktionen:
 *
 *   UXF-015  Graph-Detailpanel: 404-sichere Links (letzte /entity/-Blindlinks!)
 *   UXF-016  State-Seiten: Filter in URL persistieren (?thema=) → teilbar
 *   UXF-017  State-Seiten: „Lehrplan drucken" (Button + Print-CSS + Aufklappen)
 *   UXF-018  Modulhandbuch: Modul-Deep-Link (?uni=X&modul=CODE) + uni-Param
 *            ohne toUpperCase (Round-3-Fix-Idee konsequent zu Ende)
 *   UXF-019  Vergleich: „Link kopieren"-Button (Auswahl teilbar machen)
 *
 * PARALLELISIERUNG: Ein Apply-Skript pro Zieldatei-Gruppe (kein Doppel):
 *
 *   apply-r4-graph.mjs   → curricula-index.js
 *   apply-r4-state.mjs   → curricula-state.js + Layout + CSS
 *   apply-r4-mh.mjs      → modulhandbuch-index.js
 *   apply-r4-compare.mjs → curricula-overview.js
 *   verify-r4.mjs        → Syntax + Lint + Tests (nach allen)
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r4-graph',
    name: 'UXF-015: Graph-Detailpanel 404-sichere Links',
    group: 'func-ux4',
    command: 'node scripts/ux/apply-r4-graph.mjs',
    description:
      'curricula-index.js: Topic/Subtopic-Nodes → „Im Lehrplan {STATE} ansehen" (meta.state), Konzept-Links → Search-Fallback + Manifest-Rewrite; toSlug entfernt',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r4-state',
    name: 'UXF-016+017: State-Filter-URL + Druckansicht',
    group: 'func-ux4',
    command: 'node scripts/ux/apply-r4-state.mjs',
    description:
      'curricula-state.js: ?thema= URL-State (replaceState + Restore); Drucken-Button (Layout) + beforeprint/afterprint (alles aufklappen, Filter temporär aus) + Print-CSS',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r4-mh',
    name: 'UXF-018: Modulhandbuch Modul-Deep-Link',
    group: 'func-ux4',
    command: 'node scripts/ux/apply-r4-mh.mjs',
    description:
      'modulhandbuch-index.js: ?uni=X&modul=CODE öffnet Modul-Detail direkt; URL synchronisiert bei Uni/Modul-Wechsel; uni-Param nicht mehr uppercased',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r4-compare',
    name: 'UXF-019: Vergleich „Link kopieren"',
    group: 'func-ux4',
    command: 'node scripts/ux/apply-r4-compare.mjs',
    description:
      'curricula-overview.js: Share-Button im Vergleichs-Toolbar — kopiert ?tab=advanced&vergleich=BB,BY in die Zwischenablage (Clipboard-API + Prompt-Fallback)',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r4-verify',
    name: 'Verifikation Runde 4: Syntax, Lint, Tests',
    group: 'verify4',
    command: 'node scripts/ux/verify-r4.mjs',
    description: 'node --check auf allen geänderten Dateien + eslint + vitest (Regression)',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r4-graph', 'r4-state', 'r4-mh', 'r4-compare'],
  },
];

export default TASKS;
export { TASKS };
