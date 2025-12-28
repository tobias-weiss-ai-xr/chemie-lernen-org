#!/usr/bin/env node

/**
 * SEO and Meta Tag Tests
 * Validates SEO best practices, meta tags, Open Graph, etc.
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

let totalChecks = 0;
let passedChecks = 0;
let warnings = 0;

function check(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    passedChecks++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${message}`);
  }
}

function warn(message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
  warnings++;
}

/**
 * Test 1: Config.toml SEO Settings
 */
function testConfigSEO() {
  console.log(`${colors.cyan}=== Test 1: Config.toml SEO Settings ===${colors.reset}\n`);

  const configPath = path.join(__dirname, '../../config.toml');

  if (!fs.existsSync(configPath)) {
    console.log(`  ${colors.red}✗${colors.reset} config.toml not found\n`);
    return;
  }

  const config = fs.readFileSync(configPath, 'utf8');

  // Check for basic SEO settings
  check(config.includes('baseURL'), 'Has baseURL');
  check(config.includes('title ='), 'Has site title');
  check(config.includes('languageCode'), 'Has language code');

  // Check for params.meta section
  const hasMetaSection = config.includes('[params.meta]') || config.includes('keywords');
  check(hasMetaSection, 'Has meta params section');

  if (hasMetaSection) {
    check(config.includes('keywords'), 'Has keywords');
    check(config.includes('description'), 'Has description');
  }

  // Check for author
  check(config.includes('author ='), 'Has author information');

  console.log('');
}

/**
 * Test 2: HTML Meta Tags
 */
function testHTMLMetaTags() {
  console.log(`${colors.cyan}=== Test 2: HTML Meta Tags ===${colors.reset}\n`);

  const headPath = path.join(__dirname, '../../layouts/partials/head.html');

  if (!fs.existsSync(headPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} head.html not found, skipping\n`);
    return;
  }

  const head = fs.readFileSync(headPath, 'utf8');

  // Check for essential meta tags
  check(head.includes('<meta charset=') || head.includes('<meta charset ='), 'Has charset meta tag');
  check(head.includes('viewport'), 'Has viewport meta tag');
  check(head.includes('name="description"') || head.includes('name=\'description\''), 'Has description meta tag');

  // Check for Open Graph tags
  const hasOG = head.includes('og:') || head.includes('property="og');
  check(hasOG, 'Has Open Graph meta tags');

  if (hasOG) {
    check(head.includes('og:title'), 'Has og:title');
    check(head.includes('og:description') || head.includes('og:description'), 'Has og:description');
    check(head.includes('og:type'), 'Has og:type');
  }

  // Check for Twitter Card
  const hasTwitterCard = head.includes('twitter:card') || head.includes('name="twitter"');
  if (hasTwitterCard) {
    console.log(`  ${colors.green}✓${colors.reset} Has Twitter Card meta tags`);
    passedChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No Twitter Card meta tags (optional)`);
    warnings++;
  }
  totalChecks++;

  // Check for favicon
  check(head.includes('icon') || head.includes('favicon'), 'Has favicon link');

  console.log('');
}

/**
 * Test 3: Sitemap and Robots
 */
function testSitemapRobots() {
  console.log(`${colors.cyan}=== Test 3: Sitemap & Robots.txt ===${colors.reset}\n`);

  const staticDir = path.join(__dirname, '../../static');
  const layoutDir = path.join(__dirname, '../../layouts');
  const configPath = path.join(__dirname, '../../config.toml');

  // Check for robots.txt
  const robotsPath = path.join(staticDir, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    console.log(`  ${colors.green}✓${colors.reset} Has robots.txt`);
    passedChecks++;
    totalChecks++;

    // Check content
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (robots.includes('Sitemap:')) {
      console.log(`    ${colors.green}✓${colors.reset} References sitemap in robots.txt`);
      passedChecks++;
    } else {
      console.log(`    ${colors.yellow}⚠${colors.reset} No sitemap reference in robots.txt`);
      warnings++;
    }
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No robots.txt found`);
    warnings++;
    totalChecks++;
  }

  // Check config for sitemap generation
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    const enableRobots = config.includes('enableRobotsTXT') && config.includes('true');
    check(enableRobots, 'Hugo sitemap generation enabled');
  }

  console.log('');
}

/**
 * Test 4: Heading Structure
 */
function testHeadingStructure() {
  console.log(`${colors.cyan}=== Test 4: Heading Structure ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');
  const contentDir = path.join(__dirname, '../../content');

  const files = [
    ...findFiles(layoutDir, '.html'),
    ...findFiles(contentDir, '.md'),
  ];

  let hasH1 = 0;
  let properHierarchy = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../../'), file);

      // Check for h1
      if (content.includes('<h1') || content.includes('# ')) {
        hasH1++;
      }

      // Check heading hierarchy (simplified check)
      const headings = content.match(/<h[1-6]/g) || content.match(/^#{1,6}\s/gm) || [];
      if (headings.length > 0) {
        const hasMultipleH1 = (content.match(/<h1/g) || []).length > 1;
        if (!hasMultipleH1) {
          properHierarchy++;
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Files with h1: ${hasH1}${colors.reset}`);
  console.log(`  ${colors.blue}Files with proper hierarchy: ${properHierarchy}${colors.reset}`);

  if (hasH1 > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Pages have h1 headings`);
    passedChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No h1 headings found`);
    warnings++;
  }
  totalChecks++;

  console.log('');
}

/**
 * Test 5: Internal Linking
 */
function testInternalLinking() {
  console.log(`${colors.cyan}=== Test 5: Internal Linking ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');

  if (!fs.existsSync(contentDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Content directory not found\n`);
    return;
  }

  const files = findFiles(contentDir, '.md');
  let linkCount = 0;
  let withLinks = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

      if (links.length > 0) {
        withLinks++;
        linkCount += links.length;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Total internal links: ${linkCount}${colors.reset}`);
  console.log(`  ${colors.blue}Pages with links: ${withLinks}/${files.length}${colors.reset}`);

  if (withLinks > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Content has internal links`);
    passedChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No internal links found`);
    warnings++;
  }
  totalChecks++;

  console.log('');
}

/**
 * Test 6: Image Alt Attributes
 */
function testImageAltAttributes() {
  console.log(`${colors.cyan}=== Test 6: Image Alt Attributes ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');
  const layoutDir = path.join(__dirname, '../../layouts');

  const files = [
    ...findFiles(contentDir, '.md'),
    ...findFiles(layoutDir, '.html'),
  ];

  let totalImages = 0;
  let imagesWithAlt = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check markdown images
      const mdImages = content.match(/!\[([^\]]*)\]/g) || [];
      totalImages += mdImages.length;
      imagesWithAlt += mdImages.filter(img => !img.match(/!\[\]/)).length;

      // Check HTML images
      const htmlImages = content.match(/<img[^>]*>/g) || [];
      for (const img of htmlImages) {
        totalImages++;
        if (img.includes('alt=') && !img.includes('alt=""')) {
          imagesWithAlt++;
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Images with alt text: ${imagesWithAlt}/${totalImages}${colors.reset}`);

  if (totalImages > 0) {
    const percentage = Math.round((imagesWithAlt / totalImages) * 100);
    if (percentage >= 80) {
      console.log(`  ${colors.green}✓${colors.reset} ${percentage}% of images have alt text`);
      passedChecks++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Only ${percentage}% of images have alt text`);
      warnings++;
    }
  } else {
    console.log(`  ${colors.blue}No images found${colors.reset}`);
  }
  totalChecks++;

  console.log('');
}

/**
 * Test 7: URL Structure
 */
function testURLStructure() {
  console.log(`${colors.cyan}=== Test 7: URL Structure ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');
  const configPath = path.join(__dirname, '../../config.toml');

  // Check for pretty URLs
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    const hasPrettyUrls = config.includes('prettyUrls') || !config.includes('uglyURLs');

    check(hasPrettyUrls, 'Pretty URLs enabled (no .html extension)');
  }

  // Check for content files
  if (fs.existsSync(contentDir)) {
    const files = findFiles(contentDir, '.md');
    const indexFiles = files.filter(f => f.endsWith('index.md') || f.endsWith('_index.md'));

    console.log(`  ${colors.blue}Total pages: ${files.length}${colors.reset}`);
    console.log(`  ${colors.blue}Index files: ${indexFiles.length}${colors.reset}`);

    if (files.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Has ${files.length} content pages`);
      passedChecks++;
    }
    totalChecks++;
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
function runSEOTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   SEO & Meta Tag Test Suite               ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testConfigSEO();
  testHTMLMetaTags();
  testSitemapRobots();
  testHeadingStructure();
  testInternalLinking();
  testImageAltAttributes();
  testURLStructure();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}SEO Test Summary:${colors.reset}`);
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  Passed: ${passedChecks}`);
  console.log(`  Warnings: ${warnings}\n`);

  if (passedChecks >= totalChecks * 0.8) {
    console.log(`${colors.green}✓ SEO tests passed${colors.reset}`);
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠ ${warnings} warning(s) - improvements suggested${colors.reset}`);
    }
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ SEO needs improvement${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runSEOTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
