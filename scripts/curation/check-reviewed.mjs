#!/usr/bin/env node
/**
 * Safety check for the Chemie-Forschung curation gate.
 *
 *   node scripts/curation/check-reviewed.mjs
 *
 * Scans myhugoapp/content/chemie-forschung/*.md and exits non-zero if any
 * published (draft: false) article lacks review_status: published or a
 * reviewer. Also lists open drafts (info only).
 *
 * Intended to run as a CI step before deploy.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('myhugoapp/content/chemie-forschung');

function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return {};
  const end = lines.indexOf('---', 1);
  if (end === -1) return {};
  const fm = lines.slice(1, end);
  const get = (k) => {
    const re = new RegExp(`^${k}:\\s?(.*)$`);
    const hit = fm.find((l) => re.test(l));
    return hit ? hit.replace(re, '$1').trim().replace(/^"|"$/g, '') : undefined;
  };
  return { get };
}

function main() {
  if (!fs.existsSync(DIR)) {
    console.log(`ℹ No chemie-forschung content dir at ${DIR} — nothing to check.`);
    return;
  }
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
  const errors = [];
  const drafts = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(DIR, f), 'utf-8');
    const { get } = parseFrontmatter(raw);
    // Skip Hugo section indexes / non-articles (no dated frontmatter).
    if (get('date') === undefined) continue;
    const draft = get('draft');
    const status = get('review_status');
    const reviewer = get('reviewer');

    if (draft === 'true' || status === 'draft') {
      drafts.push(f);
      continue;
    }
    // published (draft: false) — must be properly reviewed
    if (status !== 'published' || !reviewer) {
      errors.push(`  ✗ ${f}: draft=${draft} review_status=${status} reviewer=${reviewer}`);
    }
  }

  if (drafts.length) {
    console.log(`ℹ Open drafts (${drafts.length}) — not yet published:`);
    drafts.forEach((d) => console.log(`    · ${d}`));
  }
  if (errors.length) {
    console.error(`\n✗ Curation check FAILED — ${errors.length} unreviewed published article(s):`);
    errors.forEach((e) => console.error(e));
    process.exit(1);
  }
  console.log(`\n✓ Curation check passed (${files.length} articles, ${drafts.length} open drafts).`);
}

main();
