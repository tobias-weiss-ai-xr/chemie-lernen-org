#!/usr/bin/env node
/**
 * cross-link-audit.mjs
 *
 * Scans content/themenbereiche/ articles and reports which are missing
 * from content-cross-links.json. Produces a coverage report.
 *
 * Usage: node scripts/cross-link-audit.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'myhugoapp', 'content', 'themenbereiche');
const CROSS_LINKS_FILE = join(__dirname, '..', 'myhugoapp', 'data', 'curricula', 'content-cross-links.json');

/**
 * Recursively find all article markdown files under themenbereiche/
 * Returns array of URL paths like "/themenbereiche/foo/bar/"
 */
function findArticles(dir, baseDir, baseUrl = '/themenbereiche') {
  const articles = [];
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        articles.push(...findArticles(fullPath, baseDir, `${baseUrl}/${entry.name}`));
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== '_index.md') {
        // This is an article file
        const articleName = entry.name.replace('.md', '');
        articles.push({
          path: fullPath,
          url: `${baseUrl}/${articleName}/`,
          name: articleName,
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message);
  }
  
  return articles;
}

/**
 * Load cross-links data
 */
function loadCrossLinks() {
  try {
    const data = readFileSync(CROSS_LINKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading cross-links:', err.message);
    return {};
  }
}

/**
 * Extract title from _index.md frontmatter
 */
function extractTitle(content) {
  const match = content.match(/^---\s*[\r\n]+([\s\S]*?)^---\s*[\r\n]/m);
  if (!match) return null;
  
  const frontmatter = match[1];
  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

// ── Main ──────────────────────────────────────────────────────────────────
function main() {
  const startTime = Date.now();
  
  console.log('=== Content Cross-Link Audit ===\n');
  
  // Find all articles
  const articles = findArticles(CONTENT_DIR, CONTENT_DIR);
  console.log(`Found ${articles.length} articles in content/themenbereiche/\n`);
  
  // Load cross-links
  const crossLinks = loadCrossLinks();
  const linkedUrls = new Set(Object.keys(crossLinks));
  console.log(`Cross-links file has ${linkedUrls.size} entries\n`);
  
  // Check coverage
  const missing = [];
  const present = [];
  
  for (const article of articles) {
    if (linkedUrls.has(article.url)) {
      present.push(article);
    } else {
      missing.push(article);
    }
  }
  
  const coverage = articles.length > 0 ? (present.length / articles.length * 100) : 0;
  
  // Report
  console.log('─'.repeat(70));
  console.log(`Total articles: ${articles.length}`);
  console.log(`Linked: ${present.length}`);
  console.log(`Missing: ${missing.length}`);
  console.log(`Coverage: ${coverage.toFixed(1)}%`);
  console.log('─'.repeat(70));
  
  if (missing.length > 0) {
    console.log('\n### Missing Cross-Links\n');
    for (const article of missing) {
      const content = readFileSync(article.path, 'utf-8');
      const title = extractTitle(content) || article.name;
      console.log(`- [ ] \`${article.url}\` — ${title}`);
    }
  }
  
  // Write report
  const report = {
    generated: new Date().toISOString(),
    duration: Date.now() - startTime,
    summary: {
      totalArticles: articles.length,
      linked: present.length,
      missing: missing.length,
      coveragePercent: Math.round(coverage * 10) / 10,
    },
    missingArticles: missing.map(a => {
      const content = readFileSync(a.path, 'utf-8');
      return {
        url: a.url,
        name: a.name,
        title: extractTitle(content) || a.name,
        path: a.path,
      };
    }),
  };
  
  const reportPath = join(dirname(CROSS_LINKS_FILE), 'cross-link-audit-report.json');
  import('fs').then(({ writeFileSync }) => {
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\nReport written to: ${reportPath}`);
  });
  
  console.log('');
  console.log(`Target: ≥95% coverage`);
  console.log(`Status: ${coverage >= 95 ? '✅ PASS' : '❌ NEEDS WORK'}`);
  console.log('');
  
  // Exit with appropriate code for CI
  process.exit(coverage >= 95 ? 0 : 1);
}

main();
