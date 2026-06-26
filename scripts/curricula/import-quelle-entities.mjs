/**
 * import-quelle-entities.mjs — KG2: Import Quelle (source) entities into Neo4j.
 *
 * Reads the 5 Quelle entities defined in api/server.js getFallbackData()
 * and creates them as :Entity {kategorie: 'quelle'} nodes in Neo4j.
 *
 * Run: NEO4J_URI="bolt://localhost:7687" NEO4J_PASSWORD="..." node scripts/curricula/import-quelle-entities.mjs
 * --dry-run: preview without writing
 */

// import { readFileSync } from 'fs'; // unused — removed

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-neo4j:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';
const DRY_RUN = process.argv.includes('--dry-run');

// Quelle entities from api/server.js fallback
const QUELLEN = [
  {
    name: 'Chemie Heute (Schroedel)',
    description:
      'Standard-Lehrbuch für die gymnasiale Oberstufe Chemie. Deckt die Themen der KMK-Bildungsstandards umfassend ab.',
  },
  {
    name: 'Elemente Chemie (Klett)',
    description:
      'Lehrwerk für den Chemieunterricht der Sekundarstufe I und II. Einer der verbreitetsten Schulbuchverlage in Deutschland.',
  },
  {
    name: 'Basiswissen Chemie (Cornelsen)',
    description:
      'Fundiertes Überblickswerk zu den Grundlagen der Chemie. Enthalten sind Aufbau der Materie, Reaktionsmechanismen und Stoffklassen.',
  },
  {
    name: 'Spektrum der Wissenschaft – Verständliche Forschung',
    description:
      'Wissenschaftsjournal, das aktuelle Forschungsergebnisse aus der Chemie allgemeinverständlich aufbereitet.',
  },
  {
    name: 'Naturwissenschaften im Unterricht Chemie (Friedrich Verlag)',
    description:
      'Fachdidaktische Zeitschrift mit praxisnahen Unterrichtsvorschlägen für das Fach Chemie.',
  },
];

async function run() {
  const neo4j = await import('neo4j-driver');
  const driver = neo4j.default.driver(
    NEO4J_URI,
    neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  );

  try {
    const session = driver.session({ database: NEO4J_DATABASE });

    console.log(`[import-quelle] importing ${QUELLEN.length} Quelle entities...`);

    let created = 0;
    for (const quelle of QUELLEN) {
      if (DRY_RUN) {
        console.log(
          `  [dry-run] MERGE (:Entity {name: "${quelle.name}", kategorie: "quelle"})`,
        );
        created++;
        continue;
      }

      await session.run(
        'MERGE (e:Entity {name: $name, kategorie: $kategorie}) ' +
          'ON CREATE SET e.description = $description, e.quelle = true ' +
          'ON MATCH SET e.description = $description, e.quelle = true ' +
          'RETURN id(e)',
        {
          name: quelle.name,
          kategorie: 'quelle',
          description: quelle.description,
        },
      );
      created++;
    }

    console.log(`[import-quelle] DONE — ${created}/${QUELLEN.length} Quelle entities created/verified`);
    await session.close();
  } finally {
    await driver.close();
  }
}

run().catch((err) => {
  console.error('[import-quelle] FATAL:', err);
  process.exit(1);
});
