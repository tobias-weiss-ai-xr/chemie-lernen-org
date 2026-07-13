#!/usr/bin/env node
/**
 * neo4j-migrate-curriculum.mjs — Seed a sample Mittelstufe-Chemie curriculum
 * into the Neo4j knowledge graph.
 *
 * Creates:
 *   - :Curriculum {slug, title, grade, description}
 *   - :Topic      {slug, title, order} — linked via :HAS_TOPIC
 *   - :SubTopic   {slug, title, order} — linked via :HAS_SUBTOPIC
 *   - :LearningObjective {slug, description, bloomLevel, estimatedMinutes}
 *                    — linked via :HAS_OBJECTIVE
 *   - :PREREQUISITE links between objectives (intra- & cross-topic)
 *   - :COVERED_BY links from objectives to existing :Content nodes
 *
 * Safety: MERGE-only, no DETACH DELETE, no mass updates.
 * Idempotent: running multiple times produces the same graph.
 *
 * Usage:
 *   node scripts/neo4j-migrate-curriculum.mjs
 *   node scripts/neo4j-migrate-curriculum.mjs --dry-run
 *   node scripts/neo4j-migrate-curriculum.mjs --force
 *
 * Environment:
 *   NEO4J_URI      (default: bolt://chemie-neo4j:7687)
 *   NEO4J_USER     (default: neo4j)
 *   NEO4J_PASSWORD (default: chemie_knowledge_2024)
 *   NEO4J_DATABASE (default: chemie)
 */

import neo4j from 'neo4j-driver';
import { createInterface } from 'node:readline';

// ── Configuration ─────────────────────────────────────────────────────

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

// ── Curriculum data ────────────────────────────────────────────────────
// Structured: curriculum → topics → subTopics → learningObjectives

const CURRICULUM = {
  slug: 'mittelstufe-chemie',
  title: 'Mittelstufe Chemie',
  grade: 8,
  description: 'Grundlegende Chemie für die Klassen 8-10',
  topics: [
    {
      slug: 'stoffgemische',
      title: 'Stoffgemische',
      order: 1,
      subTopics: [
        {
          slug: 'trennverfahren',
          title: 'Trennverfahren',
          order: 1,
          objectives: [
            {
              slug: 'trennverfahren-kennen',
              description:
                'Die Schüler kennen grundlegende Trennverfahren (Filtration, Destillation, Chromatographie)',
              bloomLevel: 'remember',
              estimatedMinutes: 15,
              contentUrl: '/themenbereiche/stoffgemische/trennverfahren/',
            },
            {
              slug: 'trennverfahren-anwenden',
              description:
                'Die Schüler können Trennverfahren für gegebene Stoffgemische auswählen und begründen',
              bloomLevel: 'apply',
              estimatedMinutes: 20,
              contentUrl: '/themenbereiche/stoffgemische/trennverfahren/',
              prerequisites: ['trennverfahren-kennen'],
            },
          ],
        },
        {
          slug: 'gemischarten',
          title: 'Gemischarten',
          order: 2,
          objectives: [
            {
              slug: 'gemischarten-unterscheiden',
              description:
                'Die Schüler können homogene und heterogene Gemische unterscheiden',
              bloomLevel: 'understand',
              estimatedMinutes: 10,
              contentUrl: '/themenbereiche/stoffgemische/gemischarten/',
            },
            {
              slug: 'reinstoff-erkennen',
              description:
                'Die Schüler können Reinstoffe von Gemischen unterscheiden',
              bloomLevel: 'remember',
              estimatedMinutes: 10,
              contentUrl: '/themenbereiche/stoffgemische/',
            },
          ],
        },
      ],
    },
    {
      slug: 'atome-molekuele',
      title: 'Atome & Moleküle',
      order: 2,
      subTopics: [
        {
          slug: 'atombau',
          title: 'Atombau',
          order: 1,
          objectives: [
            {
              slug: 'atombau-grundlagen',
              description:
                'Die Schüler kennen den Aufbau eines Atoms (Kern, Hülle, Protonen, Neutronen, Elektronen)',
              bloomLevel: 'remember',
              estimatedMinutes: 15,
              contentUrl: '/themenbereiche/atombau/',
            },
            {
              slug: 'atommodelle-vergleichen',
              description:
                'Die Schüler können verschiedene Atommodelle (Dalton, Rutherford, Bohr) vergleichen',
              bloomLevel: 'understand',
              estimatedMinutes: 20,
              contentUrl: '/themenbereiche/atombau/atommodelle/',
              prerequisites: ['atombau-grundlagen'],
            },
          ],
        },
        {
          slug: 'molekuele',
          title: 'Moleküle',
          order: 2,
          objectives: [
            {
              slug: 'molekuelbildung-verstehen',
              description:
                'Die Schüler verstehen, wie Atome durch chemische Bindungen Moleküle bilden',
              bloomLevel: 'understand',
              estimatedMinutes: 15,
              contentUrl: '/themenbereiche/molekuele/',
            },
            {
              slug: 'molekuelformeln-ablesen',
              description:
                'Die Schüler können Summenformeln lesen und die Anzahl der Atome bestimmen',
              bloomLevel: 'apply',
              estimatedMinutes: 20,
              contentUrl: '/themenbereiche/molekuele/molekuelformeln/',
              prerequisites: ['molekuelbildung-verstehen'],
            },
          ],
        },
        {
          slug: 'chemische-bindungen',
          title: 'Chemische Bindungen',
          order: 3,
          objectives: [
            {
              slug: 'bindungsarten-unterscheiden',
              description:
                'Die Schüler können Ionenbindung, Elektronenpaarbindung und Metallbindung unterscheiden',
              bloomLevel: 'understand',
              estimatedMinutes: 20,
              contentUrl: '/themenbereiche/chemische-bindungen/',
            },
            {
              slug: 'bindungen-eigenschaften-erklaeren',
              description:
                'Die Schüler können Stoffeigenschaften aus der Bindungsart erklären',
              bloomLevel: 'analyze',
              estimatedMinutes: 25,
              contentUrl: '/themenbereiche/chemische-bindungen/eigenschaften/',
              prerequisites: ['bindungsarten-unterscheiden'],
            },
          ],
        },
      ],
    },
    {
      slug: 'chemische-reaktionen',
      title: 'Chemische Reaktionen',
      order: 3,
      subTopics: [
        {
          slug: 'reaktionsgleichungen',
          title: 'Reaktionsgleichungen',
          order: 1,
          objectives: [
            {
              slug: 'reaktionsgleichungen-aufstellen',
              description:
                'Die Schüler können aus Wortgleichungen Reaktionsgleichungen mit Formeln aufstellen',
              bloomLevel: 'apply',
              estimatedMinutes: 25,
              contentUrl: '/themenbereiche/chemische-reaktionen/reaktionsgleichungen/',
              // Cross-topic prerequisite: needs molecule formulas
              prerequisites: ['molekuelformeln-ablesen'],
            },
            {
              slug: 'reaktionsgleichungen-ausgleichen',
              description:
                'Die Schüler können Reaktionsgleichungen durch Koeffizienten ausgleichen',
              bloomLevel: 'apply',
              estimatedMinutes: 20,
              contentUrl: '/themenbereiche/chemische-reaktionen/reaktionsgleichungen/ausgleichen/',
              prerequisites: ['reaktionsgleichungen-aufstellen'],
            },
          ],
        },
        {
          slug: 'energie',
          title: 'Energie bei Reaktionen',
          order: 2,
          objectives: [
            {
              slug: 'energieformen-erkennen',
              description:
                'Die Schüler können verschiedene Energieformen bei chemischen Reaktionen benennen',
              bloomLevel: 'remember',
              estimatedMinutes: 10,
              contentUrl: '/themenbereiche/chemische-reaktionen/energie/',
            },
            {
              slug: 'exotherm-endotherm-unterscheiden',
              description:
                'Die Schüler können exotherme und endotherme Reaktionen unterscheiden',
              bloomLevel: 'understand',
              estimatedMinutes: 15,
              contentUrl: '/themenbereiche/chemische-reaktionen/energie/exotherm-endotherm/',
              prerequisites: ['energieformen-erkennen'],
            },
          ],
        },
      ],
    },
    {
      slug: 'saeuren-laugen',
      title: 'Säuren & Laugen',
      order: 4,
      subTopics: [
        {
          slug: 'ph-wert',
          title: 'pH-Wert',
          order: 1,
          objectives: [
            {
              slug: 'ph-wert-definition',
              description:
                'Die Schüler kennen die Definition des pH-Werts und die pH-Skala von 0 bis 14',
              bloomLevel: 'remember',
              estimatedMinutes: 10,
              contentUrl: '/themenbereiche/saeuren-laugen/ph-wert/',
            },
            {
              slug: 'ph-wert-messen',
              description:
                'Die Schüler können den pH-Wert von Lösungen mit Indikatoren und pH-Meter messen',
              bloomLevel: 'apply',
              estimatedMinutes: 20,
              contentUrl: '/themenbereiche/saeuren-laugen/ph-wert/messen/',
              prerequisites: ['ph-wert-definition'],
            },
          ],
        },
        {
          slug: 'neutralisation',
          title: 'Neutralisation',
          order: 2,
          objectives: [
            {
              slug: 'neutralisation-erklaeren',
              description:
                'Die Schüler können das Prinzip der Neutralisation von Säuren mit Laugen erklären',
              bloomLevel: 'understand',
              estimatedMinutes: 15,
              contentUrl: '/themenbereiche/saeuren-laugen/neutralisation/',
            },
            {
              slug: 'neutralisation-berechnen',
              description:
                'Die Schüler können Stoffmengen bei der Neutralisation berechnen',
              bloomLevel: 'apply',
              estimatedMinutes: 25,
              contentUrl: '/themenbereiche/saeuren-laugen/neutralisation/berechnen/',
              prerequisites: ['neutralisation-erklaeren', 'ph-wert-messen'],
            },
          ],
        },
        {
          slug: 'indikatoren',
          title: 'Indikatoren',
          order: 3,
          objectives: [
            {
              slug: 'indikatoren-kennen',
              description:
                'Die Schüler kennen wichtige Indikatoren (Lackmus, Universalindikator, Phenolphthalein)',
              bloomLevel: 'remember',
              estimatedMinutes: 10,
              contentUrl: '/themenbereiche/saeuren-laugen/indikatoren/',
            },
            {
              slug: 'indikatoren-anwenden',
              description:
                'Die Schüler können Indikatoren zur Unterscheidung saurer, basischer und neutraler Lösungen einsetzen',
              bloomLevel: 'apply',
              estimatedMinutes: 15,
              contentUrl: '/themenbereiche/saeuren-laugen/indikatoren/anwendung/',
              prerequisites: ['indikatoren-kennen'],
            },
          ],
        },
      ],
    },
  ],
};

// ── Dry-run output ─────────────────────────────────────────────────────

function dryRunLog() {
  console.log('=== DRY RUN ===\n');
  console.log(`:Curriculum {slug: '${CURRICULUM.slug}'} — ${CURRICULUM.title} (Grade ${CURRICULUM.grade})\n`);

  let topicCount = 0;
  let subTopicCount = 0;
  let loCount = 0;

  for (const topic of CURRICULUM.topics) {
    console.log(`  :Topic {slug: '${topic.slug}'} — ${topic.title} (order: ${topic.order})`);
    topicCount++;

    for (const sub of topic.subTopics) {
      console.log(`    :SubTopic {slug: '${sub.slug}'} — ${sub.title} (order: ${sub.order})`);
      subTopicCount++;

      for (const lo of sub.objectives) {
        console.log(`      :LearningObjective {slug: '${lo.slug}'} — ${lo.bloomLevel} | ${lo.estimatedMinutes}min`);
        if (lo.prerequisites && lo.prerequisites.length > 0) {
          console.log(`        → PREREQUISITE: ${lo.prerequisites.join(', ')}`);
        }
        console.log(`        → COVERED_BY: ${lo.contentUrl}`);
        loCount++;
      }
    }
  }

  console.log(`\nSummary: 1 :Curriculum, ${topicCount} :Topic, ${subTopicCount} :SubTopic, ${loCount} :LearningObjective`);
  console.log('(no Neo4j connection needed)\n');
}

// ── Migration queries ─────────────────────────────────────────────────

async function runCurriculumMigrations(session) {
  console.log('[migrate] Creating curriculum and topic structure...\n');

  // ── Create :Curriculum ────────────────────────────────────────────────
  await session.run(
    `MERGE (c:Curriculum {slug: $slug})
     SET c.title = $title, c.grade = $grade, c.description = $description
     RETURN c.slug AS slug`,
    {
      slug: CURRICULUM.slug,
      title: CURRICULUM.title,
      grade: CURRICULUM.grade,
      description: CURRICULUM.description,
    }
  );
  console.log(`  ✓ :Curriculum {slug: '${CURRICULUM.slug}'}`);

  for (const topic of CURRICULUM.topics) {
    // ── Create :Topic ──────────────────────────────────────────────────────
    await session.run(
      `MATCH (c:Curriculum {slug: $cSlug})
       MERGE (t:Topic {slug: $tSlug})
       SET t.title = $title, t.order = $order
       MERGE (c)-[:HAS_TOPIC]->(t)
       RETURN t.slug AS slug`,
      {
        cSlug: CURRICULUM.slug,
        tSlug: topic.slug,
        title: topic.title,
        order: topic.order,
      }
    );
    console.log(`  ✓ :Topic {slug: '${topic.slug}'} — ${topic.title}`);

    for (const sub of topic.subTopics) {
      // ── Create :SubTopic ──────────────────────────────────────────────────
      await session.run(
        `MATCH (t:Topic {slug: $tSlug})
         MERGE (st:SubTopic {slug: $stSlug})
         SET st.title = $title, st.order = $order
         MERGE (t)-[:HAS_SUBTOPIC]->(st)
         RETURN st.slug AS slug`,
        {
          tSlug: topic.slug,
          stSlug: sub.slug,
          title: sub.title,
          order: sub.order,
        }
      );
      console.log(`    ✓ :SubTopic {slug: '${sub.slug}'} — ${sub.title}`);

      for (const lo of sub.objectives) {
        // ── Create :LearningObjective ────────────────────────────────────────
        await session.run(
          `MATCH (st:SubTopic {slug: $stSlug})
           MERGE (lo:LearningObjective {slug: $loSlug})
           SET lo.description = $description,
               lo.bloomLevel = $bloomLevel,
               lo.estimatedMinutes = $estimatedMinutes
           MERGE (st)-[:HAS_OBJECTIVE]->(lo)
           RETURN lo.slug AS slug`,
          {
            stSlug: sub.slug,
            loSlug: lo.slug,
            description: lo.description,
            bloomLevel: lo.bloomLevel,
            estimatedMinutes: lo.estimatedMinutes,
          }
        );
        console.log(`      ✓ :LearningObjective {slug: '${lo.slug}'}`);

        // ── COVERED_BY → :Content ────────────────────────────────────────────
        await session.run(
          `MATCH (lo:LearningObjective {slug: $loSlug})
           MERGE (c:Content {url: $contentUrl})
           MERGE (lo)-[:COVERED_BY]->(c)`,
          {
            loSlug: lo.slug,
            contentUrl: lo.contentUrl,
          }
        );
        console.log(`        ✓ COVERED_BY → ${lo.contentUrl}`);

        // ── PREREQUISITE links ──────────────────────────────────────────────
        if (lo.prerequisites && lo.prerequisites.length > 0) {
          for (const prereqSlug of lo.prerequisites) {
            await session.run(
              `MATCH (lo:LearningObjective {slug: $loSlug})
               MATCH (prereq:LearningObjective {slug: $prereqSlug})
               MERGE (lo)-[:PREREQUISITE]->(prereq)`,
              {
                loSlug: lo.slug,
                prereqSlug: prereqSlug,
              }
            );
            console.log(`        ✓ PREREQUISITE → ${prereqSlug}`);
          }
        }
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const counts = await session.run(
    `MATCH (c:Curriculum {slug: $slug})
     OPTIONAL MATCH (c)-[:HAS_TOPIC]->(:Topic)-[:HAS_SUBTOPIC]->(:SubTopic)-[:HAS_OBJECTIVE]->(lo:LearningObjective)
     RETURN count(DISTINCT lo) AS objectiveCount`,
    { slug: CURRICULUM.slug }
  );

  const objCount = counts.records[0].get('objectiveCount').toNumber();
  console.log(`\n[migrate] Done. ${objCount} learning objectives created for curriculum "${CURRICULUM.slug}".`);
}

// ── Confirmation prompt ────────────────────────────────────────────────

function askConfirmation() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      `This will create/update curriculum nodes in Neo4j at ${NEO4J_URI}. Continue? [y/N] `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('=== neo4j-migrate-curriculum.mjs ===');
  console.log(`NEO4J_URI:       ${NEO4J_URI}`);
  console.log(`NEO4J_DATABASE:  ${NEO4J_DATABASE}`);
  console.log(`DRY_RUN:         ${DRY_RUN}`);
  console.log(`FORCE:           ${FORCE}`);
  console.log();

  if (DRY_RUN) {
    dryRunLog();
    return;
  }

  if (!FORCE) {
    const ok = await askConfirmation();
    if (!ok) {
      console.log('[migrate] Aborted by user.');
      process.exit(0);
    }
    console.log();
  }

  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
      connectionTimeout: 30000,
      maxConnectionLifetime: 300000,
    }
  );

  try {
    const session = driver.session({ database: NEO4J_DATABASE });
    try {
      await runCurriculumMigrations(session);
    } finally {
      await session.close();
    }
  } catch (err) {
    console.error('[migrate] Error:', err.message);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main().catch((err) => {
  console.error('[migrate] Fatal:', err);
  process.exit(1);
});
