/**
 * ux12-taskfleet-config.mjs — TaskFleet Runde 12
 * UX-Findings aus Live-Audit 2026-09-12 (Runde 2, tiefere Seiten):
 *  - UXF-046: /api/auth/me 2–3× pro Seitenlast → getUser()-Memoization
 *  - UXF-047: lernpfade.js feuerte /api/gamification/profile für anonyme
 *    Besucher (401-Noise) → Auth-Gate wie UXF-045
 *  - UXF-048: 2 below-the-fold-Bilder ohne loading=lazy (Startseite/Footer)
 *  - UXF-049: /stoechiometrie/ + /stoichiometrie/ 404ten → Hugo-Aliase
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'auth-memoize',
    name: 'UXF-046: /api/auth/me memoisieren (2-3x → 1x pro Seitenlast)',
    group: 'fix-ux12',
    command: 'node scripts/ux/apply-uxf-046-auth-memoize.mjs',
    description: 'auth-client.js: Promise-Cache in getUser(), Invalidierung bei login()/logout().',
    timeout: 30000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'lernpfade-gate',
    name: 'UXF-047: Lernpfade ohne 401-Noise für anonyme Besucher',
    group: 'fix-ux12',
    command: 'node scripts/ux/apply-uxf-047-lernpfade-gate.mjs',
    description:
      'lernpfade.js: profile-Call nur nach getUser()-Login; anonym → renderLoginPrompt().',
    timeout: 30000,
    retries: 1,
    priority: 28,
  },
  {
    id: 'lazy-images',
    name: 'UXF-048: below-the-fold-Bilder lazy (QR-Code, Liberapay-Badge)',
    group: 'fix-ux12',
    command: 'node scripts/ux/apply-uxf-048-lazy-images.mjs',
    description: 'footer.html + content/_index.md: loading=lazy decoding=async.',
    timeout: 30000,
    retries: 1,
    priority: 26,
  },
  {
    id: 'stoech-alias',
    name: 'UXF-049: /stoechiometrie/ + /stoichiometrie/ Aliase',
    group: 'fix-ux12',
    command: 'node scripts/ux/apply-uxf-049-stoech-alias.mjs',
    description: 'Hugo-Aliase auf stoechiometrie-rechner/_index.md.',
    timeout: 30000,
    retries: 1,
    priority: 24,
  },
  {
    id: 'verify-auth-memoize',
    name: 'Verify UXF-046/047: Memoization- + Gate-Unit-Tests',
    group: 'verify-ux12',
    command: 'npx vitest run tests/auth-client-memoize.test.js tests/lernpfade-gate.test.js',
    description: 'Memo-Lifecycle (1 Call, Invalidierung) + lernpfade-Gate (3 Szenarien).',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['auth-memoize', 'lernpfade-gate'],
  },
  {
    id: 'verify-stoech-alias',
    name: 'Verify UXF-049: Hugo baut Redirect-Seiten',
    group: 'verify-ux12',
    command: 'node scripts/ux/verify-uxf-049-stoech-alias.mjs',
    description: 'Echter Hugo-Build: /stoechiometrie/index.html + /stoichiometrie/ redirecten.',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['stoech-alias'],
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
    dependencies: ['verify-auth-memoize', 'verify-stoech-alias'],
  },
];

export default { name: 'ux12-live-audit-fixes', tasks: TASKS, concurrency: 3 };
export { TASKS };
