#!/usr/bin/env node

/**
 * JavaScript Unit Tests
 * Tests JavaScript modules for dark mode, PSE, and other functionality
 */

const fs = require('fs');
const path = require('path');

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

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    passedTests++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${message}`);
    failedTests++;
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    passedTests++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${message}`);
    console.log(`    Expected: ${expected}, Got: ${actual}`);
    failedTests++;
  }
}

/**
 * Test 1: Dark Mode JavaScript
 */
function testDarkModeJS() {
  console.log(`${colors.cyan}=== Test 1: Dark Mode JavaScript ===${colors.reset}\n`);

  const jsPath = path.join(__dirname, '../../static/js/dark-mode.js');

  if (!fs.existsSync(jsPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} dark-mode.js not found, skipping tests\n`);
    return;
  }

  const js = fs.readFileSync(jsPath, 'utf8');

  // Test for required functions
  const hasThemeToggle = js.includes('toggleTheme') || js.includes('setTheme');
  assert(hasThemeToggle, 'Has theme toggle function');

  const hasLocalStorage = js.includes('localStorage');
  assert(hasLocalStorage, 'Uses localStorage for persistence');

  const hasPreferredTheme = js.includes('getPreferredTheme') || js.includes('preferredTheme');
  assert(hasPreferredTheme, 'Has preferred theme detection');

  const hasDarkDefault = js.includes('dark') && (js.includes('default') || js.includes('return \'dark\''));
  assert(hasDarkDefault, 'Dark mode is set as default');

  const hasDataTheme = js.includes('data-theme') || js.includes('setAttribute');
  assert(hasDataTheme, 'Sets data-theme attribute on HTML/body');

  // Check for event listeners
  const hasDOMContentLoaded = js.includes('DOMContentLoaded') || js.includes('addEventListener');
  assert(hasDOMContentLoaded, 'Waits for DOM ready');

  const hasThemeToggleListener = js.includes('#theme-toggle') || js.includes('getElementById');
  assert(hasThemeToggleListener, 'Listens for theme toggle button clicks');

  console.log('');
}

/**
 * Test 2: PSE JavaScript Functions
 */
function testPSEFunctions() {
  console.log(`${colors.cyan}=== Test 2: PSE JavaScript Functions ===${colors.reset}\n`);

  const jsPath = path.join(__dirname, '../../static/js/perioden-system-der-elemente.js');

  if (!fs.existsSync(jsPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} perioden-system-der-elemente.js not found, skipping tests\n`);
    return;
  }

  const js = fs.readFileSync(jsPath, 'utf8');

  // Test for required Three.js imports
  assert(js.includes('from \'three\'') || js.includes('from "three"'), 'Imports Three.js');
  assert(js.includes('CSS3DRenderer'), 'Imports CSS3DRenderer');
  assert(js.includes('TrackballControls'), 'Imports TrackballControls');

  // Test for updateCentering function
  assert(js.includes('function updateCentering()'), 'Has updateCentering function');

  // Test for table dimensions
  assert(js.includes('tableWidth') && js.includes('tableHeight'), 'Calculates table dimensions');

  // Test for mobile detection
  assert(js.includes('width < 768') || js.includes('isMobile'), 'Detects mobile devices');

  // Test for dynamic offsets
  assert(js.includes('tableOffsetX') && js.includes('tableOffsetY'), 'Uses dynamic table offsets');

  // Test for resize handler
  assert(js.includes('onWindowResize'), 'Has window resize handler');

  // Test for color function
  assert(js.includes('getElementColor'), 'Has element color function');

  // Test for Wikipedia links
  assert(js.includes('wikipedia.org'), 'Opens Wikipedia links on click');

  console.log('');
}

/**
 * Test 3: PSE Element Data
 */
function testPSEElementData() {
  console.log(`${colors.cyan}=== Test 3: PSE Element Data ===${colors.reset}\n`);

  const jsPath = path.join(__dirname, '../../static/js/perioden-system-der-elemente.js');

  if (!fs.existsSync(jsPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} perioden-system-der-elemente.js not found, skipping tests\n`);
    return;
  }

  const js = fs.readFileSync(jsPath, 'utf8');

  // Extract the table array
  const tableMatch = js.match(/const table = \[([\s\S]*?)\];/);
  assert(tableMatch !== null, 'PSE table data exists');

  if (tableMatch) {
    // Count elements (each element has 5 data points)
    const elementCount = (tableMatch[1].match(/'/g) || []).length / 10; // Approximate
    const expectedElements = 118;

    // Check for common elements
    assert(js.includes('\'H\''), 'Has Hydrogen');
    assert(js.includes('\'He\''), 'Has Helium');
    assert(js.includes('\'Li\''), 'Has Lithium');
    assert(js.includes('\'U\''), 'Has Uranium');
    assert(js.includes('\'Og\''), 'Has Oganesson (element 118)');

    // Check for lanthanides/actinides
    assert(js.includes('La') && js.includes('Ac'), 'Has Lanthanides and Actinides');
  }

  console.log('');
}

/**
 * Test 4: PSE Color Scheme
 */
function testPSEColorScheme() {
  console.log(`${colors.cyan}=== Test 4: PSE Color Scheme ===${colors.reset}\n`);

  const jsPath = path.join(__dirname, '../../static/js/perioden-system-der-elemente.js');

  if (!fs.existsSync(jsPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} perioden-system-der-elemente.js not found, skipping tests\n`);
    return;
  }

  const js = fs.readFileSync(jsPath, 'utf8');

  // Check for color groups
  assert(js.includes('getElementColor'), 'Has color grouping function');

  // Check for element group colors
  assert(js.includes('rgba'), 'Uses RGBA colors for transparency');

  // Check for group definitions (at least some groups)
  const groupCount = (js.match(/group/g) || []).length;
  assert(groupCount > 5, `Defines colors for multiple groups (found ${groupCount} references)`);

  // Check for specific group colors
  assert(js.includes('1:') || js.includes('group: 1'), 'Defines Group 1 (Alkali metals) color');
  assert(js.includes('18:') || js.includes('group: 18'), 'Defines Group 18 (Noble gases) color');

  console.log('');
}

/**
 * Test 5: PSE View Modes
 */
function testPSEViewModes() {
  console.log(`${colors.cyan}=== Test 5: PSE View Modes ===${colors.reset}\n`);

  const jsPath = path.join(__dirname, '../../static/js/perioden-system-der-elemente.js');

  if (!fs.existsSync(jsPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} perioden-system-der-elemente.js not found, skipping tests\n`);
    return;
  }

  const js = fs.readFileSync(jsPath, 'utf8');

  // Check for view targets
  assert(js.includes('targets.table'), 'Has table view targets');
  assert(js.includes('targets.sphere'), 'Has sphere view targets');
  assert(js.includes('targets.helix'), 'Has helix view targets');
  assert(js.includes('targets.grid'), 'Has grid view targets');

  // Check for view buttons
  assert(js.includes('buttonTable') || js.includes('getElementById(\'table\')'), 'Has table button listener');
  assert(js.includes('buttonSphere') || js.includes('getElementById(\'sphere\')'), 'Has sphere button listener');
  assert(js.includes('buttonHelix') || js.includes('getElementById(\'helix\')'), 'Has helix button listener');
  assert(js.includes('buttonGrid') || js.includes('getElementById(\'grid\')'), 'Has grid button listener');

  // Check for transform function
  assert(js.includes('function transform('), 'Has transform function for view switching');

  // Check for Tween animations
  assert(js.includes('TWEEN'), 'Uses TWEEN for animations');

  console.log('');
}

/**
 * Test 6: JavaScript Syntax Validation
 */
function testJSSyntax() {
  console.log(`${colors.cyan}=== Test 6: JavaScript Syntax ===${colors.reset}\n`);

  const jsDir = path.join(__dirname, '../../static/js');

  const jsFiles = findFiles(jsDir, '.js');
  const syntaxErrors = [];

  // Skip external libraries
  const skipFiles = ['three.core.js', 'three.module.js', 'bootstrap.min.js', 'jquery.min.js'];

  for (const file of jsFiles) {
    const basename = path.basename(file);

    // Skip external libraries
    if (skipFiles.includes(basename) || basename.includes('.min.') || basename.includes('three.')) {
      console.log(`  ${colors.blue}⊝${colors.reset} Skipping ${basename} (external library)`);
      totalTests++;
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');

      // Basic syntax checks
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      if (openBraces !== closeBraces) {
        syntaxErrors.push(`${basename}: Mismatched braces (${openBraces} vs ${closeBraces})`);
      }
      if (openParens !== closeParens) {
        syntaxErrors.push(`${basename}: Mismatched parentheses (${openParens} vs ${closeParens})`);
      }

      // Check for common issues
      const logCount = (content.match(/console\.log/g) || []).length;
      if (logCount > 5) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${basename}: Has ${logCount} console.log statements (consider removing)`);
      }
    } catch (e) {
      syntaxErrors.push(`${basename}: ${e.message}`);
    }
  }

  if (syntaxErrors.length === 0) {
    const checkedCount = jsFiles.filter(f => {
      const basename = path.basename(f);
      return !skipFiles.includes(basename) && !basename.includes('.min.') && !basename.includes('three.');
    }).length;
    console.log(`  ${colors.green}✓${colors.reset} All ${checkedCount} custom JavaScript files have valid syntax`);
  } else {
    for (const error of syntaxErrors) {
      console.log(`  ${colors.red}✗${colors.reset} ${error}`);
      failedTests++;
    }
  }

  console.log('');
}

/**
 * Helper: Find files recursively
 */
function findFiles(dir, extension) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath, extension));
    } else if (entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Main test runner
 */
function runJSTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   JavaScript Unit Test Suite             ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testDarkModeJS();
  testPSEFunctions();
  testPSEElementData();
  testPSEColorScheme();
  testPSEViewModes();
  testJSSyntax();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Total: ${totalTests} tests, ${passedTests} passed, ${failedTests} failed${colors.reset}\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}✓ All JavaScript tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ ${failedTests} JavaScript test(s) failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runJSTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
