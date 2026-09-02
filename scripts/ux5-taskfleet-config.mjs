/**
 * ux5-taskfleet-config.mjs — TaskFleet-Konfiguration für funktionale UX (Runde 5)
 *
 * Fokus: Journey-Abschluss — die 404-Falle schließen + kleine hohe Hebel:
 *
 *   UXF-020  Smart-404: Das Suchformular der 404 ging auf /suche/ (SELBST 404!)
 *            + Auto-Redirect für alte /entity/{slug}/-Bookmarks (Runden 3/4-
 *            Kontext) und ungültige /curricula/{xy}/-Pfade + Pagefind live
 *   UXF-021  „/"-Shortcut fokussiert das Suchfeld (global, a11y-safe)
 *   UXF-022  Entity-Seite „Lehrplan-Bezug": Topic-Titel/State-Badges → Links
 *            auf die State-Lehrplan-Seiten (waren reiner Text)
 *   UXF-023  Quiz: „Ergebnis kopieren"-Button (Clipboard + Fallback + Toast)
 *   UXF-024  Modulhandbuch: Sortier-Select in der Modul-Liste (A–Z / ECTS ↓)
 *
 * PARALLELISIERUNG: Ein Apply-Skript pro Zieldatei-Gruppe (kein Doppel):
 *
 *   apply-r5-404.mjs     → layouts/_default/404.html (Rewrite)
 *   apply-r5-shortcut.mjs → NEU static/js/search-shortcut.js + partials/head.html
 *   apply-r5-entity.mjs  → layouts/entity/single.html
 *   apply-r5-quiz.mjs    → static/js/quiz-ui.js
 *   apply-r5-mh.mjs      → static/js/modulhandbuch-index.js
 *   verify-r5.mjs        → Syntax + Lint + Hugo + Tests (nach allen)
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r5-404',
    name: 'UXF-020: Smart-404 (Suchform-Fix + Auto-Redirects + Pagefind)',
    group: 'func-ux5',
    command: 'node scripts/ux/apply-r5-404.mjs',
    description:
      'layouts/_default/404.html: Suche zeigt auf /pages/suche/ (vorher /suche/ = 404!), /entity/{slug}/-Bookmarks landen automatisch in der Suche, ungültige /curricula/{xy}/ → Übersicht, Pagefind-Instanzsuche, beliebte Ziele',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'r5-shortcut',
    name: 'UXF-021: „/"-Shortcut für Suchfelder',
    group: 'func-ux5',
    command: 'node scripts/ux/apply-r5-shortcut.mjs',
    description:
      'NEU static/js/search-shortcut.js + Script-Tag in head.html: „/" fokussiert das erste sichtbare Suchfeld (nicht in Inputs/Selects), Escape blendet ab — Standard-Pattern wie GitHub/MDN',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r5-entity',
    name: 'UXF-022: Entity „Lehrplan-Bezug" mit Links',
    group: 'func-ux5',
    command: 'node scripts/ux/apply-r5-entity.mjs',
    description:
      'layouts/entity/single.html: Topic-Titel → State-Seite (/curricula/{state}/), State-Badge wird klickbar — die Lehrplan-Kontext-Navigation war vorher Text ohne Ziel',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r5-quiz',
    name: 'UXF-023: Quiz „Ergebnis kopieren"',
    group: 'func-ux5',
    command: 'node scripts/ux/apply-r5-quiz.mjs',
    description:
      'static/js/quiz-ui.js: Share-Button im Ergebnis-Screen — „Quiz „X": 85% (6/7) — chemie-lernen.org/quiz/" in die Zwischenablage, UIToast/prompt-Fallback',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r5-mh',
    name: 'UXF-024: Modul-Liste sortieren (A–Z / ECTS)',
    group: 'func-ux5',
    command: 'node scripts/ux/apply-r5-mh.mjs',
    description:
      'static/js/modulhandbuch-index.js: Sortier-Select über der Modul-Liste (A–Z / ECTS absteigend), stabil über Grade-Gruppen hinweg, persistent während der Sitzung',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r5-verify',
    name: 'Verifikation Runde 5: Syntax, Lint, Tests',
    group: 'verify5',
    command: 'node scripts/ux/verify-r5.mjs',
    description: 'node --check + eslint auf geänderten JS-Dateien + vitest (Regression)',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r5-404', 'r5-shortcut', 'r5-entity', 'r5-quiz', 'r5-mh'],
  },
];

export default TASKS;
export { TASKS };
