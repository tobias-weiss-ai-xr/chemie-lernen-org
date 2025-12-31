#!/usr/bin/env node

/**
 * Mobile Responsiveness Tests
 * Tests mobile viewport, touch targets, and responsive design
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
let warnings = 0;

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

function warn(message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
  warnings++;
}

/**
 * Test 1: Viewport Meta Tag
 */
function testViewportMetaTag() {
  console.log(`${colors.cyan}=== Test 1: Viewport Configuration ===${colors.reset}\n`);

  const headPath = path.join(__dirname, '../../layouts/partials/head.html');

  if (!fs.existsSync(headPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} head.html not found\n`);
    return;
  }

  const head = fs.readFileSync(headPath, 'utf8');

  assert(head.includes('viewport'), 'Has viewport meta tag');
  assert(head.includes('width=device-width'), 'Viewport width set to device-width');
  assert(head.includes('initial-scale=1'), 'Initial scale set to 1.0');

  // Check for shrink-to-fit (iOS Safari)
  if (head.includes('shrink-to-fit')) {
    console.log(`  ${colors.green}✓${colors.reset} Has shrink-to-fit=no (better iOS support)`);
    passedTests++;
    totalTests++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Missing shrink-to-fit=no (recommended for iOS)`);
    warnings++;
    totalTests++;
  }

  console.log('');
}

/**
 * Test 2: Touch Target Sizes
 */
function testTouchTargetSizes() {
  console.log(`${colors.cyan}=== Test 2: Touch Target Sizes ===${colors.reset}\n`);

  const cssDir = path.join(__dirname, '../../static/css');
  const publicCssDir = path.join(__dirname, '../../public/css');

  const cssDirs = [cssDir, publicCssDir];
  let hasMinTouchSize = false;
  let hasButtonStyles = false;

  for (const dir of cssDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = findFiles(dir, '.css');
    for (const file of files) {
      const css = fs.readFileSync(file, 'utf8');

      // Check for minimum touch target size (44x44px recommended)
      if (css.includes('min-height') && (css.includes('44px') || css.includes('3rem'))) {
        hasMinTouchSize = true;
      }

      // Check for button styling
      if (css.includes('button') || css.includes('.btn')) {
        hasButtonStyles = true;
        const buttonSection = css.match(/button\s*{[^}]+}/g) || css.match(/\.btn[^{]*{[^}]+}/g);
        if (buttonSection) {
          for (const section of buttonSection) {
            if ((section.includes('padding') && section.includes('1rem')) ||
                (section.includes('min-height') && parseInt(section.match(/\d+/)?.[0] || '0') >= 40)) {
              hasMinTouchSize = true;
            }
          }
        }
      }
    }
  }

  assert(hasButtonStyles, 'Has button/link styles defined');
  assert(hasMinTouchSize, 'Touch targets meet minimum size (44px/3rem)');

  console.log('');
}

/**
 * Test 3: Responsive Images
 */
function testResponsiveImages() {
  console.log(`${colors.cyan}=== Test 3: Responsive Images ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');
  const contentDir = path.join(__dirname, '../../content');

  const files = [
    ...findFiles(layoutDir, '.html'),
    ...findFiles(contentDir, '.md'),
  ];

  let hasSrcset = 0;
  let hasSizes = 0;
  let totalImages = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check HTML images
      const htmlImages = content.match(/<img[^>]*>/g) || [];
      totalImages += htmlImages.length;

      for (const img of htmlImages) {
        if (img.includes('srcset=')) hasSrcset++;
        if (img.includes('sizes=')) hasSizes++;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Total images: ${totalImages}${colors.reset}`);
  console.log(`  ${colors.blue}Images with srcset: ${hasSrcset}${colors.reset}`);
  console.log(`  ${colors.blue}Images with sizes: ${hasSizes}${colors.reset}`);

  if (totalImages > 0 && hasSrcset === 0) {
    console.log(`  ${colors.yellow}⚠${colors.reset} No responsive images found (srcset)`);
    warnings++;
  } else {
    console.log(`  ${colors.green}✓${colors.reset} Has responsive image support`);
    passedTests++;
  }
  totalTests++;

  console.log('');
}

/**
 * Test 4: Mobile Navigation
 */
function testMobileNavigation() {
  console.log(`${colors.cyan}=== Test 4: Mobile Navigation ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');

  // Check for mobile menu implementation
  const hasHamburgerMenu = checkFileContains(layoutDir, 'hamburger', 'menu-button', 'nav-toggle', 'mobile-menu');
  const hasCSSMediaQueries = checkCSSForMediaQueries();
  const hasMobileJS = checkFileContains(layoutDir, 'mobile', 'toggleMenu', 'menuToggle');

  assert(hasCSSMediaQueries, 'Has CSS media queries for responsive design');
  assert(hasHamburgerMenu, 'Has mobile menu button/hamburger icon');
  assert(hasMobileJS, 'Has JavaScript for mobile menu toggle');

  console.log('');
}

/**
 * Test 5: Readability on Mobile
 */
function testMobileReadability() {
  console.log(`${colors.cyan}=== Test 5: Mobile Readability ===${colors.reset}\n`);

  const cssDir = path.join(__dirname, '../../static/css');

  if (!fs.existsSync(cssDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} CSS directory not found\n`);
    return;
  }

  const cssFiles = findFiles(cssDir, '.css');
  let hasResponsiveFont = false;
  let hasLineHeight = false;
  let hasMaxWidth = false;

  for (const file of cssFiles) {
    const css = fs.readFileSync(file, 'utf8');

    // Check for responsive font sizes
    if (css.includes('rem') || css.includes('em') || css.includes('vw') || css.includes('clamp(')) {
      hasResponsiveFont = true;
    }

    // Check for line height (readability)
    if (css.includes('line-height')) {
      hasLineHeight = true;
    }

    // Check for max-width on content (prevents text too wide on mobile)
    if (css.includes('max-width') && (css.includes('content') || css.includes('article') || css.includes('main'))) {
      hasMaxWidth = true;
    }
  }

  assert(hasResponsiveFont, 'Uses responsive font units (rem/em/vw)');
  assert(hasLineHeight, 'Has line-height for readability');
  assert(hasMaxWidth, 'Content has max-width to prevent overly wide text');

  console.log('');
}

/**
 * Test 6: Mobile-Specific CSS
 */
function testMobileCSS() {
  console.log(`${colors.cyan}=== Test 6: Mobile-Specific CSS ===${colors.reset}\n`);

  const cssDir = path.join(__dirname, '../../static/css');

  if (!fs.existsSync(cssDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} CSS directory not found\n`);
    return;
  }

  const cssFiles = findFiles(cssDir, '.css');
  let hasMobileBreakpoint = false;
  let hasFlexbox = false;
  let hasGridSupport = false;

  for (const file of cssFiles) {
    const css = fs.readFileSync(file, 'utf8');

    // Check for mobile-first or mobile breakpoints
    if (css.includes('@media') && (css.includes('max-width') || css.includes('min-width'))) {
      hasMobileBreakpoint = true;
    }

    // Check for modern layout systems
    if (css.includes('display: flex') || css.includes('flexbox')) {
      hasFlexbox = true;
    }

    if (css.includes('display: grid') || css.includes('grid-template')) {
      hasGridSupport = true;
    }
  }

  assert(hasMobileBreakpoint, 'Has media queries for responsive breakpoints');
  assert(hasFlexbox, 'Uses Flexbox for layout');
  assert(hasGridSupport, 'Uses CSS Grid (modern layouts)');

  console.log('');
}

/**
 * Test 7: Form Input on Mobile
 */
function testMobileFormInputs() {
  console.log(`${colors.cyan}=== Test 7: Mobile Form Inputs ===${colors.reset}\n`);

  const pages = [
    '../../public/molare-masse-rechner/index.html',
    '../../public/ph-rechner/index.html',
    '../../public/reaktionsgleichungen-ausgleichen/index.html',
  ];

  let hasInputTypes = 0;
  let hasInputMode = 0;

  for (const pagePath of pages) {
    const htmlPath = path.join(__dirname, pagePath);
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Check for appropriate input types
    if (html.includes('input type="number"') || html.includes("input type='number'")) {
      hasInputTypes++;
    }

    // Check for inputmode (better mobile keyboard)
    if (html.includes('inputmode=')) {
      hasInputMode++;
    }
  }

  console.log(`  ${colors.blue}Pages with proper input types: ${hasInputTypes}${colors.reset}`);
  console.log(`  ${colors.blue}Pages with inputmode attribute: ${hasInputMode}${colors.reset}`);

  if (hasInputTypes > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Uses proper input types for mobile`);
    passedTests++;
    totalTests++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Consider using input type="number" for numeric inputs`);
    warnings++;
    totalTests++;
  }

  if (hasInputMode > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Uses inputmode for better mobile keyboards`);
    passedTests++;
    totalTests++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Consider adding inputmode for better mobile keyboard experience`);
    warnings++;
    totalTests++;
  }

  console.log('');
}

/**
 * Test 8: Text Size & Scaling
 */
function testTextScaling() {
  console.log(`${colors.cyan}=== Test 8: Text Size & Scaling ===${colors.reset}\n`);

  const cssDir = path.join(__dirname, '../../static/css');

  if (!fs.existsSync(cssDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} CSS directory not found\n`);
    return;
  }

  const cssFiles = findFiles(cssDir, '.css');
  let hasRootFontSize = false;
  let noTextZoomDisabled = true;

  for (const file of cssFiles) {
    const css = fs.readFileSync(file, 'utf8');

    // Check for root font size
    if (css.includes('html') && css.includes('font-size')) {
      hasRootFontSize = true;
    }

    // Check if text zoom is disabled (bad practice)
    if (css.includes('text-size-adjust: none') || css.includes('-webkit-text-size-adjust: none')) {
      noTextZoomDisabled = false;
    }
  }

  assert(hasRootFontSize, 'Has root font-size defined');
  assert(noTextZoomDisabled, 'Does not disable text zoom (accessibility)');

  console.log('');
}

/**
 * Helper: Check if files in directory contain any of the keywords
 */
function checkFileContains(dir, ...keywords) {
  const files = findFiles(dir, '.html');
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
        return true;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }
  return false;
}

/**
 * Helper: Check CSS for media queries
 */
function checkCSSForMediaQueries() {
  const cssDir = path.join(__dirname, '../../static/css');
  if (!fs.existsSync(cssDir)) return false;

  const files = findFiles(cssDir, '.css');
  for (const file of files) {
    const css = fs.readFileSync(file, 'utf8');
    if (css.includes('@media')) return true;
  }
  return false;
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
function runMobileTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Mobile Responsiveness Test Suite      ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testViewportMetaTag();
  testTouchTargetSizes();
  testResponsiveImages();
  testMobileNavigation();
  testMobileReadability();
  testMobileCSS();
  testMobileFormInputs();
  testTextScaling();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Mobile Tests Summary:${colors.reset}`);
  console.log(`  Total: ${totalTests} tests`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Warnings: ${warnings}\n`);

  if (failedTests === 0) {
    console.log(`${colors.green}✓ All mobile tests passed!${colors.reset}`);
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠ ${warnings} warning(s) - improvements suggested${colors.reset}`);
    }
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ ${failedTests} test(s) failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runMobileTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
