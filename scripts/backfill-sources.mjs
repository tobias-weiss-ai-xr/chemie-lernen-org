import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const POSTS_DIR = join(REPO_ROOT, 'myhugoapp', 'content', 'posts');

const URL_MAP = {
  'metallfreie-carboran': 'https://phys.org/news/2026-05-metal-free-method-carborane-cancer.html',
  'neue-quantenmethode':
    'https://phys.org/news/2026-06-method-uncovers-conical-intersections-driven.html',
  'neue-katalysatoren-reduzieren-verdampfungsverluste':
    'https://phys.org/news/2026-05-catalysts-losses-liquid-hydrogen-production.html',
  'methan-wird-mit-licht': 'https://www.sciencedaily.com/releases/2026/02/260227071916.htm',
  'eisen-katalysator-uebertrifft-seltene-metalle':
    'https://www.sciencedaily.com/releases/2026/02/260227061821.htm',
  'wolframcarbid-katalysator-uebertrifft-platin':
    'https://www.sciencedaily.com/releases/2026/01/260124003806.htm',
};

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  return m ? m[1] : null;
}
function hasRealSource(fm) {
  const m = fm.match(/^source:\s*"([^"]+)"/m);
  return m && m[1] !== 'unknown' && m[1] !== '';
}
function hasQuelle(c) {
  return /### 📄 Quelle|_Quelle:/m.test(c);
}
function getSource(fm) {
  const m = fm.match(/^source:\s*"([^"]+)"/m);
  return m ? m[1] : null;
}

function findUrl(file) {
  const f = file.toLowerCase();
  for (const [key, url] of Object.entries(URL_MAP)) if (f.includes(key)) return url;
  return null;
}

function addSourceToFm(fm, url) {
  return fm.replace(/^(draft:.+)$/m, `source: "${url}"\n$1`);
}

function addQuelleBody(body, url) {
  if (/### 📄 Quelle/.test(body)) return body;
  const sep = '\n---\n\n### 🧪 Verwandte Rechner';
  const idx = body.indexOf(sep);
  const block =
    url === 'unbekannt'
      ? `\n\n---\n\n### 📄 Quelle\n\n*Quelle nicht verfügbar*\n`
      : `\n\n---\n\n### 📄 Quelle\n\n[Original-Artikel](${url})\n`;
  return idx !== -1 ? body.slice(0, idx) + block + body.slice(idx) : body + block;
}

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md') && f !== '_index.md');
console.log(`[backfill] ${files.length} posts`);

let updated = 0,
  skipped = 0,
  missing = 0;
for (const file of files) {
  const fp = join(POSTS_DIR, file);
  let c = await readFile(fp, 'utf-8');
  const fm = parseFrontmatter(c);
  if (!fm || !fm.includes('forschung')) {
    skipped++;
    continue;
  }
  if (hasQuelle(c) && hasRealSource(fm)) {
    skipped++;
    continue;
  }

  // Use existing source URL if it's real, otherwise try to find one
  let url = getSource(fm);
  if (!url || url === 'unknown') url = findUrl(file);
  if (!url) {
    // Add "Quelle nicht verfügbar" for posts without source
    if (!hasQuelle(c)) {
      url = 'unbekannt';
      const newFm = addSourceToFm(fm.replace(/^source:.*$/m, '').trim(), url);
      c = c.replace(`---\n${fm}\n---`, `---\n${newFm}\n---`);
      const bm = c.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/);
      if (bm) c = c.replace(bm[1], addQuelleBody(bm[1], url));
      await writeFile(fp, c);
      updated++;
      console.log(`[backfill] ✓ ${file} (Quelle nicht verfügbar)`);
    } else {
      console.log(`[backfill] ? ${file}`);
      missing++;
    }
    continue;
  }

  console.log(`[backfill] ✓ ${file} → ${url.replace(/^https?:\/\//, '').slice(0, 50)}...`);

  // Update frontmatter if needed
  const oldSource = getSource(fm);
  if (oldSource !== url) {
    const newFm = addSourceToFm(fm.replace(/^source:.*$/m, '').trim(), url);
    c = c.replace(`---\n${fm}\n---`, `---\n${newFm}\n---`);
  }

  // Add Quelle block if missing
  if (!hasQuelle(c)) {
    const bm = c.match(/^---\n[\s\S]*?\n---\n([\s\S]*)/);
    if (bm) c = c.replace(bm[1], addQuelleBody(bm[1], url));
  }
  await writeFile(fp, c);
  updated++;
}
console.log(`[backfill] Done. ${updated} updated, ${skipped} skipped, ${missing} missing source.`);
