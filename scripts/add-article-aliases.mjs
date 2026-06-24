#!/usr/bin/env node
/**
 * add-article-aliases.mjs
 *
 * Adds Hugo `aliases` frontmatter to all article markdown files
 * under myhugoapp/content/themenbereiche/.
 *
 * For each .md file, adds: aliases: [/article/{filename}/]
 * where {filename} is the markdown filename without extension.
 *
 * Idempotent: skips files that already have an `aliases:` key.
 *
 * Usage: node scripts/add-article-aliases.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve(
  import.meta.dirname,
  '..',
  'myhugoapp',
  'content',
  'themenbereiche',
);

/**
 * Check if a line is a YAML frontmatter key line (e.g., "title: foo" or "aliases: [...]").
 */
function isKeyLine(line) {
  return /^[a-zA-Z_][a-zA-Z0-9_-]*\s*:/.test(line);
}

/**
 * Parse frontmatter from markdown content, return { frontmatterLines, bodyLines, fmEndIndex }.
 */
function splitFrontmatter(content) {
  const lines = content.split('\n');
  if (lines.length < 2 || lines[0].trim() !== '---') {
    return { frontmatterLines: [], bodyLines: lines, fmEndIndex: -1 };
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) {
    return { frontmatterLines: [], bodyLines: lines, fmEndIndex: -1 };
  }
  return {
    frontmatterLines: lines.slice(1, endIdx),
    bodyLines: lines.slice(endIdx + 1),
    fmEndIndex: endIdx,
  };
}

/**
 * Recursively find all .md files in a directory.
 */
function findMdFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findMdFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist or can't be read
  }
  return results;
}

function run() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = findMdFiles(CONTENT_DIR);
  console.log(`Found ${files.length} .md files in ${CONTENT_DIR}`);

  let modified = 0;
  let skipped = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatterLines, bodyLines, fmEndIndex } = splitFrontmatter(content);

    if (fmEndIndex === -1) {
      skipped++;
      continue;
    }

    // Check if 'aliases:' already exists in frontmatter
    const hasAliases = frontmatterLines.some((line) => /^aliases\s*:/.test(line.trim()));

    if (hasAliases) {
      skipped++;
      continue;
    }

    // Build the slug from filename
    const basename = path.basename(filePath, '.md');
    const aliasLine = `aliases: [/article/${basename}/]`;

    // Find the last key:value line in frontmatter to insert after
    // Insert before the last frontmatter line (works for typical YAML)
    // Or just append to frontmatter (before closing ---)
    const newFrontmatter = [...frontmatterLines, aliasLine];
    const newContent =
      '---\n' + newFrontmatter.join('\n') + '\n---\n' + bodyLines.join('\n');

    fs.writeFileSync(filePath, newContent, 'utf-8');
    modified++;
    console.log(`  + ${aliasLine}  →  ${path.relative(CONTENT_DIR, filePath)}`);
  }

  console.log(`\nDone: ${modified} files modified, ${skipped} files skipped.`);
}

run();
