/**
 * Curriculum route handlers — extracted from server.js.
 *
 * Routes:
 *   GET /api/curricula/states
 *   GET /api/curricula/topics
 *   GET /api/curricula/objectives
 *   GET /api/curricula/by-state/:state
 *   GET /api/curricula/by-state/:state/grade/:grade
 *   GET /api/curricula/topic/:slug/articles
 *   GET /api/curricula/objective/:slug/articles
 *   GET /api/entity/:name/curricula
 *   GET /api/curricula/linked-entities
 *   GET /api/curricula/compare
 */

import { Router } from 'express';
import neo4j from 'neo4j-driver';
import pino from 'pino';
import { getNeo4jDriver, NEO4J_DATABASE, toNumberSafe } from '../services/neo4j.js';
import { getFallbackData } from '../services/content.js';
import curriculaMapper from '../curricula-mapper.cjs';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

/**
 * GET /api/curricula/states
 */
router.get('/api/curricula/states', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (c:Curriculum)
       WITH c.state_abbr AS state, c.state AS stateName,
            count(c) AS curriculumCount
       RETURN state, stateName, curriculumCount
       ORDER BY state`
    );
    await session.close();
    const states = result.records.map((r) => ({
      state: r.get('state'),
      stateName: r.get('stateName'),
      curriculumCount: r.get('curriculumCount').toNumber(),
    }));
    res.json({ source: 'neo4j', states, count: states.length });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/states] Neo4j error'
    );
    try {
      const fb = getFallbackData();
      const seen = {};
      const states = [];
      for (const c of fb.curricula) {
        if (c.curriculumMeta && !seen[c.curriculumMeta.state]) {
          seen[c.curriculumMeta.state] = true;
          states.push({
            state: c.curriculumMeta.state,
            stateName: c.curriculumMeta.state,
            curriculumCount: 1,
          });
        }
      }
      res.json({ source: 'fallback', states, count: states.length });
    } catch {
      res.status(503).json({ error: 'Curriculum data unavailable' });
    }
  }
});

/**
 * GET /api/curricula/list
 * All curricula grouped by state — powers the always-visible overview
 * sidebar on the Lehrpläne page.
 */
router.get('/api/curricula/list', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    const result = await session.run(
      `MATCH (c:Curriculum)
       OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH c, count(DISTINCT t) AS topicCount, count(DISTINCT lo) AS objectiveCount
       RETURN c.state_abbr AS state, c.state AS stateName, c.slug AS slug,
              c.school_type AS schoolType, c.grade AS grade,
              topicCount, objectiveCount
       ORDER BY c.state_abbr, c.school_type`
    );
    await session.close();
    const map = new Map();
    result.records.forEach((r) => {
      const state = r.get('state');
      if (!map.has(state)) {
        map.set(state, { state, stateName: r.get('stateName'), curricula: [] });
      }
      map.get(state).curricula.push({
        slug: r.get('slug'),
        schoolType: r.get('schoolType'),
        grade: r.get('grade'),
        topicCount: toNumberSafe(r.get('topicCount')),
        objectiveCount: toNumberSafe(r.get('objectiveCount')),
      });
    });
    const states = Array.from(map.values());
    res.json({
      source: 'neo4j',
      states,
      count: states.reduce((s, st) => s + st.curricula.length, 0),
    });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[curricula/list] Neo4j error');
    try {
      const fb = getFallbackData();
      const map = new Map();
      (fb.curricula || []).forEach((c) => {
        const st = c.curriculumMeta && c.curriculumMeta.state;
        if (!st) return;
        if (!map.has(st)) map.set(st, { state: st, stateName: st, curricula: [] });
        map.get(st).curricula.push({
          slug: c.name,
          schoolType: c.curriculumMeta.school_type,
          grade: c.curriculumMeta.grade,
          topicCount: 0,
          objectiveCount: c.curriculumMeta.objective_count || 0,
        });
      });
      res.json({
        source: 'fallback',
        states: Array.from(map.values()),
        count: fb.curricula.length,
      });
    } catch {
      res.status(503).json({ error: 'Curriculum list unavailable' });
    }
  }
});

/**
 * GET /api/curricula/topics
 */
router.get('/api/curricula/topics', async (req, res) => {
  const state = (req.query.state || '').trim();
  const grade = (req.query.grade || '').trim();
  const schoolType = (req.query.schoolType || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    let matchClause = 'MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic)';
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (state) {
      whereClause += ' AND c.state_abbr = $state';
      params.state = state;
    }
    if (grade) {
      whereClause += ' AND t.grade = $grade';
      params.grade = grade;
    }
    if (schoolType) {
      whereClause += ' AND c.school_type = $schoolType';
      params.schoolType = schoolType;
    }
    if (search) {
      whereClause += ' AND toLower(t.title) CONTAINS $search';
      params.search = search;
    }

    const countResult = await session.run(
      `${matchClause} ${whereClause} RETURN count(t) AS total`,
      params
    );
    const total = countResult.records[0].get('total').toNumber();

    const result = await session.run(
      `${matchClause} ${whereClause}
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH t, c, count(DISTINCT lo) AS objectiveCount
       RETURN t.slug AS slug, t.title AS title, t.grade AS grade,
              c.state_abbr AS state, c.school_type AS schoolType,
              objectiveCount
       ORDER BY c.state_abbr, t.grade, t.title
       SKIP ${offset} LIMIT ${limit}`,
      params
    );
    await session.close();

    const topics = result.records.map((r) => ({
      slug: r.get('slug'),
      title: r.get('title'),
      state: r.get('state'),
      grade: r.get('grade'),
      schoolType: r.get('schoolType'),
      objectiveCount: toNumberSafe(r.get('objectiveCount')),
    }));
    res.json({ source: 'neo4j', topics, total, limit, offset });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/topics] Neo4j error'
    );
    try {
      const fb = getFallbackData();
      let topics = fb.curricula.map((c) => ({
        slug: c.name,
        title: c.name,
        state: c.curriculumMeta.state,
        grade: c.curriculumMeta.grade,
        schoolType: c.curriculumMeta.school_type,
        objectiveCount: c.curriculumMeta.objective_count,
      }));
      if (state) topics = topics.filter((t) => t.state === state);
      if (grade) topics = topics.filter((t) => t.grade === grade);
      if (search) topics = topics.filter((t) => (t.title || '').includes(search));
      const total = topics.length;
      topics = topics.slice(offset, offset + limit);
      res.json({ source: 'fallback', topics, total, limit, offset });
    } catch {
      res.status(503).json({ error: 'Curriculum topics unavailable' });
    }
  }
});

/**
 * GET /api/curricula/objectives
 */
router.get('/api/curricula/objectives', async (req, res) => {
  const topic = (req.query.topic || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 1000,
    });

    let matchClause = 'MATCH (lo:LearningObjective)';
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (topic) {
      matchClause = 'MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)';
      whereClause += ' AND (t.slug CONTAINS $topic OR t.title CONTAINS $topic)';
      params.topic = topic;
    }
    if (search) {
      whereClause += ' AND toLower(lo.text) CONTAINS $search';
      params.search = search;
    }

    const countResult = await session.run(
      `${matchClause} ${whereClause} RETURN count(lo) AS total`,
      params
    );
    const total = countResult.records[0].get('total').toNumber();

    const result = await session.run(
      `${matchClause} ${whereClause}
       OPTIONAL MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
       OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
       RETURN lo.slug AS slug, lo.text AS text,
              t.slug AS topicSlug, t.title AS topicTitle,
              c.state_abbr AS state, t.grade AS grade
       ORDER BY lo.text
       SKIP ${offset} LIMIT ${limit}`,
      params
    );
    await session.close();

    const objectives = result.records.map((r) => ({
      slug: r.get('slug'),
      text: r.get('text'),
      topicSlug: r.get('topicSlug'),
      topicTitle: r.get('topicTitle'),
      state: r.get('state'),
      grade: r.get('grade'),
    }));
    res.json({ source: 'neo4j', objectives, total, limit, offset });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/objectives] Neo4j error'
    );
    res.status(503).json({ error: 'Learning objectives unavailable' });
  }
});

/**
 * GET /api/curricula/by-state/:state
 */
router.get('/api/curricula/by-state/:state', async (req, res) => {
  const state = req.params.state.toUpperCase();
  if (!state || state.length !== 2) {
    return res.status(400).json({ error: 'Invalid state code', state });
  }

  try {
    var driver = getNeo4jDriver();
    var session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 5000,
    });

    const result = await session.run(curriculaMapper.buildByStateQuery(state), { state });
    await session.close();

    const topics = curriculaMapper.mapCurriculumTopics(result.records);

    res.json({
      source: 'neo4j',
      state,
      topicCount: topics.length,
      totalObjectives: topics.reduce((s, t) => s + t.objectiveCount, 0),
      topics,
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/by-state] Neo4j error'
    );
    try {
      var fb = getFallbackData();
      var fTopics = fb.curricula.filter(function (c) {
        return c.curriculumMeta && c.curriculumMeta.state === state;
      });
      res.json({
        source: 'fallback',
        state,
        topicCount: fTopics.length,
        totalObjectives: fTopics.reduce(function (s, t) {
          return s + (t.curriculumMeta.objective_count || 0);
        }, 0),
        topics: fTopics.map(function (c) {
          return {
            name: c.name,
            grade: c.curriculumMeta.grade,
            schoolType: c.curriculumMeta.school_type,
            displayName: c.name,
            objectiveCount: c.curriculumMeta.objective_count || 0,
            objectives: [],
            entities: [],
            entityCount: 0,
            contentLinks: [],
          };
        }),
      });
    } catch {
      res.status(503).json({ error: 'Curriculum data unavailable' });
    }
  }
});

/**
 * GET /api/curricula/by-state/:state/grade/:grade
 */
router.get('/api/curricula/by-state/:state/grade/:grade', async (req, res) => {
  const state = req.params.state.toUpperCase();
  const grade = req.params.grade;
  if (!state || state.length !== 2) {
    return res.status(400).json({ error: 'Invalid state code', state });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 5000,
    });

    const result = await session.run(
      `MATCH (c:Curriculum {state_abbr: $state})
       MATCH (c)-[:HAS_TOPIC]->(t:Topic {grade: $grade})
       OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
       WITH t, collect(DISTINCT lo.text) AS objectives
       RETURN t.slug AS slug, t.title AS title, t.grade AS grade,
              size(objectives) AS objectiveCount,
              [ob IN objectives WHERE ob IS NOT NULL] AS objectives
       ORDER BY t.title`,
      { state, grade }
    );
    await session.close();

    const topics = result.records.map(function (r) {
      return {
        slug: r.get('slug'),
        title: r.get('title'),
        grade: r.get('grade'),
        objectiveCount: toNumberSafe(r.get('objectiveCount')),
        objectives: r.get('objectives'),
      };
    });

    res.json({
      source: 'neo4j',
      state,
      grade,
      topicCount: topics.length,
      totalObjectives: topics.reduce((s, t) => s + t.objectiveCount, 0),
      topics,
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/by-state/grade] Neo4j error'
    );
    res.status(503).json({ error: 'Curriculum data unavailable' });
  }
});

/**
 * GET /api/curricula/topic/:slug/articles
 */
router.get('/api/curricula/topic/:slug/articles', async (req, res) => {
  let slug;
  try {
    slug = decodeURIComponent(req.params.slug).trim();
  } catch {
    return res.status(400).json({ error: 'Ungültige URL-Kodierung' });
  }
  if (!slug) {
    return res.status(400).json({ error: 'Topic slug required' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (t:Topic) WHERE t.slug CONTAINS $slug OR t.title CONTAINS $slug
       OPTIONAL MATCH (e:Entity)-[:COVERS_TOPIC]->(t)
       OPTIONAL MATCH (t)-[:RELATED_TO]->(e:Entity)
       OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
       RETURN t.slug AS topicSlug, t.title AS title, t.grade AS grade,
              collect(DISTINCT {name: e.name, kategorie: e.kategorie}) AS coveringEntities,
              collect(DISTINCT {url: c.url, title: c.title, type: c.type}) AS contentLinks`,
      { slug }
    );
    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Topic not found', slug });
    }

    const row = result.records[0];
    res.json({
      source: 'neo4j',
      topic: {
        slug: row.get('topicSlug'),
        title: row.get('title'),
        grade: row.get('grade'),
      },
      coveringEntities: row.get('coveringEntities').filter((e) => e.name),
      contentLinks: row.get('contentLinks').filter((c) => c.url),
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/topic/articles] Neo4j error'
    );
    res.status(503).json({ error: 'Topic articles unavailable' });
  }
});

/**
 * GET /api/curricula/objective/:slug/articles
 */
router.get('/api/curricula/objective/:slug/articles', async (req, res) => {
  let slug;
  try {
    slug = decodeURIComponent(req.params.slug).trim();
  } catch {
    return res.status(400).json({ error: 'Ungültige URL-Kodierung' });
  }
  if (!slug) {
    return res.status(400).json({ error: 'Objective slug required' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (lo:LearningObjective) WHERE lo.slug CONTAINS $slug OR lo.text CONTAINS $slug
       OPTIONAL MATCH (e:Entity)-[:FULFILLS]->(lo)
       OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
       OPTIONAL MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
       RETURN lo.slug AS objSlug, lo.text AS text,
              t.slug AS topicSlug, t.title AS topicTitle,
              collect(DISTINCT {name: e.name, kategorie: e.kategorie}) AS fulfillingEntities,
              collect(DISTINCT {url: c.url, title: c.title, type: c.type}) AS contentLinks`,
      { slug }
    );
    await session.close();

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Objective not found', slug });
    }

    const row = result.records[0];
    res.json({
      source: 'neo4j',
      objective: {
        slug: row.get('objSlug'),
        text: row.get('text'),
        topic: row.get('topicSlug'),
        topicTitle: row.get('topicTitle'),
      },
      fulfillingEntities: row.get('fulfillingEntities').filter((e) => e.name),
      contentLinks: row.get('contentLinks').filter((c) => c.url),
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/objective/articles] Neo4j error'
    );
    res.status(503).json({ error: 'Objective articles unavailable' });
  }
});

/**
 * GET /api/entity/:name/curricula
 */
// Redirect old /api/entities/ path to new /api/entity/ path
router.get('/api/entities/:name/curricula', (req, res) => {
  res.redirect(301, `/api/entity/${req.params.name}/curricula`);
});

router.get('/api/entity/:name/curricula', async (req, res) => {
  let nameParam;
  try {
    nameParam = decodeURIComponent(req.params.name).trim();
  } catch {
    return res.status(400).json({ error: 'Ungültige URL-Kodierung' });
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (e:Entity)
       WHERE toLower(e.name) = toLower($name)
       OPTIONAL MATCH (e)-[:COVERS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (e)-[:FULFILLS|FULFILLS_OBJECTIVE]->(lo:LearningObjective)
       OPTIONAL MATCH (e)-[:MENTIONS]->(c:Content)
       OPTIONAL MATCH (t2:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
       RETURN e.name AS name, e.kategorie AS kategorie,
              collect(DISTINCT {
                slug: t.slug, title: t.title,
                state: t.state, grade: t.grade
              }) AS coveredTopics,
              collect(DISTINCT {
                slug: lo.slug, text: lo.text,
                topicSlug: t2.slug, topicTitle: t2.title
              }) AS fulfilledObjectives,
              collect(DISTINCT {
                url: c.url, title: c.title, type: c.type
              }) AS contentLinks`,
      { name: nameParam }
    );
    await session.close();

    if (result.records.length === 0 || !result.records[0].get('name')) {
      return res.status(404).json({ error: 'Entity not found', name: nameParam });
    }

    const r = result.records[0];
    const coveredTopics = (r.get('coveredTopics') || []).filter((t) => t.slug != null);
    const fulfilledObjectives = (r.get('fulfilledObjectives') || []).filter((o) => o.slug != null);
    const contentLinks = (r.get('contentLinks') || []).filter((c) => c.url !== null);

    res.json({
      source: 'neo4j',
      entity: {
        name: r.get('name'),
        kategorie: r.get('kategorie'),
      },
      coveredTopics,
      fulfilledObjectives,
      contentLinks,
      stats: {
        coveredTopics: coveredTopics.length,
        fulfilledObjectives: fulfilledObjectives.length,
        contentLinks: contentLinks.length,
      },
    });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[entities/curricula] Neo4j error'
    );
    res.status(503).json({ error: 'Curriculum context unavailable' });
  }
});

/**
 * GET /api/curricula/linked-entities
 */
router.get('/api/curricula/linked-entities', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const result = await session.run(
      `MATCH (e:Entity)-[:COVERS_TOPIC|FULFILLS]->()
       RETURN collect(DISTINCT e.name) AS names`
    );
    await session.close();

    const names = (result.records[0]?.get('names') || []).map((n) => n);
    res.json({ names, count: names.length });
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/linked-entities] Neo4j error'
    );
    res.status(503).json({ error: 'Linked entities unavailable', names: [], count: 0 });
  }
});

/**
 * GET /api/curricula/compare
 */
router.get('/api/curricula/compare', function (req, res) {
  var q = (req.query.name || '').toLowerCase().trim();
  if (!q) {
    return res.json({ results: {}, query: q, count: 0 });
  }

  var fallback = getFallbackData();
  var matches = [];
  var seen = {};

  for (var ci = 0; ci < fallback.curricula.length; ci++) {
    var c = fallback.curricula[ci];
    if (c.name.toLowerCase().indexOf(q) !== -1) {
      var key = c.curriculumMeta.state + '|' + c.name;
      if (!seen[key]) {
        seen[key] = true;
        matches.push({
          name: c.name,
          state: c.curriculumMeta.state,
          grade: c.curriculumMeta.grade,
          school_type: c.curriculumMeta.school_type,
          objective_count: c.curriculumMeta.objective_count,
        });
      }
    }
  }

  var grouped = {};
  for (var mi = 0; mi < matches.length; mi++) {
    var m = matches[mi];
    if (!grouped[m.state]) grouped[m.state] = [];
    grouped[m.state].push(m);
  }

  res.json({ results: grouped, query: q, count: matches.length });
});

// ── Graph payload for the curricula index page ────────────────────────────

// Small in-memory cache: the same scope+params are re-requested on every
// page load / scope switch; Neo4j is read-only for this route.
const graphCache = new Map();
const GRAPH_CACHE_TTL_MS = 60 * 1000;

/** Namespaced, stable node id helper. */
function graphNodeId(type, key) {
  return `${type}:${String(key).slice(0, 200)}`;
}

/**
 * GET /api/curricula/graph — cytoscape-ready nodes/edges for the
 * Lehrplan + Modulhandbuch subsets.
 *
 * Query params:
 *   scope       all | universities | curriculum   (default: all)
 *   university  short code filter, e.g. CAM
 *   state       state_abbr filter, e.g. BY
 *   limit       node cap (default 500, max 1500)
 *   q           name substring filter
 */
router.get('/api/curricula/graph', async (req, res) => {
  const scope = ['all', 'universities', 'curriculum'].includes(req.query.scope)
    ? req.query.scope
    : 'all';
  const university = String(req.query.university || '')
    .trim()
    .toUpperCase();
  const state = String(req.query.state || '')
    .trim()
    .toUpperCase();
  const curriculum = String(req.query.curriculum || '').trim();
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 50), 1500);
  const q = String(req.query.q || '')
    .trim()
    .toLowerCase();

  const cacheKey = [scope, university, state, curriculum, limit, q].join('|');
  const cached = graphCache.get(cacheKey);
  if (cached && Date.now() - cached.at < GRAPH_CACHE_TTL_MS) {
    return res.json(cached.payload);
  }

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
      fetchSize: 2000,
    });

    const nodes = new Map(); // id -> node
    const edges = new Map(); // "s|t|type" -> edge

    const addNode = (id, type, label, meta) => {
      if (!nodes.has(id)) {
        nodes.set(id, { id, type, label: label || id, meta: meta || {} });
      } else if (meta) {
        nodes.get(id).meta = Object.assign({}, nodes.get(id).meta, meta);
      }
    };
    const addEdge = (source, target, type) => {
      const key = `${source}|${target}|${type}`;
      if (!edges.has(key)) edges.set(key, { source, target, type });
    };

    // ── Query 1: University → UniversityModule → Entity ──
    if (scope !== 'curriculum') {
      const uniWhere = university ? 'WHERE u.short_code = $university' : '';
      const uniParams = university ? { university } : {};
      const r1 = await session.run(
        `MATCH (u:University)-[:OFFERS]->(m:UniversityModule)
         ${uniWhere}
         OPTIONAL MATCH (m)-[:COVERS|TEACHES]->(e:Entity)
         RETURN u, m, collect(DISTINCT e) AS entities
         ORDER BY u.name, m.module_name`,
        uniParams
      );
      r1.records.forEach((rec) => {
        const u = rec.get('u');
        const m = rec.get('m');
        if (!u) return;
        const uniId = graphNodeId('uni', u.properties.short_code || u.properties.name);
        addNode(uniId, 'university', u.properties.name, {
          shortCode: u.properties.short_code,
          country: u.properties.country,
          city: u.properties.city,
          website: u.properties.website,
        });
        if (!m) return;
        const modId = graphNodeId(
          'mod',
          `${u.properties.short_code || 'uni'}:${m.properties.module_code}`
        );
        addNode(modId, 'module', m.properties.module_name || m.properties.module_code, {
          moduleCode: m.properties.module_code,
          university: u.properties.short_code,
          degree: m.properties.degree,
          level: m.properties.level,
          ects: m.properties.ects,
          language: m.properties.language,
          url: m.properties.url,
        });
        addEdge(uniId, modId, 'OFFERS');
        const ents = rec.get('entities') || [];
        ents.forEach((e) => {
          if (!e || !e.properties || !e.properties.name) return;
          const entId = graphNodeId('ent', e.properties.name);
          addNode(entId, 'entity', e.properties.name, {
            kategorie: e.properties.kategorie,
            state: e.properties.state,
            grade: e.properties.grade,
          });
          addEdge(modId, entId, 'COVERS');
        });
      });
    }

    // ── Query 2: Curriculum → Topic → SubTopic (+ objectives, capped) ──
    if (scope !== 'universities') {
      const curWhere = curriculum
        ? 'WHERE c.slug = $curriculum'
        : state
          ? 'WHERE c.state_abbr = $state'
          : '';
      const curParams = curriculum ? { curriculum } : state ? { state } : {};
      const r2 = await session.run(
        `MATCH (c:Curriculum)-[:HAS_TOPIC]->(t:Topic)
         ${curWhere}
         OPTIONAL MATCH (t)-[:HAS_SUBTOPIC]->(s:SubTopic)
         OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
         WITH c, t, collect(DISTINCT s) AS subs, collect(DISTINCT lo) AS los
         RETURN c.state_abbr AS stateAbbr, c.state AS stateName,
                c.slug AS curSlug, c.school_type AS schoolType,
                t.title AS topicTitle, t.slug AS topicSlug,
                subs, los
         ORDER BY c.state_abbr, t.title`,
        curParams
      );
      r2.records.forEach((rec) => {
        const curId = graphNodeId('cur', rec.get('curSlug') || rec.get('stateAbbr'));
        addNode(curId, 'curriculum', rec.get('stateName') || rec.get('stateAbbr'), {
          state: rec.get('stateAbbr'),
          schoolType: rec.get('schoolType'),
        });
        const topicTitle = rec.get('topicTitle');
        if (!topicTitle) return;
        const topicId = graphNodeId('topic', rec.get('topicSlug') || topicTitle);
        addNode(topicId, 'topic', topicTitle, { state: rec.get('stateAbbr') });
        addEdge(curId, topicId, 'HAS_TOPIC');
        const subs = rec.get('subs') || [];
        subs.forEach((s) => {
          if (!s || !s.properties || !s.properties.title) return;
          const subId = graphNodeId('sub', s.properties.slug || s.properties.title);
          addNode(subId, 'subtopic', s.properties.title, { state: rec.get('stateAbbr') });
          addEdge(topicId, subId, 'HAS_SUBTOPIC');
        });
        // Objectives: bounded, only in scope=curriculum to keep payload sane.
        if (scope === 'curriculum') {
          const los = (rec.get('los') || []).slice(0, 150);
          los.forEach((lo) => {
            if (!lo || !lo.properties || !lo.properties.text) return;
            const loId = graphNodeId('lo', lo.properties.slug || lo.properties.text);
            addNode(loId, 'objective', lo.properties.text.slice(0, 140), {
              state: rec.get('stateAbbr'),
            });
            addEdge(topicId, loId, 'HAS_LEARNING_OBJECTIVE');
          });
        }
      });
    }

    // ── Query 3: bridge Entity → SubTopic (non-lehrplan) + page mentions ──
    if (scope !== 'universities') {
      const r3 = await session.run(
        `MATCH (e:Entity)-[:COVERS_TOPIC]->(s:SubTopic)
         WHERE e.kategorie IS NOT NULL AND e.kategorie <> 'lehrplan'
         RETURN e.name AS entName, e.kategorie AS kategorie,
                s.title AS subTitle, s.slug AS subSlug
         LIMIT 400`
      );
      r3.records.forEach((rec) => {
        const entId = graphNodeId('ent', rec.get('entName'));
        addNode(entId, 'entity', rec.get('entName'), { kategorie: rec.get('kategorie') });
        const subId = graphNodeId('sub', rec.get('subSlug') || rec.get('subTitle'));
        addNode(subId, 'subtopic', rec.get('subTitle'));
        addEdge(entId, subId, 'COVERS_TOPIC');
      });
    }

    // ── Apply q filter + limit cap (prefer high-degree nodes) ──
    let nodeList = Array.from(nodes.values());
    if (q) {
      nodeList = nodeList.filter((n) => n.label.toLowerCase().includes(q));
    }
    if (nodeList.length > limit) {
      const degree = new Map();
      edges.forEach((e) => {
        degree.set(e.source, (degree.get(e.source) || 0) + 1);
        degree.set(e.target, (degree.get(e.target) || 0) + 1);
      });
      nodeList.sort(
        (a, b) =>
          (degree.get(b.id) || 0) - (degree.get(a.id) || 0) || a.label.localeCompare(b.label)
      );
      const keep = new Set(nodeList.slice(0, limit).map((n) => n.id));
      nodeList = nodeList.filter((n) => keep.has(n.id));
      edges.forEach((e, key) => {
        if (!keep.has(e.source) || !keep.has(e.target)) edges.delete(key);
      });
    }

    await session.close();

    const payload = {
      source: 'neo4j',
      scope,
      meta: {
        nodeCount: nodeList.length,
        edgeCount: edges.size,
        truncated: nodeList.length > limit,
        filters: { university, state, q },
      },
      nodes: nodeList,
      edges: Array.from(edges.values()),
    };

    graphCache.set(cacheKey, { at: Date.now(), payload });
    return res.json(payload);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[curricula/graph] Neo4j error'
    );
    return res.status(503).json({ error: 'Graphendaten nicht verfügbar' });
  }
});

export default router;
