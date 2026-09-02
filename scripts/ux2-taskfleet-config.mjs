/**
 * ux2-taskfleet-config.mjs — TaskFleet-Konfiguration für funktionale UX (Runde 2)
 *
 * Fokus: chemie-lernen.org/curricula/ und verwandte Seiten.
 * Funktionale Verbesserungen (nicht nur kosmetisch):
 *
 *   UXF-001  Themen-Suche über alle Bundesländer (Live-Suche via
 *            /api/curricula/topics?search=) — NEUES Modul
 *   UXF-002  URL-State für die Übersicht (Tab/Filters/Compare deep-linkbar)
 *   UXF-003  Lernziele ausklappen ("+N" → alle anzeigen)
 *   UXF-004  Schulform-Gruppen einklappbar (localStorage-persistent)
 *   UXF-005  Graph-Legende interaktiv (Knotentyp hervorheben)
 *   UXF-006  Graph-Suche: nur Highlight bei Tippen, Reload nur bei Enter
 *   UXF-007  Vergleichstabelle: "Nur gemeinsame"-Filter + CSV-Export
 *   UXF-008  Sprungnavigation auf State-Seiten (bei RP: 936 Themen!)
 *
 * PARALLELISIERUNG: Ein Apply-Skript pro Zieldatei — keine Race Conditions.
 *
 *   apply-topic-search.mjs   → neue Files + curricula-index.html + baseof
 *   apply-overview-func.mjs  → curricula-overview.js (UXF-002 + UXF-007)
 *   apply-state-func.mjs     → curricula-state.js (UXF-003 + 004 + 008)
 *   apply-graph-func.mjs     → curricula-index.js (UXF-005 + UXF-006)
 *
 * verify-func-ux läuft NACH allen Apply-Tasks (Dependencies).
 *
 * Usage:
 *   node scripts/taskfleet.mjs --config scripts/ux2-taskfleet-config.mjs --dry-run
 *   node scripts/taskfleet.mjs --config scripts/ux2-taskfleet-config.mjs
 *   node scripts/taskfleet.mjs --config scripts/ux2-taskfleet-config.mjs --tasks apply-topic-search
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'uxf-topic-search',
    name: 'UXF-001: Themen-Suche über alle Bundesländer',
    group: 'func-ux',
    command: 'node scripts/ux/apply-topic-search.mjs',
    description:
      'Live-Suche über /api/curricula/topics (debounced, Bundesland-Badges, Keyboard-Nav). Neue Dateien: utils/curricula-utils.js, curricula-topic-search.js',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'uxf-overview',
    name: 'UXF-002+007: Übersicht URL-State + Compare-Filter/CSV',
    group: 'func-ux',
    command: 'node scripts/ux/apply-overview-func.mjs',
    description:
      'curricula-overview.js: Tab/Filter/Compare-Zustand in URL (deep-linkable), Vergleichstabelle mit "Nur gemeinsame Themen"-Filter und CSV-Export',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'uxf-state-page',
    name: 'UXF-003+004+008: State-Seite ausklappbar + Sprungnavi',
    group: 'func-ux',
    command: 'node scripts/ux/apply-state-func.mjs',
    description:
      'curricula-state.js: Lernziele ausklappbar (+N Button), Schulform-Gruppen collapsible (localStorage), Anchor-Sprungnavigation',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'uxf-graph',
    name: 'UXF-005+006: Graph-Legende interaktiv + Such-Performance',
    group: 'func-ux',
    command: 'node scripts/ux/apply-graph-func.mjs',
    description:
      'curricula-index.js: Legend-Klick hebt Knotentyp hervor, Suchinput macht nur client-Highlight (Reload nur bei Enter)',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'verify-func-ux',
    name: 'Verifikation: Syntax, Lint, Tests',
    group: 'verify',
    command: 'node scripts/ux/verify-func-ux.mjs',
    description: 'node --check auf allen geänderten Dateien + eslint + neue vitest-Tests',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['uxf-topic-search', 'uxf-overview', 'uxf-state-page', 'uxf-graph'],
  },
];

export default TASKS;
export { TASKS };
