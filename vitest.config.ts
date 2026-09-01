import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // Map 'three' to the dependency-free test fake (replaces Jest's moduleNameMapper)
      { find: /^three$/, replacement: resolve(__dirname, 'tests/three-fake.cjs') },
      // Map '@jest/globals' to 'vitest' for Jest-compatible test imports
      { find: '@jest/globals', replacement: 'vitest' },
    ],
  },
  test: {
    // Match the same test files as the old Jest config
    include: ['tests/**/*.test.js', 'tests/**/*.test.mjs'],
    exclude: ['**/node_modules/**', '**/.tf-worktrees/**'],
    // Ignore the same test suites Jest ignored (integration/e2e run separately)
    testTimeout: 30000,
    // jsdom environment (matches Jest's testEnvironment: 'jsdom')
    environment: 'jsdom',
    // Enable script execution in jsdom (required for tests that inject <script> elements)
    environmentOptions: {
      jsdom: {
        runScripts: 'dangerously',
        url: 'http://localhost',
      },
    },
    // Setup file for polyfills (fetch, Response) that Jest provided but Vitest's jsdom doesn't
    setupFiles: ['tests/setup.mjs'],
    // Provide global test APIs (describe, test, expect, vi) — matches Jest's global injection
    globals: true,
    // Coverage configuration (matches Jest's collectCoverageFrom)
    coverage: {
      provider: 'v8',
      include: ['myhugoapp/static/js/calculators/**/*.js'],
      reporter: ['text', 'lcov'],
    },
  },
});
