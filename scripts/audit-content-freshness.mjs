#!/usr/bin/env node

/**
 * audit-content-freshness.mjs — Audit and update content freshness metadata.
 *
 * Usage:
 *   node scripts/audit-content-freshness.mjs                    # Report only
 *   node scripts/audit-content-freshness.mjs --update           # Add/update last_reviewed
 *   node scripts/audit-content-freshness.mjs --days=180         # Threshold (default: 180)
 *   node scripts/audit-content-freshness.mjs --dir=myhugoapp/content/pages
 *
 * Scans all *.md files under CONTENT_DIR, checks for last_reviewed frontmatter,
 * and reports stale content. With --update, adds last_reviewed: <today> to
 * files missing it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'myhugoapp', 'content');

// Parse CLI args
const args = process.argv.slice(2);
const FLAG_UPDATE = args.includes('--update');
const STALE_DAYS = parseInt(args.find((a) => a.startsWith('--days='))?.split('=')[1] || '180', 10);
const DIR_OVERRIDE = args.find((a) => a.startsWith('--dir='))?.split('=')[1];
const baseDir = DIR_OVERRIDE ? path.resolve(REPO_ROOT, DIR_OVERRIDE) : CONTENT_DIR;

const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { frontmatter: Record<string,any>, body: string, raw: string }
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { frontmatter: null, body: text, raw: '' };
  const raw = match[1];
  const frontmatter = {};
  for (const line of raw.split('\n')) {
    const sep = line.search(/:\s/);
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    // Strip quotes
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body: text.slice(match[0].length), raw };
}

function daysSince(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

function collectMarkdownFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// --- Main ---

const files = collectMarkdownFiles(baseDir);
console.log(`\n📄 Content Freshness Audit — ${TODAY_ISO}`);
console.log(`   Directory: ${baseDir}`);
console.log(`   Files found: ${files.length}`);
console.log(`   Stale threshold: ${STALE_DAYS} days`);
if (FLAG_UPDATE) console.log(`   Mode: UPDATE (adding last_reviewed where missing)\n`);
else console.log('   Mode: READ-ONLY (use --update to apply)\n');

let withReview = 0;
let stale = 0;
let missing = 0;
let updated = 0;

for (const filePath of files) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body, raw } = parseFrontmatter(text);

  if (!frontmatter) {
    missing++;
    continue;
  }

  const relPath = path.relative(CONTENT_DIR, filePath);
  const reviewed = frontmatter.last_reviewed;
  const created = frontmatter.date;

  if (!reviewed) {
    missing++;
    if (FLAG_UPDATE) {
      // Add last_reviewed after the date field (or after the first field if no date)
      const insertAfter = created ? `date: ${created}` : `title: ${frontmatter.title}`;
      const newRaw = raw.replace(new RegExp(`(${insertAfter})`), `$1\nlast_reviewed: ${TODAY_ISO}`);
      const newText = `---\n${newRaw}\n---\n${body}`;
      fs.writeFileSync(filePath, newText, 'utf-8');
      console.log(`  ✚ ${relPath} → last_reviewed: ${TODAY_ISO}`);
      updated++;
    } else {
      console.log(`  ⚠ ${relPath} — missing last_reviewed`);
    }
    continue;
  }

  withReview++;
  const age = daysSince(reviewed);
  if (age > STALE_DAYS) {
    stale++;
    console.log(`  🟡 ${relPath} — last_reviewed: ${reviewed} (${age}d ago)`);
  }
}

console.log(`\n─── Summary ───`);
console.log(`   Total files:    ${files.length}`);
console.log(`   With review:    ${withReview}`);
console.log(`   Stale (>${STALE_DAYS}d): ${stale}`);
console.log(`   Missing:        ${missing}`);
if (FLAG_UPDATE) console.log(`   Updated:        ${updated}`);
console.log('');
