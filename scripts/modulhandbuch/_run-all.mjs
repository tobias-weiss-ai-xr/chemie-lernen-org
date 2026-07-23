/**
 * _run-all.mjs — Run all modulhandbuch scrapers in sequence.
 *
 * Usage: node scripts/modulhandbuch/_run-all.mjs
 *
 * Each scraper outputs to myhugoapp/data/modulhandbuch/<state>.json.
 * Import the resulting files with: npm run import:modulhandbuch
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scrapers = [
  'by.mjs',
  'nw.mjs',
  'bw.mjs',
];

let totalModules = 0;
let errors = [];

for (const scraper of scrapers) {
  const scraperPath = path.join(__dirname, scraper);
  console.log(`\n── Running ${scraper} ──`);

  try {
    const output = execSync(`node "${scraperPath}"`, {
      encoding: 'utf-8',
      timeout: 120000, // 2 min per scraper
    });
    console.log(output.trim());
    const match = output.match(/(\d+) modules? (saved|found|output)/i);
    if (match) totalModules += parseInt(match[1], 10);
  } catch (err) {
    const msg = `  ✗ ${scraper}: ${err.message.split('\n')[0]}`;
    console.error(msg);
    errors.push(msg);
  }
}

console.log(`\n═══ Summary ═══`);
console.log(`Total modules scraped: ${totalModules}`);
if (errors.length) {
  console.log(`Errors (${errors.length}):`);
  errors.forEach((e) => console.log(`  ${e}`));
  process.exit(1);
} else {
  console.log('All scrapers completed successfully.');
}
