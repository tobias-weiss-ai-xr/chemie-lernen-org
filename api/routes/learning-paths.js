/**
 * Learning path route handlers — extracted from server.js.
 *
 * Routes:
 *   GET  /api/learning-paths
 *   GET  /api/learning-paths/:slug
 *   POST /api/learning-paths/:slug/enroll
 *   GET  /api/learning-paths/progress
 *   POST /api/learning-paths/:slug/certificate
 */

import { Router } from 'express';
import crypto from 'crypto';
import neo4j from 'neo4j-driver';
import PDFDocument from 'pdfkit';
import pino from 'pino';
import { requireAuth, requirePremium } from '../auth.js';
import { getNeo4jDriver, NEO4J_DATABASE } from '../services/neo4j.js';
import { getGamification } from '../auth-db.js';
import * as learningEngine from '../learning-engine.js';
import { loadLearningPathsJson } from '../services/content.js';
import { sessionStore } from '../services/session.js';

const router = Router();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

/**
 * GET /api/learning-paths
 */
router.get('/api/learning-paths', async (req, res) => {
  var stateParam = (req.query.state || '').toUpperCase().trim();
  if (stateParam.length === 2) {
    var allData = loadLearningPathsJson();
    var current = null;
    for (var di = 0; di < allData.length; di++) {
      if (allData[di].state === stateParam) {
        current = allData[di];
        break;
      }
    }
    if (!current) {
      return res.status(404).json({ error: 'Lernpfad für ' + stateParam + ' nicht gefunden' });
    }

    var states = allData.map(function (s) {
      return { state: s.state, name: s.name, grade: s.grade, topicCount: s.topicCount };
    });
    return res.json({ states: states, current: current });
  }

  // Legacy behavior: query Neo4j for Curriculum-based paths
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    let paths;
    try {
      const result = await session.run(
        `MATCH (c:Curriculum)
         OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)
         RETURN c, count(t) AS topicCount
         ORDER BY c.state_abbr`
      );
      paths = result.records.map((r) => {
        const props = r.get('c').properties;
        return {
          slug: props.slug || '',
          title: props.title || props.state || props.state_abbr || '',
          description: props.description || props.school_type || '',
          topicCount: r.get('topicCount') ? r.get('topicCount').toNumber() : 0,
          completedTopics: 0,
          progressPercent: 0,
        };
      });
    } finally {
      await session.close();
    }

    // Compute user progress if authenticated
    if (req.user?.id) {
      const g = getGamification(req.user.id);
      const completedSlugs = new Set(((g && g.completedObjectives) || []).map((o) => o.slug));

      const detailSession = driver.session({
        database: NEO4J_DATABASE,
        defaultAccessMode: neo4j.session.READ,
      });
      try {
        const objResult = await detailSession.run(
          `MATCH (c:Curriculum)-[:HAS_SUBTOPIC]->(st:SubTopic)-[:FULFILLS]->(lo:LearningObjective)
           OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)-[:HAS_SUBTOPIC]->(st2:SubTopic)-[:FULFILLS]->(lo2:LearningObjective)
           RETURN c.slug AS slug, lo.slug AS objectiveId, lo2.slug AS objectiveId2`
        );
        const pathObjectives = {};
        for (const r of objResult.records) {
          const slug = r.get('slug');
          const oid = r.get('objectiveId');
          const oid2 = r.get('objectiveId2');
          if (!slug) continue;
          if (!pathObjectives[slug]) pathObjectives[slug] = new Set();
          if (oid != null) pathObjectives[slug].add(String(oid));
          if (oid2 != null) pathObjectives[slug].add(String(oid2));
        }

        paths = paths.map((p) => {
          const objectives = Array.from(pathObjectives[p.slug] || []);
          if (objectives.length === 0) return p;
          const completed = objectives.filter((oid) => completedSlugs.has(oid)).length;
          return {
            ...p,
            completedTopics: completed,
            progressPercent: Math.round((completed / objectives.length) * 100),
          };
        });
      } finally {
        await detailSession.close();
      }
    }

    var learningPathsData = loadLearningPathsJson();
    var stateList = learningPathsData.map(function (s) {
      return { state: s.state, name: s.name, grade: s.grade, topicCount: s.topicCount };
    });

    res.json({ paths: paths, states: stateList });
  } catch (err) {
    logger.error({ err: err, message: err.message || String(err) }, '[learning-paths] list error');
    res.status(500).json({ error: 'Lernpfade konnten nicht geladen werden' });
  }
});

/**
 * GET /api/learning-paths/progress
 */
router.get('/api/learning-paths/progress', requireAuth, async (req, res) => {
  try {
    const progress = learningEngine.getAggregatedProgress(sessionStore, req.user.id);
    res.json(progress);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[learning-paths] progress error'
    );
    res.status(500).json({ error: 'Fortschritt konnte nicht geladen werden' });
  }
});

/**
 * GET /api/learning-paths/:slug
 */
router.get('/api/learning-paths/:slug', async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });

    let tree = null;
    try {
      // Combined schema query:
      //   Schema A (legacy, majority): Curriculum→HAS_SUBTOPIC→SubTopic→FULFILLS→LO
      //   Schema B (BY only):          Curriculum→HAS_TOPIC→Topic→HAS_SUBTOPIC→SubTopic→FULFILLS→LO
      // Both paths are combined via OPTIONAL MATCH; LOs are deduplicated by id.
      const result = await session.run(
        `MATCH (c:Curriculum {slug: $slug})
         OPTIONAL MATCH (c)-[:HAS_SUBTOPIC]->(stA:SubTopic)-[:FULFILLS]->(loA:LearningObjective)
         OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)-[:HAS_SUBTOPIC]->(stB:SubTopic)-[:FULFILLS]->(loB:LearningObjective)
         OPTIONAL MATCH (loA)-[:PREREQUISITE]->(preA:LearningObjective)
         OPTIONAL MATCH (loB)-[:PREREQUISITE]->(preB:LearningObjective)
         RETURN c, t, stA, loA, collect(DISTINCT preA.slug) AS prerequisitesA,
                stB, loB, collect(DISTINCT preB.slug) AS prerequisitesB
         ORDER BY t.title, stA.title, stB.title, loA.slug, loB.slug`,
        { slug: req.params.slug }
      );

      if (result.records.length === 0) {
        const existsResult = await session.run(`MATCH (c:Curriculum {slug: $slug}) RETURN c`, {
          slug: req.params.slug,
        });
        if (existsResult.records.length === 0) {
          return res.status(404).json({ error: 'Lernpfad nicht gefunden' });
        }
        const cProps = existsResult.records[0].get('c').properties;
        tree = {
          slug: cProps.slug || req.params.slug,
          title: cProps.title || '',
          description: cProps.description || '',
          topics: [],
          totalObjectives: 0,
          completedObjectives: 0,
        };
      } else {
        const cProps = result.records[0].get('c').properties;
        const topicMap = {};
        const seenLOs = new Set();

        const addObjective = (lo, preReqIds, topic, subtopic) => {
          if (!lo) return;
          const loId = lo.properties.slug || '';
          if (!loId || seenLOs.has(loId)) return;
          seenLOs.add(loId);

          const tId = topic ? topic.identity.toNumber() : 'schemaA';
          if (!topicMap[tId]) {
            topicMap[tId] = {
              title: topic ? topic.properties.title || '' : cProps.title || 'Themen',
              slug: topic ? topic.properties.slug || '' : cProps.slug || '',
              subtopics: {},
            };
          }

          const stId = subtopic
            ? subtopic.identity.toNumber()
            : 'stA-' + (subtopic && subtopic.properties.slug);
          if (!topicMap[tId].subtopics[stId]) {
            topicMap[tId].subtopics[stId] = {
              title: subtopic ? subtopic.properties.title || '' : '',
              slug: subtopic ? subtopic.properties.slug || '' : '',
              objectives: [],
            };
          }

          topicMap[tId].subtopics[stId].objectives.push({
            id: loId,
            text: lo.properties.text || lo.properties.title || '',
            prerequisites: preReqIds.filter(Boolean).map(String),
          });
        };

        for (const r of result.records) {
          // Schema A: direct subtopics
          const stA = r.get('stA');
          const loA = r.get('loA');
          if (stA && loA) {
            addObjective(loA, r.get('prerequisitesA') || [], null, stA);
          }
          // Schema B: topic-nested subtopics
          const topic = r.get('t');
          const stB = r.get('stB');
          const loB = r.get('loB');
          if (topic && stB && loB) {
            addObjective(loB, r.get('prerequisitesB') || [], topic, stB);
          }
        }

        // Schema A subtopics without a topic get grouped under one fallback topic
        const topics = Object.values(topicMap).map((t) => ({
          ...t,
          subtopics: Object.values(t.subtopics),
        }));

        let totalObjectives = 0;
        for (const t of topics) {
          for (const st of t.subtopics) {
            totalObjectives += st.objectives.length;
          }
        }

        tree = {
          slug: cProps.slug || req.params.slug,
          title: cProps.title || '',
          description: cProps.description || '',
          topics,
          totalObjectives,
          completedObjectives: 0,
        };

        if (req.user?.id) {
          const g = getGamification(req.user.id);
          const completedSlugs = new Set(((g && g.completedObjectives) || []).map((o) => o.slug));
          let completedCount = 0;
          for (const t of tree.topics) {
            for (const st of t.subtopics) {
              for (const obj of st.objectives) {
                if (completedSlugs.has(obj.id)) {
                  obj.completed = true;
                  completedCount++;
                } else {
                  obj.completed = false;
                }
              }
            }
          }
          tree.completedObjectives = completedCount;
        }
      }
    } finally {
      await session.close();
    }

    res.json(tree);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[learning-paths] detail error'
    );
    res.status(500).json({ error: 'Lernpfad-Details konnten nicht geladen werden' });
  }
});

/**
 * POST /api/learning-paths/:slug/enroll
 */
router.post('/api/learning-paths/:slug/enroll', requireAuth, async (req, res) => {
  try {
    const result = learningEngine.enrollInPath(sessionStore, req.user.id, req.params.slug);
    res.json(result);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[learning-paths] enroll error'
    );
    res.status(500).json({ error: 'Einschreibung fehlgeschlagen' });
  }
});

/**
 * POST /api/learning-paths/:slug/certificate
 */
router.post('/api/learning-paths/:slug/certificate', requirePremium, async (req, res) => {
  try {
    const driver = getNeo4jDriver();
    const session = driver.session({
      database: NEO4J_DATABASE,
      defaultAccessMode: neo4j.session.READ,
    });
    let pathTitle = '';
    let allObjectives = [];
    try {
      const result = await session.run(
        `MATCH (c:Curriculum {slug: $slug})
         OPTIONAL MATCH (c)-[:HAS_SUBTOPIC]->(stA:SubTopic)-[:FULFILLS]->(loA:LearningObjective)
         OPTIONAL MATCH (c)-[:HAS_TOPIC]->(t:Topic)-[:HAS_SUBTOPIC]->(stB:SubTopic)-[:FULFILLS]->(loB:LearningObjective)
         RETURN c.title AS pathTitle, loA.slug AS objectiveIdA, loB.slug AS objectiveIdB
         ORDER BY loA.slug, loB.slug`,
        { slug: req.params.slug }
      );
      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Lernpfad nicht gefunden' });
      }
      pathTitle = result.records[0].get('pathTitle');
      const objectiveSet = new Set();
      for (const r of result.records) {
        const oidA = r.get('objectiveIdA');
        const oidB = r.get('objectiveIdB');
        if (oidA != null) objectiveSet.add(String(oidA));
        if (oidB != null) objectiveSet.add(String(oidB));
      }
      allObjectives = Array.from(objectiveSet);
    } finally {
      await session.close();
    }

    const g = getGamification(req.user.id);
    const completedSlugs = new Set(((g && g.completedObjectives) || []).map((o) => o.slug));
    const completed = allObjectives.filter((oid) => completedSlugs.has(oid)).length;

    if (completed < allObjectives.length) {
      return res.status(400).json({
        error: 'Path not completed',
        completed,
        total: allObjectives.length,
      });
    }

    // Generate PDF certificate with pdfkit
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    const userName = req.user.displayName || req.user.email || 'Benutzer';
    const today = new Date().toLocaleDateString('de-DE');
    const certId = crypto.randomUUID();

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#1a5276', 3);
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke('#2e86c1', 1);

      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#1a5276')
        .text('Zertifikat', { align: 'center' });

      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#555')
        .text('Hiermit wird bestätigt, dass', { align: 'center' });

      doc.moveDown(0.8);
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#000').text(userName, { align: 'center' });

      doc.moveDown(0.8);
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#555')
        .text('den Lernpfad erfolgreich abgeschlossen hat:', { align: 'center' });

      doc.moveDown(0.5);
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#2e86c1')
        .text(pathTitle, { align: 'center' });

      doc.moveDown(1.5);
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#777')
        .text(`Ausgestellt am ${today}`, { align: 'center' });

      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#999')
        .text(`Zertifikats-ID: ${certId}`, { align: 'center' });

      doc.end();
    });

    const pdfBuffer = Buffer.concat(buffers);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zertifikat-${req.params.slug}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    logger.error(
      { err: err, message: err.message || String(err) },
      '[learning-paths] certificate error'
    );
    res.status(500).json({ error: 'Zertifikat konnte nicht erstellt werden' });
  }
});

export default router;
