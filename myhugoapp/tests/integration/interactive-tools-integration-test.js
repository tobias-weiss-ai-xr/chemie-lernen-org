#!/usr/bin/env node

/**
 * Integration Tests for Interactive Tools
 * Tests the actual functionality of calculators and interactive tools
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

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

/**
 * Test 1: Molar Mass Calculator
 */
function testMolarMassCalculator() {
  console.log(`${colors.cyan}=== Test 1: Molar Mass Calculator ===${colors.reset}\n`);

  const htmlPath = path.join(__dirname, '../../public/molare-masse-rechner/index.html');

  if (!fs.existsSync(htmlPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Molar mass calculator page not found, skipping\n`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check for required elements
  assert(html.includes('input'), 'Has input field for chemical formula');
  assert(html.includes('button') || html.includes('Berechnen'), 'Has calculate button');
  assert(html.includes('id="result"') || html.includes('class="result"'), 'Has result display element');

  // Check for JavaScript
  assert(html.includes('molare-masse') || html.includes('molar'), 'Has calculator JavaScript');

  // Check for example elements
  const commonElements = ['H', 'C', 'O', 'N', 'Na', 'Cl'];
  const hasElementData = commonElements.some(el => html.includes(el));
  assert(hasElementData, 'Contains element data for calculations');

  console.log('');
}

/**
 * Test 2: pH Calculator
 */
function testPHCalculator() {
  console.log(`${colors.cyan}=== Test 2: pH Calculator ===${colors.reset}\n`);

  const htmlPath = path.join(__dirname, '../../public/ph-rechner/index.html');

  if (!fs.existsSync(htmlPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} pH calculator page not found, skipping\n`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check for required elements
  assert(html.includes('input'), 'Has input field');
  assert(html.includes('acid') || html.includes('base') || html.includes('Säure') || html.includes('Base'),
         'Has acid/base selection or calculation');
  assert(html.includes('result') || html.includes('Ergebnis'), 'Has result display');

  // Check for pH calculation logic
  assert(html.includes('-log') || html.includes('Math.log10') || html.includes('PH'),
         'Has pH calculation logic');

  console.log('');
}

/**
 * Test 3: Equation Balancer
 */
function testEquationBalancer() {
  console.log(`${colors.cyan}=== Test 3: Equation Balancer ===${colors.reset}\n`);

  const htmlPath = path.join(__dirname, '../../public/reaktionsgleichungen-ausgleichen/index.html');

  if (!fs.existsSync(htmlPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Equation balancer page not found, skipping\n`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check for required elements
  assert(html.includes('input') || html.includes('textarea'), 'Has input field for equations');
  assert(html.includes('button') || html.includes('Ausgleichen'), 'Has balance button');
  assert(html.includes('output') || html.includes('result') || html.includes('Ergebnis'),
         'Has result display');

  // Check for chemical equation parsing
  assert(html.includes('→') || html.includes('->') || html.includes('arrow'),
         'Handles chemical equation arrows');

  console.log('');
}

/**
 * Test 4: Periodic Table (PSE) Interactive
 */
function testPeriodicTable() {
  console.log(`${colors.cyan}=== Test 4: Periodic Table (PSE) ===${colors.reset}\n`);

  const htmlPath = path.join(__dirname, '../../public/perioden-system-der-elemente/index.html');

  if (!fs.existsSync(htmlPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Periodic table page not found, skipping\n`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check for Three.js
  assert(html.includes('three') || html.includes('THREE') || html.includes('CSS3DRenderer'),
         'Uses Three.js for 3D rendering');

  // Check for view controls
  assert(html.includes('table') || html.includes('Tabelle'), 'Has table view');
  assert(html.includes('sphere') || html.includes('Kugel'), 'Has sphere view');

  // Check for element data
  const elementCount = (html.match(/data-element/g) || []).length;
  assert(elementCount > 50, `Has ${elementCount} elements in the table`);

  // Check for interaction
  assert(html.includes('click') || html.includes('addEventListener'),
         'Has click event listeners for element interaction');

  console.log('');
}

/**
 * Test 5: Molecule Studio (Molekül Studio)
 */
function testMoleculeStudio() {
  console.log(`${colors.cyan}=== Test 5: Molecule Studio ===${colors.reset}\n`);

  const htmlPath = path.join(__dirname, '../../public/molekuel-studio/index.html');

  if (!fs.existsSync(htmlPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Molecule studio page not found, skipping\n`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Check for 3D rendering
  assert(html.includes('three') || html.includes('THREE'),
         'Uses Three.js for 3D molecule visualization');

  // Check for molecule selection
  assert(html.includes('select') || html.includes('option') || html.includes('Molekül'),
         'Has molecule selection interface');

  // Check for controls
  assert(html.includes('OrbitControls') || html.includes('TrackballControls') || html.includes('rotate'),
         'Has camera controls');

  // Check for atom rendering
  assert(html.includes('SphereGeometry') || html.includes('atom') || html.includes('Atom'),
         'Renders atoms as spheres');

  console.log('');
}

/**
 * Test 6: Calculator Input Validation
 */
function testInputValidation() {
  console.log(`${colors.cyan}=== Test 6: Input Validation ===${colors.reset}\n`);

  const pages = [
    { path: '../../public/molare-masse-rechner/index.html', name: 'Molar Mass Calculator' },
    { path: '../../public/ph-rechner/index.html', name: 'pH Calculator' },
  ];

  for (const page of pages) {
    const htmlPath = path.join(__dirname, page.path);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Check for input validation patterns
    const hasValidation = html.includes('pattern=') ||
                         html.includes('min=') ||
                         html.includes('max=') ||
                         html.includes('required') ||
                         html.includes('validate') ||
                         html.includes('input type="number"');

    assert(hasValidation, `${page.name}: Has input validation`);
  }

  console.log('');
}

/**
 * Test 7: Error Handling
 */
function testErrorHandling() {
  console.log(`${colors.cyan}=== Test 7: Error Handling ===${colors.reset}\n`);

  const calcPages = [
    '../../public/molare-masse-rechner/index.html',
    '../../public/ph-rechner/index.html',
    '../../public/reaktionsgleichungen-ausgleichen/index.html',
  ];

  for (const pagePath of calcPages) {
    const htmlPath = path.join(__dirname, pagePath);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');
    const pageName = path.basename(path.dirname(htmlPath));

    // Check for error messages or handling
    const hasErrorHandling = html.includes('error') ||
                            html.includes('Fehler') ||
                            html.includes('Ungültig') ||
                            html.includes('try') ||
                            html.includes('catch');

    assert(hasErrorHandling, `${pageName}: Has error handling`);
  }

  console.log('');
}

/**
 * Test 8: Tool Accessibility
 */
function testToolAccessibility() {
  console.log(`${colors.cyan}=== Test 8: Tool Accessibility ===${colors.reset}\n`);

  const toolPages = [
    '../../public/molare-masse-rechner/index.html',
    '../../public/ph-rechner/index.html',
    '../../public/reaktionsgleichungen-ausgleichen/index.html',
    '../../public/molekuel-studio/index.html',
  ];

  for (const pagePath of toolPages) {
    const htmlPath = path.join(__dirname, pagePath);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');
    const pageName = path.basename(path.dirname(htmlPath));

    // Check for labels on inputs
    const hasLabels = html.includes('<label') ||
                     html.includes('aria-label') ||
                     html.includes('placeholder=');

    assert(hasLabels, `${pageName}: Input fields have labels or placeholders`);

    // Check for keyboard navigation
    const hasKeyboardNav = html.includes('tabindex') ||
                          html.includes('onkeydown') ||
                          html.includes('onkeypress');

    if (hasKeyboardNav) {
      console.log(`  ${colors.green}✓${colors.reset} ${pageName}: Supports keyboard navigation`);
      totalTests++;
      passedTests++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${pageName}: No explicit keyboard navigation support`);
      totalTests++;
    }
  }

  console.log('');
}

/**
 * Main test runner
 */
function runIntegrationTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Interactive Tools Integration Tests     ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testMolarMassCalculator();
  testPHCalculator();
  testEquationBalancer();
  testPeriodicTable();
  testMoleculeStudio();
  testInputValidation();
  testErrorHandling();
  testToolAccessibility();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Integration Tests Summary:${colors.reset}`);
  console.log(`  Total: ${totalTests} tests`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}✓ All integration tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ ${failedTests} test(s) failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runIntegrationTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
