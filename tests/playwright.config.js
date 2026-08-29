// Playwright Test Configuration for Molecule Studio Visual Tests

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',

  // Only run Playwright spec files — .test.js files are Jest-only
  testMatch: '**/*.spec.{js,ts}',

  // Timeout per test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry transient failures. Live E2E runs against the production API,
  // which rate-limits bursts of requests (HTTP 429) — retries absorb that.
  retries: 2,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'https://chemie-lernen.org',

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Screenshot configuration
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: !process.env.CI,
  },

  // Projects for different browsers and viewports
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests (optional)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:1313',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
