/**
 * Content route handlers — extracted from server.js.
 *
 * Routes:
 *   GET /api/content
 *   GET /api/content/cross-link-stats
 *   GET /api/article/:slug
 */

import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import neo4j from 'neo4j-driver';
import pino from 'pino';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';
import { loadContentLinks, loadArticleIndex } from '../services/content.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

/**
 * GET /api/content — List Content nodes.
 * Query params: ?type= (article|calculator), ?search=, ?limit=, ?offset=
 */
router.get('/api/content', async (req, res) => {
  const type = (req.query.type || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    let whereExtra = '';
    const params = {};
    if (type) {
      whereExtra = ' AND c.type = $type';
      params.type = type;
    }
    if (search) {
      whereExtra += ' AND toLower(c.title) CONTAINS $search';
      params.search = search;
    }

    const result = await session.run(
      `MATCH (c:Content)
       WHERE true${whereExtra}
       RETURN c.url AS url, c.title AS title, c.type AS type,
              labels(c) AS labels
       ORDER BY c.type, c.title
       SKIP ${offset} LIMIT ${limit}`,
      params
    );
    await session.close();

    const items = result.records.map((r) => ({
      url: r.get('url'),
      title: r.get('title'),
      type: r.get('type'),
      labels: r.get('labels'),
    }));
    res.json({ source: 'neo4j', items, count: items.length, limit, offset });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[content] Neo4j error');
    try {
      const links = await loadContentLinks();
      const seen = {};
      const items = [];
      for (const [, entries] of Object.entries(links)) {
        for (const item of entries) {
          const key = item.url;
          if (seen[key]) continue;
          seen[key] = true;
          if (type && item.type !== type) continue;
          if (search && !item.title.toLowerCase().includes(search)) continue;
          items.push({ url: item.url, title: item.title, type: item.type, labels: ['Content'] });
        }
      }
      const total = items.length;
      const paginated = items.slice(offset, offset + limit);
      res.json({
        source: 'fallback',
        items: paginated,
        total,
        count: paginated.length,
        limit,
        offset,
      });
    } catch {
      res.status(503).json({ error: 'Content list unavailable' });
    }
  }
});

/**
 * GET /api/content/cross-link-stats — Cross-linking coverage metrics.
 */
router.get('/api/content/cross-link-stats', function (req, res) {
  try {
    var crossLinksPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'myhugoapp',
      'data',
      'curricula',
      'content-cross-links.json'
    );
    var crossLinks = JSON.parse(fs.readFileSync(crossLinksPath, 'utf-8'));
    var total = Object.keys(crossLinks).length;
    var withArticles = 0;
    var withCalculators = 0;
    var withExercise = 0;
    var orphan = 0;

    for (var url in crossLinks) {
      var entry = crossLinks[url];
      var rel = entry.related || {};
      var hasArticles = rel.articles && rel.articles.length > 0;
      var hasCalcs = rel.calculators && rel.calculators.length > 0;
      var hasEx = rel.exercises && rel.exercises.length > 0;

      if (hasArticles) withArticles++;
      if (hasCalcs) withCalculators++;
      if (hasEx) withExercise++;
      if (!hasArticles && !hasCalcs && !hasEx) orphan++;
    }

    res.json({
      source: 'content-cross-links.json',
      timestamp: new Date().toISOString(),
      totalEntries: total,
      withArticleLinks: withArticles,
      withCalculatorLinks: withCalculators,
      withExerciseLinks: withExercise,
      orphanEntries: orphan,
      coveragePct: total > 0 ? Math.round(((total - orphan) / total) * 100) : 0,
    });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[cross-link-stats] Error');
    res.status(500).json({ error: 'Failed to load cross-link data', detail: err.message });
  }
});

/**
 * GET /api/article/:slug — Article detail JSON.
 */
router.get('/api/article/:slug', function (req, res) {
  var slug = req.params.slug;
  var index = loadArticleIndex();
  var article = index[slug];
  if (!article) {
    return res.status(404).json({ error: 'Article not found', slug: slug });
  }
  res.json({
    title: article.title || '',
    description: article.description || '',
    slug: article._slug,
    url: article._url,
    tags: article.tags || [],
    icon: article.icon || '',
    difficulty: article.schwierigkeit || '',
    category: article._category || '',
    interactive: !!article.interaktiv,
  });
});

export default router;
