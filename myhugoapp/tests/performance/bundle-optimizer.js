#!/usr/bin/env node

/**
 * Bundle Optimization Tools
 * Optimizes JavaScript and CSS bundles for production
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

// Optimization configuration
const OPTIMIZATION_CONFIG = {
  css: {
    targetSize: 25 * 1024, // 25KB per file
    enableMinification: true,
    enableCompression: true,
    enableCriticalCSS: true,
  },
  js: {
    targetSize: 100 * 1024, // 100KB per file
    enableMinification: true,
    enableCompression: true,
    enableTreeShaking: true,
    enableCodeSplitting: true,
  },
  images: {
    targetSize: 200 * 1024, // 200KB per image
    enableCompression: true,
    enableWebP: true,
    enableResponsiveImages: true,
  }
};

let optimizations = 0;
let warnings = 0;

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
 * Calculate size reduction percentage
 */
function calculateReduction(original, optimized) {
  return Math.round(((original - optimized) / original) * 100);
}

/**
 * Optimize CSS files
 */
function optimizeCSS() {
  console.log(`${colors.cyan}=== CSS Bundle Optimization ===${colors.reset}\n`);

  const cssDir = path.join(__dirname, '../../static/css');
  if (!fs.existsSync(cssDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} CSS directory not found\n`);
    return;
  }

  const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const file of cssFiles) {
    const filePath = path.join(cssDir, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(originalContent, 'utf8');
    totalOriginalSize += originalSize;

    let optimizedContent = originalContent
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .replace(/:\s*/g, ':');

    optimizedContent = removeUnusedCSS(optimizedContent);

    const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
    totalOptimizedSize += optimizedSize;

    const reduction = calculateReduction(originalSize, optimizedSize);
    const isLarge = optimizedSize > OPTIMIZATION_CONFIG.css.targetSize;

    if (reduction > 0) {
      const optimizedPath = filePath.replace('.css', '.optimized.css');
      fs.writeFileSync(optimizedPath, optimizedContent);
      optimizations++;
      console.log(`  ${colors.green}✓${colors.reset} ${file}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (-${reduction}%)`);
    } else {
      console.log(`  ${colors.blue}○${colors.reset} ${file}: ${formatBytes(originalSize)} (already optimized)`);
    }

    if (isLarge) {
      console.log(`    ${colors.yellow}⚠${colors.reset} Still large: consider splitting`);
      warnings++;
    }
  }

  const totalReduction = calculateReduction(totalOriginalSize, totalOptimizedSize);
  console.log(`\n  ${colors.blue}CSS Summary:${colors.reset}`);
  console.log(`    Total: ${formatBytes(totalOriginalSize)} → ${formatBytes(totalOptimizedSize)} (-${totalReduction}%)`);
  console.log(`    Optimizations: ${optimizations}\n`);
}

/**
 * Optimize JavaScript files
 */
function optimizeJavaScript() {
  console.log(`${colors.cyan}=== JavaScript Bundle Optimization ===${colors.reset}\n`);

  const jsDir = path.join(__dirname, '../../static/js');
  if (!fs.existsSync(jsDir)) {
    console.log(`  ${colors.yellow}⚠${colors.reset} JavaScript directory not found\n`);
    return;
  }

  const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js') && !file.includes('.min.'));
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const file of jsFiles) {
    const filePath = path.join(jsDir, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(originalContent, 'utf8');
    totalOriginalSize += originalSize;

    let optimizedContent = originalContent
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .replace(/,\s*/g, ',');

    optimizedContent = optimizedContent.replace(/console\.log[^;]*;?/g, '');

    const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
    totalOptimizedSize += optimizedSize;

    const reduction = calculateReduction(originalSize, optimizedSize);
    const isLarge = optimizedSize > OPTIMIZATION_CONFIG.js.targetSize;

    if (reduction > 5) {
      const optimizedPath = filePath.replace('.js', '.optimized.js');
      fs.writeFileSync(optimizedPath, optimizedContent);
      optimizations++;
      console.log(`  ${colors.green}✓${colors.reset} ${file}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (-${reduction}%)`);
    } else {
      console.log(`  ${colors.blue}○${colors.reset} ${file}: ${formatBytes(originalSize)} (already optimized)`);
    }

    if (isLarge) {
      console.log(`    ${colors.yellow}⚠${colors.reset} Consider code splitting`);
      warnings++;
    }
  }

  const totalReduction = calculateReduction(totalOriginalSize, totalOptimizedSize);
  console.log(`\n  ${colors.blue}JavaScript Summary:${colors.reset}`);
  console.log(`    Total: ${formatBytes(totalOriginalSize)} → ${formatBytes(totalOptimizedSize)} (-${totalReduction}%)`);
  console.log(`    Optimizations: ${optimizations}\n`);
}

/**
 * Generate bundle splitting configuration
 */
function generateBundleSplitting() {
  console.log(`${colors.cyan}=== Bundle Splitting Configuration ===${colors.reset}\n`);

  const config = {
    framework: [
      'chemistry-calculator-framework.js',
      'dark-mode.js',
      'progress-tracker.js'
    ],
    calculators: [
      'ph-rechner-framework.js',
      'druck-flaechen-rechner-framework.js',
      'molare-masse-rechner.js',
      'konzentrationsumrechner.js',
      'gasgesetz-rechner.js'
    ],
    visualizations: [
      'molekuel-studio.js',
      'perioden-system-der-elemente.js'
    ],
    interactive: [
      'quiz-system.js',
      'titrations-simulator.js'
    ]
  };

  const vendorFiles = [
    'bootstrap.min.js',
    'jquery.min.js'
  ];

  console.log(`  ${colors.green}✓${colors.reset} Bundle splitting strategy:`);
  console.log(`    Framework bundle: ${config.framework.length} files`);
  console.log(`    Calculator bundle: ${config.calculators.length} files`);
  console.log(`    Visualization bundle: ${config.visualizations.length} files`);
  console.log(`    Interactive bundle: ${config.interactive.length} files`);
  console.log(`    Vendor bundle: ${vendorFiles.length} files\n`);

  // Generate loading strategy
  const loadingStrategy = `
<!-- Critical CSS (inline) -->
<style>
  /* Critical above-the-fold styles */
  body { margin: 0; font-family: Arial, sans-serif; }
  .calculator-panel { padding: 20px; }
</style>

<!-- Framework bundle (high priority) -->
<script src="/js/chemistry-calculator-framework.optimized.js" defer></script>

<!-- Vendor bundle (separate) -->
<script src="/js/bootstrap.min.js" defer></script>

<!-- Calculator bundles (lazy loaded) -->
<script>
  // Lazy load calculator bundles when needed
  function loadCalculator(name) {
    return import(\`/js/calculators/\${name}.js\`);
  }
</script>
`;

  const strategyPath = path.join(__dirname, '../../static/loading-strategy.html');
  fs.writeFileSync(strategyPath, loadingStrategy);
  console.log(`  ${colors.green}✓${colors.reset} Loading strategy saved to loading-strategy.html\n`);
}

/**
 * Remove unused CSS (basic implementation)
 */
function removeUnusedCSS(css) {
  const commonUnused = [
    /\.unused-[a-z0-9-]+/g,
    /\.test-[a-z0-9-]+/g,
    /\.debug-[a-z0-9-]+/g
  ];

  let cleanedCSS = css;
  for (const pattern of commonUnused) {
    cleanedCSS = cleanedCSS.replace(pattern, '');
  }

  return cleanedCSS;
}

/**
 * Generate performance budget
 */
function generatePerformanceBudget() {
  console.log(`${colors.cyan}=== Performance Budget ===${colors.reset}\n`);

  const budget = {
    totalJS: 300 * 1024,
    totalCSS: 100 * 1024,
    totalImages: 500 * 1024,
    maxSingleJS: 100 * 1024,
    maxSingleCSS: 25 * 1024,
    maxSingleImage: 200 * 1024,
  };

  const budgetContent = {
    budget,
    thresholds: {
      warnings: 0.8,
      errors: 1.0
    }
  };

  const budgetPath = path.join(__dirname, '../../performance-budget.json');
  fs.writeFileSync(budgetPath, JSON.stringify(budgetContent, null, 2));
  console.log(`  ${colors.green}✓${colors.reset} Performance budget saved to performance-budget.json\n`);
}

/**
 * Generate optimization report
 */
function generateOptimizationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    optimizations,
    warnings,
    recommendations: [
      'Implement code splitting for better caching',
      'Use lazy loading for non-critical resources',
      'Optimize images with WebP format',
      'Minimize external dependencies',
      'Implement service worker for offline support'
    ]
  };

  const reportPath = path.join(__dirname, '../../optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  ${colors.green}✓${colors.reset} Optimization report saved to optimization-report.json\n`);
}

/**
 * Main optimization runner
 */
function runOptimization() {
  console.log(`\n${colors.magenta}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   Bundle Optimization Suite            ║${colors.reset}`);
  console.log(`${colors.magenta}╚══════════════════════════════════════════╝${colors.reset}\n`);

  try {
    optimizeCSS();
    optimizeJavaScript();
    generateBundleSplitting();
    generatePerformanceBudget();
    generateOptimizationReport();

    console.log(`${colors.magenta}═══════════════════════════════════════════${colors.reset}\n`);
    console.log(`${colors.cyan}Optimization Summary:${colors.reset}`);
    console.log(`  Optimizations performed: ${optimizations}`);
    console.log(`  Warnings: ${warnings}\n`);

    if (optimizations > 0) {
      console.log(`${colors.green}✓${colors.reset} Bundle optimization completed successfully`);
      console.log(`  ${colors.blue}→${colors.reset} Check .optimized.js/.optimized.css files`);
      console.log(`  ${colors.blue}→${colors.reset} Review performance-budget.json`);
      console.log(`  ${colors.blue}→${colors.reset} See optimization-report.json\n`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} No optimizations needed - bundles are already optimized\n`);
    }

  } catch (error) {
    console.error(`${colors.red}Error during optimization:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run optimization
runOptimization();