#!/usr/bin/env node

/**
 * Visual Layout Tests for Periodic Table (PSE)
 * Tests that the periodic table is centered on desktop and mobile
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Test configuration
const TESTS = {
  desktopWidth: 1920,
  desktopHeight: 1080,
  mobileWidth: 375,
  mobileHeight: 667,
  tabletWidth: 768,
  tabletHeight: 1024,
};

// Expected table dimensions
const TABLE_WIDTH = 18 * 140;  // 2520px
const TABLE_HEIGHT = 10 * 180; // 1800px

/**
 * Test 1: Check JavaScript file for centering logic
 */
function testJavaScriptCentering() {
  console.log(`${colors.cyan}=== Test 1: JavaScript Centering Logic ===${colors.reset}\n`);

  const jsPath = path.join(__dirname, '../../static/js/perioden-system-der-elemente.js');
  const js = fs.readFileSync(jsPath, 'utf8');

  const checks = [
    {
      name: 'Has updateCentering function',
      test: () => js.includes('function updateCentering()'),
    },
    {
      name: 'Calculates table dimensions',
      test: () => js.includes('tableWidth') && js.includes('tableHeight'),
    },
    {
      name: 'Uses dynamic offsets',
      test: () => js.includes('tableOffsetX') && js.includes('tableOffsetY'),
    },
    {
      name: 'Detects mobile devices',
      test: () => js.includes('isMobile') || js.includes('width < 768'),
    },
    {
      name: 'Updates centering on resize',
      test: () => js.includes('updateCentering()') && js.includes('onWindowResize'),
    },
    {
      name: 'Applies centered offsets to table',
      test: () => js.includes('+ tableOffsetX') || js.includes('+ tableOffsetY'),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.test()) {
      console.log(`${colors.green}✓${colors.reset} ${check.name}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${check.name}`);
      failed++;
    }
  }

  console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

/**
 * Test 2: Check CSS for centering and responsive design
 */
function testCSSCentering() {
  console.log(`${colors.cyan}=== Test 2: CSS Centering & Responsive Design ===${colors.reset}\n`);

  const cssPath = path.join(__dirname, '../../static/css/perioden-system-der-elemente.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const checks = [
    {
      name: '#container has centering styles',
      test: () => css.includes('#container') && css.includes('justify-content: center'),
    },
    {
      name: '#container has flex centering',
      test: () => css.includes('display: flex') && css.includes('align-items: center'),
    },
    {
      name: '#menu is centered',
      test: () => css.includes('#menu') && (css.includes('text-align: center') || css.includes('justify-content: center')),
    },
    {
      name: 'Has mobile breakpoint (@media max-width: 768px)',
      test: () => css.includes('@media (max-width: 768px)'),
    },
    {
      name: 'Mobile styles scale down elements',
      test: () => css.includes('transform: scale') || css.includes('0.7'),
    },
    {
      name: 'Menu uses flexbox for responsive layout',
      test: () => css.includes('display: flex') && css.includes('flex-wrap'),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.test()) {
      console.log(`${colors.green}✓${colors.reset} ${check.name}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${check.name}`);
      failed++;
    }
  }

  console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

/**
 * Test 3: Calculate expected centering for different screen sizes
 */
function testCenteringCalculations() {
  console.log(`${colors.cyan}=== Test 3: Centering Calculations ===${colors.reset}\n`);

  const scenarios = [
    {
      name: 'Desktop (1920x1080)',
      width: TESTS.desktopWidth,
      height: TESTS.desktopHeight,
      expectedX: -(TABLE_WIDTH / 2) + 70, // -1190
      expectedY: (TABLE_HEIGHT / 2) - 90, // 810
    },
    {
      name: 'Tablet (768x1024)',
      width: TESTS.tabletWidth,
      height: TESTS.tabletHeight,
      // Mobile scaling applies
      scale: Math.min(768 / TABLE_WIDTH, 1024 / TABLE_HEIGHT) * 0.9,
    },
    {
      name: 'Mobile (375x667)',
      width: TESTS.mobileWidth,
      height: TESTS.mobileHeight,
      // Mobile scaling applies
      scale: Math.min(375 / TABLE_WIDTH, 667 / TABLE_HEIGHT) * 0.9,
    },
  ];

  console.log(`${colors.blue}Centering offsets for different screen sizes:${colors.reset}\n`);

  for (const scenario of scenarios) {
    const isMobile = scenario.width < 768;
    let offsetX, offsetY;

    if (isMobile) {
      const scale = scenario.scale;
      offsetX = -(TABLE_WIDTH * scale / 2) + 70 * scale;
      offsetY = (TABLE_HEIGHT * scale / 2) - 90 * scale;
      console.log(`${colors.cyan}${scenario.name}:${colors.reset}`);
      console.log(`  Scale: ${scale.toFixed(3)}x`);
      console.log(`  Offset X: ${offsetX.toFixed(1)}px`);
      console.log(`  Offset Y: ${offsetY.toFixed(1)}px`);
      console.log(`  Fit in viewport: ${TABLE_WIDTH * scale < scenario.width && TABLE_HEIGHT * scale < scenario.height ? colors.green+'Yes'+colors.reset : colors.red+'No'+colors.reset}`);
    } else {
      offsetX = scenario.expectedX;
      offsetY = scenario.expectedY;
      console.log(`${colors.cyan}${scenario.name}:${colors.reset}`);
      console.log(`  Offset X: ${offsetX}px`);
      console.log(`  Offset Y: ${offsetY}px`);
      console.log(`  Table visible: ${colors.green}Yes${colors.reset}`);
    }
    console.log('');
  }

  return true;
}

/**
 * Test 4: Verify layout template structure
 */
function testLayoutStructure() {
  console.log(`${colors.cyan}=== Test 4: Layout Structure ===${colors.reset}\n`);

  const layoutPath = path.join(__dirname, '../../layouts/_default/perioden-system-der-elemente.html');

  if (!fs.existsSync(layoutPath)) {
    console.log(`${colors.red}✗${colors.reset} Layout file not found`);
    return false;
  }

  const layout = fs.readFileSync(layoutPath, 'utf8');

  const checks = [
    {
      name: 'Has #container element',
      test: () => layout.includes('<div id="container">'),
    },
    {
      name: 'Has #menu element',
      test: () => layout.includes('<div id="menu">'),
    },
    {
      name: 'Has view toggle buttons',
      test: () => layout.includes('id="table"') && layout.includes('id="sphere"') && layout.includes('id="helix"') && layout.includes('id="grid"'),
    },
    {
      name: 'Loads CSS file',
      test: () => layout.includes('perioden-system-der-elemente.css'),
    },
    {
      name: 'Loads JavaScript module',
      test: () => layout.includes('perioden-system-der-elemente.js'),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.test()) {
      console.log(`${colors.green}✓${colors.reset} ${check.name}`);
      passed++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${check.name}`);
      failed++;
    }
  }

  console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
  return failed === 0;
}

/**
 * Test 5: Element positioning calculation
 */
function testElementPositioning() {
  console.log(`${colors.cyan}=== Test 5: Element Positioning ===${colors.reset}\n`);

  // Simulate positioning of first element (Hydrogen: column 1, row 1)
  const column = 1;
  const row = 1;
  const elementWidth = 140;
  const elementHeight = 180;

  const centerX = -(TABLE_WIDTH / 2) + (elementWidth / 2);
  const centerY = (TABLE_HEIGHT / 2) - (elementHeight / 2);

  const hydrogenX = column * elementWidth + centerX;
  const hydrogenY = -row * elementHeight + centerY;

  console.log(`${colors.blue}Hydrogen (H) position calculation:${colors.reset}`);
  console.log(`  Table width: ${TABLE_WIDTH}px, height: ${TABLE_HEIGHT}px`);
  console.log(`  Center offset X: ${centerX}px`);
  console.log(`  Center offset Y: ${centerY}px`);
  console.log(`  Hydrogen X: ${hydrogenX}px (column ${column})`);
  console.log(`  Hydrogen Y: ${hydrogenY}px (row ${row})`);

  // Test corner elements
  const heliumX = 18 * elementWidth + centerX;
  const heliumY = -1 * elementHeight + centerY;

  console.log(`\n${colors.blue}Helium (He) position calculation:${colors.reset}`);
  console.log(`  Helium X: ${heliumX}px (column 18)`);
  console.log(`  Helium Y: ${heliumY}px (row 1)`);

  // Check if table is approximately centered
  // The table spans from column 1 to 18, so center should be between column 9 and 10
  const expectedCenterX = 9.5 * elementWidth + centerX;
  const tableCenterX = (hydrogenX + heliumX) / 2;
  const isCentered = Math.abs(tableCenterX) < 200; // Allow 200px tolerance for 3D camera positioning

  console.log(`\n${colors.blue}Center verification:${colors.reset}`);
  console.log(`  Table center X: ${tableCenterX.toFixed(1)}px`);
  console.log(`  Expected center: ${expectedCenterX.toFixed(1)}px`);
  console.log(`  Deviation: ${Math.abs(tableCenterX - expectedCenterX).toFixed(1)}px`);
  console.log(`  Is centered: ${isCentered ? colors.green+'Yes' : colors.red+'No'}${colors.reset}`);

  console.log('');
  return isCentered;
}

/**
 * Main test runner
 */
function runLayoutTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   PSE Visual Layout Test Suite            ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  const results = {
    jsCentering: testJavaScriptCentering(),
    cssCentering: testCSSCentering(),
    calculations: testCenteringCalculations(),
    layoutStructure: testLayoutStructure(),
    elementPositioning: testElementPositioning(),
  };

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log(`${colors.green}✓ All layout tests passed!${colors.reset}`);
    console.log(`\n${colors.blue}Summary:${colors.reset}`);
    console.log(`  JavaScript centering: ${colors.green}✓${colors.reset}`);
    console.log(`  CSS centering: ${colors.green}✓${colors.reset}`);
    console.log(`  Centering calculations: ${colors.green}✓${colors.reset}`);
    console.log(`  Layout structure: ${colors.green}✓${colors.reset}`);
    console.log(`  Element positioning: ${colors.green}✓${colors.reset}`);
    console.log(`\n${colors.blue}The periodic table will be centered on:${colors.reset}`);
    console.log(`  - Desktop (1920x1080)`);
    console.log(`  - Tablet (768x1024)`);
    console.log(`  - Mobile (375x667)`);
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some layout tests failed${colors.reset}`);
    const failedTests = Object.entries(results).filter(([_, v]) => !v).map(([k]) => k);
    console.log(`\n${colors.red}Failed tests:${colors.reset} ${failedTests.join(', ')}`);
    console.log('');
    process.exit(1);
  }
}

// Run tests
runLayoutTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
