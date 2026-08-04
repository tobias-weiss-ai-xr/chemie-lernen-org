#!/usr/bin/env node
/**
 * Manual import for HE (Hessen) curriculum
 * HE's PDF scraper produces garbage, so we manually create
 * a proper curriculum structure based on Hessischer Bildungsplan.
 */
import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7688';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');
const STATE = 'HE';
// const SCHOOL_TYPE = 'Gymnasium';

// Hessischer Bildungsplan Chemie - Gymnasiale Oberstufe
// Based on: https://kultus.hessen.de/sites/kultus.hessen.de/files/docs/chemie-gymnasium-oberstufe-2024.pdf
const HE_CURRICULUM = {
  school_type: 'Gymnasium (Oberstufe)',
  grade_levels: [
    {
      grade: 'Einführungsphase',
      topics: [
        {
          title: 'Stoffe und ihre Eigenschaften',
          learning_objectives: [
            'Stoff-Trennverfahren anwenden',
            'Stoffeigenschaften mit Teilchenmodell erklären',
            'Chemische Reaktionen von physikalischen Vorgängen unterscheiden',
          ],
        },
        {
          title: 'Atombau und Periodensystem',
          learning_objectives: [
            'Aufbau der Atome beschreiben',
            'Periodensystem der Elemente nutzen',
            'Elementfamilien und ihre Eigenschaften erklären',
          ],
        },
        {
          title: 'Chemische Bindung',
          learning_objectives: [
            'Ionenbindung und Metallbindung erklären',
            'Elektronenpaarbindung beschreiben',
            'Stoff Eigenschaften aus Bindungsart ableiten',
          ],
        },
        {
          title: 'Stoffmengen und ihre Berechnung',
          learning_objectives: [
            'Molare Masse berechnen',
            'Stoffmenge und molares Volumen anwenden',
            'Stöchiometrische Berechnungen durchführen',
          ],
        },
        {
          title: 'Säure-Base-Reaktionen',
          learning_objectives: [
            'Säuren und Basen definieren',
            'pH-Wert erklären und berechnen',
            'Neutralisationsreaktionen beschreiben',
          ],
        },
        {
          title: 'Redoxreaktionen',
          learning_objectives: [
            'Oxidation und Reduktion unterscheiden',
            'Oxidationszahlen bestimmen',
            'Redoxgleichungen aufstellen',
          ],
        },
      ],
    },
    {
      grade: 'Qualifikationsphase Q1',
      topics: [
        {
          title: 'Organische Chemie - Kohlenwasserstoffe',
          learning_objectives: [
            'Alkane, Alkene, Alkine charakterisieren',
            'Nomenklatur organischer Verbindungen anwenden',
            'Reaktionstypen der Kohlenwasserstoffe erklären',
          ],
        },
        {
          title: 'Nonmetalle und ihre Verbindungen',
          learning_objectives: [
            'Eigenschaften und Reaktionen von Halogenen beschreiben',
            'Sauerstoffverbindungen analysieren',
            'Umweltaspekte diskutieren',
          ],
        },
        {
          title: 'Metalle und ihre Verbindungen',
          learning_objectives: [
            'Eigenschaften von Metallen erklären',
            'Metallische Bindung beschreiben',
            'Redoxreaktionen von Metallen analysieren',
          ],
        },
      ],
    },
    {
      grade: 'Qualifikationsphase Q2',
      topics: [
        {
          title: 'Aromatische Verbindungen',
          learning_objectives: [
            'Benzolstruktur und Aromatizität erklären',
            'Reaktionen des Benzols beschreiben',
            'Phenole und ihre Eigenschaften analysieren',
          ],
        },
        {
          title: 'Naturstoffe - Fette und Kohlenhydrate',
          learning_objectives: [
            'Aufbau und Struktur von Fetten erklären',
            'Seifenherstellung beschreiben',
            'Monosaccharide, Disaccharide, Polysaccharide unterscheiden',
          ],
        },
        {
          title: 'Kunststoffe',
          learning_objectives: [
            'Polymerisation, Polykondensation, Polyaddition unterscheiden',
            'Struktur und Eigenschaften von Kunststoffen analysieren',
            'Nachhaltigkeit und Recycling diskutieren',
          ],
        },
      ],
    },
    {
      grade: 'Qualifikationsphase Q3/Q4',
      topics: [
        {
          title: 'Chemisches Gleichgewicht',
          learning_objectives: [
            'Massenwirkungsgesetz anwenden',
            'Gleichgewichtsverschiebung nach Le Chatelier erklären',
            'Gleichgewichtskonstanten berechnen',
          ],
        },
        {
          title: 'Säure-Base-Gleichgewichte',
          learning_objectives: [
            'pH-Wert von Säure-Base-Lösungen berechnen',
            'Pufferlösungen erklären',
            'Titrationskurven interpretieren',
          ],
        },
        {
          title: 'Elektrochemie',
          learning_objectives: [
            'Galvanische Zellen erklären',
            'Standardpotentiale anwenden',
            'Elektrolyse beschrieben',
            'Batterien und Akkumulatoren analysieren',
          ],
        },
        {
          title: 'Energie und chemische Reaktionen',
          learning_objectives: [
            'Reaktionsenthalpien berechnen',
            'Energiediagramme interpretieren',
            'Hess\'scher Satz anwenden',
          ],
        },
      ],
    },
  ],
};

// Slugify function (same as import script)
function slugify(text, prefix = '') {
  return (prefix + text)
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 255);
}

function generateWorkflowId() {
  return Math.random().toString(36).substring(2, 15);
}

async function main() {
  console.log('=== Manual HE curriculum import ===');
  console.log('DRY_RUN:', DRY_RUN);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });

  try {
    const workflowId = generateWorkflowId();
    console.log(`Workflow ID: ${workflowId}`);

    // Delete existing HE curriculum (if any orphans remain)
    await session.run(
      `MATCH (c:Curriculum {slug: $slug})
       DETACH DELETE c
       RETURN count(*) as deleted`,
      { slug: `${STATE}-${slugify(HE_CURRICULUM.school_type)}` }
    );

    // Create Curriculum node
    const currSlug = `${STATE}-${slugify(HE_CURRICULUM.school_type)}`;
    await session.run(
      `MERGE (c:Curriculum {
        slug: $slug,
        state: $state,
        stateAbbr: $stateAbbr,
        schoolType: $schoolType,
        title: $title,
        workflowId: $workflowId
      })
      RETURN c.slug as slug`,
      {
        slug: currSlug,
        state: 'Hessen',
        stateAbbr: STATE,
        schoolType: HE_CURRICULUM.school_type,
        title: `Kerncurriculum Chemie - ${HE_CURRICULUM.school_type}`,
        workflowId,
      }
    );
    console.log(`Created Curriculum: ${currSlug}`);

    // Create SubTopics and LearningObjectives
    let subTopicCount = 0;
    let loCount = 0;

    for (const gl of HE_CURRICULUM.grade_levels) {
      for (const topic of gl.topics) {
        const stSlug = `${STATE}-${slugify(HE_CURRICULUM.school_type)}-${slugify(gl.grade)}-${slugify(topic.title)}-topic`;

        // Create SubTopic
        await session.run(
          `MERGE (st:SubTopic {
            slug: $stSlug,
            title: $title,
            grade: $grade,
            curriculumSlug: $currSlug,
            workflowId: $workflowId
          })
          RETURN st.slug as slug`,
          {
            stSlug,
            title: topic.title,
            grade: gl.grade,
            currSlug,
            workflowId,
          }
        );

        // Link Curriculum -> SubTopic
        await session.run(
          `MATCH (c:Curriculum {slug: $currSlug})
           MATCH (st:SubTopic {slug: $stSlug})
           MERGE (c)-[:HAS_SUBTOPIC]->(st)
           RETURN count(*) as linked`,
          { currSlug, stSlug }
        );

        // Create LearningObjectives
        for (const loText of topic.learning_objectives) {
          const loSlug = `${STATE}-${slugify(HE_CURRICULUM.school_type)}-${slugify(loText)}-lo`;

          await session.run(
            `MERGE (lo:LearningObjective {
              slug: $loSlug,
              text: $text,
              subtopicSlug: $stSlug,
              curriculumSlug: $currSlug,
              workflowId: $workflowId
            })
            RETURN lo.slug as slug`,
            { loSlug, text: loText, stSlug, currSlug, workflowId }
          );

          // Link SubTopic -> LearningObjective
          await session.run(
            `MATCH (st:SubTopic {slug: $stSlug})
             MATCH (lo:LearningObjective {slug: $loSlug})
             MERGE (st)-[:FULFILLS]->(lo)
             RETURN count(*) as linked`,
            { stSlug, loSlug }
          );
          loCount++;
        }
        subTopicCount++;
      }
    }

    console.log(`Created ${subTopicCount} SubTopics, ${loCount} LearningObjectives`);
    console.log('Done!');

  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);
