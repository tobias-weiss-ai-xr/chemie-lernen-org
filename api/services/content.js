/**
 * Content service — entity lookups, article index, content linking, utilities.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

// ── Fallback data ──────────────────────────────────────────────

let _cachedFallbackData = null;

/**
 * Get or load fallback data (kg_fallback.json) — used when Neo4j is unreachable.
 * @returns {{ articles: Array, entities: Array, curricula: Array }}
 */
export function getFallbackData() {
  if (_cachedFallbackData) return _cachedFallbackData;
  // Resolve relative to this module file (api/services/), not process.cwd()
  var _moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const fallbackPath = path.resolve(_moduleDir, '..', 'data', 'kg_fallback.json');
  try {
    _cachedFallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      'Failed to load kg_fallback.json'
    );
    _cachedFallbackData = { articles: [], entities: [], curricula: [] };
  }
  return _cachedFallbackData;
}

// ── Entity helpers ─────────────────────────────────────────────

/**
 * Find an entity by slug/name across all fallback data.
 * @param {string} slug
 * @returns {object|null}
 */
export function findEntityBySlug(slug) {
  var data = getFallbackData();
  var normalized = slug.toLowerCase().replace(/-/g, ' ');
  var entity = null;
  var fi;
  for (fi = 0; fi < data.entities.length; fi++) {
    if (data.entities[fi].name.toLowerCase() === normalized) {
      entity = data.entities[fi];
      break;
    }
  }
  if (!entity && data.curricula) {
    for (fi = 0; fi < data.curricula.length; fi++) {
      if (data.curricula[fi].name.toLowerCase() === normalized) {
        entity = data.curricula[fi];
        break;
      }
    }
  }
  return entity;
}

// ── Content links ──────────────────────────────────────────────

var _contentLinksCache = null;

/**
 * Lazy-load content-links.json (article↔curriculum mapping).
 * @returns {Promise<object>}
 */
export async function loadContentLinks() {
  if (_contentLinksCache) return _contentLinksCache;
  try {
    var url = new URL('file://' + process.cwd() + '/myhugoapp/data/curricula/content-links.json');
    var fsMod = await import('fs');
    _contentLinksCache = JSON.parse(fsMod.readFileSync(url.pathname, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') logger.warn('[content-links] load error: ' + err.message);
    _contentLinksCache = {};
  }
  return _contentLinksCache;
}

/**
 * Find content links for a curriculum topic using 3-level matching.
 * @param {string} topicName
 * @returns {Promise<Array>}
 */
export async function findContentLinks(topicName) {
  var links = await loadContentLinks();
  var results = [];
  var normName = topicName.toLowerCase().trim();
  var matched = {};

  // 1. Exact match
  if (links[normName]) {
    for (var li = 0; li < links[normName].length; li++) {
      var item = links[normName][li];
      var key = item.url + '|' + item.title;
      if (!matched[key]) {
        matched[key] = true;
        results.push(item);
      }
    }
  }

  // 2. Substring match
  for (var topic in links) {
    if (topic !== normName && topic.indexOf(normName) !== -1) {
      for (var li2 = 0; li2 < links[topic].length; li2++) {
        var item2 = links[topic][li2];
        var key2 = item2.url + '|' + item2.title;
        if (!matched[key2]) {
          matched[key2] = true;
          results.push(item2);
        }
      }
    }
  }

  // 3. Fallback: first significant keyword
  var firstWord = normName.replace(/[^a-z0-9]/g, ' ');
  var words = firstWord.split(' ').filter(function (w) {
    return w.length > 3;
  });
  if (words.length > 0) {
    var primary = words[0];
    for (var topic2 in links) {
      if (
        topic2 !== normName &&
        topic2.indexOf(normName) === -1 &&
        topic2.indexOf(primary) !== -1
      ) {
        for (var li3 = 0; li3 < links[topic2].length; li3++) {
          var item3 = links[topic2][li3];
          var key3 = item3.url + '|' + item3.title;
          if (!matched[key3]) {
            matched[key3] = true;
            results.push(item3);
          }
        }
      }
    }
  }

  return results;
}

// ── Article index ──────────────────────────────────────────────

var _articleCache = null;

/**
 * Build an index of all articles from the Hugo content directory.
 * @returns {object} Map of slug → frontmatter
 */
export function loadArticleIndex() {
  if (_articleCache) return _articleCache;
  _articleCache = {};
  try {
    var contentDir = path.join(process.cwd(), 'myhugoapp', 'content', 'themenbereiche');
    var dirs = fs.readdirSync(contentDir);
    for (var di = 0; di < dirs.length; di++) {
      var subDir = path.join(contentDir, dirs[di]);
      var stat = fs.statSync(subDir);
      if (!stat.isDirectory()) continue;
      var files = fs.readdirSync(subDir);
      for (var fi = 0; fi < files.length; fi++) {
        if (!files[fi].endsWith('.md')) continue;
        var filePath = path.join(subDir, files[fi]);
        var content = fs.readFileSync(filePath, 'utf8');
        var fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
        if (!fmMatch) continue;
        var fm = {};
        var fmLines = fmMatch[1].split('\n');
        for (var li = 0; li < fmLines.length; li++) {
          var line = fmLines[li];
          var colonIdx = line.indexOf(':');
          if (colonIdx === -1) continue;
          var key = line.slice(0, colonIdx).trim();
          var val = line.slice(colonIdx + 1).trim();
          if (val.startsWith('[') && val.endsWith(']')) {
            try {
              fm[key] = JSON.parse(val.replace(/'/g, '"'));
            } catch {
              fm[key] = val;
            }
          } else if (val === 'true') {
            fm[key] = true;
          } else if (val === 'false') {
            fm[key] = false;
          } else {
            fm[key] = val.replace(/^"(.*)"$/, '$1');
          }
        }
        var slug = files[fi].replace(/\.md$/, '');
        fm._slug = slug;
        fm._url = '/themenbereiche/' + dirs[di] + '/' + slug + '/';
        fm._category = dirs[di];
        _articleCache[slug] = fm;
      }
    }
  } catch (err) {
    logger.warn('[article-index] load error: ' + err.message);
  }
  return _articleCache;
}

// ── Learning paths ─────────────────────────────────────────────

var _cachedLearningPathsData = null;

/**
 * Load learning paths from static JSON file.
 * @returns {Array}
 */
export function loadLearningPathsJson() {
  if (_cachedLearningPathsData) return _cachedLearningPathsData;
  // Candidate locations: repo root (dev: cwd=/opt/git/...) and container
  // (api/ context copies data into /app/data).
  var candidates = [
    path.join(process.cwd(), 'myhugoapp', 'data', 'learning-paths.json'),
    path.join(process.cwd(), 'data', 'learning-paths.json'),
  ];
  var fp = candidates.find(function (p) {
    return fs.existsSync(p);
  });
  try {
    if (fp) {
      _cachedLearningPathsData = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      logger.info(
        '[learning-paths] Loaded ' + _cachedLearningPathsData.length + ' state paths from JSON'
      );
    } else {
      logger.warn(
        '[learning-paths] learning-paths.json not found (tried: ' + candidates.join(', ') + ')'
      );
      _cachedLearningPathsData = [];
    }
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[learning-paths] Failed to load learning-paths.json'
    );
    _cachedLearningPathsData = [];
  }
  return _cachedLearningPathsData;
}

// ── Utility functions ──────────────────────────────────────────

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Slugify a string (lowercase, spaces to hyphens, remove special chars).
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
