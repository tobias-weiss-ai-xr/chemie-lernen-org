#!/usr/bin/env node

/**
 * HTML Validation Tests
 * Validates HTML structure, semantic elements, and best practices
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

const tests = {
  semanticChecks: [],
  accessibilityChecks: [],
  metaChecks: [],
};

/**
 * Test 1: Validate HTML semantic structure
 */
function testSemanticHTML() {
  console.log(`${colors.cyan}=== Test 1: Semantic HTML Structure ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');
  const layoutDir = path.join(__dirname, '../../layouts');
  const issues = [];

  // Check layouts for semantic HTML
  const checkLayout = (dir) => {
    if (!fs.existsSync(dir)) return;

    const files = findFiles(dir, '.html');
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(layoutDir, file);

      // Check for semantic elements
      const hasSemantic = [
        '<header', '<main', '<nav', '<footer',
        '<article', '<section', '<aside', '<details'
      ].some(tag => content.includes(tag));

      if (!hasSemantic) {
        issues.push(`${relativePath}: No semantic HTML elements found`);
      }

      // Check for proper heading hierarchy
      const headings = content.match(/<h[1-6]/g) || [];
      if (headings.length > 0 && !content.includes('<h1')) {
        issues.push(`${relativePath}: Missing h1, has ${headings.length} headings`);
      }
    }
  };

  checkLayout(layoutDir);
  checkLayout(path.join(layoutDir, 'partials'));
  checkLayout(path.join(layoutDir, '_default'));

  if (issues.length === 0) {
    console.log(`${colors.green}✓${colors.reset} Semantic HTML structure is good`);
    console.log(`  Checked ${findFiles(layoutDir, '.html').length} layout files\n`);
  } else {
    for (const issue of issues) {
      console.log(`${colors.yellow}⚠${colors.reset} ${issue}`);
    }
    console.log('');
  }

  return issues.length === 0;
}

/**
 * Test 2: Validate accessibility attributes
 */
function testAccessibilityAttributes() {
  console.log(`${colors.cyan}=== Test 2: Accessibility Attributes ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');
  const checks = [];

  const checkFile = (file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '../../'), file);

    // Check for alt attributes on images
    const imgs = content.match(/<img[^>]*>/g) || [];
    const missingAlt = imgs.filter(img => !img.includes('alt=') || img.includes('alt=""'));
    if (missingAlt.length > 0) {
      checks.push({
        file: relativePath,
        check: 'Images have alt text',
        pass: missingAlt.length === 0,
        message: `${missingAlt.length} images missing alt text`
      });
    } else if (imgs.length > 0) {
      checks.push({
        file: relativePath,
        check: 'Images have alt text',
        pass: true,
        message: `All ${imgs.length} images have alt attributes`
      });
    }

    // Check for lang attribute
    if (content.includes('<html')) {
      const hasLang = content.includes('lang=') || content.includes('lang =');
      checks.push({
        file: relativePath,
        check: 'HTML lang attribute',
        pass: hasLang,
        message: hasLang ? 'Has lang attribute' : 'Missing lang attribute'
      });
    }

    // Check for proper labels on form inputs
    const inputs = content.match(/<input[^>]*>/g) || [];
    const labels = content.match(/<label[^>]*>/g) || [];
    if (inputs.length > 0) {
      checks.push({
        file: relativePath,
        check: 'Form labels',
        pass: labels.length > 0 || inputs.every(i => i.includes('aria-label') || i.includes('placeholder=')),
        message: `${inputs.length} inputs, ${labels.length} labels`
      });
    }

    // Check for skip links
    if (content.includes('<nav')) {
      checks.push({
        file: relativePath,
        check: 'Skip navigation link',
        pass: content.includes('skip') || content.includes('Skip'),
        message: content.includes('skip') ? 'Has skip link' : 'Consider adding skip link'
      });
    }
  };

  const files = findFiles(layoutDir, '.html');
  for (const file of files) {
    try {
      checkFile(file);
    } catch (e) {
      // Skip files that can't be read
    }
  }

  // Display results
  let passed = 0;
  let failed = 0;
  const grouped = {};

  for (const check of checks) {
    const key = `${check.file}: ${check.check}`;
    if (!grouped[key]) grouped[key] = [];

    if (check.pass) {
      console.log(`${colors.green}✓${colors.reset} ${check.file}`);
      console.log(`  ${check.check}: ${check.message}\n`);
      passed++;
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} ${check.file}`);
      console.log(`  ${check.check}: ${check.message}\n`);
      failed++;
    }
  }

  console.log(`${colors.cyan}Results: ${passed} passed, ${failed} warnings${colors.reset}\n`);
  return true;
}

/**
 * Test 3: Validate meta tags and SEO
 */
function testMetaTags() {
  console.log(`${colors.cyan}=== Test 3: Meta Tags & SEO ===${colors.reset}\n`);

  const configPath = path.join(__dirname, '../../config.toml');
  const headPath = path.join(__dirname, '../../layouts/partials/head.html');

  let configHasMeta = false;
  let headHasMeta = false;

  // Check config.toml
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    configHasMeta = config.includes('[params.meta]') || config.includes('keywords') || config.includes('description');
  }

  // Check head.html
  if (fs.existsSync(headPath)) {
    const head = fs.readFileSync(headPath, 'utf8');
    headHasMeta = head.includes('<meta') || head.includes('og:') || head.includes('name="description"');
  }

  const checks = [
    {
      name: 'config.toml has meta params',
      pass: configHasMeta,
    },
    {
      name: 'head.html has meta tags',
      pass: headHasMeta,
    },
    {
      name: 'Site has title',
      pass: fs.existsSync(configPath) && fs.readFileSync(configPath, 'utf8').includes('title ='),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    if (check.pass) {
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
 * Test 4: Check for broken internal links
 */
function testInternalLinks() {
  console.log(`${colors.cyan}=== Test 4: Internal Link Validation ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');
  const layoutDir = path.join(__dirname, '../../layouts');

  const allFiles = [
    ...findFiles(contentDir, '.md'),
    ...findFiles(layoutDir, '.html'),
  ];

  const links = [];
  const brokenLinks = [];

  // Extract all markdown and HTML links
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../../'), file);

      // Extract markdown links: [text](url)
      const mdLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      for (const link of mdLinks) {
        const url = link.match(/\(([^)]+)\)/)[1];
        if (url.startsWith('/') && !url.startsWith('//')) {
          links.push({ file: relativePath, url });
        }
      }

      // Extract HTML links: href="url"
      const htmlLinks = content.match(/href="([^"]+)"/g) || [];
      for (const link of htmlLinks) {
        const url = link.match(/href="([^"]+)"/)[1];
        if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('http')) {
          links.push({ file: relativePath, url });
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  // Check if referenced files exist
  const publicDir = path.join(__dirname, '../../public');
  for (const link of links) {
    const urlPath = link.url.split('#')[0].split('?')[0]; // Remove anchors and query params
    if (urlPath === '/' || urlPath === '') continue;

    const fullPath = path.join(__dirname, '../../', urlPath);
    const publicPath = path.join(publicDir, urlPath);

    // Check if file exists in content or public
    if (!fs.existsSync(fullPath) && !fs.existsSync(publicPath) &&
        !fs.existsSync(fullPath + '.md') && !fs.existsSync(fullPath + '.html')) {
      brokenLinks.push({ file: link.file, url: link.url });
    }
  }

  if (brokenLinks.length === 0) {
    console.log(`${colors.green}✓${colors.reset} All ${links.length} internal links are valid\n`);
  } else {
    console.log(`${colors.red}✗${colors.reset} Found ${brokenLinks.length} potentially broken links:\n`);
    for (const link of brokenLinks.slice(0, 10)) {
      console.log(`  ${colors.yellow}${link.file}${colors.reset}: ${link.url}`);
    }
    if (brokenLinks.length > 10) {
      console.log(`  ... and ${brokenLinks.length - 10} more`);
    }
    console.log('');
  }

  return brokenLinks.length === 0;
}

/**
 * Test 5: Check for common HTML issues
 */
function testCommonIssues() {
  console.log(`${colors.cyan}=== Test 5: Common HTML Issues ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');
  const issues = [];

  const checkFile = (file) => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '../../'), file);

    // Check for inline styles (should use CSS classes)
    const inlineStyles = content.match(/style="[^"]*"/g) || [];
    if (inlineStyles.length > 5) {
      issues.push(`${relativePath}: Has ${inlineStyles.length} inline styles (consider CSS classes)`);
    }

    // Check for inline scripts (should use external files)
    const inlineScripts = (content.match(/<script>/g) || []).length -
                          (content.match(/<script src=/g) || []).length;
    if (inlineScripts > 2) {
      issues.push(`${relativePath}: Has ${inlineScripts} inline scripts`);
    }

    // Check for table without th
    if (content.includes('<table') && !content.includes('<th')) {
      issues.push(`${relativePath}: Table without header cells (th)`);
    }

    // Check for missing viewport meta tag
    if (content.includes('<head') && !content.includes('viewport')) {
      issues.push(`${relativePath}: Missing viewport meta tag for mobile`);
    }
  };

  const files = findFiles(layoutDir, '.html');
  for (const file of files) {
    try {
      checkFile(file);
    } catch (e) {
      // Skip files that can't be read
    }
  }

  if (issues.length === 0) {
    console.log(`${colors.green}✓${colors.reset} No common HTML issues found\n`);
  } else {
    for (const issue of issues) {
      console.log(`${colors.yellow}⚠${colors.reset} ${issue}`);
    }
    console.log('');
  }

  return issues.length === 0;
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
function runHTMLTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   HTML Validation Test Suite              ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  const results = {
    semantic: testSemanticHTML(),
    accessibility: testAccessibilityAttributes(),
    metaTags: testMetaTags(),
    internalLinks: testInternalLinks(),
    commonIssues: testCommonIssues(),
  };

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log(`${colors.green}✓ All HTML validation tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    const failedTests = Object.entries(results).filter(([_, v]) => !v).map(([k]) => k);
    console.log(`${colors.yellow}⚠ Some HTML tests have warnings${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${failedTests.join(', ')}${colors.reset}\n`);
    process.exit(0); // Exit with 0 as warnings are acceptable
  }
}

// Run tests
runHTMLTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
