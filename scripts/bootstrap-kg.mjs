#!/usr/bin/env node
/**
 * Bootstrap the chemistry Knowledge Graph.
 * 1. Categorizes existing entities + creates RELATED_TO from article co-occurrence
 * 2. Seeds fundamental chemistry knowledge: elements, compounds, reaction types, concepts
 *
 * Neo4j driver lifecycle managed by @graphwiz/neo4j.
 */
import { getDriver, closeDriver } from '@graphwiz/neo4j';

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASS = process.env.NEO4J_PASSWORD || 'chemie';

const config = { uri: URI, username: USER, password: PASS, database: 'chemie' };

async function run() {
  const d = getDriver(config);
  const session = d.session({ database: config.database });

  console.log('=== Phase 1: Categorize existing entities ===');

  const categoryRules = [
    { cat: 'stoff', keywords: ['wasserstoff','sauerstoff','stickstoff','kohlenstoff','silizium','eisen','kupfer','platin','ammoniak','methan','ethen','propan','butan','ethanol','propanol','glycerin','glucose','saccharose','harnstoff','benzol','toluol','oxid','chlorid','nitrat','sulfat','phosphat','carbonat','cobaltferrit','kohlenstoffnitrid','kupferoxid','perowskit','metallcluster','metallionen','katalysator','bioethanol','fluorchlorkohlenwasserstoffe'] },
    { cat: 'methode', keywords: ['hdx-ms','spektroskopie','chromatographie','elektrophorese','titration','kalorimetrie','diffraktion','mikroskopie','massenspektrometrie','nmr'] },
    { cat: 'person', keywords: ['universität','institut','forscher','wissenschaftler','labor','prof','center','university','college','school'] },
    { cat: 'reaktion', keywords: ['katalyse','oxidation','reduktion','substitution','addition','eliminierung','synthese','umwandlung','elektrolyse','verbrennung','polymerisation','neutralisation'] },
    { cat: 'konzept', keywords: ['allosterie','biosensoren','datenspeicherung','elektrokatalyse','hydrathülle','kristallstruktur','ligandenempfindlichkeit','luftstabilität','magnetfeld','magnetische ordnung','bioinformatik','thermodynamik','kinetik','gleichgewicht','enthalpie','entropie','aktivierungsenergie','ph-wert','puffer'] }
  ];

  for (const rule of categoryRules) {
    const { cat, keywords } = rule;
    if (!keywords || keywords.length === 0) continue;
    const result = await session.run(
      'MATCH (e:Entity) WHERE toLower(e.name) IN $words AND e.kategorie IS NULL SET e.kategorie = $cat RETURN count(e) AS updated',
      { words: keywords.map(w => w.toLowerCase()), cat }
    );
    const count = result.records[0].get('updated').toNumber();
    if (count > 0) console.log(`  ${cat}: ${count} entities`);
  }

  // Default remaining uncategorized to 'konzept'
  const defResult = await session.run(
    "MATCH (e:Entity) WHERE e.kategorie IS NULL SET e.kategorie = 'konzept' RETURN count(e) AS updated"
  );
  console.log(`  konzept (default): ${defResult.records[0].get('updated').toNumber()} entities`);

  // Verify categories set
  const catCheck = await session.run(
    'MATCH (e:Entity) WHERE e.kategorie IS NULL RETURN count(e) AS uncategorized'
  );
  console.log(`  Remaining uncategorized: ${catCheck.records[0].get('uncategorized').toNumber()}`);

  console.log('\n=== Phase 2: Create RELATED_TO from article co-occurrence ===');
  const relResult = await session.run(`
    MATCH (e1:Entity)<-[:MENTIONS]-(d:Document)-[:MENTIONS]->(e2:Entity)
    WHERE id(e1) < id(e2)
    WITH e1, e2, count(d) AS weight
    MERGE (e1)-[r:RELATED_TO]-(e2)
    SET r.weight = weight
    RETURN count(r) AS created
  `);
  console.log(`  Created ${relResult.records[0].get('created').toNumber()} RELATED_TO relationships`);

  console.log('\n=== Phase 3: Seed fundamental chemistry knowledge ===');

  // Chemical elements (important ones)
  const elements = [
    { name: 'wasserstoff', symbol: 'H', ordnung: 1, kategorie: 'stoff' },
    { name: 'helium', symbol: 'He', ordnung: 2, kategorie: 'stoff' },
    { name: 'kohlenstoff', symbol: 'C', ordnung: 6, kategorie: 'stoff' },
    { name: 'stickstoff', symbol: 'N', ordnung: 7, kategorie: 'stoff' },
    { name: 'sauerstoff', symbol: 'O', ordnung: 8, kategorie: 'stoff' },
    { name: 'natrium', symbol: 'Na', ordnung: 11, kategorie: 'stoff' },
    { name: 'magnesium', symbol: 'Mg', ordnung: 12, kategorie: 'stoff' },
    { name: 'aluminium', symbol: 'Al', ordnung: 13, kategorie: 'stoff' },
    { name: 'silizium', symbol: 'Si', ordnung: 14, kategorie: 'stoff' },
    { name: 'phosphor', symbol: 'P', ordnung: 15, kategorie: 'stoff' },
    { name: 'schwefel', symbol: 'S', ordnung: 16, kategorie: 'stoff' },
    { name: 'chlor', symbol: 'Cl', ordnung: 17, kategorie: 'stoff' },
    { name: 'kalium', symbol: 'K', ordnung: 19, kategorie: 'stoff' },
    { name: 'calcium', symbol: 'Ca', ordnung: 20, kategorie: 'stoff' },
    { name: 'eisen', symbol: 'Fe', ordnung: 26, kategorie: 'stoff' },
    { name: 'kupfer', symbol: 'Cu', ordnung: 29, kategorie: 'stoff' },
    { name: 'zink', symbol: 'Zn', ordnung: 30, kategorie: 'stoff' },
    { name: 'platin', symbol: 'Pt', ordnung: 78, kategorie: 'stoff' },
    { name: 'gold', symbol: 'Au', ordnung: 79, kategorie: 'stoff' },
    { name: 'silber', symbol: 'Ag', ordnung: 47, kategorie: 'stoff' },
  ];

  // Important chemical compounds
  const compounds = [
    { name: 'wasser', formel: 'H2O', kategorie: 'stoff', elements: ['wasserstoff','sauerstoff'] },
    { name: 'kohlenstoffdioxid', formel: 'CO2', kategorie: 'stoff', elements: ['kohlenstoff','sauerstoff'] },
    { name: 'methan', formel: 'CH4', kategorie: 'stoff', elements: ['kohlenstoff','wasserstoff'] },
    { name: 'natriumchlorid', formel: 'NaCl', kategorie: 'stoff', elements: ['natrium','chlor'] },
    { name: 'schwefelsäure', formel: 'H2SO4', kategorie: 'stoff', elements: ['wasserstoff','schwefel','sauerstoff'] },
    { name: 'salzsäure', formel: 'HCl', kategorie: 'stoff', elements: ['wasserstoff','chlor'] },
    { name: 'natronlauge', formel: 'NaOH', kategorie: 'stoff', elements: ['natrium','sauerstoff','wasserstoff'] },
    { name: 'ammoniak', formel: 'NH3', kategorie: 'stoff', elements: ['stickstoff','wasserstoff'] },
    { name: 'ethanol', formel: 'C2H5OH', kategorie: 'stoff', elements: ['kohlenstoff','wasserstoff','sauerstoff'] },
    { name: 'glucose', formel: 'C6H12O6', kategorie: 'stoff', elements: ['kohlenstoff','wasserstoff','sauerstoff'] },
    { name: 'calciumcarbonat', formel: 'CaCO3', kategorie: 'stoff', elements: ['calcium','kohlenstoff','sauerstoff'] },
  ];

  // Reaction types
  const reactionTypes = [
    { name: 'säure-base-reaktion', kategorie: 'reaktion' },
    { name: 'redoxreaktion', kategorie: 'reaktion' },
    { name: 'verbrennung', kategorie: 'reaktion' },
    { name: 'polymerisation', kategorie: 'reaktion' },
    { name: 'neutralisation', kategorie: 'reaktion' },
    { name: 'elektrolyse', kategorie: 'reaktion' },
    { name: 'fällungsreaktion', kategorie: 'reaktion' },
  ];

  // Core concepts
  const concepts = [
    { name: 'periodensystem', kategorie: 'konzept' },
    { name: 'molare masse', kategorie: 'konzept' },
    { name: 'stoffmenge', kategorie: 'konzept' },
    { name: 'konzentration', kategorie: 'konzept' },
    { name: 'ph-wert', kategorie: 'konzept' },
    { name: 'chemisches gleichgewicht', kategorie: 'konzept' },
    { name: 'thermodynamik', kategorie: 'konzept' },
    { name: 'enthalpie', kategorie: 'konzept' },
    { name: 'entropie', kategorie: 'konzept' },
    { name: 'aktivierungsenergie', kategorie: 'konzept' },
    { name: 'katalyse', kategorie: 'konzept' },
    { name: 'oxidation', kategorie: 'konzept' },
    { name: 'reduktion', kategorie: 'konzept' },
    { name: 'pufferlösung', kategorie: 'konzept' },
    { name: 'stöchiometrie', kategorie: 'konzept' },
    { name: 'orbital', kategorie: 'konzept' },
    { name: 'ion', kategorie: 'konzept' },
    { name: 'isotop', kategorie: 'konzept' },
    { name: 'molekül', kategorie: 'konzept' },
    { name: 'kovalente bindung', kategorie: 'konzept' },
    { name: 'ionenbindung', kategorie: 'konzept' },
    { name: 'metallbindung', kategorie: 'konzept' },
    { name: 'vsepr-theorie', kategorie: 'konzept' },
  ];

  // Merge all entities
  const allEntities = [...elements, ...compounds, ...reactionTypes, ...concepts];
  let entityCount = 0;
  for (const ent of allEntities) {
    try {
      await session.run(
        'MERGE (e:Entity {name: toLower($name)}) ON CREATE SET e.kategorie = $kategorie, e.seeded = true RETURN e.name',
        { name: ent.name, kategorie: ent.kategorie }
      );
      entityCount++;
    } catch { /* skip duplicates */ }
  }
  console.log(`  Seeded ${entityCount} new entities`);

  console.log('\n=== Phase 4: Create domain knowledge relationships ===');

  // Compound → element relationships (BESTEHT_AUS)
  for (const cpd of compounds) {
    if (!cpd.elements) continue;
    for (const el of cpd.elements) {
      try {
        await session.run(
          `MATCH (cpd:Entity {name: toLower($cpdName)})
           MATCH (el:Entity {name: toLower($elName)})
           MERGE (cpd)-[:BESTEHT_AUS]->(el)`,
          { cpdName: cpd.name, elName: el }
        );
      } catch { /* skip */ }
    }
  }

  // Reaction type → concept relationships
  const reactionConceptLinks = [
    ['redoxreaktion', 'oxidation'],
    ['redoxreaktion', 'reduktion'],
    ['neutralisation', 'säure-base-reaktion'],
    ['neutralisation', 'ph-wert'],
    ['verbrennung', 'oxidation'],
    ['elektrolyse', 'redoxreaktion'],
    ['polymerisation', 'molekül'],
    ['säure-base-reaktion', 'ph-wert'],
    ['chemisches gleichgewicht', 'thermodynamik'],
    ['enthalpie', 'thermodynamik'],
    ['entropie', 'thermodynamik'],
    ['aktivierungsenergie', 'katalyse'],
    ['stöchiometrie', 'molare masse'],
    ['stöchiometrie', 'stoffmenge'],
    ['konzentration', 'molare masse'],
    ['ph-wert', 'säure-base-reaktion'],
    ['pufferlösung', 'ph-wert'],
    ['pufferlösung', 'chemisches gleichgewicht'],
    ['orbital', 'vsepr-theorie'],
    ['kovalente bindung', 'molekül'],
    ['ionenbindung', 'ion'],
    ['metallbindung', 'ion'],
  ];

  for (const [from, to] of reactionConceptLinks) {
    try {
      await session.run(
        `MATCH (a:Entity {name: toLower($from)})
         MATCH (b:Entity {name: toLower($to)})
         MERGE (a)-[:RELATED_TO {weight: 3}]-(b)`,
        { from, to }
      );
    } catch { /* skip if one entity doesn't exist */ }
  }

  // Periodic trends: element groups
  const groups = [
    ['edelgase', ['helium']],
    ['halogene', ['chlor']],
    ['alkalimetalle', ['natrium', 'kalium']],
    ['erdalkalimetalle', ['magnesium', 'calcium']],
    ['übergangsmetalle', ['eisen', 'kupfer', 'zink', 'platin', 'gold', 'silber']],
  ];

  for (const [groupName, members] of groups) {
    // Create group entity if not exists
    await session.run(
      "MERGE (g:Entity {name: toLower($name)}) ON CREATE SET g.kategorie = 'konzept', g.seeded = true",
      { name: groupName }
    );
    for (const member of members) {
      try {
        await session.run(
          `MATCH (g:Entity {name: toLower($group)})
           MATCH (e:Entity {name: toLower($member)})
           MERGE (e)-[:GEHOERT_ZU]->(g)`,
          { group: groupName, member }
        );
      } catch { /* skip */ }
    }
  }

  // Final count
  const finalDoc = await session.run('MATCH (d:Document) RETURN count(d) AS c');
  const finalEnt = await session.run('MATCH (e:Entity) RETURN count(e) AS c');
  const finalRel = await session.run('MATCH ()-[r]->() RETURN count(r) AS c');
  const finalRelTo = await session.run('MATCH ()-[r:RELATED_TO]-() RETURN count(r) AS c');
  const finalBestAus = await session.run('MATCH ()-[r:BESTEHT_AUS]->() RETURN count(r) AS c');

  console.log('\n=== Final Knowledge Graph State ===');
  console.log(`  Documents:     ${finalDoc.records[0].get('c').toNumber()}`);
  console.log(`  Entities:      ${finalEnt.records[0].get('c').toNumber()}`);
  console.log(`  Relations:     ${finalRel.records[0].get('c').toNumber()}`);
  console.log(`  ├── RELATED_TO: ${finalRelTo.records[0].get('c').toNumber()}`);
  console.log(`  ├── BESTEHT_AUS: ${finalBestAus.records[0].get('c').toNumber()}`);

  await session.close();
  await closeDriver();
  console.log('\n✓ Knowledge Graph bootstrap complete!');
}

run().catch(e => {
  console.error('Bootstrap failed:', e.message);
  process.exit(1);
});
