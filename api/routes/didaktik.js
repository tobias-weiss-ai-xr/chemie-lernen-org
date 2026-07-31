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
 * GET /api/didaktik
 *
 * Two modes:
 * - ?topic=<slug>&state=<code> → didactic teaching tips mode
 * - ?institution=, ?search=, ?limit= → guidelines list mode
 */
router.get('/api/didaktik', async (req, res) => {
  const topic = (req.query.topic || '').trim().toLowerCase();

  // ── Mode 2: Didactic teaching tips (when topic param is present) ──
  if (topic) {
    var stateCode = (req.query.state || '').trim().toUpperCase();

    try {
      var driver = getNeo4jDriver();
      var session = driver.session({
        database: NEO4J_DATABASE,
        defaultAccessMode: neo4j.session.READ,
      });

      var result;
      var curriculumResult;
      var teachingTips = [];

      try {
        // 1. Query LearningObjective nodes matching topic
        var query = `MATCH (lo:LearningObjective)
          MATCH (t:Topic)-[:HAS_LEARNING_OBJECTIVE]->(lo)
          WHERE t.slug CONTAINS $topic OR toLower(t.title) CONTAINS $topic
          OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
          RETURN lo.text AS objectiveText,
                 t.title AS topicTitle, t.slug AS topicSlug,
                 c.state_abbr AS state, c.school_type AS schoolType,
                 t.grade AS grade
          ORDER BY c.state_abbr, t.grade
          LIMIT 100`;

        result = await session.run(query, { topic: topic });
      } catch (queryErr) {
        logger.warn('[didaktik] LearningObjective query failed:', queryErr.message);
        result = { records: [] };
      }

      // 2. Get curricula context for the matching state
      if (stateCode) {
        try {
          curriculumResult = await session.run(
            `MATCH (c:Curriculum {state_abbr: $state})
             OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
             OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)
             RETURN c.slug AS curriculumSlug, c.school_type AS schoolType,
                    t.title AS topicTitle, t.grade AS grade,
                    collect(DISTINCT lo.text) AS objectives
             ORDER BY t.grade, t.title
             LIMIT 50`,
            { state: stateCode }
          );
        } catch (currErr) {
          logger.warn('[didaktik] Curriculum query failed:', currErr.message);
          curriculumResult = { records: [] };
        }
      } else {
        curriculumResult = { records: [] };
      }

      // 3. If no LearningObjective results, search SubTopic nodes by name similarity
      if (result.records.length === 0) {
        try {
          var subTopicResult = await session.run(
            `MATCH (st:SubTopic)
             WHERE toLower(st.title) CONTAINS $topic
             OPTIONAL MATCH (t:Topic)-[:HAS_SUB_TOPIC]->(st)
             OPTIONAL MATCH (c:Curriculum)-[:HAS_TOPIC]->(t)
             RETURN st.title AS subTopicTitle,
                    t.title AS topicTitle, t.slug AS topicSlug,
                    c.state_abbr AS state, t.grade AS grade
             LIMIT 20`,
            { topic: topic }
          );
          for (var si = 0; si < subTopicResult.records.length; si++) {
            var sr = subTopicResult.records[si];
            teachingTips.push({
              subTopic: sr.get('subTopicTitle'),
              topicTitle: sr.get('topicTitle'),
              state: sr.get('state'),
              grade: sr.get('grade'),
            });
          }
        } catch (subErr) {
          logger.warn('[didaktik] SubTopic query failed:', subErr.message);
        }
      }

      await session.close();

      // Build response
      var objectives = [];
      var curriculaMap = {};

      for (var ri = 0; ri < result.records.length; ri++) {
        var rec = result.records[ri];
        var objText = rec.get('objectiveText');
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
        var recState = rec.get('state');
        if (recState && !curriculaMap[recState]) {
          curriculaMap[recState] = {
            state: recState,
            topicTitle: rec.get('topicTitle'),
            grade: rec.get('grade'),
            schoolType: rec.get('schoolType'),
          };
        }
      }

      if (curriculumResult && curriculumResult.records.length > 0) {
        for (var ci = 0; ci < curriculumResult.records.length; ci++) {
          var cr = curriculumResult.records[ci];
          var crState = cr.get('curriculumSlug');
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

      var curricula = Object.keys(curriculaMap).map(function (k) {
        return curriculaMap[k];
      });

      if (teachingTips.length === 0 && objectives.length === 0) {
        teachingTips = [
          {
            note: 'Keine spezifischen didaktischen Hinweise für "' + topic + '" gefunden.',
            suggestion:
              'Versuche einen allgemeineren Themenbegriff oder überprüfe die Schreibweise.',
          },
        ];
      }

      res.json({
        topic: topic,
        state: stateCode || null,
        objectives: objectives,
        curricula: curricula,
        teachingTips: teachingTips,
        count: {
          objectives: objectives.length,
          curricula: curricula.length,
          tips: teachingTips.length,
        },
      });
    } catch (err) {
      logger.error({ err: err, message: err.message || String(err) }, '[didaktik] Error');
      res.json({
        topic: topic,
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
    }
    return;
  }

  // ── Mode 1: Guidelines list (default, when no topic param) ──
  const institution = (req.query.institution || '').trim();
  const search = (req.query.search || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);

  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
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
    await session.close();
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
    logger.error({ err: err, message: err.message || String(err) }, '[didaktik] Neo4j error');
    res.status(503).json({ error: 'Didaktik data unavailable' });
  }
});

export default router;
