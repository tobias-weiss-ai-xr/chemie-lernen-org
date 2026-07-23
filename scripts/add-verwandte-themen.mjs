#!/usr/bin/env node
/**
 * add-verwandte-themen.mjs
 *
 * Fügt "## Verwandte Themen" zu Artikel-Markdown-Dateien hinzu,
 * die diese Sektion noch nicht haben.
 *
 * Generiert automatisch Cross-Links zu anderen Artikeln im selben
 * Teilgebiet (gleicher Ordner). Verwendet Titel aus dem Frontmatter.
 *
 * Aufruf: node scripts/add-verwandte-themen.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEMENBEREICHE_DIR = path.resolve(__dirname, '..', 'myhugoapp', 'content', 'themenbereiche');

/**
 * Parst YAML-Frontmatter aus einer Markdown-Datei.
 * Gibt { frontmatter, content, raw } zurück.
 */
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
    // Remove quotes
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    frontmatter[key] = val;
  }

  return {
    frontmatter,
    content: match[2],
    raw,
  };
}

/**
 * Liest alle Artikel-Dateien in einem Themenbereich-Ordner,
 * sammelt Titel und Pfad.
 */
function scanArticles(bereichPath, bereichName) {
  const articles = [];
  const entries = fs.readdirSync(bereichPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    if (entry.name === '_index.md') continue;

    const filePath = path.join(bereichPath, entry.name);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) continue;

    // Build relative URL path
    const slug = entry.name.replace(/\.md$/, '');
    const urlPath = `/themenbereiche/${bereichName}/${slug}/`;
    articles.push({
      title: parsed.frontmatter.title || slug,
      description: parsed.frontmatter.description || '',
      slug,
      urlPath,
      filePath,
      raw,
      parsed,
    });
  }
  return articles;
}

function generateVerwandteThemenBlock(article, peers) {
  const lines = ['## Verwandte Themen\n'];
  for (const peer of peers) {
    const desc = peer.description ? ` – ${peer.description}` : '';
    lines.push(`- [${peer.title}](${peer.urlPath})${desc}`);
  }
  lines.push(''); // trailing newline
  return lines.join('\n');
}

function main() {
  const bereiche = fs
    .readdirSync(THEMENBEREICHE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let added = 0;
  let skippedNoPeers = 0;
  let skippedHasSection = 0;

  for (const bereichName of bereiche) {
    const bereichPath = path.join(THEMENBEREICHE_DIR, bereichName);
    const allArticles = scanArticles(bereichPath, bereichName);

    for (const article of allArticles) {
      // Check if already has Verwandte Themen
      if (
        article.raw.includes('## Verwandte Themen') ||
        article.parsed.content.includes('## Verwandte Themen')
      ) {
        skippedHasSection++;
        continue;
      }

      // Peers = other articles in the same Bereich
      const peers = allArticles.filter((a) => a.filePath !== article.filePath);
      if (peers.length === 0) {
        skippedNoPeers++;
        continue;
      }

      const block = generateVerwandteThemenBlock(article, peers);
      const content = article.parsed.content;

      // Find position: before "## Zusammenfassung" if exists, else at end
      const summaryMatch = content.match(/^## Zusammenfassung$/m);
      let newContent;
      if (summaryMatch) {
        const insertPos = summaryMatch.index;
        newContent = content.slice(0, insertPos) + block + '\n' + content.slice(insertPos);
      } else {
        // Append at the end (with a blank line before)
        const trimmed = content.trimEnd();
        newContent = trimmed + '\n\n' + block;
      }

      // Write back
      const fullFile =
        article.raw.slice(0, article.raw.indexOf(article.parsed.content)) + newContent;
      fs.writeFileSync(article.filePath, fullFile, 'utf-8');
      added++;
      console.log(`  ✅ ${bereichName}/${path.basename(article.filePath)} (${peers.length} peers)`);
    }
  }

  console.log(
    `\nFertig: ${added} Artikel erweitert, ${skippedHasSection} hatten bereits Verwandte Themen, ${skippedNoPeers} übersprungen (keine anderen Artikel im Bereich).`
  );
}

main();
