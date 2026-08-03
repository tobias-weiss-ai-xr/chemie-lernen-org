# Article Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily AI pipeline that fetches chemistry RSS feeds, generates German articles via litellm, and pushes them to the Hugo site.

**Architecture:** Node.js script runs on the production server at 04:42 UTC via systemd timer. Fetches RSS feeds, deduplicates, sends to local litellm for German summarization, writes Hugo markdown, commits + pushes. Existing deploy timer picks up the push automatically.

**Tech Stack:** Node.js (ESM), fast-xml-parser, litellm (running on server), systemd timers, Hugos default section listing for `/posts/`.

---

## File Structure

| File                                                  | Purpose                          |
| ----------------------------------------------------- | -------------------------------- |
| `scripts/feeds.json`                                  | RSS feed URL configuration       |
| `scripts/article-pipeline.mjs`                        | Main pipeline script             |
| `/etc/systemd/system/chemie-article-pipeline.service` | Systemd service unit (on server) |
| `/etc/systemd/system/chemie-article-pipeline.timer`   | Systemd timer unit (on server)   |

No Hugo template changes needed — posts use the default single page layout, section listing is automatic.

---

### Task 1: Create feeds.json

**Files:**

- Create: `scripts/feeds.json`

- [ ] **Step 1: Create the feed config**

```json
[
  {
    "url": "https://rss.arxiv.org/rss/cs.CE",
    "lang": "en",
    "category": "forschung"
  },
  {
    "url": "https://www.chemistryworld.com/rss",
    "lang": "en",
    "category": "news"
  },
  {
    "url": "https://www.spektrum.de/rss/chemie/",
    "lang": "de",
    "category": "news"
  },
  {
    "url": "https://phys.org/rss-feed/chemistry-news/",
    "lang": "en",
    "category": "news"
  },
  {
    "url": "https://cen.acs.org/rss",
    "lang": "en",
    "category": "news"
  },
  {
    "url": "https://www.nature.com/chem.rss",
    "lang": "en",
    "category": "forschung"
  },
  {
    "url": "https://www.gdch.de/rss",
    "lang": "de",
    "category": "news"
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add scripts/feeds.json
git commit -m "feat: add RSS feed config for article pipeline"
```

### Task 2: Create article pipeline script

**Files:**

- Create: `scripts/article-pipeline.mjs`

- [ ] **Step 1: Create the pipeline script**

```javascript
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FEEDS_PATH = join(__dirname, 'feeds.json');
const POSTS_DIR = join(REPO_ROOT, 'myhugoapp', 'content', 'posts');
const MAX_ARTICLES = 3;
const LITELLM_URL = 'http://localhost:4000/chat/completions';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const SYSTEM_PROMPT = `Du bist ein Chemie-Redakteur für chemie-lernen.org.
Fasse den folgenden Artikel auf Deutsch zusammen (max. 300 Wörter).
Ergänze Hintergrundwissen wenn relevant.
Formatiere chemische Formeln mit KaTeX ($...$ oder $$...$$).
Titel: max. 80 Zeichen, aussagekräftig.
Füge 3-5 relevante Tags hinzu (z.B. chemie, forschung, [spezifisches Thema]).`;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
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
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  return parsed;
}

function extractItems(parsed) {
  const rss = parsed.rss;
  if (rss && rss.channel && rss.channel.item) {
    return Array.isArray(rss.channel.item) ? rss.channel.item : [rss.channel.item];
  }
  const feed = parsed.feed || parsed['feed'];
  if (feed && feed.entry) {
    return Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  }
  return [];
}

function extractTitle(item) {
  return item.title || item['title'] || item['title$t'] || '';
}

function extractLink(item) {
  const link = item.link || item['link'];
  if (typeof link === 'string') return link;
  if (link && link['@_href']) return link['@_href'];
  if (Array.isArray(link)) {
    for (const l of link) {
      if (typeof l === 'string') return l;
      if (l['@_href']) return l['@_href'];
    }
  }
  return '';
}

function extractDescription(item) {
  const desc = item.description || item['description'] || item.summary || item['summary'] || '';
  if (typeof desc === 'string') return desc.replace(/<[^>]*>/g, '').trim();
  if (desc['#text']) return desc['#text'].replace(/<[^>]*>/g, '').trim();
  return '';
}

async function generateArticle(title, description, sourceUrl) {
  const body = {
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
  };

  const res = await fetch(LITELLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) throw new Error(`litellm HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function parseGeneratedText(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  let title = '';
  let tags = [];
  let content = text;

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
    title = lines[0].replace(/^#\s*/, '').replace(/[*"]/g, '').trim().slice(0, 80);
  }

  return { title, tags, content };
}

function buildFrontmatter(title, date, tags) {
  const tagStr = tags.map((t) => `  - "${t}"`).join('\n');
  return `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
tags:
${tagStr}
categories: ["forschung"]
draft: false
---`;
}

function buildMarkdown(frontmatter, bodyContent) {
  const lines = bodyContent.split('\n');
  const body = lines
    .filter((l) => !l.match(/^(Titel|Tags?):/i))
    .join('\n')
    .trim();

  return `${frontmatter}\n\n${body}\n`;
}

async function getExistingUrls() {
  const urls = new Set();
  if (!existsSync(POSTS_DIR)) return urls;
  try {
    const entries = await readFile(join(POSTS_DIR, '.urls.json'), 'utf-8').catch(() => '[]');
    const parsed = JSON.parse(entries);
    parsed.forEach((u) => urls.add(u));
  } catch {}
  return urls;
}

async function saveUrl(url) {
  const path = join(POSTS_DIR, '.urls.json');
  let urls = [];
  try {
    urls = JSON.parse(await readFile(path, 'utf-8'));
  } catch {}
  urls.push(url);
  await writeFile(path, JSON.stringify(urls, null, 2));
}

async function run() {
  console.log(`[pipeline] Starting at ${new Date().toISOString()}`);

  const feeds = JSON.parse(await readFile(FEEDS_PATH, 'utf-8'));
  const existingUrls = await getExistingUrls();
  const candidates = [];

  for (const feed of feeds) {
    try {
      console.log(`[pipeline] Fetching ${feed.url}`);
      const parsed = await fetchFeed(feed.url);
      const items = extractItems(parsed);
      console.log(`[pipeline]   Got ${items.length} items`);

      for (const item of items) {
        const link = extractLink(item);
        if (!link || existingUrls.has(link)) continue;
        const title = extractTitle(item);
        const description = extractDescription(item);
        if (description.length < 100) continue;
        candidates.push({ title, description, url: link, lang: feed.lang });
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
      const today = dateStr();
      const isoDate = isoDateStr();
      const frontmatter = buildFrontmatter(
        title,
        isoDate,
        tags.length ? tags : ['chemie', 'forschung']
      );
      const markdown = buildMarkdown(frontmatter, generated);
      const filename = `${today}-${slug}.md`;
      await writeFile(join(POSTS_DIR, filename), markdown);
      await saveUrl(article.url);
      console.log(`[pipeline] Wrote ${filename}`);
    } catch (err) {
      console.error(`[pipeline] Error generating article "${article.title}": ${err.message}`);
    }
  }

  console.log(`[pipeline] Done`);
}

run().catch((err) => {
  console.error(`[pipeline] Fatal: ${err.message}`);
  process.exit(1);
});
```

- [ ] **Step 2: Add fast-xml-parser dependency**

Run in repo root:

```bash
npm install --save fast-xml-parser
```

Expected: package.json and package-lock.json updated with fast-xml-parser dependency.

- [ ] **Step 3: Commit**

```bash
git add scripts/article-pipeline.mjs package.json package-lock.json
git commit -m "feat: add article pipeline script"
```

### Task 3: Set up systemd timer on server

**Files:**

- Create: `/etc/systemd/system/chemie-article-pipeline.service`
- Create: `/etc/systemd/system/chemie-article-pipeline.timer`

- [ ] **Step 1: Create the service unit**

SSH to the server and create:

```bash
ssh root@v22290.1blu.de
cat > /etc/systemd/system/chemie-article-pipeline.service << 'SERVICEEOF'
[Unit]
Description=Chemistry article pipeline for chemie-lernen.org
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/opt/git/hugo-chemie-lernen-org
ExecStart=/usr/bin/node /opt/git/hugo-chemie-lernen-org/scripts/article-pipeline.mjs
StandardOutput=journal
StandardError=journal
SERVICEEOF
```

- [ ] **Step 2: Create the timer unit**

```bash
cat > /etc/systemd/system/chemie-article-pipeline.timer << 'TIMEREOF'
[Unit]
Description=Daily chemistry article pipeline at 04:42 UTC

[Timer]
OnCalendar=*-*-* 04:42:00
Persistent=true

[Install]
WantedBy=timers.target
TIMEREOF
```

- [ ] **Step 3: Enable and start the timer**

```bash
systemctl daemon-reload
systemctl enable chemie-article-pipeline.timer
systemctl start chemie-article-pipeline.timer
```

- [ ] **Step 4: Verify timer status**

```bash
systemctl list-timers --all | grep chemie-article
```

Expected: shows the timer with Next trigger at 04:42 UTC next day.

- [ ] **Step 5: Test the service manually**

```bash
systemctl start chemie-article-pipeline.service
journalctl -u chemie-article-pipeline.service --no-pager -n 50
```

Expected: service completes, articles appear in `myhugoapp/content/posts/`, git shows committed changes.

### Task 4: Verify end-to-end

- [ ] **Step 1: Check that articles appear on the site**

After the deploy timer picks up the push, visit:
https://chemie-lernen.org/posts/

Expected: section listing shows generated articles with titles, dates, and tags.

- [ ] **Step 2: Final commit of any remaining changes**

```bash
git add -A
git commit -m "chore: finalize article pipeline setup"
```
