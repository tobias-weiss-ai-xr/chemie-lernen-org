/**
 * ux13-taskfleet-config.mjs — TaskFleet Runde 13 (Mini)
 * UXF-050: auth-client Auto-Init — blinder 200ms-Retry → MutationObserver.
 * getUser() ist seit UXF-046 memoiziert; init = genau 1 /me-Call, spätes
 * Navbar-Rendering wird ohne Netz-Call bedient.
 */

/** @type {Array<Object>} */
const TASKS = [
  {
    id: 'auth-init-observer',
    name: 'UXF-050: auth-client init — MutationObserver statt 200ms-Retry',
    group: 'fix-ux13',
    command: 'node scripts/ux/apply-uxf-050-auth-init-observer.mjs',
    description:
      'init(): applyAuthUI() + watchDynamicNav() — spätes Navbar-Rendering ohne Netz-Call bedient.',
    timeout: 30000,
    retries: 1,
    priority: 30,
  },
  {
    id: 'verify-init-nav',
    name: 'Verify UXF-050: init/Observer-Unit-Tests',
    group: 'verify-ux13',
    command: 'npx vitest run tests/auth-client-init-nav.test.js tests/auth-client-memoize.test.js',
    description:
      'init = 1 /me-Call; dynamische Navbar + Re-Render ohne Extra-Call; Memo-Lifecycle intakt.',
    timeout: 120000,
    retries: 1,
    priority: 20,
    dependencies: ['auth-init-observer'],
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
    dependencies: ['verify-init-nav'],
  },
];

export default { name: 'ux13-auth-init-observer', tasks: TASKS, concurrency: 3 };
export { TASKS };
