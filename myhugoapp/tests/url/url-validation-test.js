#!/usr/bin/env node

/**
 * URL Validation Tests
 * Tests that all important URLs return valid HTTP status codes
 * Tests for broken links, redirects, and 404 errors
 */

const http = require('http');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:1313';

// Important URLs to test
const importantUrls = [
  '/',
  '/perioden-system-der-elemente/',
  '/molekuel-studio/',
  '/pages/about/',
  '/pages/contact/',
  '/pages/roadmap/',
];

// Common typo URLs that should 404 (to verify proper error handling)
const expected404s = [
  '/perioden-system-der-eleme',
  '/perioden-system',
  '/molecule-studio',
  '/molekul',
];

/**
 * Check if a URL returns expected status code
 */
function checkUrl(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      host: 'localhost',
      port: 1313,
      path: url,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve({
        url,
        expectedStatus,
        actualStatus: res.statusCode,
        passed: res.statusCode === expectedStatus,
      });
    });

    req.on('error', () => {
      resolve({
        url,
        expectedStatus,
        actualStatus: 'ERROR',
        passed: false,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        expectedStatus,
        actualStatus: 'TIMEOUT',
        passed: false,
      });
    });

    req.end();
  });
}

/**
 * Test 1: Important URLs should return 200
 */
async function testImportantUrls() {
  console.log(`${colors.cyan}=== Test 1: Important URLs (Should return 200) ===${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  for (const url of importantUrls) {
    const result = await checkUrl(url, 200);

    if (result.passed) {
      console.log(`  ${colors.green}✓${colors.reset} ${url} - ${result.actualStatus}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${url} - Expected ${result.expectedStatus}, got ${result.actualStatus}`);
      failed++;
    }
  }

  console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

/**
 * Test 2: Common typos should return 404
 */
async function testExpected404s() {
  console.log(`${colors.cyan}=== Test 2: Invalid URLs (Should return 404) ===${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  for (const url of expected404s) {
    const result = await checkUrl(url, 404);

    if (result.passed) {
      console.log(`  ${colors.green}✓${colors.reset} ${url} - correctly returns 404`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${url} - Expected 404, got ${result.actualStatus}`);
      failed++;
    }
  }

  console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

/**
 * Test 3: Check for trailing slash consistency
 */
async function testTrailingSlashConsistency() {
  console.log(`${colors.cyan}=== Test 3: Trailing Slash Consistency ===${colors.reset}\n`);

  const testUrls = [
    '/perioden-system-der-elemente',
    '/perioden-system-der-elemente/',
    '/molekuel-studio',
    '/molekuel-studio/',
  ];

  let consistent = true;
  const results = [];

  for (const url of testUrls) {
    const result = await checkUrl(url, 200);
    results.push({ url, status: result.actualStatus });
  }

  // Check if with and without trailing slash both work
  const pairs = [
    ['/perioden-system-der-elemente', '/perioden-system-der-elemente/'],
    ['/molekuel-studio', '/molekuel-studio/'],
  ];

  for (const [without, withSlash] of pairs) {
    const r1 = results.find(r => r.url === without);
    const r2 = results.find(r => r.url === withSlash);

    // Accept 200 (direct access) or 301 (redirect) as valid
    const r1Valid = r1?.status === 200 || r1?.status === 301;
    const r2Valid = r2?.status === 200 || r2?.status === 301;

    if (r1Valid && r2Valid) {
      console.log(`  ${colors.green}✓${colors.reset} Both ${without} (${r1?.status}) and ${withSlash} (${r2?.status}) work`);
    } else if (r1Valid || r2Valid) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Partial: ${without} (${r1?.status}) vs ${withSlash} (${r2?.status})`);
      consistent = false;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Both variants fail: ${without} and ${withSlash}`);
      consistent = false;
    }
  }

  console.log(`\n${colors.cyan}Result: ${consistent ? 'PASS' : 'FAIL'}${colors.reset}\n`);
  return consistent;
}

/**
 * Main test runner
 */
async function runUrlTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║         URL Validation Test Suite          ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);
  console.log(`${colors.blue}Base URL: ${BASE_URL}${colors.reset}\n`);

  const test1 = await testImportantUrls();
  const test2 = await testExpected404s();
  const test3 = await testTrailingSlashConsistency();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);

  if (test1 && test2 && test3) {
    console.log(`${colors.green}✓ All URL validation tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some URL validation tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runUrlTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
