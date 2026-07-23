/**
 * Knowledge graph data route handlers — extracted from server.js.
 *
 * Routes:
 *   GET /api/kg-data
 *   GET /api/rag-context
 *   GET /api/kg-data/entity/:name
 *   GET /api/entity/:slug
 *   GET /entity/:slug  (SSR HTML page)
 *   GET /api/kg-stats
 *   GET /api/elements
 *   GET /api/health
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import neo4j from 'neo4j-driver';
import pino from 'pino';
import { getNeo4jDriver, NEO4J_DATABASE, closeNeo4jDriver } from '../services/neo4j.js';
import {
  getCachedKgData,
  setCachedKgData,
  parseKGParams,
  filterEntities,
  getKgDataCacheKey,
  loadCurriculaFromStaticFiles,
} from '../services/kg-cache.js';
import {
  getFallbackData,
  findEntityBySlug,
  escapeHtml,
  slugify,
  findContentLinks,
  loadContentLinks,
} from '../services/content.js';
import { renderEntityPage } from '../templates/article.mjs';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm-proxy:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'gemma-4';

// ── Helpers ────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  konzept: '#2196F3',
  element: '#4CAF50',
  reaktion: '#FF9800',
  lehrplan: '#9C27B0',
  didaktik: '#E91E63',
  quelle: '#795548',
  gesetz: '#009688',
  methode: '#00BCD4',
  stoff: '#8BC34A',
};

const CATEGORY_LABELS = {
  konzept: 'Konzept',
  element: 'Element',
  reaktion: 'Reaktionstyp',
  lehrplan: 'Lehrplan',
  didaktik: 'KMK-Bildungsstandard',
  quelle: 'Quelle',
  gesetz: 'Gesetzmäßigkeit',
  methode: 'Methode',
  stoff: 'Stoff',
};

// ── Routes ─────────────────────────────────────────────────────

/**
 * GET /api/kg-data — Knowledge graph data (entities).
 */
router.get('/api/kg-data', async (req, res) => {
  var cacheKey = getKgDataCacheKey(req);
  var cached = getCachedKgData(cacheKey);
  if (cached) return res.json(cached);

  var params = parseKGParams(req);
  var showLehrplan = req.query.lehrplan === 'true';

  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 5000,
    });

    var whereClauses = ['e.kategorie IS NOT NULL'];
    if (params.search) {
      whereClauses.push('toLower(e.name) CONTAINS $search');
    }
    if (params.category) {
      whereClauses.push('toLower(e.kategorie) = $category');
    } else if (!showLehrplan) {
      whereClauses.push("e.kategorie <> 'lehrplan'");
    }

    var whereStr = whereClauses.join(' AND ');

    var countResult;
    try {
      countResult = await session.run(
        `MATCH (e:Entity) WHERE ${whereStr} RETURN count(e) AS cnt`,
        { search: params.search, category: params.category }
      );
    } catch (countErr) {
      logger.warn('[kg-data] Count query failed, returning fallback:', countErr.message);
      await session.close();
      return serveFallbackKgData(req, res, params, showLehrplan, cacheKey);
    }

    var totalEntities = countResult.records[0].get('cnt').toNumber();

    var result;
    try {
      result = await session.run(
        `MATCH (e:Entity) WHERE ${whereStr}
         OPTIONAL MATCH (e)-[r:RELATED_TO|MENTIONS]->(target)
         WITH e, count(DISTINCT r) AS relCount
         RETURN e.name AS name, e.kategorie AS category,
                e.description AS description,
                e.state AS state, e.grade AS grade,
                e.school_type AS schoolType,
                relCount,
                e.objective_count AS objectiveCount
         ORDER BY e.name
         SKIP ${params.offset} LIMIT ${params.limit}`,
        { search: params.search, category: params.category }
      );
    } catch (queryErr) {
      logger.warn('[kg-data] Main query failed:', queryErr.message);
      await session.close();
      return serveFallbackKgData(req, res, params, showLehrplan, cacheKey);
    }
    await session.close();

    var entities = result.records.map(function (r) {
      var obj = {
        name: r.get('name'),
        category: r.get('category'),
        description: r.get('description'),
        relationCount: r.get('relCount') ? r.get('relCount').toNumber() : 0,
      };
      var state = r.get('state');
      var grade = r.get('grade');
      var schoolType = r.get('schoolType');
      var objCount = r.get('objectiveCount');
      if (state) obj.state = state;
      if (grade) obj.grade = grade;
      if (schoolType) obj.schoolType = schoolType;
      if (objCount) obj.objectiveCount = objCount.toNumber();
      return obj;
    });

    // Filter empty names
    entities = entities.filter(function (e) {
      return e.name && e.name.length > 0;
    });

    var payload = {
      source: 'neo4j',
      entities: entities,
      total: totalEntities,
      count: entities.length,
      offset: params.offset,
      limit: params.limit,
    };

    setCachedKgData(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    logger.error('[kg-data] ERROR:', err.message);
    serveFallbackKgData(req, res, params, showLehrplan, cacheKey);
  }
});

function serveFallbackKgData(req, res, params, showLehrplan, cacheKey) {
  try {
    var fallback = getFallbackData();
    var entities = fallback.entities || [];
    var curricula = fallback.curricula || [];

    if (showLehrplan && curricula.length > 0) {
      entities = entities.concat(
        curricula.map(function (c) {
          return {
            name: c.name,
            category: 'lehrplan',
            description: c.curriculumMeta
              ? c.curriculumMeta.state + ' - ' + c.curriculumMeta.grade
              : '',
            state: c.curriculumMeta ? c.curriculumMeta.state : '',
            grade: c.curriculumMeta ? c.curriculumMeta.grade : '',
            schoolType: c.curriculumMeta ? c.curriculumMeta.school_type : '',
            objectiveCount: c.curriculumMeta ? c.curriculumMeta.objective_count : 0,
          };
        })
      );
    }

    entities = filterEntities(entities, params);
    var total = entities.length;
    var paginated = entities.slice(params.offset, params.offset + params.limit);

    var payload = {
      source: 'fallback',
      entities: paginated,
      total: total,
      count: paginated.length,
      offset: params.offset,
      limit: params.limit,
    };

    setCachedKgData(cacheKey, payload);
    res.json(payload);
  } catch (fbErr) {
    logger.error('[kg-data] Fallback also failed:', fbErr.message);
    res.status(503).json({ error: 'KG data unavailable', entities: [], total: 0 });
  }
}

/**
 * GET /api/rag-context — Provide RAG context for a query.
 */
router.get('/api/rag-context', async (req, res) => {
  try {
    var { getRAGContext } = await import('../services/rag.js');
    var query = (req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    var context = await getRAGContext(query);
    if (!context) {
      return res.json({ context: null, found: false, query });
    }
    res.json({ context, found: true, query });
  } catch (err) {
    logger.error('[rag-context] Error:', err.message);
    res.status(500).json({ error: 'RAG context retrieval failed' });
  }
});

/**
 * GET /api/kg-data/entity/:name — Single entity detail.
 */
router.get('/api/kg-data/entity/:name', async (req, res) => {
  var entityName = decodeURIComponent(req.params.name).toLowerCase().trim();
  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    var result;
    try {
      result = await session.run(
        `MATCH (e:Entity)
         WHERE toLower(e.name) = $name
         OPTIONAL MATCH (e)-[r:RELATED_TO]-(related:Entity)
         OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
         OPTIONAL MATCH (e)-[:COVERS_TOPIC]->(t:Topic)
         OPTIONAL MATCH (e)-[:FULFILLS]->(lo:LearningObjective)
         WITH e, COLLECT(DISTINCT { name: related.name, category: related.kategorie }) AS relatedEntities,
              COLLECT(DISTINCT { url: c.url, title: c.title, type: c.type }) AS contentLinks,
              COLLECT(DISTINCT { slug: t.slug, title: t.title, grade: t.grade }) AS topics,
              COLLECT(DISTINCT { slug: lo.slug, text: lo.text }) AS objectives
         RETURN e.name AS name, e.kategorie AS kategorie, e.description AS description,
                e.state AS state, e.grade AS grade, e.school_type AS schoolType,
                e.objective_count AS objectiveCount,
                relatedEntities, contentLinks, topics, objectives`,
        { name: entityName }
      );
    } finally {
      await session.close();
    }

    if (result.records.length === 0 || !result.records[0].get('name')) {
      return res.status(404).json({ error: 'Entity not found', name: entityName });
    }

    var rec = result.records[0];
    res.json({
      source: 'neo4j',
      entity: {
        name: rec.get('name'),
        kategorie: rec.get('kategorie'),
        description: rec.get('description'),
        state: rec.get('state'),
        grade: rec.get('grade'),
        schoolType: rec.get('schoolType'),
        objectiveCount: rec.get('objectiveCount') ? rec.get('objectiveCount').toNumber() : 0,
      },
      relatedEntities: (rec.get('relatedEntities') || []).filter(function (r) {
        return r.name != null;
      }),
      contentLinks: (rec.get('contentLinks') || []).filter(function (c) {
        return c.url != null;
      }),
      topics: (rec.get('topics') || []).filter(function (t) {
        return t.slug != null;
      }),
      objectives: (rec.get('objectives') || []).filter(function (o) {
        return o.slug != null;
      }),
    });
  } catch (err) {
    logger.error('[kg-data/entity] Neo4j error:', err.message);
    res.status(503).json({ error: 'Entity detail unavailable' });
  }
});

/**
 * GET /api/entity/:slug — Entity detail JSON (from fallback data).
 */
router.get('/api/entity/:slug', function (req, res) {
  var slug = req.params.slug;
  var entity = findEntityBySlug(slug);
  if (!entity) {
    return res.status(404).json({ error: 'Entity not found', slug: slug });
  }
  var catColor = CATEGORY_COLORS[entity.category] || '#666';
  var catLabel = CATEGORY_LABELS[entity.category] || entity.category || 'Unbekannt';
  var displayName = entity.name.charAt(0).toUpperCase() + entity.name.slice(1).replace(/-/g, ' ');
  var isCurriculum = entity.category === 'lehrplan' || !!entity.curriculumMeta;

  var metaHtml = '';
  if (isCurriculum && entity.curriculumMeta) {
    metaHtml +=
      '<div class="meta-row"><span class="meta-label">Schulform</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.school_type) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Klasse</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.grade) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Lernziele</span><span class="meta-value">' +
      entity.curriculumMeta.objective_count +
      '</span></div>';
  }

  res.json({
    name: entity.name,
    displayName: displayName,
    category: entity.category,
    catLabel: catLabel,
    catColor: catColor,
    isCurriculum: isCurriculum,
    meta: entity.curriculumMeta || {},
    relatedEntities: entity.relatedEntities || [],
    articles: entity.articles || [],
    articleCount: entity.articleCount || 0,
    components: entity.components || [],
  });
});

/**
 * GET /entity/:slug — SSR entity detail HTML page.
 */
router.get('/entity/:slug', async function (req, res) {
  var slug = req.params.slug;
  var entity = findEntityBySlug(slug);
  if (!entity) {
    return res.status(404).send('<h1>Entity nicht gefunden</h1>');
  }

  var catColor = CATEGORY_COLORS[entity.category] || '#666';
  var catLabel = CATEGORY_LABELS[entity.category] || entity.category || 'Unbekannt';
  var displayName = entity.name.charAt(0).toUpperCase() + entity.name.slice(1).replace(/-/g, ' ');
  var isCurriculum = entity.category === 'lehrplan' || !!entity.curriculumMeta;

  // Build meta HTML for curriculum topics
  var metaHtml = '';
  if (isCurriculum && entity.curriculumMeta) {
    metaHtml =
      '<div class="meta-row"><span class="meta-label">Schulform</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.school_type) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Klasse</span><span class="meta-value">' +
      escapeHtml(entity.curriculumMeta.grade) +
      '</span></div>' +
      '<div class="meta-row"><span class="meta-label">Lernziele</span><span class="meta-value">' +
      entity.curriculumMeta.objective_count +
      '</span></div>';
  }

  // Collect all related entities (forward + reverse lookup)
  var kmkRefs = [];
  var quelleRefs = [];
  var otherRefs = [];
  var seenRefNames = {};

  function addRef(name) {
    if (seenRefNames[name]) return;
    seenRefNames[name] = true;
    var refEntity = findEntityBySlug(name);
    if (refEntity && refEntity.category === 'didaktik') {
      kmkRefs.push(name);
    } else if (refEntity && refEntity.category === 'quelle') {
      quelleRefs.push(name);
    } else if (refEntity) {
      otherRefs.push(name);
    }
  }

  // Forward: entity.relatedEntities
  if (entity.relatedEntities && entity.relatedEntities.length > 0) {
    for (var r = 0; r < entity.relatedEntities.length; r++) {
      var ref = entity.relatedEntities[r];
      var refName = typeof ref === 'string' ? ref : ref.name;
      addRef(refName);
    }
  }
  // Reverse: find entities that reference this one
  var data = getFallbackData();
  for (var ei = 0; ei < data.entities.length; ei++) {
    var candidate = data.entities[ei];
    if (candidate.name === entity.name) continue;
    if (candidate.relatedEntities && candidate.relatedEntities.length > 0) {
      for (var ri = 0; ri < candidate.relatedEntities.length; ri++) {
        var cr = candidate.relatedEntities[ri];
        var crName = typeof cr === 'string' ? cr : cr.name;
        if (
          crName.toLowerCase() === entity.name.toLowerCase() ||
          (candidate.category === 'quelle' &&
            crName.toLowerCase().indexOf(entity.name.toLowerCase()) !== -1)
        ) {
          addRef(candidate.name);
          break;
        }
      }
    }
  }

  var quelleHtml = '';
  if (quelleRefs.length > 0) {
    quelleHtml = '<h3>📚 Quellen</h3><div class="related-list">';
    for (var qi = 0; qi < quelleRefs.length; qi++) {
      quelleHtml +=
        '<a href="/entity/' +
        slugify(quelleRefs[qi]) +
        '/" class="quelle-chip">' +
        escapeHtml(
          quelleRefs[qi].replace(/-/g, ' ').replace(/\b\w/g, function (c) {
            return c.toUpperCase();
          })
        ) +
        '</a>';
    }
    quelleHtml += '</div>';
  }

  var kmkHtml = '';
  if (kmkRefs.length > 0) {
    kmkHtml = '<h3>KMK-Bildungsstandards</h3><div class="kmk-list">';
    for (var k = 0; k < kmkRefs.length; k++) {
      kmkHtml +=
        '<a href="/entity/' +
        slugify(kmkRefs[k]) +
        '/" class="kmk-chip">' +
        escapeHtml(
          kmkRefs[k]
            .replace(/^kmk-/i, 'KMK ')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, function (c) {
              return c.toUpperCase();
            })
        ) +
        '</a>';
    }
    kmkHtml += '</div>';
  }

  var otherRelatedHtml = '';
  if (otherRefs.length > 0) {
    otherRelatedHtml = '<h3>Verwandte Begriffe</h3><div class="related-list">';
    for (var r2 = 0; r2 < otherRefs.length; r2++) {
      otherRelatedHtml +=
        '<a href="/entity/' +
        slugify(otherRefs[r2]) +
        '/" class="related-chip">' +
        escapeHtml(otherRefs[r2].replace(/-/g, ' ')) +
        '</a>';
    }
    otherRelatedHtml += '</div>';
  }

  var articlesHtml = '';

  // Learning path: group content by type
  var learningPathHtml = '';
  if (isCurriculum) {
    var clinks = await findContentLinks(entity.name);
    if (clinks.length > 0) {
      var sections = { article: [], calculator: [], simulation: [], exercise: [] };
      for (var cli2 = 0; cli2 < clinks.length; cli2++) {
        var cl2 = clinks[cli2];
        var t = (cl2.type || 'article').toLowerCase();
        if (sections[t]) sections[t].push(cl2);
        else sections.article.push(cl2);
      }
      var order = ['article', 'calculator', 'simulation', 'exercise'];
      var labels = {
        article: '📖 Artikel',
        calculator: '🔬 Rechner',
        simulation: '🎮 Simulationen',
        exercise: '✏️ Übungen',
      };
      for (var si = 0; si < order.length; si++) {
        var key = order[si];
        var items = sections[key];
        if (items.length === 0) continue;
        var maxShow = Math.min(items.length, 8);
        learningPathHtml +=
          '<h3>' + labels[key] + ' (' + items.length + ')</h3><div class="content-links-list">';
        for (var li = 0; li < maxShow; li++) {
          var item = items[li];
          learningPathHtml +=
            '<a href="' +
            escapeHtml(item.url) +
            '" class="content-link-card" target="_blank" rel="noopener">' +
            '<span class="content-link-title">' +
            escapeHtml(item.title) +
            '</span>' +
            '<span class="content-link-type">' +
            escapeHtml(item.type || 'article') +
            '</span>' +
            '</a>';
        }
        if (items.length > maxShow) {
          learningPathHtml +=
            '<div class="content-link-more">+' + (items.length - maxShow) + ' weitere</div>';
        }
        learningPathHtml += '</div>';
      }
    }
  }

  if (entity.articles && entity.articles.length > 0) {
    articlesHtml = '<h3>Artikel (' + entity.articles.length + ')</h3><ul class="article-list">';
    for (var a = 0; a < entity.articles.length; a++) {
      articlesHtml += '<li>' + escapeHtml(entity.articles[a]) + '</li>';
    }
    articlesHtml += '</ul>';
  }

  // Quiz links for curriculum topics
  var quizHtml = '';
  if (isCurriculum) {
    var qCategories = [
      { kw: 'atom', label: 'Atommodelle und Kernchemie' },
      { kw: 'bindung', label: 'Chemische Bindungen' },
      { kw: 'saeure', label: 'Säuren und Basen' },
      { kw: 'base', label: 'Säuren und Basen' },
      { kw: 'redox', label: 'Redoxreaktionen' },
      { kw: 'stoechiometrie', label: 'Stöchiometrie' },
      { kw: 'stoffmeng', label: 'Stöchiometrie' },
      { kw: 'organisch', label: 'Organische Chemie' },
      { kw: 'kohlenwasserstoff', label: 'Organische Chemie' },
      { kw: 'periodensystem', label: 'Periodensystem' },
      { kw: 'pse', label: 'Periodensystem' },
    ];
    var qLinks = [];
    var nameLower = entity.name.toLowerCase();
    for (var qzi = 0; qzi < qCategories.length; qzi++) {
      if (nameLower.indexOf(qCategories[qzi].kw) !== -1) {
        if (qLinks.indexOf(qCategories[qzi].label) === -1) {
          qLinks.push(qCategories[qzi].label);
        }
      }
    }
    if (qLinks.length > 0) {
      quizHtml = '<h3>📝 Übungen zu diesem Thema</h3><div class="quiz-links-list">';
      for (var qzi2 = 0; qzi2 < qLinks.length; qzi2++) {
        quizHtml +=
          '<a href="/lueckentexte/" class="quiz-link-card" target="_blank" rel="noopener">' +
          '<span class="quiz-link-label">' +
          escapeHtml(qLinks[qzi2]) +
          '</span>' +
          '<span class="quiz-link-arrow">→</span></a>';
      }
      quizHtml += '</div>';
    }
  }

  var backLink = isCurriculum ? '/' : '/entity/';

  res.send(
    renderEntityPage({
      entity,
      isCurriculum,
      displayName,
      catColor,
      catLabel,
      metaHtml,
      quelleHtml,
      kmkHtml,
      learningPathHtml,
      quizHtml,
      otherRelatedHtml,
      articlesHtml,
      slug,
      backLink,
    })
  );
});

/**
 * GET /api/kg-stats — Knowledge graph statistics.
 */
router.get('/api/kg-stats', async (req, res) => {
  var statsCacheKey = 'kg-stats:v1';
  var statsCached = getCachedKgData(statsCacheKey);
  if (statsCached) return res.json(statsCached);

  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    var byKatResult = await session.run(
      `MATCH (e:Entity) WHERE e.kategorie IS NOT NULL
       RETURN e.kategorie AS kat, count(e) AS n ORDER BY n DESC`
    );
    var byCategory = {};
    byKatResult.records.forEach(function (r) {
      byCategory[r.get('kat')] = r.get('n').toNumber();
    });

    var relResult = await session.run(
      `MATCH (a)-[r]->(b)
       WHERE (a:Entity OR a:Topic OR a:LearningObjective OR a:Content OR a:Curriculum)
          OR (b:Entity OR b:Topic OR b:LearningObjective OR b:Content OR b:Curriculum)
       RETURN type(r) AS t, count(r) AS n ORDER BY n DESC`
    );
    var byRelType = {};
    relResult.records.forEach(function (r) {
      byRelType[r.get('t')] = r.get('n').toNumber();
    });

    var dqResult = await session.run(
      `MATCH (e:Entity)
       WITH e,
            (e.description IS NULL OR e.description = '') AS missingDesc,
            (e.kategorie IS NULL OR e.kategorie = '') AS missingKat
       WITH count(e) AS total,
            count(CASE WHEN missingDesc THEN 1 END) AS missingDescription,
            count(CASE WHEN missingKat THEN 1 END) AS missingKategorie
       RETURN total, missingDescription, missingKategorie`
    );
    var dq = dqResult.records[0];
    var totalEntities = dq.get('total').toNumber();
    var missingDescription = dq.get('missingDescription').toNumber();
    var missingKategorie = dq.get('missingKategorie').toNumber();

    var orphanResult = await session.run(
      `MATCH (e:Entity)
       WHERE NOT (e)-[:RELATED_TO|ERFUELLT|BESTEHT_AUS|GEHOERT_ZU]-()
         AND NOT (:Document)-[:MENTIONS]->(e)
       RETURN count(e) AS n`
    );
    var orphans = orphanResult.records[0].get('n').toNumber();

    var danglingResult = await session.run(
      `MATCH (a:Entity)-[r:RELATED_TO]->(b)
       WHERE b IS NULL
       RETURN count(r) AS n`
    );
    var dangling = danglingResult.records[0].get('n').toNumber();

    var dupResult = await session.run(
      `MATCH (e:Entity)
       WITH toLower(e.name) AS lname, collect(e) AS nodes
       WHERE size(nodes) > 1
       RETURN count(*) AS n`
    );
    var duplicates = dupResult.records[0].get('n').toNumber();

    var currCoverage = {
      totalCurricula: 0,
      totalTopics: 0,
      totalSubTopics: 0,
      totalObjectives: 0,
      linkedEntities: 0,
      contentNodes: 0,
      entityObjectiveLinks: 0,
    };
    try {
      var curResult = await session.run(`MATCH (c:Curriculum) RETURN count(c) AS cnt`);
      currCoverage.totalCurricula = curResult.records[0].get('cnt').toNumber();
      var ccResult = await session.run(`MATCH (t:Topic) RETURN count(t) AS topics`);
      currCoverage.totalTopics = ccResult.records[0].get('topics').toNumber();
      var subResult = await session.run(`MATCH (st:SubTopic) RETURN count(st) AS cnt`);
      currCoverage.totalSubTopics = subResult.records[0].get('cnt').toNumber();
      var objResult = await session.run(`MATCH (lo:LearningObjective) RETURN count(lo) AS objectives`);
      currCoverage.totalObjectives = objResult.records[0].get('objectives').toNumber();
      var linkResult = await session.run(
        `MATCH (e:Entity)-[:COVERS_TOPIC]->(:SubTopic) RETURN count(DISTINCT e) AS linked`
      );
      currCoverage.linkedEntities = linkResult.records[0].get('linked').toNumber();
      var contentNodeResult = await session.run(`MATCH (c:Content) RETURN count(c) AS cnt`);
      currCoverage.contentNodes = contentNodeResult.records[0].get('cnt').toNumber();
      var entityLoResult = await session.run(
        `MATCH (e:Entity)-[:FULFILLS_OBJECTIVE]->(:LearningObjective) RETURN count(DISTINCT e) AS linked`
      );
      currCoverage.entityObjectiveLinks = entityLoResult.records[0].get('linked').toNumber();
    } catch (ccErr) {
      logger.warn('[kg-stats] curriculum coverage query failed:', ccErr.message);
    }

    await session.close();

    var payload = {
      source: 'neo4j',
      generatedAt: new Date().toISOString(),
      totals: {
        entities: totalEntities,
        relations: Object.values(byRelType).reduce(function (a, b) {
          return a + b;
        }, 0),
      },
      byCategory: byCategory,
      byRelType: byRelType,
      curriculumCoverage: currCoverage,
      quality: {
        missingDescription: missingDescription,
        missingKategorie: missingKategorie,
        orphans: orphans,
        danglingRefs: dangling,
        duplicateNames: duplicates,
        descriptionCoveragePct:
          totalEntities > 0
            ? Math.round(((totalEntities - missingDescription) / totalEntities) * 1000) / 10
            : 0,
        kategorieCoveragePct:
          totalEntities > 0
            ? Math.round(((totalEntities - missingKategorie) / totalEntities) * 1000) / 10
            : 0,
      },
    };

    setCachedKgData(statsCacheKey, payload, 300);
    res.json(payload);
  } catch (err) {
    logger.error('[kg-stats] ERROR:', err.message);
    res.status(503).json({
      error: 'kg-stats unavailable',
      message: err.message,
    });
  }
});

/**
 * GET /api/elements — Periodic elements data.
 */
router.get('/api/elements', (req, res) => {
  try {
    const elements = JSON.parse(
      fs.readFileSync(
        path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'elements.json'),
        'utf-8'
      )
    );
    res.json(elements);
  } catch (err) {
    logger.error({ err }, 'Failed to load elements data');
    res.status(500).json({ error: 'Fehler beim Laden der Elementdaten' });
  }
});

/**
 * GET /api/health — Health check endpoint.
 */
router.get('/api/health', async (req, res) => {
  var neo4jOk;
  var entityCount = 0;
  try {
    var driver = getNeo4jDriver();
    var session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: 'READ' });
    var result = await session.run('MATCH (e:Entity) RETURN count(e) as cnt');
    entityCount = result.records[0].get('cnt').toNumber();
    neo4jOk = true;
    await session.close();
  } catch {
    neo4jOk = false;
  }
  var litellmOk;
  try {
    var litellmRes = await fetch(LITELLM_URL.replace('/chat/completions', '/health'), {
      signal: AbortSignal.timeout(3000),
    });
    litellmOk = litellmRes.ok;
  } catch {
    litellmOk = false;
  }
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    neo4j: neo4jOk ? 'connected' : 'unavailable',
    entityCount: entityCount,
    litellm: litellmOk ? 'connected' : 'unavailable',
    model: LITELLM_MODEL,
    version: '2.0',
  });
});

export default router;
