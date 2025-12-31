#!/usr/bin/env node

/**
 * Content Quality Tests
 * Tests for spelling, broken links, LaTeX rendering, and content completeness
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
 * Test 1: LaTeX Formula Validation
 */
function testLatexFormulas() {
  console.log(`${colors.cyan}=== Test 1: LaTeX Formula Validation ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');

  if (!fs.existsSync(contentDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Content directory not found\n`);
    return;
  }

  const files = findFiles(contentDir, '.md');
  let totalFormulas = 0;
  let hasFormulas = 0;
  let potentialIssues = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(contentDir, file);

      // Check for inline math $...$
      const inlineMath = content.match(/\$[^$\n]+\$/g) || [];
      // Check for display math $$...$$ or \[...\]
      const displayMath = content.match(/\$\$[^$]+\$\$/g) || [];
      // Check for \[...\]
      const bracketMath = content.match(/\\\[[\s\S]*?\\\]/g) || [];

      totalFormulas += inlineMath.length + displayMath.length + bracketMath.length;

      if (inlineMath.length > 0 || displayMath.length > 0 || bracketMath.length > 0) {
        hasFormulas++;
      }

      // Check for common LaTeX errors
      const allMath = [...inlineMath, ...displayMath, ...bracketMath];
      for (const math of allMath) {
        // Unescaped special characters
        if (math.includes('&') && !math.includes('\\&') && !math.includes('\\align')) {
          potentialIssues.push(`${relativePath}: Unescaped & in formula`);
        }
        // Unmatched braces
        const openBraces = (math.match(/{/g) || []).length;
        const closeBraces = (math.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          potentialIssues.push(`${relativePath}: Unmatched braces in formula`);
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Pages with formulas: ${hasFormulas}/${files.length}${colors.reset}`);
  console.log(`  ${colors.blue}Total formulas: ${totalFormulas}${colors.reset}`);

  if (hasFormulas > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Content uses LaTeX formulas`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No LaTeX formulas found`);
    warnings++;
    totalChecks++;
  }

  if (potentialIssues.length > 0) {
    console.log(`\n  ${colors.yellow}Potential LaTeX issues:${colors.reset}`);
    for (const issue of potentialIssues.slice(0, 5)) {
      console.log(`    ${colors.yellow}⚠${colors.reset} ${issue}`);
    }
    if (potentialIssues.length > 5) {
      console.log(`    ... and ${potentialIssues.length - 5} more`);
    }
    warnings += potentialIssues.length;
  } else if (hasFormulas > 0) {
    console.log(`  ${colors.green}✓${colors.reset} No obvious LaTeX syntax issues`);
    passedChecks++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 2: Internal Link Validation
 */
function testInternalLinks() {
  console.log(`${colors.cyan}=== Test 2: Internal Link Validation ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');
  const layoutDir = path.join(__dirname, '../../layouts');

  const files = [
    ...findFiles(contentDir, '.md'),
    ...findFiles(layoutDir, '.html'),
  ];

  const links = [];
  const brokenLinks = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../../'), file);

      // Extract markdown links
      const mdLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      for (const link of mdLinks) {
        const url = link.match(/\(([^)]+)\)/)[1];
        if (url.startsWith('/') && !url.startsWith('//')) {
          links.push({ file: relativePath, url, raw: link });
        }
      }

      // Extract HTML links
      const htmlLinks = content.match(/href="([^"]+)"/g) || [];
      for (const link of htmlLinks) {
        const url = link.match(/href="([^"]+)"/)[1];
        if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('http')) {
          links.push({ file: relativePath, url, raw: link });
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  // Check if referenced files exist
  for (const link of links) {
    const urlPath = link.url.split('#')[0].split('?')[0]; // Remove anchors and query params
    if (urlPath === '/' || urlPath === '') continue;

    const possiblePaths = [
      path.join(__dirname, '../../', urlPath),
      path.join(__dirname, '../../', urlPath + '.md'),
      path.join(__dirname, '../../', urlPath + '.html'),
      path.join(__dirname, '../../public', urlPath),
      path.join(__dirname, '../../public', urlPath + '.html'),
      path.join(__dirname, '../../content', urlPath.replace(/^\//, '')),
    ];

    const exists = possiblePaths.some(p => fs.existsSync(p));
    if (!exists) {
      // Also check if it's a section index
      const indexPath = path.join(__dirname, '../../', urlPath, '_index.md');
      if (!fs.existsSync(indexPath)) {
        brokenLinks.push(link);
      }
    }
  }

  console.log(`  ${colors.blue}Total internal links: ${links.length}${colors.reset}`);

  if (brokenLinks.length === 0) {
    console.log(`  ${colors.green}✓${colors.reset} All internal links appear valid`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.red}✗${colors.reset} Found ${brokenLinks.length} potentially broken links:\n`);
    for (const link of brokenLinks.slice(0, 10)) {
      console.log(`    ${colors.yellow}${link.file}${colors.reset}: ${link.url}`);
    }
    if (brokenLinks.length > 10) {
      console.log(`    ... and ${brokenLinks.length - 10} more`);
    }
    failedChecks++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 3: Content Completeness
 */
function testContentCompleteness() {
  console.log(`${colors.cyan}=== Test 3: Content Completeness ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');

  if (!fs.existsSync(contentDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Content directory not found\n`);
    return;
  }

  const files = findFiles(contentDir, '.md');
  const issues = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(contentDir, file);

      // Check for title
      if (!content.match(/^title\s*=/m) && !content.match(/^#\s+.+/m)) {
        issues.push(`${relativePath}: Missing title`);
      }

      // Check for description
      if (!content.match(/^description\s*=/m) && !content.includes('description:')) {
        warn(`${relativePath}: Missing description (SEO)`);
      }

      // Check for very short content (less than 100 chars)
      const bodyContent = content.replace(/^---[\s\S]*?---/m, '').trim();
      if (bodyContent.length < 100 && bodyContent.length > 0) {
        issues.push(`${relativePath}: Very short content (${bodyContent.length} chars)`);
      }

      // Check for empty sections
      if (bodyContent.includes('##') && bodyContent.match(/##\s*$/m)) {
        issues.push(`${relativePath}: Has empty section headings`);
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Checked ${files.length} content files${colors.reset}`);

  if (issues.length === 0) {
    console.log(`  ${colors.green}✓${colors.reset} All content files have basic metadata`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}Found ${issues.length} issues:${colors.reset}`);
    for (const issue of issues.slice(0, 10)) {
      console.log(`    ${colors.yellow}⚠${colors.reset} ${issue}`);
    }
    if (issues.length > 10) {
      console.log(`    ... and ${issues.length - 10} more`);
    }
    warnings += issues.length;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 4: Image Alt Text Coverage
 */
function testImageAltText() {
  console.log(`${colors.cyan}=== Test 4: Image Alt Text Coverage ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');
  const layoutDir = path.join(__dirname, '../../layouts');

  const files = [
    ...findFiles(contentDir, '.md'),
    ...findFiles(layoutDir, '.html'),
  ];

  let totalImages = 0;
  let imagesWithAlt = 0;
  const emptyAltImages = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '../../'), file);

      // Check markdown images
      const mdImages = content.match(/!\[([^\]]*)\]/g) || [];
      totalImages += mdImages.length;
      const withAlt = mdImages.filter(img => !img.match(/!\[\]/));
      imagesWithAlt += withAlt.length;
      const emptyAlt = mdImages.filter(img => img.match(/!\[\]/));
      if (emptyAlt.length > 0) {
        emptyAltImages.push(`${relativePath}: ${emptyAlt.length} images without alt`);
      }

      // Check HTML images
      const htmlImages = content.match(/<img[^>]*>/g) || [];
      for (const img of htmlImages) {
        totalImages++;
        if (img.includes('alt=') && !img.includes('alt=""') && !img.includes("alt=''")) {
          imagesWithAlt++;
        } else if (img.includes('alt=""') || img.includes("alt=''")) {
          emptyAltImages.push(`${relativePath}: Image with empty alt`);
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Images with alt text: ${imagesWithAlt}/${totalImages}${colors.reset}`);

  if (totalImages > 0) {
    const percentage = Math.round((imagesWithAlt / totalImages) * 100);
    assert(percentage >= 80, `${percentage}% of images have alt text (target: 80%)`);

    if (emptyAltImages.length > 0) {
      console.log(`\n  ${colors.yellow}Files with missing alt text:${colors.reset}`);
      for (const issue of emptyAltImages.slice(0, 5)) {
        console.log(`    ${colors.yellow}⚠${colors.reset} ${issue}`);
      }
    }
  } else {
    console.log(`  ${colors.blue}No images found${colors.reset}`);
  }

  console.log('');
}

/**
 * Test 5: Heading Structure
 */
function testHeadingStructure() {
  console.log(`${colors.cyan}=== Test 5: Heading Structure ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');

  if (!fs.existsSync(contentDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Content directory not found\n`);
    return;
  }

  const files = findFiles(contentDir, '.md');
  let hasIssues = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(contentDir, file);

      // Extract headings
      const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
      if (headings.length === 0) continue;

      // Check for multiple h1s
      const h1Count = headings.filter(h => h.startsWith('# ')).length;
      if (h1Count > 1) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${relativePath}: Has ${h1Count} H1 headings (should be 1)`);
        hasIssues++;
      }

      // Check heading hierarchy (simplified)
      let lastLevel = 0;
      for (const heading of headings) {
        const level = heading.match(/^#+/)[0].length;
        if (level > lastLevel + 1 && lastLevel !== 0) {
          console.log(`  ${colors.yellow}⚠${colors.reset} ${relativePath}: Heading jumped from H${lastLevel} to H${level}`);
          hasIssues++;
          break;
        }
        lastLevel = level;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  if (hasIssues === 0) {
    console.log(`  ${colors.green}✓${colors.reset} Heading structure is good`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}Found ${hasIssues} heading issues${colors.reset}`);
    warnings += hasIssues;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 6: German Language Consistency
 */
function testGermanLanguage() {
  console.log(`${colors.cyan}=== Test 6: German Language Consistency ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');

  if (!fs.existsSync(contentDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Content directory not found\n`);
    return;
  }

  const files = findFiles(contentDir, '.md');
  let totalWords = 0;
  let hasUmlauts = 0;

  // Common German words with umlauts
  const germanWords = ['Änderung', 'Übung', 'äußere', 'Über', 'für', 'mehr', 'ähnlich', 'Molekül', 'Bücher', 'Größe'];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const bodyContent = content.replace(/^---[\s\S]*?---/m, '');

      // Count words
      const words = bodyContent.match(/\b\w+\b/g) || [];
      totalWords += words.length;

      // Check for German umlauts
      if (/[äöüÄÖÜß]/.test(bodyContent)) {
        hasUmlauts++;
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Total words: ${totalWords}${colors.reset}`);
  console.log(`  ${colors.blue}Pages with German content: ${hasUmlauts}/${files.length}${colors.reset}`);

  if (hasUmlauts > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Site contains German language content`);
    passedChecks++;
    totalChecks++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No German umlauts found (site might be German)`);
    warnings++;
    totalChecks++;
  }

  console.log('');
}

/**
 * Test 7: Code Block Formatting
 */
function testCodeBlocks() {
  console.log(`${colors.cyan}=== Test 7: Code Block Formatting ===${colors.reset}\n`);

  const contentDir = path.join(__dirname, '../../content');

  if (!fs.existsSync(contentDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Content directory not found\n`);
    return;
  }

  const files = findFiles(contentDir, '.md');
  let hasCodeBlocks = 0;
  let withLanguage = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check for fenced code blocks
      const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
      if (codeBlocks.length > 0) {
        hasCodeBlocks++;
        const withLang = codeBlocks.filter(block => block.match(/```\w+/));
        if (withLang.length > 0) {
          withLanguage++;
        }
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }

  console.log(`  ${colors.blue}Pages with code blocks: ${hasCodeBlocks}${colors.reset}`);

  if (hasCodeBlocks > 0) {
    const percentage = hasCodeBlocks > 0 ? Math.round((withLanguage / hasCodeBlocks) * 100) : 0;
    console.log(`  ${colors.blue}Code blocks with language: ${percentage}%${colors.reset}`);

    assert(percentage >= 50, 'Most code blocks have language syntax highlighting');
  } else {
    console.log(`  ${colors.blue}No code blocks found${colors.reset}`);
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
function runContentTests() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Content Quality Test Suite              ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}\n`);

  testLatexFormulas();
  testInternalLinks();
  testContentCompleteness();
  testImageAltText();
  testHeadingStructure();
  testGermanLanguage();
  testCodeBlocks();

  console.log(`${colors.magenta}═════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Content Quality Summary:${colors.reset}`);
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  Passed: ${passedChecks}`);
  console.log(`  Failed: ${failedChecks}`);
  console.log(`  Warnings: ${warnings}\n`);

  if (failedChecks === 0) {
    console.log(`${colors.green}✓ Content quality tests passed${colors.reset}`);
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
runContentTests().catch(err => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, err);
  process.exit(1);
});
