#!/usr/bin/env node
/**
 * update-index-links.mjs
 *
 * Aktualisiert _index.md-Dateien: Fügt Links zu allen Unterseiten
 * im "Weiterführende Themen"-Bereich hinzu.
 *
 * Aufruf: node scripts/update-index-links.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEMEN_DIR = path.resolve(__dirname, '..', 'myhugoapp', 'content', 'themenbereiche');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const fmLines = match[1].split('\n');
  const frontmatter = {};
  for (const line of fmLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    frontmatter[key] = val;
  }
  return { frontmatter, content: match[2] };
}

function main() {
  const bereiche = fs.readdirSync(THEMEN_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const bereich of bereiche) {
    const dir = path.join(THEMEN_DIR, bereich);
    const indexFile = path.join(dir, '_index.md');
    if (!fs.existsSync(indexFile)) {
      console.log(`  ⚠️  Kein _index.md in ${bereich}/`);
      continue;
    }

    // Get all sub-articles
    const articles = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== '_index.md')
      .map(f => {
        const fp = path.join(dir, f);
        const raw = fs.readFileSync(fp, 'utf-8');
        const parsed = parseFrontmatter(raw);
        const title = parsed?.frontmatter?.title || f.replace('.md', '');
        const desc = parsed?.frontmatter?.description || '';
        const slug = f.replace('.md', '');
        return { title, desc, slug, fp };
      });

    const raw = fs.readFileSync(indexFile, 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) continue;

    const fm = parsed.frontmatter;
    const body = parsed.content;

    // Check that each article is linked somewhere in the index
    let needsUpdate = false;
    const linkedSlugs = new Set();
    const linkRegex = /\]\(\/themenbereiche\/[^/]+\/([^/]+)\/\)/g;
    let match;
    while ((match = linkRegex.exec(body)) !== null) {
      linkedSlugs.add(match[1]);
    }

    const missing = articles.filter(a => !linkedSlugs.has(a.slug));
    
    if (missing.length > 0) {
      console.log(`\n📋 ${bereich}/_index.md fehlt ${missing.length} Links:`);
      for (const a of missing) {
        console.log(`     - ${a.title}`);
      }

      // Add missing links before "## Weiterführende Themen" section
      const weiterSection = body.match(/^## Weiterführende Themen$/m);
      if (weiterSection) {
        // Find the end of the existing Weiterführende Themen section
        const afterWtStart = body.indexOf('## Weiterführende Themen') + '## Weiterführende Themen'.length;
        const afterSection = body.slice(afterWtStart);
        const nextSection = afterSection.match(/\n## /);
        const sectionEnd = nextSection ? afterWtStart + nextSection.index : body.length;

        const newLinks = missing.map(a => {
          const desc = a.desc ? ` – ${a.desc}` : '';
          return `\n- [${a.title}](/themenbereiche/${bereich}/${a.slug}/)${desc}`;
        }).join('');

        const newBody = body.slice(0, sectionEnd) + newLinks + '\n' + body.slice(sectionEnd);
        fs.writeFileSync(indexFile, `---\n${Object.entries(fm).map(([k,v]) => `${k}: '${v}'`).join('\n')}\n---\n${newBody}`, 'utf-8');
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log(`  ✅ ${bereich}/_index.md aktualisiert`);
    } else {
      console.log(`  ✓ ${bereich}/_index.md OK (alle ${articles.length} Artikel verlinkt)`);
    }
  }

  console.log('\nFertig.');
}

main();
