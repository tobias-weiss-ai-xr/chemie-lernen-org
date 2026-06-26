#!/usr/bin/env node
/**
 * kg-enrich-relations.mjs — Ersetzt generische RELATED_TO durch semantische Beziehungstypen.
 *
 * Liest bestehende RELATED_TO-Beziehungen zwischen chemie-relevanten Entity-Kategorien
 * (stoff, konzept, reaktion, methode, person, quelle) und legt neue, semantisch
 * spezifische Beziehungstypen an (siehe TYPISIERUNGS_MATRIX).
 *
 * Nutzung:  node scripts/kg-enrich-relations.mjs [--dry-run]
 * Env:      NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 */

import neo4j from 'neo4j-driver';

// ── Config ──
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Typisierungsmatrix ──
// Quelle | Ziel | Neuer Typ | Bedeutung
const TYPISIERUNGS_MATRIX = [
  ['stoff', 'stoff', 'AEHNLICH_ZU'],
  ['stoff', 'konzept', 'BEINHALTET'],
  ['stoff', 'reaktion', 'BETEILIGT_AN'],
  ['stoff', 'methode', 'WIRD_VERWENDET_IN'],
  ['konzept', 'konzept', 'VERALLGEMEINERT'],
  ['konzept', 'stoff', 'BESCHREIBT'],
  ['konzept', 'reaktion', 'BESCHREIBT'],
  ['reaktion', 'reaktion', 'VERGLEICHBAR'],
  ['reaktion', 'stoff', 'ERZEUGT'],
  ['reaktion', 'konzept', 'DEMONSTRIERT'],
  ['methode', 'stoff', 'VERWENDET'],
  ['methode', 'konzept', 'WENDET_AN'],
  ['person', 'stoff', 'ENTDECKT'],
  ['person', 'konzept', 'ENTDECKT'],
  ['person', 'reaktion', 'ENTDECKT'],
  ['quelle', 'stoff', 'QUELLE_VON'],
  ['quelle', 'konzept', 'QUELLE_VON'],
  ['quelle', 'reaktion', 'QUELLE_VON'],
  ['quelle', 'methode', 'QUELLE_VON'],
  ['quelle', 'person', 'QUELLE_VON'],
];

function getNewType(srcCat, tgtCat) {
  for (const [s, t, type] of TYPISIERUNGS_MATRIX) {
    if (s === srcCat && t === tgtCat) return type;
  }
  return null;
}

async function main() {
  console.log('[kg-enrich-relations] ' + (DRY_RUN ? 'DRY RUN' : 'LIVE') + ' — connecting to ' + NEO4J_URI);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
    connectionTimeout: 10000,
  });

  const session = driver.session({
    database: NEO4J_DATABASE,
    defaultAccessMode: DRY_RUN ? neo4j.session.READ : neo4j.session.WRITE,
    fetchSize: 1000,
  });

  try {
    // 1. Alle RELATED_TO zwischen chemie-relevanten Entities holen
    console.log('[kg-enrich-relations] Fetching RELATED_TO relationships...');
    const result = await session.run(`
      MATCH (e:Entity)-[r:RELATED_TO]->(e2:Entity)
      WHERE e.kategorie IN ['stoff','konzept','reaktion','methode','person','quelle']
        AND e2.kategorie IN ['stoff','konzept','reaktion','methode','person','quelle']
      RETURN e.name as srcName, e.kategorie as srcCat,
             e2.name as tgtName, e2.kategorie as tgtCat,
             id(r) as relId, id(e) as srcId, id(e2) as tgtId
    `);

    const rows = result.records;
    console.log('[kg-enrich-relations] Found ' + rows.length + ' RELATED_TO relationships to process');

    // 2. Typisieren
    const toCreate = [];
    const skipped = [];

    for (const rec of rows) {
      const srcCat = rec.get('srcCat');
      const tgtCat = rec.get('tgtCat');
      const srcName = rec.get('srcName');
      const tgtName = rec.get('tgtName');
      const newType = getNewType(srcCat, tgtCat);

      if (newType) {
        // Prüfen ob dieser Typ bereits existiert
        toCreate.push({
          srcId: rec.get('srcId'),
          tgtId: rec.get('tgtId'),
          srcName,
          tgtName,
          newType,
          srcCat,
          tgtCat,
        });
      } else {
        skipped.push({ srcName, srcCat, tgtName, tgtCat });
      }
    }

    console.log('[kg-enrich-relations] To create: ' + toCreate.length + ' new relationships');
    if (skipped.length > 0) {
      console.log('[kg-enrich-relations] Skipped (no matching rule): ' + skipped.length);
      for (const s of skipped.slice(0, 5)) {
        console.log('  SKIP ' + s.srcName + ' (' + s.srcCat + ') → ' + s.tgtName + ' (' + s.tgtCat + ')');
      }
    }

    if (DRY_RUN) {
      console.log('\n[kg-enrich-relations] === DRY RUN — would create: ===');
      const byType = {};
      for (const c of toCreate) {
        if (!byType[c.newType]) byType[c.newType] = 0;
        byType[c.newType]++;
      }
      for (const [type, cnt] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
        console.log('  CREATE ' + type + ': ' + cnt + ' relationships');
      }
      console.log('[kg-enrich-relations] Dry run complete. Pass without --dry-run to execute.');
    } else {
      // 3. Neue Beziehungen anlegen (MERGE vermeidet Duplikate)
      let created = 0;
      let errors = 0;

      for (const c of toCreate) {
        try {
          // Prüfen ob diese Beziehung bereits existiert
          const checkResult = await session.run(
            'MATCH (e:Entity)-[r:' + c.newType + ']->(e2:Entity) ' +
            'WHERE id(e) = $srcId AND id(e2) = $tgtId ' +
            'RETURN count(r) as cnt',
            { srcId: c.srcId, tgtId: c.tgtId }
          );
          const exists = checkResult.records[0].get('cnt').toNumber() > 0;

          if (!exists) {
            await session.run(
              'MATCH (e:Entity) WHERE id(e) = $srcId ' +
              'MATCH (e2:Entity) WHERE id(e2) = $tgtId ' +
              'CREATE (e)-[r:' + c.newType + ']->(e2)',
              { srcId: c.srcId, tgtId: c.tgtId }
            );
            created++;
          }
        } catch (err) {
          errors++;
          if (errors <= 3) {
            console.error('[kg-enrich-relations] Error creating ' + c.newType + ' ' +
              c.srcName + '→' + c.tgtName + ': ' + err.message);
          }
        }
      }

      console.log('[kg-enrich-relations] Created: ' + created + ' new relationships');
      if (errors > 0) console.log('[kg-enrich-relations] Errors: ' + errors);
    }
  } catch (err) {
    console.error('[kg-enrich-relations] ERROR: ' + err.message);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
