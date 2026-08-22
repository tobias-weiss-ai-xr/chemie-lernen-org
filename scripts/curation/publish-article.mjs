#!/usr/bin/env node
/**
 * Publish a draft Chemie-Forschung article after human review.
 *
 *   node scripts/curation/publish-article.mjs <path> [--reviewer "Name"]
 *
 * Enforces quality heuristics, then flips the article to published:
 *   review_status: draft  -> published
 *   draft: true           -> false
 *   reviewer / review_date are stamped
 * and commits the change.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const MIN_BODY_CHARS = 800;
const REQUIRED_FIELDS = ['title', 'description', 'date'];
const PLACEHOLDERS = [/TODO/i, /lorem ipsum/i, /xxx+/i];

function tagsPresent(fm) {
  const i = fm.findIndex((l) => /^tags:/.test(l));
  if (i === -1) return false;
  for (let j = i + 1; j < fm.length; j++) {
    if (/^\s*-\s+/.test(fm[j])) return true;
    if (/^[A-Za-z_]+:/.test(fm[j])) break; // next key reached
  }
  return false;
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') fail('No frontmatter delimited by --- at top');
  const end = lines.indexOf('---', 1);
  if (end === -1) fail('Unterminated frontmatter');
  const fm = lines.slice(1, end);
  const body = lines.slice(end + 1).join('\n');
  const get = (k) => {
    const re = new RegExp(`^${k}:\\s?(.*)$`);
    const hit = fm.find((l) => re.test(l));
    return hit ? hit.replace(re, '$1').trim().replace(/^"|"$/g, '') : undefined;
  };
  return { fm, body, get };
}

function setScalar(fm, key, value) {
  const idx = fm.findIndex((l) => new RegExp(`^${key}:`).test(l));
  const line = `${key}: ${value}`;
  if (idx === -1) {
    // insert before closing (last line is the body start; fm has no ---)
    fm.push(line);
  } else {
    fm[idx] = line;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) fail('Usage: publish-article.mjs <path> [--reviewer "Name"]');
  let reviewerArg;
  const ri = args.findIndex((a) => a === '--reviewer' || a.startsWith('--reviewer='));
  if (ri !== -1)
    reviewerArg = args[ri].startsWith('--reviewer=') ? args[ri].split('=')[1] : args[ri + 1];
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) fail(`File not found: ${abs}`);

  const raw = fs.readFileSync(abs, 'utf-8');
  const { fm, body, get } = parseFrontmatter(raw);

  // --- heuristics ---
  if (get('review_status') !== 'draft')
    fail(`review_status is "${get('review_status')}", expected "draft"`);
  if (body.trim().length < MIN_BODY_CHARS)
    fail(`body too short (${body.trim().length} < ${MIN_BODY_CHARS} chars)`);
  for (const f of REQUIRED_FIELDS)
    if (get(f) === undefined || get(f) === '')
      fail(`missing required field: ${f}`);
  if (!tagsPresent(fm)) fail('missing required field: tags (list empty)');
  for (const re of PLACEHOLDERS)
    if (re.test(body)) fail(`placeholder text detected: ${re}`);

  // --- stamp ---
  const reviewer = reviewerArg || gitUserName();
  setScalar(fm, 'review_status', 'published');
  setScalar(fm, 'draft', 'false');
  setScalar(fm, 'reviewer', `"${reviewer}"`);
  setScalar(fm, 'review_date', today());

  const out = `---\n${fm.join('\n')}\n---\n${body}`;
  fs.writeFileSync(abs, out, 'utf-8');

  execFileSync('git', ['add', abs], { stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', `curation: publish ${path.basename(abs)} (reviewer: ${reviewer})`], {
    stdio: 'inherit',
  });
  console.log(`✓ Published ${path.basename(abs)} — reviewer: ${reviewer}`);
}

function gitUserName() {
  try {
    return execFileSync('git', ['config', 'user.name']).toString().trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

main();
