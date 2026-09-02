/**
 * ux6-taskfleet-config.mjs — TaskFleet-Konfiguration für UXF Runde 6
 * (Bugs & Edgecases)
 *
 *   UXF-025  404: tiefe /curricula/{state}/…-Pfade redirecten jetzt auf die
 *            State-Seite (alte Bookmarks generierter Seiten liefen in die
 *            nackte 404); Spiegel in apply-r5-404 (Full-Rewrite-Schutz)
 *   UXF-026  API: limit/offset-Clamping — ?limit=-1 (LIMIT -1 → Neo4j-
 *            Fehler → leere Antwort) und ?offset=-5 (SKIP -5) werden jetzt
 *            auf [1,1000] beziehungsweise [0,∞) begrenzt (beide Routen)
 *   UXF-027  ki-assistent Sanitizer-Härtung: srcdoc-Bypass, form/base-
 *            Tags, iframe-src-Whitelist, data:/vbscript:-URIs
 *   UXF-028  Quiz-Share: echter Thema-Name statt Seiten-h1 „Chemie-Quiz"
 *            (inkl. this→self-Falle im click-Handler)
 *
 * PARALLELISIERUNG: Ein Apply-Skript pro Zieldatei-Gruppe:
 *   apply-r6-404.mjs     → layouts/404.html + Spiegel in apply-r5-404.mjs
 *   apply-r6-api.mjs     → api/routes/curricula.js
 *   apply-r6-sanitize.mjs → static/js/ki-assistent.js
 *   apply-r6-quiz.mjs    → layouts/_default/quiz.html + static/js/quiz-ui.js
 *   verify-r6.mjs        → Syntax + Lint + Logik-Matrizen + Tests + Hugo
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'r6-404',
    name: 'UXF-025: 404 Deep-Path-Redirects für Curricula',
    group: 'bugs-ux6',
    command: 'node scripts/ux/apply-r6-404.mjs',
    description:
      '/curricula/{valider-state}/…/ → State-Seite; unbekanntes Segment → Übersicht; Spiegel in apply-r5-404.mjs, damit Full-Rewrites den Fix behalten',
    timeout: 60000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'r6-api',
    name: 'UXF-026: API limit/offset-Clamping',
    group: 'bugs-ux6',
    command: 'node scripts/ux/apply-r6-api.mjs',
    description:
      'api/routes/curricula.js: ?limit=-1 und ?offset=-5 erzeugten LIMIT -1 / SKIP -5 (Neo4j-Fehler, leere Antwort) — jetzt geclampt, topics + objectives',
    timeout: 60000,
    retries: 1,
    priority: 25,
  },
  {
    id: 'r6-sanitize',
    name: 'UXF-027: ki-assistent Sanitizer-Härtung',
    group: 'bugs-ux6',
    command: 'node scripts/ux/apply-r6-sanitize.mjs',
    description:
      'srcdoc-Bypass (Entities werden vom Browser dekodiert), form/base-Phishing-Tags, iframe-src-Whitelist, data:/vbscript:-URI-Block — 9 Funktionaltests',
    timeout: 60000,
    retries: 1,
    priority: 25,
  },
  {
    id: 'r6-quiz',
    name: 'UXF-028: Quiz-Share mit echtem Thema-Namen',
    group: 'bugs-ux6',
    command: 'node scripts/ux/apply-r6-quiz.mjs',
    description:
      'quiz.html reicht quizTitle=currentTopic; quiz-ui.js nutzt self.options.quizTitle (this zeigt im click-Handler auf den Button!) mit Fallback',
    timeout: 60000,
    retries: 1,
    priority: 20,
  },
  {
    id: 'r6-verify',
    name: 'Verifikation Runde 6: Syntax, Lint, Logik, Tests',
    group: 'verify6',
    command: 'node scripts/ux/verify-r6.mjs',
    description:
      'node --check + eslint + 404-Redirect-Matrix + API-Clamp-Tests + Sanitizer-Funktionaltest + vitest + Hugo-Build',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['r6-404', 'r6-api', 'r6-sanitize', 'r6-quiz'],
  },
];

export default TASKS;
export { TASKS };
