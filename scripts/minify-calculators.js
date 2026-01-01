#!/usr/bin/env node

/**
 * Minify Calculator Scripts
 * Minifies JavaScript files for production
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const filesToMinify = [
  'myhugoapp/static/js/calculators/stoichiometry.js',
  'myhugoapp/static/js/calculators/practice-generators.js',
  'myhugoapp/static/js/lazy-loader.js',
  // Note: stoichiometry-calculator-page.js contains HTML templates and is skipped
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

    // Write minified code
    fs.writeFileSync(filePath, result.code, 'utf8');
    const newSize = Buffer.byteLength(result.code, 'utf8');
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(
      `${colors.green}✓${colors.reset} ${path.basename(filePath)}: ` +
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
