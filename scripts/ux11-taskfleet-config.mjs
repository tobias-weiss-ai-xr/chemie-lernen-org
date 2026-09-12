/**
 * ux11-taskfleet-config.mjs — TaskFleet Runde 11
 * UX-Findings aus Live-Audit 2026-09-12:
 *  - UXF-044: /periodensystem/, /pse/, /periodentafel/ 404ten → Hugo-Aliase
 *  - UXF-045: Homepage feuerte /api/gamification/profile für anonyme
 *    Besucher (401-Console-Noise) → Auth-Gate via AuthClient.getUser()
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'pse-alias',
    name: 'UXF-044: PSE-Aliase /periodensystem/ /pse/ /periodentafel/',
    group: 'fix-ux11',
    command: 'node scripts/ux/apply-uxf-044-pse-alias.mjs',
    description:
      'Hugo-Aliase auf perioden-system-der-elemente.md — naheliegende URLs redirecten statt 404.',
    timeout: 30000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'home-auth-gate',
    name: 'UXF-045: Homepage ohne 401-Noise für anonyme Besucher',
    group: 'fix-ux11',
    command: 'node scripts/ux/apply-uxf-045-home-auth-gate.mjs',
    description:
      'home-recommendation.js: profile-Call nur nach AuthClient.getUser()-Login; anonym direkt Fallback-Widget.',
    timeout: 30000,
    retries: 1,
    priority: 25,
  },
  {
    id: 'verify-pse-alias',
    name: 'Verify UXF-044: Hugo baut Redirect-Seiten',
    group: 'verify-ux11',
    command: 'node scripts/ux/verify-uxf-044-pse-alias.mjs',
    description:
      'Echter Hugo-Build: public/periodensystem/index.html + 2 weitere redirecten auf die PSE-Seite.',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['pse-alias'],
  },
  {
    id: 'verify-auth-gate',
    name: 'Verify UXF-045: Auth-Gate Unit-Tests (3 Szenarien)',
    group: 'verify-ux11',
    command: 'npx vitest run tests/home-recommendation-auth-gate.test.js',
    description: 'anonym → kein profile-Call; eingeloggt → Flow läuft; ohne AuthClient → Legacy.',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['home-auth-gate'],
  },
  {
    id: 'suite-green',
    name: 'Verify: Test-Suite grün',
    group: 'verify',
    command: 'npm test',
    description: 'node/dom/jsdom-Projekte inkl. der neuen Guards müssen grün bleiben.',
    timeout: 300000,
    retries: 1,
    priority: 10,
    dependencies: ['verify-pse-alias', 'verify-auth-gate'],
  },
];

export default { name: 'ux11-live-audit-fixes', tasks: TASKS, concurrency: 3 };
export { TASKS };
