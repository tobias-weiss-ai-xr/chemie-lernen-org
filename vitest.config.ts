import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// DOM-freie Testfiles laufen im 'node'-Projekt (kein jsdom-Setup pro File).
// Liste regenerieren mit:
//   grep -rLE "document\.|window\.|HTMLElement|localStorage|navigator|DOMParser|jsdom|getComputed" tests/*.test.js tests/*.test.mjs | sed 's|tests/||' | sort > tests/node-env-files.txt
// Indirekte DOM-Nutzer (via import) müssen wieder raus — die Suite zeigt sie als
// 'document is not defined'. File muss exakt `tests/<name>` enthalten.
const nodeGlobs = readFileSync(new URL('./tests/node-env-files.txt', import.meta.url), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((f) => `**/tests/${f}`);

// Live-Integrations-Suiten (echte HTTP-Calls gegen chemie-lernen.org /
// hubs.chemie-lernen.org — Flakiness je Serverzustand): nur in `test:all` /
// `--project slow`, NICHT in `npm test` (So war es auch vorher via CLI-Excludes).
const SLOW_GLOBS = [
  '**/tests/complete-site-audit*.test.js',
  '**/tests/site-accessibility*.test.js',
  '**/tests/mobile-responsiveness*.test.js',
  '**/tests/accessibility-validation*.test.js',
  '**/tests/hubs-stack.test.mjs',
];

const defaultExcludes = ['**/node_modules/**', '**/.tf-worktrees/**'];
const jsdomEnvOptions = {
  jsdom: {
    runScripts: 'dangerously',
    url: 'http://localhost',
  },
};

// Projekte erben Root-resolve NICHT zuverlässig (molecule-hero: 'three' unresolved)
// → Alias-Variable, pro Projekt gesetzt.
const alias = [
  // Map 'three' to the dependency-free test fake (replaces Jest's moduleNameMapper)
  { find: /^three$/, replacement: resolve(__dirname, 'tests/three-fake.cjs') },
  // Map '@jest/globals' to 'vitest' for Jest-compatible test imports
  { find: '@jest/globals', replacement: 'vitest' },
];

export default defineConfig({
  // Hinweis: Vitest-4-Projekte erben Root-test-Options unzuverlässig —
  // deshalb sind environment/globals/setupFiles/testTimeout JEWEILS pro Projekt gesetzt.
  test: {
    // Coverage configuration (calculators + utils; thresholds = Ratchet
    // leicht unter Ist-Stand 2026-09-08: 62.2/61.7/70.7/64.3)
    coverage: {
      provider: 'v8',
      include: ['myhugoapp/static/js/calculators/**/*.js', 'myhugoapp/static/js/utils/**/*.js'],
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 68,
        lines: 62,
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          setupFiles: ['tests/setup.mjs'],
          testTimeout: 30000,
          include: nodeGlobs,
          exclude: defaultExcludes,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['tests/setup.mjs'],
          testTimeout: 30000,
          include: ['**/tests/**/*.test.js', '**/tests/**/*.test.mjs'],
          exclude: [...defaultExcludes, ...SLOW_GLOBS, ...nodeGlobs],
          environmentOptions: jsdomEnvOptions,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'slow',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['tests/setup.mjs'],
          testTimeout: 60000,
          include: SLOW_GLOBS,
          exclude: defaultExcludes,
          environmentOptions: jsdomEnvOptions,
        },
      },
    ],
  },
});
