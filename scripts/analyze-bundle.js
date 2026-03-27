#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Analyzes bundle sizes and performance metrics
 */

const fs = require('fs');
const path = require('path');

// Performance budget configuration
const BUDGETS = {
  javascript: {
    maxSize: 200 * 1024, // 200 KB for individual JS files
    totalSize: 500 * 1024, // 500 KB total JS
    gzipSize: 150 * 1024, // 150 KB gzipped
  },
  css: {
    maxSize: 50 * 1024, // 50 KB for individual CSS files
    totalSize: 100 * 1024, // 100 KB total CSS
  },
  html: {
    maxSize: 50 * 1024, // 50 KB per HTML page
  },
  images: {
    maxSize: 500 * 1024, // 500 KB per image
  },
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getColor(status) {
  switch (status) {
    case 'pass':
      return colors.green;
    case 'warning':
      return colors.yellow;
    case 'fail':
      return colors.red;
    default:
      return colors.reset;
  }
}

function checkBudget(size, budget) {
  const percentage = (size / budget.maxSize) * 100;

  if (percentage <= 70) {
    return { status: 'pass', percentage, message: `✓ Within budget (${percentage.toFixed(1)}%)` };
  } else if (percentage <= 90) {
    return {
      status: 'warning',
      percentage,
      message: `⚠ Approaching budget (${percentage.toFixed(1)}%)`,
    };
  } else {
    return { status: 'fail', percentage, message: `✗ Over budget (${percentage.toFixed(1)}%)` };
  }
}

function analyzeFile(filePath, budgetType) {
  try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const budget = BUDGETS[budgetType];
    const result = checkBudget(size, budget, budgetType);

    return {
      file: filePath,
      size: size,
      budget: budget.maxSize,
      ...result,
    };
  } catch {
    return null;
  }
}

function analyzeDirectory(directory, extensions, budgetType) {
  const files = [];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other ignored dirs
        if (!['node_modules', '.git', 'public', 'resources', 'test-results'].includes(entry.name)) {
          walkDir(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(directory);

  const results = files
    .map((file) => analyzeFile(file, budgetType))
    .filter((result) => result !== null);

  const totalSize = results.reduce((sum, r) => sum + r.size, 0);

  return {
    files: results,
    totalSize,
    averageSize: results.length > 0 ? totalSize / results.length : 0,
    count: results.length,
  };
}

function analyzeCalculatorFiles() {
  console.log(`\n${colors.blue}=== Calculator JavaScript Files ===${colors.reset}\n`);

  const calculatorsDir = path.join(__dirname, '../myhugoapp/static/js/calculators');
  const results = analyzeDirectory(calculatorsDir, ['.js'], 'javascript');

  results.files.forEach((result) => {
    const color = getColor(result.status);
    const fileName = path.basename(result.file);
    console.log(
      `${color}${result.message}${colors.reset} ${fileName} (${formatBytes(result.size)})`
    );
  });

  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total files: ${results.count}`);
  console.log(`  Total size: ${formatBytes(results.totalSize)}`);
  console.log(`  Average size: ${formatBytes(results.averageSize)}`);

  return results;
}

function analyzeStaticJS() {
  console.log(`\n${colors.blue}=== Static JavaScript Files ===${colors.reset}\n`);

  const staticDir = path.join(__dirname, '../myhugoapp/static/js');
  const results = analyzeDirectory(staticDir, ['.js'], 'javascript');

  const largeFiles = results.files.filter((f) => f.size > 50 * 1024); // Files > 50KB

  if (largeFiles.length > 0) {
    console.log(`\n${colors.yellow}Large files (>50KB):${colors.reset}`);
    largeFiles.forEach((result) => {
      const fileName = path.basename(result.file);
      console.log(`  ${fileName}: ${formatBytes(result.size)}`);
    });
  }

  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total files: ${results.count}`);
  console.log(`  Total size: ${formatBytes(results.totalSize)}`);

  return results;
}

function checkBuildArtifacts() {
  console.log(`\n${colors.blue}=== Build Artifacts ===${colors.reset}\n`);

  const publicDir = path.join(__dirname, '../myhugoapp/public');

  if (!fs.existsSync(publicDir)) {
    console.log(`${colors.yellow}⚠ Build directory not found. Run: npm run build${colors.reset}`);
    return;
  }

  // Check HTML pages
  const htmlFiles = [];
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && path.extname(entry.name) === '.html') {
        htmlFiles.push(fullPath);
      }
    }
  }
  walkDir(publicDir);

  const htmlTotalSize = htmlFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);

  console.log(`  HTML pages: ${htmlFiles.length}`);
  console.log(`  Total HTML size: ${formatBytes(htmlTotalSize)}`);
  console.log(`  Average page size: ${formatBytes(htmlTotalSize / htmlFiles.length)}`);

  // Check calculator page specifically
  const calculatorPage = path.join(publicDir, 'stoechiometrie-rechner/index.html');
  if (fs.existsSync(calculatorPage)) {
    const size = fs.statSync(calculatorPage).size;
    const result = checkBudget(size, BUDGETS.html, 'html');
    const color = getColor(result.status);
    console.log(
      `\n  Calculator page: ${color}${result.message}${colors.reset} (${formatBytes(size)})`
    );
  }

  return { htmlFiles, htmlTotalSize };
}

function generatePerformanceReport() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Performance Analysis Report        ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════╝${colors.reset}\n`);

  const startTime = Date.now();

  const calcResults = analyzeCalculatorFiles();
  const staticResults = analyzeStaticJS();
  const buildResults = checkBuildArtifacts();

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`\n${colors.blue}=== Recommendations ===${colors.reset}\n`);

  // Check for issues
  const issues = [];

  const largeCalcFiles = calcResults.files.filter((f) => f.size > 20 * 1024);
  if (largeCalcFiles.length > 0) {
    issues.push('Consider splitting large calculator files (>20KB)');
  }

  if (staticResults.totalSize > 500 * 1024) {
    issues.push('Total JS size exceeds 500KB - consider code splitting');
  }

  if (buildResults.htmlTotalSize / buildResults.htmlFiles.length > 50 * 1024) {
    issues.push('Average HTML page size >50KB - optimize content');
  }

  if (issues.length === 0) {
    console.log(
      `${colors.green}✓ All performance metrics within acceptable ranges!${colors.reset}`
    );
  } else {
    issues.forEach((issue) => {
      console.log(`${colors.yellow}• ${issue}${colors.reset}`);
    });
  }

  console.log(`\n${colors.blue}Analysis completed in: ${duration}ms${colors.reset}\n`);

  // Generate JSON report for CI/CD
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      calculatorFiles: calcResults.count,
      calculatorTotalSize: calcResults.totalSize,
      staticFiles: staticResults.count,
      staticTotalSize: staticResults.totalSize,
      htmlPages: buildResults.htmlFiles.length,
      htmlTotalSize: buildResults.htmlTotalSize,
    },
    budgetStatus: {
      calculators: calcResults.files.every((f) => f.status !== 'fail'),
      static: staticResults.totalSize <= BUDGETS.javascript.totalSize,
      html: buildResults.htmlTotalSize / buildResults.htmlFiles.length <= BUDGETS.html.maxSize,
    },
    issues: issues,
  };

  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`${colors.blue}Performance report saved:${colors.reset} performance-report.json`);

  return report;
}

// Run analysis
if (require.main === module) {
  try {
    const report = generatePerformanceReport();
    process.exit(
      report.budgetStatus.calculators && report.budgetStatus.static && report.budgetStatus.html
        ? 0
        : 1
    );
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

module.exports = {
  generatePerformanceReport,
  analyzeFile,
  BUDGETS,
};
