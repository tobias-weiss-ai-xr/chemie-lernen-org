/**
 * Didaktik (didactic guidelines & teaching tips) route handlers — extracted from server.js.
 *
 * There are TWO GET /api/didaktik endpoints that were merged:
 *   1. List didactic guidelines (KMK standards) — when ?institution= or no specific param
 *   2. Didactic teaching tips — when ?topic= param is present
 *
 * Routes:
 *   GET /api/didaktik (merged handler: checks query params to dispatch)
 */

import { Router } from 'express';
import neo4j from 'neo4j-driver';
import pino from 'pino';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

/**
 * Run a Neo4j query, returning { records: [] } on failure instead of throwing.
 * Centralises the repeated try/catch-with-logger pattern used by the tips handler.
 */
async function safeSessionRun(session, query, params, label) {
  try {
    return await session.run(query, params);
  } catch (err) {
    logger.warn({ err, message: err.message || String(err) }, `[didaktik] ${label} query failed`);
    return { records: [] };
  }
}

/** Map LearningObjective records into objectives + curricula index. */
function mapObjectives(records) {
  const objectives = [];
  const curriculaMap = {};
  for (let ri = 0; ri < records.length; ri++) {
    const rec = records[ri];
    const objText = rec.get('objectiveText');
    if (objText) {
      objectives.push({
        text: objText,
        topicTitle: rec.get('topicTitle'),
        topicSlug: rec.get('topicSlug'),
        state: rec.get('state'),
        schoolType: rec.get('schoolType'),
        grade: rec.get('grade'),
      });
    }
    const recState = rec.get('state');
    if (recState && !curriculaMap[recState]) {
      curriculaMap[recState] = {
        state: recState,
        topicTitle: rec.get('topicTitle'),
        grade: rec.get('grade'),
        schoolType: rec.get('schoolType'),
      };
    }
  }
  return { objectives, curriculaMap };
}

/** Merge Curriculum records into an existing curricula index (mutates curriculaMap). */
function mergeCurricula(curriculumResult, curriculaMap) {
  if (!curriculumResult || curriculumResult.records.length === 0) return;
  for (let ci = 0; ci < curriculumResult.records.length; ci++) {
    const cr = curriculumResult.records[ci];
    const crState = cr.get('curriculumSlug');
    if (crState && !curriculaMap[crState]) {
      curriculaMap[crState] = {
        state: crState,
        schoolType: cr.get('schoolType'),
        topicTitle: cr.get('topicTitle'),
        grade: cr.get('grade'),
      };
    }
  }
}

/** Mode 2: didactic teaching tips for a topic (with optional state context). */
async function handleDidacticTips(req, res, topic) {
  const stateCode = (req.query.state || '').trim().toUpperCase();

  let driver;
  let session;
  try {
    driver = getNeo4jDriver();
    session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    const learningQuery = `MATCH (lo:LearningObjective)
      MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
      WHERE t.slug CONTAINS $topic OR toLower(t.title) CONTAINS $topic
      OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
      RETURN lo.text AS objectiveText,
             t.title AS topicTitle, t.slug AS topicSlug,
             c.state_abbr AS state, c.school_type AS schoolType,
             t.grade AS grade
      ORDER BY c.state_abbr, t.grade
      LIMIT 100`;
    const result = await safeSessionRun(session, learningQuery, { topic }, 'LearningObjective');

    let curriculumResult = { records: [] };
    if (stateCode) {
      const curriculumQuery = `MATCH (c:Curriculum {state_abbr: $state})
         OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
         OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
         RETURN c.slug AS curriculumSlug, c.school_type AS schoolType,
                t.title AS topicTitle, t.grade AS grade,
                collect(DISTINCT lo.text) AS objectives
         ORDER BY t.grade, t.title
         LIMIT 50`;
      curriculumResult = await safeSessionRun(
        session,
        curriculumQuery,
        { state: stateCode },
        'Curriculum'
      );
    }

    const teachingTips = [];
    if (result.records.length === 0) {
      const subTopicQuery = `MATCH (st:SubTopic)
         WHERE toLower(st.title) CONTAINS $topic
         OPTIONAL MATCH (t:Topic)-[:HAS_SUB_TOPIC]->(st)
         OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
         RETURN st.title AS subTopicTitle,
                t.title AS topicTitle, t.slug AS topicSlug,
                c.state_abbr AS state, t.grade AS grade
         LIMIT 20`;
      const subTopicResult = await safeSessionRun(session, subTopicQuery, { topic }, 'SubTopic');
      for (let si = 0; si < subTopicResult.records.length; si++) {
        const sr = subTopicResult.records[si];
        teachingTips.push({
          subTopic: sr.get('subTopicTitle'),
          topicTitle: sr.get('topicTitle'),
          state: sr.get('state'),
          grade: sr.get('grade'),
        });
      }
    }

    const { objectives, curriculaMap } = mapObjectives(result.records);
    mergeCurricula(curriculumResult, curriculaMap);
    const curricula = Object.keys(curriculaMap).map((k) => curriculaMap[k]);

    if (teachingTips.length === 0 && objectives.length === 0) {
      teachingTips.push({
        note: 'Keine spezifischen didaktischen Hinweise für "' + topic + '" gefunden.',
        suggestion: 'Versuche einen allgemeineren Themenbegriff oder überprüfe die Schreibweise.',
      });
    }

    res.json({
      topic,
      state: stateCode || null,
      objectives,
      curricula,
      teachingTips,
      count: {
        objectives: objectives.length,
        curricula: curricula.length,
        tips: teachingTips.length,
      },
    });
  } catch (err) {
    logger.error({ err, message: err.message || String(err) }, '[didaktik] Error');
    res.json({
      topic,
      state: stateCode || null,
      objectives: [],
      curricula: [],
      teachingTips: [
        {
          note: 'Didaktische Datenbank nicht verfügbar.',
          suggestion: 'Bitte versuche es später erneut.',
        },
      ],
      count: { objectives: 0, curricula: 0, tips: 1 },
    });
  } finally {
    if (session) await session.close();
  }
}

/** Mode 1: guidelines list (default, when no topic param). */
async function handleGuidelinesList(req, res) {
  const institution = (req.query.institution || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);

  let driver;
  let session;
  try {
    driver = getNeo4jDriver();
    session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    let whereClause = '';
    const params = {};
    if (institution) {
      whereClause += ' AND toLower(dg.institution) CONTAINS $institution';
      params.institution = institution.toLowerCase();
    }
    if (search) {
      whereClause +=
        ' AND (toLower(dg.title) CONTAINS $search OR toLower(dg.name) CONTAINS $search)';
      params.search = search;
    }

    const result = await session.run(
      `MATCH (dg:DidacticGuideline)
       WHERE 1=1${whereClause}
       OPTIONAL MATCH (dg)-[:HAS_SECTION]->(gs:GuidelineSection)
       WITH dg, count(gs) AS sectionCount
       RETURN dg.name AS name, dg.title AS title,
              dg.source_type AS sourceType, dg.institution AS institution,
              dg.url AS url, dg.section_count AS sectionCountDb,
              sectionCount AS sectionCountActual
       ORDER BY dg.title
       LIMIT ${limit}`,
      params
    );
    const items = result.records.map((r) => ({
      name: r.get('name'),
      title: r.get('title'),
      sourceType: r.get('sourceType'),
      institution: r.get('institution'),
      url: r.get('url'),
      sectionCount: r.get('sectionCountActual').toNumber(),
    }));
    res.json({ source: 'neo4j', items, count: items.length });
  } catch (err) {
    logger.error({ err, message: err.message || String(err) }, '[didaktik] Neo4j error');
    res.status(503).json({ error: 'Didaktik data unavailable' });
  } finally {
    if (session) await session.close();
  }
}

router.get('/api/didaktik', async (req, res) => {
  const topic = (req.query.topic || '').trim().toLowerCase();
  if (topic) return handleDidacticTips(req, res, topic);
  return handleGuidelinesList(req, res);
});

export default router;
