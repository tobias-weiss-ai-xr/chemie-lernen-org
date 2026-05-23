import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FEEDS_PATH = join(__dirname, 'feeds.json');
const POSTS_DIR = join(REPO_ROOT, 'myhugoapp', 'content', 'posts');
const URLS_DB = join(POSTS_DIR, '.urls.json');
const MAX_ARTICLES = 3;
const LITELLM_URL = 'http://localhost:4000/chat/completions';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

const SYSTEM_PROMPT = `Du bist ein Chemie-Redakteur für chemie-lernen.org.
Fasse den folgenden Artikel auf Deutsch zusammen (max. 300 Wörter).
Ergänze Hintergrundwissen wenn relevant.
Formatiere chemische Formeln mit KaTeX ($...$ oder $$...$$).
Titel: max. 80 Zeichen, aussagekräftig.
Füge 3-5 relevante Tags hinzu (z.B. chemie, forschung, [spezifisches Thema]).`;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function dateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoDateStr() {
  return new Date().toISOString().replace(/\.\d{3}Z/, '+02:00');
}

async function fetchFeed(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parser.parse(await res.text());
}

function extractItems(parsed) {
  if (parsed.rss?.channel?.item) {
    const items = parsed.rss.channel.item;
    return Array.isArray(items) ? items : [items];
  }
  const feed = parsed.feed || parsed['feed'] || null;
  if (feed?.entry) {
    return Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  }
  return [];
}

function extractTitle(item) {
  const t = item.title || item['title'] || item['title$t'] || '';
  if (typeof t === 'string') return t;
  if (t['#text']) return t['#text'];
  return '';
}

function extractLink(item) {
  const link = item.link || item['link'];
  if (typeof link === 'string') return link;
  if (link?.['@_href']) return link['@_href'];
  if (Array.isArray(link)) {
    for (const l of link) {
      if (typeof l === 'string') return l;
      if (l['@_href']) return l['@_href'];
    }
  }
  return '';
}

function extractDescription(item) {
  const raw = (
    item.description ||
    item['description'] ||
    item.summary ||
    item['summary'] ||
    item['content'] ||
    item['content:encoded'] ||
    ''
  );
  if (typeof raw === 'string') return raw.replace(/<[^>]*>/g, '').trim();
  if (raw['#text']) return raw['#text'].replace(/<[^>]*>/g, '').trim();
  return '';
}

async function generateArticle(title, description, sourceUrl) {
  const res = await fetch(LITELLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Quelle: ${sourceUrl}\n\nTitel: ${title}\n\nText:\n${description.slice(0, 3000)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`litellm HTTP ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

function parseGeneratedText(text) {
  let title = '';
  let tags = [];

  const titleMatch = text.match(/^Titel:\s*(.+)/m);
  if (titleMatch) {
    title = titleMatch[1].replace(/[*#]/g, '').trim();
  }

  const tagMatch = text.match(/Tags?:\s*(.+)/i);
  if (tagMatch) {
    tags = tagMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);
  }

  if (!title) {
    const firstLine = text.split('\n').find((l) => l.trim());
    title = (firstLine || '').replace(/^#\s*/, '').replace(/[*"]/g, '').trim().slice(0, 80);
  }

  return { title, tags: tags.length ? tags : ['chemie', 'forschung'] };
}

function buildFrontmatter(title, date, tags) {
  const escapedTitle = title.replace(/"/g, '\\"');
  const tagLines = tags.map((t) => `  - "${t}"`).join('\n');
  return `---
title: "${escapedTitle}"
date: "${date}"
tags:
${tagLines}
categories: ["forschung"]
draft: false
---`;
}

function buildMarkdown(frontmatter, bodyContent) {
  const body = bodyContent
    .split('\n')
    .filter((l) => !l.match(/^(Titel|Tags?):/i))
    .join('\n')
    .trim();
  return `${frontmatter}\n\n${body}\n`;
}

async function loadSeenUrls() {
  try {
    return new Set(JSON.parse(await readFile(URLS_DB, 'utf-8')));
  } catch {
    return new Set();
  }
}

async function saveSeenUrl(url) {
  const seen = await loadSeenUrls();
  seen.add(url);
  await writeFile(URLS_DB, JSON.stringify([...seen], null, 2));
}

async function run() {
  console.log(`[pipeline] Starting at ${new Date().toISOString()}`);

  const feeds = JSON.parse(await readFile(FEEDS_PATH, 'utf-8'));
  const seenUrls = await loadSeenUrls();
  const candidates = [];

  for (const feed of feeds) {
    try {
      console.log(`[pipeline] Fetching ${feed.url}`);
      const parsed = await fetchFeed(feed.url);
      const items = extractItems(parsed);
      console.log(`[pipeline]   Got ${items.length} items`);

      for (const item of items) {
        const url = extractLink(item);
        if (!url || seenUrls.has(url)) continue;
        const description = extractDescription(item);
        if (description.length < 100) continue;
        candidates.push({
          title: extractTitle(item),
          description,
          url,
          lang: feed.lang,
        });
      }
    } catch (err) {
      console.error(`[pipeline] Error fetching ${feed.url}: ${err.message}`);
    }
  }

  candidates.sort((a, b) => b.description.length - a.description.length);
  const selected = candidates.slice(0, MAX_ARTICLES);
  console.log(`[pipeline] Selected ${selected.length} articles to generate`);

  if (!existsSync(POSTS_DIR)) {
    await mkdir(POSTS_DIR, { recursive: true });
  }

  for (const article of selected) {
    try {
      console.log(`[pipeline] Generating: ${article.title}`);
      const generated = await generateArticle(article.title, article.description, article.url);
      const { title, tags } = parseGeneratedText(generated);
      const slug = slugify(title);
      const filename = `${dateStr()}-${slug}.md`;
      const frontmatter = buildFrontmatter(title, isoDateStr(), tags);
      const markdown = buildMarkdown(frontmatter, generated);
      await writeFile(join(POSTS_DIR, filename), markdown);
      await saveSeenUrl(article.url);
      console.log(`[pipeline] Wrote ${filename}`);
    } catch (err) {
      console.error(`[pipeline] Error generating "${article.title}": ${err.message}`);
    }
  }

  if (selected.length > 0) {
    try {
      console.log(`[pipeline] Committing and pushing...`);
      execSync('git add -A', { cwd: REPO_ROOT, stdio: 'pipe' });
      execSync(`git commit -m "articles: ${dateStr()}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
      execSync('git push', { cwd: REPO_ROOT, stdio: 'pipe' });
      console.log(`[pipeline] Pushed successfully`);
    } catch (err) {
      console.error(`[pipeline] Git error: ${err.message}`);
    }
  }

  console.log(`[pipeline] Done`);
}

run().catch((err) => {
  console.error(`[pipeline] Fatal: ${err.message}`);
  process.exit(1);
});
