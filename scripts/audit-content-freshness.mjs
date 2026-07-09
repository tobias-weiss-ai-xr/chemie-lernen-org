#!/usr/bin/env node
/**
 * audit-content-freshness.mjs — Scans all themenbereiche articles for
 * `last_reviewed` frontmatter and flags articles not reviewed in 6+ months.
 *
 * Usage:
 *   node scripts/audit-content-freshness.mjs          # human-readable report
 *   node scripts/audit-content-freshness.mjs --json   # JSON output
 *   node scripts/audit-content-freshness.mjs --stale  # exit 1 if stale found
 *
 * Output: list of articles with last_reviewed > 180 days ago
 * Exit codes: 0 = all fresh, 1 = stale articles found (with --stale)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const THEMENBEREICHE_DIR = path.join(REPO_ROOT, 'myhugoapp', 'content', 'themenbereiche');

const STALE_DAYS = 180;
const args = process.argv.slice(2);
const isJson = args.includes('--json');
const isStrict = args.includes('--stale');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let val = kv[2].trim();
      // Remove surrounding quotes
      if ((val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      fm[kv[1]] = val;
    }
  }
  return fm;
}

function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

const results = [];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '_index.md') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const fm = parseFrontmatter(content);
      const relativePath = path.relative(THEMENBEREICHE_DIR, fullPath);

      if (!fm.last_reviewed) {
        results.push({
          file: relativePath,
          title: fm.title || '(unknown)',
          status: 'missing',
          daysSinceReview: null,
        });
        continue;
      }

      const days = daysSince(fm.last_reviewed);
      results.push({
        file: relativePath,
        title: fm.title || '(unknown)',
        status: days > STALE_DAYS ? 'stale' : 'fresh',
        lastReviewed: fm.last_reviewed,
        daysSinceReview: days,
      });
    }
  }
}

walkDir(THEMENBEREICHE_DIR);

// Summary counts
const total = results.length;
const missing = results.filter(r => r.status === 'missing').length;
const stale = results.filter(r => r.status === 'stale').length;
const fresh = results.filter(r => r.status === 'fresh').length;

if (isJson) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total, fresh, stale, missing },
    articles: results,
  }, null, 2));
} else {
  console.log(`\n📋 Content Freshness Audit — ${new Date().toISOString().slice(0, 10)}\n`);
  console.log(`   Total articles: ${total}`);
  console.log(`   ✅ Fresh (≤${STALE_DAYS}d): ${fresh}`);
  console.log(`   ⚠️  Stale (>${STALE_DAYS}d): ${stale}`);
  console.log(`   ❌ Missing last_reviewed: ${missing}\n`);

  if (stale > 0 || missing > 0) {
    console.log('Articles needing attention:\n');
    for (const r of results) {
      if (r.status === 'stale') {
        console.log(`   ⚠️  ${r.file}`);
        console.log(`       Title: ${r.title}`);
        console.log(`       Last reviewed: ${r.lastReviewed} (${r.daysSinceReview} days ago)\n`);
      } else if (r.status === 'missing') {
        console.log(`   ❌ ${r.file}`);
        console.log(`       Title: ${r.title}`);
        console.log(`       Missing last_reviewed field\n`);
      }
    }
  }

  if (fresh === total) {
    console.log('   ✅ All articles are up to date!\n');
  }
}

if (isStrict && (stale > 0 || missing > 0)) {
  process.exit(1);
}
