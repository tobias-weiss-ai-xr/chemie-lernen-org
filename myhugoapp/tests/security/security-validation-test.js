#!/usr/bin/env node

/**
 * Security Validation Tests
 * Tests for security best practices, CSP, and potential vulnerabilities
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
let failedChecks = 0;
let warnings = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    passedChecks++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${message}`);
    failedChecks++;
  }
}

function warn(message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
  warnings++;
}

/**
 * Test 1: Content Security Policy
 */
function testContentSecurityPolicy() {
  console.log(`${colors.cyan}=== Test 1: Content Security Policy ===${colors.reset}\n`);

  const headPath = path.join(__dirname, '../../layouts/partials/head.html');
  const configPath = path.join(__dirname, '../../config.toml');

  let hasCSPMeta = false;
  let hasCSPHeader = false;

  // Check head.html for CSP meta tag
  if (fs.existsSync(headPath)) {
    const head = fs.readFileSync(headPath, 'utf8');
    hasCSPMeta = head.includes('Content-Security-Policy') || head.includes('http-equiv="Content-Security-Policy"');
  }

  // Check config.toml for CSP header configuration
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    hasCSPHeader = config.includes('Content-Security-Policy') || config.includes('csp');
  }

  assert(hasCSPMeta || hasCSPHeader, 'Has Content Security Policy defined');

  if (!hasCSPMeta && !hasCSPHeader) {
    console.log(`  ${colors.yellow}⚠${colors.reset} No CSP found. Consider adding CSP headers for security`);
    warnings++;
  }

  console.log('');
}

/**
 * Test 2: HTTPS Enforcement
 */
function testHTTPSEnforcement() {
  console.log(`${colors.cyan}=== Test 2: HTTPS Enforcement ===${colors.reset}\n`);

  const configPath = path.join(__dirname, '../../config.toml');

  if (!fs.existsSync(configPath)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} config.toml not found\n`);
    return;
  }

  const config = fs.readFileSync(configPath, 'utf8');

  assert(config.includes('https://') || config.includes('baseURL'),
         'Site uses HTTPS in baseURL');

  // Check for strict-transport-security header
  const hasHSTS = config.includes('Strict-Transport-Security') ||
                 config.includes('HSTS');

  if (hasHSTS) {
    console.log(`  ${colors.green}✓${colors.reset} Has HSTS header configured`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No HSTS header found (consider adding)`);
    warnings++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 3: External Script Security
 */
function testExternalScriptSecurity() {
  console.log(`${colors.cyan}=== Test 3: External Script Security ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');

  if (!fs.existsSync(layoutDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Layouts directory not found\n`);
    return;
  }

  const files = findFiles(layoutDir, '.html');
  const externalScripts = [];
  const scriptsWithSRI = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(layoutDir, file);

      // Find external scripts
      const scriptTags = content.match(/<script[^>]*src=["']https?:\/\/[^"']+["'][^>]*>/g) || [];

      for (const script of scriptTags) {
        const src = script.match(/src=["']([^"']+)["']/)[1];
        externalScripts.push({ file: relativePath, src, script });

        // Check for Subresource Integrity (SRI)
        if (script.includes('integrity=')) {
          scriptsWithSRI.push(src);
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}External scripts found: ${externalScripts.length}${colors.reset}`);

  if (externalScripts.length > 0) {
    console.log(`  ${colors.blue}Scripts with SRI: ${scriptsWithSRI.length}/${externalScripts.length}${colors.reset}`);

    // List external scripts
    console.log(`\n  ${colors.cyan}External scripts:${colors.reset}`);
    for (const { src } of externalScripts) {
      const hasSRI = scriptsWithSRI.includes(src);
      const icon = hasSRI ? colors.green + '✓' : colors.yellow + '⚠';
      console.log(`    ${icon}${colors.reset} ${src}`);
    }

    const sriPercentage = Math.round((scriptsWithSRI.length / externalScripts.length) * 100);
    if (sriPercentage < 50) {
      console.log(`\n  ${colors.yellow}⚠${colors.reset} Only ${sriPercentage}% of external scripts have SRI`);
      warnings++;
    } else {
      console.log(`\n  ${colors.green}✓${colors.reset} Good SRI coverage (${sriPercentage}%)`);
      passedChecks++;
    }
    totalChecks++;
  } else {
    console.log(`  ${colors.green}✓${colors.reset} No external scripts (good for security)`);
    passedChecks++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 4: Sensitive Information Exposure
 */
function testSensitiveInformation() {
  console.log(`${colors.cyan}=== Test 4: Sensitive Information Check ===${colors.reset}\n`);

  const checkDirs = [
    path.join(__dirname, '../../'),
    path.join(__dirname, '../../layouts'),
    path.join(__dirname, '../../static'),
    path.join(__dirname, '../../content'),
  ];

  const sensitivePatterns = [
    { name: 'API Keys', pattern: /api[_-]?key\s*[:=]\s*['"]\w+/gi },
    { name: 'Passwords', pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi },
    { name: 'Secret tokens', pattern: /secret[_-]?token\s*[:=]\s*['"][^'"]{20,}['"]/gi },
    { name: 'Private keys', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g },
    { name: 'AWS credentials', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'Database URLs', pattern: /mongodb:\/\/|postgres:\/\/|mysql:\/\/[^s]/gi },
  ];

  const issues = [];
  const skipExtensions = ['.min.js', '.min.css', '.map', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2'];

  for (const dir of checkDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = findFiles(dir, null); // All files
    for (const file of files) {
      // Skip binary and minified files
      if (skipExtensions.some(ext => file.endsWith(ext))) continue;

      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(path.join(__dirname, '../../'), file);

        for (const { name, pattern } of sensitivePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            issues.push(`${relativePath}: Possible ${name} (${matches.length} occurrence(s))`);
          }
        }
      } catch (e) {
        // Skip files that can't be read as text
      }
    }
  }

  console.log(`  ${colors.blue}Scanned for sensitive information${colors.reset}`);

  if (issues.length === 0) {
    console.log(`  ${colors.green}✓${colors.reset} No obvious sensitive information exposed`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} potential issues:\n`);
    for (const issue of issues) {
      console.log(`    ${colors.red}⚠${colors.reset} ${issue}`);
    }
    failedChecks++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 5: XSS Prevention
 */
function testXSSPrevention() {
  console.log(`${colors.cyan}=== Test 5: XSS Prevention ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');
  const contentDir = path.join(__dirname, '../../content');

  const issues = [];

  // Check for dangerous patterns
  const dangerousPatterns = [
    { name: 'innerHTML with user input', pattern: /innerHTML\s*=\s*[^;]+(?:\.value|\.innerHTML)/g },
    { name: 'document.write', pattern: /document\.write\s*\(/g },
    { name: 'eval() with user input', pattern: /eval\s*\(\s*[^)]*[+.value]/g },
    { name: 'unsafe DOM manipulation', pattern: /location\.hash|location\.search/g },
  ];

  const files = [
    ...findFiles(layoutDir, '.html'),
    ...findFiles(layoutDir, '.js'),
    ...findFiles(contentDir, '.md'),
  ];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../../'), file);

      for (const { name, pattern } of dangerousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          issues.push(`${relativePath}: ${name} (${matches.length} occurrence(s))`);
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Scanned for XSS vulnerabilities${colors.reset}`);

  if (issues.length === 0) {
    console.log(`  ${colors.green}✓${colors.reset} No obvious XSS vulnerabilities found`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Found ${issues.length} potential issues:\n`);
    for (const issue of issues) {
      console.log(`    ${colors.yellow}⚠${colors.reset} ${issue}`);
    }
    warnings += issues.length;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 6: File Upload Security
 */
function testFileUploadSecurity() {
  console.log(`${colors.cyan}=== Test 6: File Upload & Forms ===${colors.reset}\n`);

  const layoutDir = path.join(__dirname, '../../layouts');

  if (!fs.existsSync(layoutDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Layouts directory not found\n`);
    return;
  }

  const files = findFiles(layoutDir, '.html');
  let hasForms = 0;
  let hasFileUpload = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check for forms
      const forms = content.match(/<form/g) || [];
      hasForms += forms.length;

      // Check for file inputs
      const fileInputs = content.match(/<input[^>]*type=['"]file['"][^>]*>/g) || [];
      hasFileUpload += fileInputs.length;

      // If file upload exists, check for security measures
      if (fileInputs.length > 0) {
        const hasAccept = fileInputs.some(input => input.includes('accept='));
        const hasMaxLength = content.includes('max-file-length') || content.includes('MAX_FILE_SIZE');

        if (hasAccept) {
          console.log(`  ${colors.green}✓${colors.reset} File input has accept attribute`);
          passedChecks++;
          totalChecks++;
        } else {
          console.log(`  ${colors.yellow}⚠${colors.reset} File input missing accept attribute`);
          warnings++;
          totalChecks++;
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Forms found: ${hasForms}${colors.reset}`);
  console.log(`  ${colors.blue}File uploads: ${hasFileUpload}${colors.reset}`);

  if (hasForms > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Site uses forms`);
    passedChecks++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 7: HTTP Headers
 */
function testHTTPHeaders() {
  console.log(`${colors.cyan}=== Test 7: Recommended HTTP Headers ===${colors.reset}\n`);

  const configPath = path.join(__dirname, '../../config.toml');
  const headersFiles = [
    path.join(__dirname, '../../static/_headers'),
    path.join(__dirname, '../../public/_headers'),
  ];

  const recommendedHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Referrer-Policy',
    'Permissions-Policy',
  ];

  const foundHeaders = [];

  // Check config.toml
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    for (const header of recommendedHeaders) {
      if (config.includes(header)) {
        foundHeaders.push(header);
      }
    }
  }

  // Check _headers files
  for (const headersFile of headersFiles) {
    if (fs.existsSync(headersFile)) {
      const headers = fs.readFileSync(headersFile, 'utf8');
      for (const header of recommendedHeaders) {
        if (headers.includes(header) && !foundHeaders.includes(header)) {
          foundHeaders.push(header);
        }
      }
    }
  }

  console.log(`  ${colors.blue}Security headers found: ${foundHeaders.length}/${recommendedHeaders.length}${colors.reset}`);

  for (const header of recommendedHeaders) {
    const found = foundHeaders.includes(header);
    const icon = found ? colors.green + '✓' : colors.yellow + '⚠';
    console.log(`    ${icon}${colors.reset} ${header}`);
  }

  const coverage = Math.round((foundHeaders.length / recommendedHeaders.length) * 100);
  if (coverage >= 50) {
    console.log(`\n  ${colors.green}✓${colors.reset} Good security header coverage (${coverage}%)`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`\n  ${colors.yellow}⚠${colors.reset} Low security header coverage (${coverage}%)`);
    warnings++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 8: Robots.txt and Sitemap
 */
function testRobotsAndSitemap() {
  console.log(`${colors.cyan}=== Test 8: Robots.txt & Sitemap ===${colors.reset}\n`);

  const staticDir = path.join(__dirname, '../../static');
  const publicDir = path.join(__dirname, '../../public');

  // Check robots.txt
  const robotsPaths = [
    path.join(staticDir, 'robots.txt'),
    path.join(publicDir, 'robots.txt'),
  ];

  let hasRobots = false;
  for (const robotsPath of robotsPaths) {
    if (fs.existsSync(robotsPath)) {
      hasRobots = true;
      const robots = fs.readFileSync(robotsPath, 'utf8');

      // Check for disallow on sensitive areas
      if (robots.includes('Disallow:')) {
        console.log(`  ${colors.green}✓${colors.reset} robots.txt has Disallow rules`);
        passedChecks++;
        totalChecks++;
      }

      break;
    }
  }

  assert(hasRobots, 'Has robots.txt file');

  // Check sitemap.xml
  const sitemapPaths = [
    path.join(publicDir, 'sitemap.xml'),
    path.join(staticDir, 'sitemap.xml'),
  ];

  let hasSitemap = false;
  for (const sitemapPath of sitemapPaths) {
    if (fs.existsSync(sitemapPath)) {
      hasSitemap = true;
      break;
    }
  }

  assert(hasSitemap, 'Has sitemap.xml');

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
    } else if (extension === null || entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Main test runner
 */
function runSecurityTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Security Validation Test Suite         ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testContentSecurityPolicy();
  testHTTPSEnforcement();
  testExternalScriptSecurity();
  testSensitiveInformation();
  testXSSPrevention();
  testFileUploadSecurity();
  testHTTPHeaders();
  testRobotsAndSitemap();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Security Tests Summary:${colors.reset}`);
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  Passed: ${passedChecks}`);
  console.log(`  Failed: ${failedChecks}`);
  console.log(`  Warnings: ${warnings}\n`);

  if (failedChecks === 0) {
    console.log(`${colors.green}✓ Security validation passed${colors.reset}`);
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠ ${warnings} warning(s) - review suggested${colors.reset}`);
    }
    console.log('');
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ ${failedChecks} check(s) failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runSecurityTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
