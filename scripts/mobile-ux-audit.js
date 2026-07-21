/**
 * Mobile UX Audit Script
 * Checks for common mobile UX issues:
 * - Tap targets too small (<48px)
 * - Font size below 16px on inputs
 * - Cumulative Layout Shift (CLS) from D3 graphs
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'myhugoapp', 'public');
const REPORT_PATH = path.join(__dirname, 'mobile-ux-audit-report.json');

// Minimum font size for inputs
const MIN_INPUT_FONT_SIZE = 16;

/**
 * Extract CSS from HTML files and check for issues
 */
function auditFile(filePath, relativePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for inline styles with small font sizes
  const inlineStyleRegex = /style="[^"]*font-size:\s*(\d+)px[^"]*"/gi;
  let match;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    const fontSize = parseInt(match[1], 10);
    if (fontSize < MIN_INPUT_FONT_SIZE) {
      issues.push({
        type: 'small-font',
        severity: 'warning',
        location: relativePath,
        detail: `Inline font-size: ${fontSize}px (minimum: ${MIN_INPUT_FONT_SIZE}px)`,
        line: getLineNumber(html, match.index),
      });
    }
  }

  // Check for input elements without explicit font-size
  const inputRegex = /<input[^>]*>/gi;
  while ((match = inputRegex.exec(html)) !== null) {
    const inputHtml = match[0];
    if (
      !inputHtml.includes('font-size') &&
      !inputHtml.includes('class="') &&
      !inputHtml.includes('style=')
    ) {
      issues.push({
        type: 'input-font-size',
        severity: 'info',
        location: relativePath,
        detail: 'Input element may have font-size < 16px on iOS',
        line: getLineNumber(html, match.index),
      });
    }
  }

  // Check for D3 graph containers that might cause CLS
  if (html.includes('d3-ego-graph') || html.includes('d3.min.js')) {
    if (!html.includes('min-height') && !html.includes('height:')) {
      issues.push({
        type: 'potential-cls',
        severity: 'warning',
        location: relativePath,
        detail: 'D3 graph container may cause Cumulative Layout Shift',
        line: getLineNumber(html, match.index),
      });
    }
  }

  return issues;
}

/**
 * Get approximate line number from character index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Scan all HTML files in public directory
 */
function scanDirectory(dir, baseDir = dir) {
  const results = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
      const relativePath = path.relative(baseDir, fullPath);
      const issues = auditFile(fullPath, relativePath);
      if (issues.length > 0) {
        results.push({ file: relativePath, issues });
      }
    }
  }

  return results;
}

/**
 * Check CSS files for tap target sizes
 */
function auditCssFiles(dir) {
  const issues = [];
  const cssDir = path.join(dir, 'css');

  if (!fs.existsSync(cssDir)) {
    return issues;
  }

  const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));

  for (const file of cssFiles) {
    const cssPath = path.join(cssDir, file);
    const css = fs.readFileSync(cssPath, 'utf8');

    // Check for button/link padding that might be too small
    const buttonRegex = /\.(button|btn|nav-link)[^{]*\{[^}]*padding:\s*(\d+)px/gi;
    let match;
    while ((match = buttonRegex.exec(css)) !== null) {
      const padding = parseInt(match[2], 10);
      if (padding < 12) {
        issues.push({
          type: 'small-tap-target',
          severity: 'warning',
          location: `css/${file}`,
          detail: `Button/link padding: ${padding}px (recommended: ≥12px for 48px tap target)`,
        });
      }
    }
  }

  return issues;
}

// Main execution
console.log('🔍 Mobile UX Audit\n');

console.log('Scanning HTML files...');
const htmlResults = scanDirectory(PUBLIC_DIR);

console.log('Scanning CSS files...');
const cssIssues = auditCssFiles(PUBLIC_DIR);

// Combine results
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    filesScanned: htmlResults.length,
    filesWithIssues: htmlResults.filter((r) => r.issues.length > 0).length,
    totalIssues: htmlResults.reduce((sum, r) => sum + r.issues.length, 0) + cssIssues.length,
    byType: {},
    bySeverity: {
      error: 0,
      warning: 0,
      info: 0,
    },
  },
  htmlIssues: htmlResults,
  cssIssues,
  recommendations: [],
};

// Count by type and severity
[...htmlResults.flatMap((r) => r.issues), ...cssIssues].forEach((issue) => {
  report.summary.byType[issue.type] = (report.summary.byType[issue.type] || 0) + 1;
  report.summary.bySeverity[issue.severity]++;
});

// Generate recommendations
if (report.summary.byType['small-font']) {
  report.recommendations.push('Increase font sizes to ≥16px for better readability on mobile');
}
if (report.summary.byType['potential-cls']) {
  report.recommendations.push(
    'Add explicit height/min-height to D3 graph containers to prevent CLS'
  );
}
if (report.summary.byType['small-tap-target']) {
  report.recommendations.push(
    'Increase button/link padding to ≥12px for 48px minimum tap targets (WCAG 2.1)'
  );
}
if (report.summary.byType['input-font-size']) {
  report.recommendations.push(
    'Ensure all input elements have font-size: 16px or larger to prevent iOS zoom'
  );
}

// Write report
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

// Print summary
console.log('\n📊 Audit Summary');
console.log('───────────────');
console.log(`Files scanned: ${report.summary.filesScanned}`);
console.log(`Files with issues: ${report.summary.filesWithIssues}`);
console.log(`Total issues: ${report.summary.totalIssues}`);
console.log('\nBy Type:');
Object.entries(report.summary.byType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log('\nBy Severity:');
Object.entries(report.summary.bySeverity).forEach(([severity, count]) => {
  if (count > 0) {
    console.log(`  ${severity}: ${count}`);
  }
});

if (report.recommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
}

console.log(`\n📄 Full report: ${REPORT_PATH}`);

// Exit with error if critical issues found
const hasErrors = report.summary.bySeverity.error > 0;
process.exit(hasErrors ? 1 : 0);
