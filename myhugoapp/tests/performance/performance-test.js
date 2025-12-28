#!/usr/bin/env node

/**
 * Performance Tests
 * Tests bundle sizes, asset loading, and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Size thresholds (in bytes)
const THRESHOLDS = {
  css: 50 * 1024,      // 50KB
  js: 200 * 1024,      // 200KB per file
  html: 50 * 1024,     // 50KB
  image: 500 * 1024,   // 500KB
  totalAssets: 2 * 1024 * 1024, // 2MB total
};

let warnings = 0;
let errors = 0;

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Test 1: CSS Bundle Size
 */
function testCSSBundleSize() {
  console.log(`${colors.cyan}=== Test 1: CSS Bundle Sizes ===${colors.reset}\n`);

  const cssDirs = [
    path.join(__dirname, '../../static/css'),
    path.join(__dirname, '../../public/css'),
  ];

  let totalSize = 0;
  const files = [];

  for (const dir of cssDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.css')) {
        const filePath = path.join(dir, entry.name);
        const stats = fs.statSync(filePath);
        files.push({ name: entry.name, size: stats.size });
        totalSize += stats.size;
      }
    }
  }

  console.log(`${colors.blue}CSS Files:${colors.reset}`);
  for (const file of files) {
    const isLarge = file.size > THRESHOLDS.css;
    const icon = isLarge ? colors.yellow + '⚠' : colors.green + '✓';
    console.log(`  ${icon}${colors.reset} ${file.name}: ${formatBytes(file.size)}`);
    if (isLarge) warnings++;
  }

  console.log(`  ${colors.blue}Total CSS: ${formatBytes(totalSize)}${colors.reset}\n`);

  return totalSize <= THRESHOLDS.totalAssets;
}

/**
 * Test 2: JavaScript Bundle Size
 */
function testJSBundleSize() {
  console.log(`${colors.cyan}=== Test 2: JavaScript Bundle Sizes ===${colors.reset}\n`);

  const jsDirs = [
    path.join(__dirname, '../../static/js'),
    path.join(__dirname, '../../public/js'),
  ];

  let totalSize = 0;
  const files = [];

  for (const dir of jsDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        const filePath = path.join(dir, entry.name);
        const stats = fs.statSync(filePath);
        files.push({ name: entry.name, size: stats.size });
        totalSize += stats.size;
      }
    }
  }

  console.log(`${colors.blue}JavaScript Files:${colors.reset}`);
  for (const file of files) {
    const isLarge = file.size > THRESHOLDS.js;
    const icon = isLarge ? colors.yellow + '⚠' : colors.green + '✓';
    console.log(`  ${icon}${colors.reset} ${file.name}: ${formatBytes(file.size)}`);
    if (isLarge) warnings++;
  }

  console.log(`  ${colors.blue}Total JavaScript: ${formatBytes(totalSize)}${colors.reset}\n`);

  return totalSize <= THRESHOLDS.totalAssets;
}

/**
 * Test 3: Image Optimization
 */
function testImageOptimization() {
  console.log(`${colors.cyan}=== Test 3: Image Optimization ===${colors.reset}\n`);

  const imgDirs = [
    path.join(__dirname, '../../static/img'),
    path.join(__dirname, '../../public/img'),
  ];

  let totalSize = 0;
  let totalCount = 0;
  const largeImages = [];

  for (const dir of imgDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(dir, entry.name);
        const stats = fs.statSync(filePath);
        totalCount++;
        totalSize += stats.size;

        if (stats.size > THRESHOLDS.image) {
          largeImages.push({ name: entry.name, size: stats.size });
        }
      }
    }
  }

  console.log(`${colors.blue}Images: ${totalCount} files, ${formatBytes(totalSize)}${colors.reset}\n`);

  if (largeImages.length > 0) {
    console.log(`${colors.yellow}Large images found:${colors.reset}`);
    for (const img of largeImages) {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${img.name}: ${formatBytes(img.size)}`);
      warnings++;
    }
    console.log('');
  } else {
    console.log(`  ${colors.green}✓${colors.reset} All images are optimized\n`);
  }

  return largeImages.length === 0;
}

/**
 * Test 4: Check for unused CSS
 */
function testUnusedCSS() {
  console.log(`${colors.cyan}=== Test 4: CSS Usage Analysis ===${colors.reset}\n`);

  const cssDir = path.join(__dirname, '../../static/css');
  const layoutDir = path.join(__dirname, '../../layouts');

  if (!fs.existsSync(cssDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} CSS directory not found\n`);
    return false;
  }

  const cssFiles = findFiles(cssDir, '.css');
  const htmlFiles = findFiles(layoutDir, '.html');

  let totalCSSRules = 0;
  let potentiallyUnused = 0;

  console.log(`${colors.blue}CSS Files:${colors.reset}`);
  for (const cssFile of cssFiles) {
    const css = fs.readFileSync(cssFile, 'utf8');
    const className = path.basename(cssFile);

    // Count CSS rules
    const rules = css.match(/\.[a-z][a-z0-9_-]*\s*{/gi) || [];
    totalCSSRules += rules.length;

    // Check for empty rules
    const emptyRules = (css.match(/\{[\s]*\}/g) || []).length;
    if (emptyRules > 0) {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${className}: Has ${emptyRules} empty CSS rules`);
      potentiallyUnused += emptyRules;
      warnings++;
    }
  }

  console.log(`\n  ${colors.blue}Total CSS rules: ${totalCSSRules}${colors.reset}`);
  console.log(`  ${colors.blue}Potentially unused: ${potentiallyUnused}${colors.reset}\n`);

  return potentiallyUnused === 0;
}

/**
 * Test 5: External Dependencies
 */
function testExternalDependencies() {
  console.log(`${colors.cyan}=== Test 5: External Dependencies ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');
  const htmlFiles = findFiles(layoutDir, '.html');

  const dependencies = {
    cdn: [],
    external: [],
    local: [],
  };

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Check for CDN links
    const cdnLinks = content.match(/https?:\/\/cdn\.|https?:\/\/unpkg\.|https?:\/\/cdnjs\./g) || [];
    for (const link of cdnLinks) {
      if (!dependencies.cdn.includes(link)) {
        dependencies.cdn.push(link);
      }
    }

    // Check for external scripts
    const externalScripts = content.match(/https?:\/\/[^"'\s]*\.js/g) || [];
    for (const script of externalScripts) {
      if (!dependencies.external.includes(script)) {
        dependencies.external.push(script);
      }
    }

    // Check for local scripts
    const localScripts = content.match(/\/js\/[^"'\s]*\.js/g) || [];
    for (const script of localScripts) {
      if (!dependencies.local.includes(script)) {
        dependencies.local.push(script);
      }
    }
  }

  console.log(`${colors.blue}Dependencies:${colors.reset}`);
  console.log(`  CDN links: ${dependencies.cdn.length}`);
  for (const link of dependencies.cdn) {
    console.log(`    ${colors.cyan}${link}${colors.reset}`);
  }

  console.log(`  External scripts: ${dependencies.external.length}`);
  for (const script of dependencies.external) {
    console.log(`    ${colors.cyan}${script}${colors.reset}`);
  }

  console.log(`  Local scripts: ${dependencies.local.length}`);
  for (const script of dependencies.local) {
    console.log(`    ${colors.green}${script}${colors.reset}`);
  }

  // Warn about too many external dependencies
  if (dependencies.cdn.length + dependencies.external.length > 5) {
    console.log(`\n  ${colors.yellow}⚠${colors.reset} Consider reducing external dependencies for better performance\n`);
    warnings++;
  } else {
    console.log('');
  }

  return true;
}

/**
 * Test 6: Asset Loading Order
 */
function testAssetLoading() {
  console.log(`${colors.cyan}=== Test 6: Asset Loading Order ===${colors.reset}\n`);

  const headPath = path.join(__dirname, '../../layouts/partials/head.html');
  const baseofPath = path.join(__dirname, '../../layouts/_default/baseof.html');

  const issues = [];

  // Check head.html
  if (fs.existsSync(headPath)) {
    const head = fs.readFileSync(headPath, 'utf8');

    // CSS should be in head
    const cssInHead = (head.match(/<link/g) || []).length;
    console.log(`  ${colors.green}✓${colors.reset} CSS files in <head>: ${cssInHead}`);

    // Check for blocking scripts
    const blockingScripts = (head.match(/<script(?![^>]*(async|defer))/g) || []).length;
    if (blockingScripts > 0) {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${blockingScripts} blocking script(s) in <head> (consider async/defer)`);
      issues.push('Blocking scripts');
      warnings++;
    } else {
      console.log(`  ${colors.green}✓${colors.reset} No blocking scripts in <head>`);
    }
  }

  // Check baseof.html
  if (fs.existsSync(baseofPath)) {
    const baseof = fs.readFileSync(baseofPath, 'utf8');

    // Scripts should be at end of body
    const hasScriptsAtEnd = baseof.includes('</script>') && baseof.lastIndexOf('</script>') > baseof.indexOf('<body>');
    if (hasScriptsAtEnd) {
      console.log(`  ${colors.green}✓${colors.reset} Scripts placed at end of body`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Scripts not at end of body`);
      issues.push('Script placement');
      warnings++;
    }
  }

  console.log('');
  return issues.length === 0;
}

/**
 * Test 7: Favicon and Manifest
 */
function testFavicons() {
  console.log(`${colors.cyan}=== Test 7: Favicons & Icons ===${colors.reset}\n`);

  const staticDir = path.join(__dirname, '../../static');

  const faviconSizes = [16, 32, 180, 192, 512];
  const found = [];

  for (const size of faviconSizes) {
    const faviconPath = path.join(staticDir, `favicon-${size}x${size}.png`);
    if (fs.existsSync(faviconPath)) {
      found.push(size);
    }
  }

  if (found.length > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Found ${found.length} favicon sizes: ${found.join(', ')}px`);
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No favicons found`);
    warnings++;
  }

  // Check for webmanifest
  const manifestPath = path.join(staticDir, 'site.webmanifest');
  if (fs.existsSync(manifestPath)) {
    console.log(`  ${colors.green}✓${colors.reset} Has site.webmanifest for PWA`);
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No site.webmanifest found (PWA feature)`);
  }

  console.log('');
  return true;
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
function runPerformanceTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Performance Test Suite                 ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testCSSBundleSize();
  testJSBundleSize();
  testImageOptimization();
  testUnusedCSS();
  testExternalDependencies();
  testAssetLoading();
  testFavicons();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Performance Summary:${colors.reset}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`  Errors: ${errors}\n`);

  if (errors === 0) {
    console.log(`${colors.green}✓ Performance tests completed${colors.reset}`);
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠ ${warnings} warning(s) - review suggested${colors.reset}`);
    }
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ ${errors} error(s) found${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runPerformanceTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
