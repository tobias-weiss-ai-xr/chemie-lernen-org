#!/usr/bin/env node
/**
 * generate-cross-links.mjs
 * Generates content-cross-links.json from content-links.json.
 * For each content URL, finds related articles, calculators, and exercises
 * that share the same curriculum topics.
 *
 * Usage:
 *   node scripts/curricula/generate-cross-links.mjs
 *
 * Output: myhugoapp/data/curricula/content-cross-links.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../myhugoapp/data/curricula');

// Load content-links.json
const linksPath = resolve(DATA_DIR, 'content-links.json');
const raw = readFileSync(linksPath, 'utf-8');
const topicLinks = JSON.parse(raw);

// Build URL → { title, type, topics: [topicName], topicCount }
const urlMap = new Map();

for (const [topicName, links] of Object.entries(topicLinks)) {
  for (const link of links) {
    if (!urlMap.has(link.url)) {
      urlMap.set(link.url, {
        title: link.title,
        type: link.type,
        topics: [],
      });
    }
    const entry = urlMap.get(link.url);
    if (!entry.topics.includes(topicName)) {
      entry.topics.push(topicName);
    }
  }
}

// For each URL, find cross-links to other URLs sharing ≥1 topic
const crossLinks = {};

for (const [url, info] of urlMap) {
  const related = { articles: [], calculators: [], exercises: [] };
  const seen = new Set();

  for (const topic of info.topics) {
    const links = topicLinks[topic] || [];
    for (const link of links) {
      if (link.url === url || seen.has(link.url)) continue;
      seen.add(link.url);

      const type =
        link.type === 'article'
          ? 'articles'
          : link.type === 'exercise'
            ? 'exercises'
            : link.type === 'calculator'
              ? 'calculators'
              : null;

      if (!type) continue;

      related[type].push({
        title: link.title,
        url: link.url,
      });
    }
  }

  // Limit to avoid massive output
  related.articles = related.articles.slice(0, 8);
  related.calculators = related.calculators.slice(0, 8);
  related.exercises = related.exercises.slice(0, 8);

  crossLinks[url] = {
    title: info.title,
    type: info.type,
    topicCount: info.topics.length,
    topics: info.topics.slice(0, 5), // top 5 for display
    related,
  };
}

const outPath = resolve(DATA_DIR, 'content-cross-links.json');
writeFileSync(outPath, JSON.stringify(crossLinks, null, 2), 'utf-8');

const stats = {
  urls: urlMap.size,
  withRelated: Object.values(crossLinks).filter(
    (c) => c.related.articles.length + c.related.calculators.length + c.related.exercises.length > 0
  ).length,
};

console.log(`Cross-links generated: ${stats.urls} URLs, ${stats.withRelated} with cross-links`);
console.log(`Output: ${outPath}`);
