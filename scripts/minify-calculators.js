#!/usr/bin/env node

/**
 * Minify Calculator Scripts
 * Minifies JavaScript files for production
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// NOTE: ESM files (*.module.js, three/**/*.js) use import/export syntax
// and are intentionally excluded from this list. Terser's default config
// preserves import/export statements, but we keep ESM files separate to
// avoid accidental mangling of named exports.
const filesToMinify = [
  // Calculator frameworks
  'myhugoapp/static/js/chemistry-calculator-framework.js',
  'myhugoapp/static/js/ph-rechner-framework.js',
  'myhugoapp/static/js/druck-flaechen-rechner-framework.js',
  'myhugoapp/static/js/molare-masse-rechner.js',
  'myhugoapp/static/js/konzentrationsumrechner.js',
  'myhugoapp/static/js/gasgesetz-rechner.js',
  'myhugoapp/static/js/redox-potenzial-rechner.js',
  'myhugoapp/static/js/titrations-simulator.js',
  'myhugoapp/static/js/verbrennungsrechner.js',
  'myhugoapp/static/js/loeslichkeitsprodukt-rechner.js',
  'myhugoapp/static/js/calculators/stoichiometry.js',
  'myhugoapp/static/js/calculators/practice-generators.js',
  // Quiz & tracking
  'myhugoapp/static/js/quiz-system.js',
  'myhugoapp/static/js/progress-tracker.js',
  'myhugoapp/static/js/quiz-user-system.js',
  // UI & utility
  'myhugoapp/static/js/lazy-loader.js',
  'myhugoapp/static/js/dark-mode.js',
  // Interactive tool scripts (directly loaded by templates)
  'myhugoapp/static/js/bindungspotential.js',
  'myhugoapp/static/js/atmosphaerendruck-alltag.js',
  'myhugoapp/static/js/reaktionskinetik-simulator.js',
  'myhugoapp/static/js/elektrochemie-teilchenebene.js',
  'myhugoapp/static/js/chemisches-gleichgewicht.js',
  'myhugoapp/static/js/enhanced-ph-visualization.js',
  'myhugoapp/static/js/ki-assistent.js',
  'myhugoapp/static/js/calculators/tutorials.js',
];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function minifyFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;

    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false,
        pure_funcs: [],
      },
      mangle: {
        reserved: ['LazyLoader'], // Preserve LazyLoader name
      },
      format: {
        comments: false,
      },
    });

    if (result.error) {
      console.error(`${colors.red}Error minifying ${filePath}:${colors.reset}`, result.error);
      return false;
    }

    // Write .optimized.js alongside source (keep source untouched)
    const parsedPath = path.parse(filePath);
    const optimizedPath = path.join(parsedPath.dir, parsedPath.name + '.optimized.js');
    fs.writeFileSync(optimizedPath, result.code, 'utf8');
    const newSize = Buffer.byteLength(result.code, 'utf8');
    const savings = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

    console.log(
      `${colors.green}✓${colors.reset} ${parsedPath.base} → ${parsedPath.name}.optimized.js: ` +
        `${formatBytes(originalSize)} → ${formatBytes(newSize)} (${colors.green}-${savings}%${colors.reset})`
    );

    return true;
  } catch (error) {
    console.error(`${colors.red}Error processing ${filePath}:${colors.reset}`, error.message);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}=== Minifying Calculator Scripts ===${colors.reset}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of filesToMinify) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const success = await minifyFile(fullPath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} File not found: ${file}`);
      failCount++;
    }
  }

  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  ${colors.green}✓${colors.reset} Successfully minified: ${successCount}`);
  console.log(`  ${failCount > 0 ? colors.red : ''}✗${colors.reset} Failed: ${failCount}`);

  process.exit(failCount > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { minifyFile };
