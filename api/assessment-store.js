/**
 * assessment-store.js — Neo4j persistence for assessment data.
 *
 * Stores Assessment, GradedAnswer, and Feedback nodes in the knowledge graph.
 * Handles CRUD, batch sync from offline localStorage, and GDPR deletion.
 *
 * All nodes use the Assessment/GradedAnswer/Feedback labels (added to CHEMIE_LABELS
 * in _neo4j-subset-filter.mjs) and scoped queries.
 */

import crypto from 'node:crypto';
import { getNeo4jDriver, NEO4J_DATABASE, toNumberSafe } from './services/neo4j.js';

// ── Index management ──────────────────────────────────────────────────

const INDEXES_CREATED = new Set();

/**
 * Reset the index-creation bookkeeping (test helper).
 * Ensures index creation runs again on the next call.
 */
export function resetAssessmentIndexes() {
  INDEXES_CREATED.clear();
}

/**
 * Ensure Neo4j indexes exist for assessment-related properties.
 * Runs once per process lifetime.
 */
async function ensureIndexes(session) {
  if (INDEXES_CREATED.size > 0) return;

  const indexQueries = [
    'CREATE INDEX IF NOT EXISTS FOR (a:Assessment) ON (a.userId)',
    'CREATE INDEX IF NOT EXISTS FOR (g:GradedAnswer) ON (g.createdAt)',
    'CREATE INDEX IF NOT EXISTS FOR (g:GradedAnswer) ON (g.exerciseId)',
  ];

  for (const query of indexQueries) {
    try {
      await session.run(query);
      INDEXES_CREATED.add(query);
    } catch (err) {
      // Index may already exist or DB version doesn't support IF NOT EXISTS
      console.warn('[assessment-store] Index warning:', err.message);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Generate a UUID v4.
 * @returns {string}
 */
function uuid() {
  return crypto.randomUUID();
}

// ── Assessment operations ─────────────────────────────────────────────

/**
 * Create an Assessment node and link it to learning objectives.
 *
 * @param {object} params
 * @param {string} params.userId - Pseudonymous user ID
 * @param {string} params.topic - Topic slug
 * @param {string} params.difficulty - leicht | mittel | schwer
 * @param {string[]} params.learningObjectiveSlugs - Array of LO slugs tested
 * @param {string} [params.type='auto-generated'] - 'auto-generated' | 'teacher-assigned'
 * @returns {Promise<object>} The created Assessment node properties
 */
export async function createAssessment({
  userId,
  topic,
  difficulty,
  learningObjectiveSlugs,
  type,
}) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    await ensureIndexes(session);

    const id = uuid();
    const createdAt = new Date().toISOString();

    // Always create the Assessment, even when no learning objective can be
    // resolved (empty/unmatched loSlugs). Linking is best-effort: the old
    // UNWIND+MATCH created nothing at all when loSlugs was empty, silently
    // dropping the assessment (and therefore never persisting a graded answer).
    const result = await session.run(
      `
      CREATE (a:Assessment {
        id: $id,
        userId: $userId,
        type: $type,
        topic: $topic,
        difficulty: $difficulty,
        createdAt: $createdAt
      })
      WITH a
      OPTIONAL MATCH (lo:LearningObjective) WHERE lo.slug IN $loSlugs
      WITH a, [x IN collect(DISTINCT lo) WHERE x IS NOT NULL] AS los
      FOREACH (lo IN los | CREATE (a)-[:TESTS]->(lo))
      RETURN a
      `,
      {
        id,
        userId,
        type: type || 'auto-generated',
        topic,
        difficulty,
        createdAt,
        loSlugs: learningObjectiveSlugs || [],
      }
    );

    return result.records[0]?.get('a')?.properties || null;
  } finally {
    await session.close();
  }
}

/**
 * Save a GradedAnswer node, linked to an Assessment and optionally to an Exercise.
 *
 * @param {object} params
 * @param {string} params.assessmentId - Parent Assessment node ID
 * @param {string} params.exerciseId - ID of the exercise answered
 * @param {string} params.userId - Pseudonymous user ID
 * @param {string} params.answer - The student's answer text
 * @param {boolean} params.correct - Whether answer was correct
 * @param {number} params.score - Score 0-100
 * @param {string} params.gradedBy - 'deterministic' | 'ai'
 * @returns {Promise<object>} The created GradedAnswer node properties
 */
export async function saveGradedAnswer({
  assessmentId,
  exerciseId,
  userId,
  answer,
  correct,
  score,
  gradedBy,
}) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const id = uuid();
    const createdAt = new Date().toISOString();

    const result = await session.run(
      `
      MATCH (a:Assessment {id: $assessmentId})
      CREATE (g:GradedAnswer {
        id: $id,
        exerciseId: $exerciseId,
        userId: $userId,
        answer: $answer,
        correct: $correct,
        score: $score,
        gradedBy: $gradedBy,
        createdAt: $createdAt
      })
      CREATE (g)-[:PART_OF]->(a)
      RETURN g
      `,
      {
        assessmentId,
        id,
        exerciseId,
        userId,
        answer,
        correct,
        score: toNumberSafe(score),
        gradedBy,
        createdAt,
      }
    );

    return result.records[0]?.get('g')?.properties || null;
  } finally {
    await session.close();
  }
}

/**
 * Save Feedback for a GradedAnswer, with optional concept references.
 *
 * @param {object} params
 * @param {string} params.gradedAnswerId - The GradedAnswer node ID
 * @param {string} params.text - Feedback text
 * @param {boolean} [params.aiGenerated=true] - Whether AI-generated
 * @param {boolean} [params.teacherOverride=false] - Whether teacher overrode
 * @param {string} [params.teacherNote] - Optional teacher annotation
 * @param {string[]} [params.conceptSlugs] - Referenced concept slugs
 * @param {string[]} [params.loSlugs] - Referenced learning objective slugs
 * @returns {Promise<object>} The created Feedback node properties
 */
export async function saveFeedback({
  gradedAnswerId,
  text,
  aiGenerated,
  teacherOverride,
  teacherNote,
  conceptSlugs,
  loSlugs,
}) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const id = uuid();
    const createdAt = new Date().toISOString();

    const result = await session.run(
      `
      MATCH (g:GradedAnswer {id: $gradedAnswerId})
      CREATE (f:Feedback {
        id: $id,
        text: $text,
        aiGenerated: $aiGenerated,
        teacherOverride: $teacherOverride,
        teacherNote: $teacherNote,
        createdAt: $createdAt
      })
      CREATE (f)-[:FOR]->(g)
      WITH f
      OPTIONAL MATCH (c:Concept) WHERE c.slug IN $conceptSlugs
      FOREACH (match IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END |
        CREATE (f)-[:REFERENCES]->(c)
      )
      WITH f
      OPTIONAL MATCH (lo:LearningObjective) WHERE lo.slug IN $loSlugs
      FOREACH (match IN CASE WHEN lo IS NOT NULL THEN [1] ELSE [] END |
        CREATE (f)-[:REFERENCES]->(lo)
      )
      RETURN f
      `,
      {
        id,
        gradedAnswerId,
        text,
        aiGenerated: aiGenerated !== false,
        teacherOverride: teacherOverride || false,
        teacherNote: teacherNote || null,
        conceptSlugs: conceptSlugs || [],
        loSlugs: loSlugs || [],
        createdAt,
      }
    );

    return result.records[0]?.get('f')?.properties || null;
  } finally {
    await session.close();
  }
}

/**
 * Override feedback with teacher's annotation.
 *
 * @param {string} feedbackId - Feedback node ID
 * @param {string} teacherNote - Teacher's annotation
 * @returns {Promise<object>} Updated Feedback node
 */
export async function teacherOverrideFeedback(feedbackId, teacherNote) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const result = await session.run(
      `
      MATCH (f:Feedback {id: $feedbackId})
      SET f.teacherOverride = true,
          f.teacherNote = $teacherNote,
          f.originalText = f.text,
          f.text = $teacherNote
      RETURN f
      `,
      { feedbackId, teacherNote }
    );

    return result.records[0]?.get('f')?.properties || null;
  } finally {
    await session.close();
  }
}

// ── Reading assessment data ──────────────────────────────────────────

/**
 * Get assessment results for a learner.
 *
 * @param {string} userId - Pseudonymous user ID
 * @param {number} [limit=20]
 * @param {number} [offset=0]
 * @returns {Promise<{results: object[], total: number}>}
 */
export async function getLearnerResults(userId, limit = 20, offset = 0) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Get total count
    const countResult = await session.run(
      `
      MATCH (a:Assessment {userId: $userId})
      RETURN count(a) AS total
      `,
      { userId }
    );
    const total = toNumberSafe(countResult.records[0]?.get('total'));

    // Get paginated results with weak concept analysis
    const result = await session.run(
      `
      MATCH (a:Assessment {userId: $userId})
      OPTIONAL MATCH (a)<-[:PART_OF]-(g:GradedAnswer)
      WITH a, collect(g) AS answers
      RETURN
        a.id AS assessmentId,
        a.topic AS topic,
        a.difficulty AS difficulty,
        a.createdAt AS date,
        size([g IN answers WHERE g.correct = true]) AS correctCount,
        size(answers) AS totalCount,
        [g IN answers WHERE g.correct = false | g.exerciseId] AS weakConcepts
      ORDER BY a.createdAt DESC
      SKIP $offset
      LIMIT $limit
      `,
      { userId, offset: toNumberSafe(offset), limit: toNumberSafe(limit) }
    );

    const results = result.records.map((rec) => ({
      assessmentId: rec.get('assessmentId'),
      topic: rec.get('topic'),
      difficulty: rec.get('difficulty'),
      date: rec.get('date'),
      weakConcepts: rec.get('weakConcepts') || [],
      score:
        rec.get('totalCount') > 0
          ? Math.round(
              (toNumberSafe(rec.get('correctCount')) / toNumberSafe(rec.get('totalCount'))) * 100
            )
          : 0,
      correctCount: toNumberSafe(rec.get('correctCount')),
      totalCount: toNumberSafe(rec.get('totalCount')),
    }));

    return { results, total };
  } finally {
    await session.close();
  }
}

/**
 * Get class-level assessment results for a teacher.
 *
 * @param {string} curriculumSlug - Curriculum slug (e.g., 'bw-gymnasium')
 * @returns {Promise<object>} Class average, topic breakdown, student list
 */
export async function getClassResults(curriculumSlug) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Assessments TESTS a LearningObjective, not a Topic. The curriculum
    // graph is (cur)-[:HAS_TOPIC]->(t)-[:HAS_LEARNING_OBJECTIVE]->(lo), so we
    // must route through the LO — matching (t)<-[:TESTS]-(a) would never
    // match and produced an all-empty teacher breakdown.
    const result = await session.run(
      `
      MATCH (cur:Curriculum {slug: $curriculumSlug})-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)<-[:TESTS]-(a:Assessment)
      OPTIONAL MATCH (a)<-[:PART_OF]-(g:GradedAnswer)
      WITH t, a, g
      RETURN
        t.title AS topic,
        count(DISTINCT a.userId) AS studentCount,
        count(DISTINCT a.id) AS assessmentCount,
        CASE WHEN count(g) > 0
          THEN round(avg(CASE WHEN g.correct THEN 100.0 ELSE 0.0 END))
          ELSE 0
        END AS averageScore
      ORDER BY topic
      `,
      { curriculumSlug }
    );

    const topicBreakdown = result.records.map((rec) => ({
      topic: rec.get('topic') || '(unknown)',
      averageScore: toNumberSafe(rec.get('averageScore')),
      studentCount: toNumberSafe(rec.get('studentCount')),
      assessmentCount: toNumberSafe(rec.get('assessmentCount')),
    }));

    // Calculate class-wide average
    const totalScore = topicBreakdown.reduce((sum, t) => sum + t.averageScore * t.studentCount, 0);
    const totalStudents = topicBreakdown.reduce((sum, t) => sum + t.studentCount, 0);
    const classAverage = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;

    return { classAverage, topicBreakdown };
  } finally {
    await session.close();
  }
}

/**
 * Get individual student data within a class/curriculum.
 *
 * @param {string} curriculumSlug
 * @returns {Promise<object[]>} Student list with averages
 */
export async function getStudentList(curriculumSlug) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Scope to the curriculum: only learners who attempted an objective in
    // this curriculum. The old query ignored $curriculumSlug entirely and
    // returned EVERY learner with assessment data in the whole database — a
    // privacy/scope leak for teachers of a specific class.
    const result = await session.run(
      `
      MATCH (cur:Curriculum {slug: $curriculumSlug})-[:HAS_TOPIC]->(t:Topic)
      MATCH (t)-[:HAS_LEARNING_OBJECTIVE]->(lo:LearningObjective)<-[:TESTS]-(a:Assessment)
      OPTIONAL MATCH (a)<-[:PART_OF]-(g:GradedAnswer)
      WITH DISTINCT a, g
      WITH a.userId AS userId, a, g
      RETURN
        userId,
        count(DISTINCT a.id) AS assessmentsCompleted,
        CASE WHEN count(g) > 0
          THEN round(avg(CASE WHEN g.correct THEN 100.0 ELSE 0.0 END))
          ELSE 0
        END AS averageScore
      ORDER BY averageScore DESC
      `,
      { curriculumSlug }
    );

    return result.records.map((rec) => ({
      userId: rec.get('userId'),
      averageScore: toNumberSafe(rec.get('averageScore')),
      assessmentsCompleted: toNumberSafe(rec.get('assessmentsCompleted')),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get feedback for a specific GradedAnswer.
 *
 * @param {string} gradedAnswerId
 * @returns {Promise<object|null>}
 */
export async function getFeedbackForAnswer(gradedAnswerId) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const result = await session.run(
      `
      MATCH (f:Feedback)-[:FOR]->(g:GradedAnswer {id: $gradedAnswerId})
      OPTIONAL MATCH (f)-[:REFERENCES]->(c:Concept)
      RETURN f, collect(DISTINCT c.name) AS referencedConcepts
      `,
      { gradedAnswerId }
    );

    if (result.records.length === 0) return null;

    const rec = result.records[0];
    const f = rec.get('f')?.properties;
    return { ...f, referencedConcepts: rec.get('referencedConcepts') || [] };
  } finally {
    await session.close();
  }
}

// ── Batch sync ────────────────────────────────────────────────────────

/**
 * Batch-sync offline queued assessment results to Neo4j.
 *
 * @param {Array<{assessmentId, gradedAnswers: object[], feedbacks: object[]}>} batch
 * @returns {Promise<{synced: number, errors: string[]}>}
 */
export async function batchSync(batch) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });
  let synced = 0;
  const errors = [];

  try {
    for (const item of batch) {
      try {
        const assessmentId = item.assessmentId;
        const createdAt = item.createdAt || new Date().toISOString();

        // Create/update the assessment if it doesn't exist
        await session.run(
          `
          MERGE (a:Assessment {id: $assessmentId})
          ON CREATE SET a.userId = $userId, a.topic = $topic,
                        a.difficulty = $difficulty, a.type = $type,
                        a.createdAt = $createdAt
          `,
          {
            assessmentId,
            userId: item.userId || '',
            topic: item.topic || '',
            difficulty: item.difficulty || 'leicht',
            type: item.type || 'auto-generated',
            createdAt,
          }
        );
        synced++;

        // Persist the queued graded answers (the old code only merged the
        // Assessment and silently dropped all offline answers/feedback).
        for (const ga of item.gradedAnswers || []) {
          const gaId = ga.id || uuid();
          await session.run(
            `
            MATCH (a:Assessment {id: $assessmentId})
            MERGE (g:GradedAnswer {id: $gaId})
            ON CREATE SET g.userId = $userId, g.createdAt = $gaCreatedAt
            SET g.exerciseId = $exerciseId, g.answer = $answer,
                g.correct = $correct, g.score = $score, g.gradedBy = $gradedBy
            WITH a, g
            MERGE (g)-[:PART_OF]->(a)
            `,
            {
              assessmentId,
              gaId,
              userId: item.userId || '',
              exerciseId: ga.exerciseId || '',
              answer: ga.answer || '',
              correct: !!ga.correct,
              score: toNumberSafe(ga.score),
              gradedBy: ga.gradedBy || 'deterministic',
              gaCreatedAt: ga.createdAt || createdAt,
            }
          );
          synced++;
        }

        // Persist queued feedback, linked to their graded answers.
        for (const fb of item.feedbacks || []) {
          if (!fb.gradedAnswerId) continue;
          await session.run(
            `
            MATCH (g:GradedAnswer {id: $gradedAnswerId})
            MERGE (f:Feedback {id: $fbId})
            ON CREATE SET f.createdAt = $fbCreatedAt
            SET f.text = $fbText, f.aiGenerated = $aiGenerated,
                f.teacherOverride = $teacherOverride, f.teacherNote = $teacherNote
            WITH f, g
            MERGE (f)-[:FOR]->(g)
            `,
            {
              gradedAnswerId: fb.gradedAnswerId,
              fbId: fb.id || uuid(),
              fb: fb.text || '',
              aiGenerated: fb.aiGenerated !== false,
              teacherOverride: !!fb.teacherOverride,
              teacherNote: fb.teacherNote || null,
              fbCreatedAt: fb.createdAt || new Date().toISOString(),
            }
          );
          synced++;
        }
      } catch (err) {
        errors.push(`Failed to sync item ${item.assessmentId}: ${err.message}`);
      }
    }

    return { synced, errors };
  } finally {
    await session.close();
  }
}

// ── GDPR Deletion ─────────────────────────────────────────────────────

/**
 * Delete ALL assessment data for a given user (GDPR).
 *
 * @param {string} userId - The user ID to delete
 * @returns {Promise<{deletedAssessments: number, deletedAnswers: number, deletedFeedback: number}>}
 */
export async function deleteUserAssessmentData(userId) {
  const driver = getNeo4jDriver();
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    // Delete in three independent steps so nothing leaks: the feedback-first
    // chain below would have left orphan GradedAnswer/Assessment nodes when a
    // graded answer had no Feedback (common — feedback is only written when
    // the grader produced one). Each layer is matched by its own userId then
    // DETACH DELETE on a single user's data (GDPR-accepted deletion).
    const feedbackRes = await session.run(
      `
      MATCH (f:Feedback)-[:FOR]->(g:GradedAnswer {userId: $userId})
      DETACH DELETE f
      RETURN count(f) AS deletedFeedback
      `,
      { userId }
    );
    const deletedFeedback = toNumberSafe(feedbackRes.records[0]?.get('deletedFeedback'));

    const answerRes = await session.run(
      `
      MATCH (g:GradedAnswer {userId: $userId})
      DETACH DELETE g
      RETURN count(g) AS deletedAnswers
      `,
      { userId }
    );
    const deletedAnswers = toNumberSafe(answerRes.records[0]?.get('deletedAnswers'));

    const assessmentRes = await session.run(
      `
      MATCH (a:Assessment {userId: $userId})
      DETACH DELETE a
      RETURN count(a) AS deletedAssessments
      `,
      { userId }
    );
    const deletedAssessments = toNumberSafe(assessmentRes.records[0]?.get('deletedAssessments'));

    return { deletedAssessments, deletedAnswers, deletedFeedback };
  } finally {
    await session.close();
  }
}
