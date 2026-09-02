/**
 * ux3-taskfleet-config.mjs — TaskFleet-Konfiguration für funktionale UX (Runde 3)
 *
 * Fokus: Curricula + Modulhandbuch — Bugfixes und Funktionen:
 *
 *   UXF-009  Modulhandbuch API: Case-Insensitivity (404 für ~15/25 Unis!)
 *   UXF-010  State-Seiten: Live-Text-Filter für Themen (RP: 936 Themen)
 *   UXF-011  Topic-Links: 404-Falle — Entity-Manifest + Search-Fallback
 *   UXF-012  Übersicht: Sortierung (A–Z / Themen / Lernziele) + URL-State
 *   UXF-013  Modulhandbuch: Modul-Filter + ECTS-Summe je Universität
 *   UXF-014  Themen-Suche: „Mehr laden"-Pagination
 *
 * PARALLELISIERUNG: Ein Apply-Skript pro Zieldatei-Gruppe (kein Doppel).
 *
 *   apply-r3-api-casefix.mjs   → api/routes/modulhandbuch.js
 *   apply-r3-state-filter.mjs  → curricula-state.js (UXF-010 + UXF-011a)
 *   apply-r3-overview.mjs      → curricula-overview.js (UXF-012 + UXF-011b)
 *   apply-r3-modulesearch.mjs  → modulhandbuch-index.js (UXF-013)
 *   apply-r3-infra.mjs         → Layouts + CI + curricula-topic-search.js
 *                                (neue Dateien entity-links.js,
 *                                 entity-slugs.json-Generator + utils-Sort
 *                                 werden direkt versioniert, nicht generiert)
 *   verify-r3.mjs              → Syntax + Lint + Tests (nach allen)
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r3-api-casefix',
    name: 'UXF-009: Modulhandbuch-API Case-Fix',
    group: 'func-ux3',
    command: 'node scripts/ux/apply-r3-api-casefix.mjs',
    description:
      'api/routes/modulhandbuch.js: toLower()-Matching statt toUpperCase/toLowerCase — behebt 404 für lowercase-codierte Universitäten (albert-ludwigs-freib, lmu_münchen) und Uppercase-Module-Routen',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'r3-state-filter',
    name: 'UXF-010+011a: State-Seite Live-Filter + Link-Fix',
    group: 'func-ux3',
    command: 'node scripts/ux/apply-r3-state-filter.mjs',
    description:
      'curricula-state.js: Themen-Filter (debounced, blendet leere Gruppen aus, Trefferzähler) + Topic-Links mit data-entity-name + Search-Fallback statt 404-Entity-Links',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r3-overview',
    name: 'UXF-012+011b: Übersicht-Sortierung + Compare-Link-Fix',
    group: 'func-ux3',
    command: 'node scripts/ux/apply-r3-overview.mjs',
    description:
      'curricula-overview.js: Sort-Select (A–Z/Themen/Lernziele) mit URL-State (?sort=) + Vergleichstabellen-Links mit Search-Fallback',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r3-modulesearch',
    name: 'UXF-013: Modulhandbuch Modul-Filter + ECTS-Summe',
    group: 'func-ux3',
    command: 'node scripts/ux/apply-r3-modulesearch.mjs',
    description:
      'modulhandbuch-index.js: Client-Filter für Modul-Liste je Universität (Code/Name) + Trefferzähler + Gesamt-ECTS',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r3-infra',
    name: 'UXF-011c+014: Manifest-CI + Layouts + Such-Pagination',
    group: 'func-ux3',
    command: 'node scripts/ux/apply-r3-infra.mjs',
    description:
      'CI-Step für entity-slugs.json-Generator, Script-Tags für entity-links.js in beiden Layouts, „Mehr laden"-Pagination in curricula-topic-search.js',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r3-verify',
    name: 'Verifikation Runde 3: Syntax, Lint, Tests',
    group: 'verify3',
    command: 'node scripts/ux/verify-r3.mjs',
    description: 'node --check auf allen geänderten Dateien + eslint + vitest (entity-links + curricula-utils)',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r3-api-casefix', 'r3-state-filter', 'r3-overview', 'r3-modulesearch', 'r3-infra'],
  },
];

export default TASKS;
export { TASKS };
