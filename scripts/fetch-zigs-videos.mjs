#!/usr/bin/env node

/**
 * fetch-zigs-videos.mjs — Pulls the latest video list from the YouTube channel
 * "Zig's Chemistry 42" (Prof. Siegfried Schindler, @ZigsChemistry42) via its
 * public RSS feed and writes myhugoapp/data/zigs-videos.json for the Hugo site.
 *
 * The /lernvideos/ page renders this data through the `zigs-video-list`
 * shortcode, so new uploads appear automatically on the next build.
 *
 * Error handling:
 * - If the feed is unreachable (CI offline, YouTube blocks, …) and a data file
 *   already exists, it is kept and the script exits 0 (non-fatal for prebuild).
 * - If no data file exists yet, the script exits 1 so the failure is visible.
 *
 * Depends on the fast-xml-parser package (same as article-pipeline.mjs).
 */

import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DATA_FILE = join(REPO_ROOT, 'myhugoapp', 'data', 'zigs_videos.json');

const CHANNEL_ID = 'UCAY_WdEZnN6GM2HYuPYhh_w';
const CHANNEL_HANDLE = '@ZigsChemistry42';
const CHANNEL_TITLE = "Zig's Chemistry 42";
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const FEED_UA = 'Mozilla/5.0 (compatible; chemie-lernen-zigbot/1.0)';
const FETCH_TIMEOUT_MS = 20000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function toIsoDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

async function fetchFeed() {
  const res = await fetch(FEED_URL, {
    headers: {
      'User-Agent': FEED_UA,
      Accept: 'application/atom+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`YouTube feed returned HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function parseFeed(xml) {
  const data = parser.parse(xml);
  const entries = data?.feed?.entry;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('No <entry> elements found in YouTube feed (feed structure changed?)');
  }
  const videos = entries
    .map((entry) => {
      const id = entry?.['yt:videoId'] ?? '';
      const title = String(entry?.title ?? '').trim();
      if (!id || !title) return null;
      return {
        id,
        title,
        published: toIsoDate(entry?.published ?? ''),
        url: `https://www.youtube.com/watch?v=${id}`,
        thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      };
    })
    .filter(Boolean);
  // Newest first
  videos.sort((a, b) => (a.published < b.published ? 1 : -1));
  return videos;
}

async function main() {
  const xml = await fetchFeed();
  const videos = parseFeed(xml);

  const payload = {
    fetched: new Date().toISOString(),
    channel: {
      id: CHANNEL_ID,
      title: CHANNEL_TITLE,
      handle: CHANNEL_HANDLE,
      url: CHANNEL_URL,
    },
    videos,
  };

  await writeFile(DATA_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`[zigs] Wrote ${videos.length} videos -> ${DATA_FILE}`);
  const newest = videos[0];
  if (newest) {
    console.log(`[zigs] Newest: ${newest.title} (${newest.published})`);
  }
}

main().catch((err) => {
  console.error(`[zigs] ERROR: ${err.message}`);
  if (existsSync(DATA_FILE)) {
    console.error(`[zigs] Keeping existing ${DATA_FILE} (non-fatal)`);
    process.exit(0);
  }
  console.error('[zigs] No existing data file to fall back to — aborting');
  process.exit(1);
});