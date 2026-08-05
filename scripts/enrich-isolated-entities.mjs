#!/usr/bin/env node
/**
 * enrich-isolated-entities.mjs — Verknüpft die 115 isolierten Chemie-Entities
 * mit dem restlichen Wissensnetz.
 *
 * Läuft gegen chemie-kg (bolt://chemie-kg:7687), der Datenbank, die die API
 * verwendet. Ausführung im chemie-chat-api-Container:
 *
 *   cat scripts/enrich-isolated-entities.mjs | docker exec -i chemie-chat-api node
 *
 * Phasen:
 *   1. Curated: Manuell kuratierte, hochwertige Verknüpfungen (RELATED_TO)
 *   2. Name:    Wortbasierte Namens-Ähnlichkeit (AEHNLICH_ZU)
 *   3. Desc:    Isolierte Namen in Descriptions verbundener Entities finden
 *               (RELATED_TO)
 *
 * Sicher: nur MERGE, keine DELETEs. Ziel sind nur Entities mit kategorie IN
 * [konzept, stoff, reaktion, methode, person, quelle].
 */

import neo4j from 'neo4j-driver';

const DRY_RUN = process.argv.includes('--dry-run');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const CATS = ['konzept', 'stoff', 'reaktion', 'methode', 'person', 'quelle'];

// ── Kuratierte Verknüpfungen: [von, zu, relType] ─────────────────────────
// Nur Paare, bei denen beide Entities existieren. MERGE ist idempotent.
const CURATED = [
  // Elemente → Periodensystem
  ['Argon', 'Periodensystem', 'RELATED_TO'],
  ['Cobalt', 'Periodensystem', 'RELATED_TO'],
  ['Fluor', 'Periodensystem', 'RELATED_TO'],
  ['Gold', 'Periodensystem', 'RELATED_TO'],
  ['Helium', 'Periodensystem', 'RELATED_TO'],
  ['Iridium', 'Periodensystem', 'RELATED_TO'],
  ['Neon', 'Periodensystem', 'RELATED_TO'],
  ['Selen', 'Periodensystem', 'RELATED_TO'],
  ['Uran', 'Periodensystem', 'RELATED_TO'],
  ['Wolfram', 'Periodensystem', 'RELATED_TO'],
  // Element-Beziehungen
  ['Argon', 'Neon', 'AEHNLICH_ZU'],
  ['Helium', 'Neon', 'AEHNLICH_ZU'],
  ['Fluor', 'Chlor', 'AEHNLICH_ZU'],
  ['Gold', 'Kupfer', 'AEHNLICH_ZU'],
  ['Cobalt', 'Eisen', 'AEHNLICH_ZU'],
  ['Argon', 'Helium', 'AEHNLICH_ZU'],
  ['Fluor', 'Selen', 'AEHNLICH_ZU'],
  // Konzepte
  ['pOH', 'pH-Wert', 'RELATED_TO'],
  ['pOH', 'Ionenprodukt des Wassers', 'RELATED_TO'],
  ['Schwache Sauere', 'Saeure-Base-Reaktion', 'RELATED_TO'],
  ['Starke Sauere', 'Saeure-Base-Reaktion', 'RELATED_TO'],
  ['Schwache Sauere', 'Starke Sauere', 'AEHNLICH_ZU'],
  ['Thermodynamik', 'Enthalpie', 'BEINHALTET'],
  ['Thermodynamik', 'Entropie', 'BEINHALTET'],
  ['Thermodynamik', 'Freie Enthalpie', 'BEINHALTET'],
  ['Thermodynamik', 'Endotherme Reaktion', 'RELATED_TO'],
  ['Thermodynamik', 'Exotherme Reaktion', 'RELATED_TO'],
  ['Quantenzahlen', 'Atomradius', 'RELATED_TO'],
  ['Quantenzahlen', 'Ionisierungsenergie', 'RELATED_TO'],
  ['Pauli-Prinzip', 'Quantenzahlen', 'RELATED_TO'],
  ['Hundsche Regel', 'Quantenzahlen', 'RELATED_TO'],
  ['Pauli-Prinzip', 'Hundsche Regel', 'AEHNLICH_ZU'],
  ['Hybridisierung', 'Kovalente Bindung', 'RELATED_TO'],
  ['Liganden', 'Ligand', 'RELATED_TO'],
  ['Liganden', 'Chelatligand', 'RELATED_TO'],
  ['Liganden', 'Komplexverbindung', 'RELATED_TO'],
  ['Chelatkomplexe', 'Chelatligand', 'RELATED_TO'],
  ['Chelatkomplexe', 'Koordinationschemie', 'RELATED_TO'],
  ['Kristallfeldtheorie', 'Koordinationschemie', 'RELATED_TO'],
  ['Koordinationszahl', 'Koordinationschemie', 'RELATED_TO'],
  ['Jahn-Teller-Effekt', 'Koordinationschemie', 'RELATED_TO'],
  ['Treibhausgase', 'Kohlendioxid (CO2)', 'RELATED_TO'],
  ['Treibhausgase', 'Kohlendioxid (CO2)', 'BESTEHT_AUS'],
  ['Saurer Regen', 'Schwefeldioxid (SO2)', 'RELATED_TO'],
  ['Saurer Regen', 'Salpetersaeure (HNO3)', 'RELATED_TO'],
  ['Ozonloch', 'Kohlendioxid (CO2)', 'RELATED_TO'],
  ['Ozonloch', 'Treibhausgase', 'RELATED_TO'],
  ['Smog', 'Saurer Regen', 'RELATED_TO'],
  ['Eutrophierung', 'Bioakkumulation', 'AEHNLICH_ZU'],
  ['Supraleiter', 'Halbleiter', 'AEHNLICH_ZU'],
  ['Nanopartikel', 'Nanomaterialien', 'RELATED_TO'],
  ['Nanopartikel', 'Halbleiter', 'RELATED_TO'],
  ['Keramik', 'Nanomaterialien', 'RELATED_TO'],
  ['Solvatisierung', 'Hydratation', 'RELATED_TO'],
  ['Solvatisierung', 'Hydrathuelle', 'RELATED_TO'],
  ['Magnetismus', 'Elektronenaffinitaet', 'RELATED_TO'],
  ['Molekulare Erkennung', 'Ligand', 'RELATED_TO'],
  ['Michaelis-Menten', 'Enzymkatalyse', 'RELATED_TO'],
  ['Michaelis-Menten', 'Enzyme', 'RELATED_TO'],
  ['Autokatalyse', 'Enzymkatalyse', 'RELATED_TO'],
  ['Autokatalyse', 'Katalyse', 'RELATED_TO'],
  // Reaktionen
  ['Hydrierung', 'Dehydrierung', 'AEHNLICH_ZU'],
  ['Hydrierung', 'Additionsreaktion', 'RELATED_TO'],
  ['Halogenierung', 'Substitutionsreaktion', 'RELATED_TO'],
  ['Nitrierung', 'Substitutionsreaktion', 'RELATED_TO'],
  ['Sulfonierung', 'Substitutionsreaktion', 'RELATED_TO'],
  ['Halogenierung', 'Elektrophile aromatische Substitution', 'RELATED_TO'],
  ['Nitrierung', 'Elektrophile aromatische Substitution', 'RELATED_TO'],
  ['Sulfonierung', 'Elektrophile aromatische Substitution', 'RELATED_TO'],
  ['Polymerisation', 'Polykondensation', 'AEHNLICH_ZU'],
  ['Polymerisation', 'Polyaddition', 'AEHNLICH_ZU'],
  ['Polykondensation', 'Polyaddition', 'AEHNLICH_ZU'],
  ['Polymerisation', 'Kondensationsreaktion', 'RELATED_TO'],
  ['Polyaddition', 'Additionsreaktion', 'RELATED_TO'],
  ['Suzuki-Kupplung', 'Stille-Kupplung', 'AEHNLICH_ZU'],
  ['Suzuki-Kupplung', 'Kreuzkupplung', 'RELATED_TO'],
  ['Stille-Kupplung', 'Kreuzkupplung', 'RELATED_TO'],
  ['Dieckmann-Kondensation', 'Kondensationsreaktion', 'RELATED_TO'],
  ['Knoevenagel-Kondensation', 'Kondensationsreaktion', 'RELATED_TO'],
  ['Glykolyse', 'Citratzyklus', 'RELATED_TO'],
  ['Glykolyse', 'Zitronensaeurezyklus', 'AEHNLICH_ZU'],
  ['Citratzyklus', 'Zitronensaeurezyklus', 'AEHNLICH_ZU'],
  ['Transkription', 'Translation', 'AEHNLICH_ZU'],
  ['Transkription', 'Replication', 'RELATED_TO'],
  ['Disproportionierung', 'Oxidation', 'RELATED_TO'],
  ['Disproportionierung', 'Reduktion', 'RELATED_TO'],
  ['Komplexbildung', 'Komplexverbindung', 'RELATED_TO'],
  ['Calvin-Zyklus', 'Kohlendioxid (CO2)', 'RELATED_TO'],
  ['Etherifizierung', 'Alkohole', 'RELATED_TO'],
  ['Beckmann-Umlagerung', 'Amine', 'RELATED_TO'],
  ['Beckmann-Umlagerung', 'Carbonsaeuren', 'RELATED_TO'],
  // Methoden
  ['NMR-Spektroskopie', 'Kernspinresonanz (NMR)', 'AEHNLICH_ZU'],
  ['nmr-spektroskopie', 'Kernspinresonanz (NMR)', 'AEHNLICH_ZU'],
  ['IR-Spektroskopie', 'ir-spektroskopie', 'AEHNLICH_ZU'],
  ['uv-vis-spektroskopie', 'Spektroskopie', 'RELATED_TO'],
  ['ir-spektroskopie', 'Spektroskopie', 'RELATED_TO'],
  ['nmr-spektroskopie', 'Spektroskopie', 'RELATED_TO'],
  ['Röntgendiffraktion', 'XRD', 'AEHNLICH_ZU'],
  ['Röntgendiffraktion', 'röntgenbeugung', 'AEHNLICH_ZU'],
  ['Röntgendiffraktion', 'Roenntgenstrukturanalyse', 'AEHNLICH_ZU'],
  ['röntgenbeugung', 'XRD', 'AEHNLICH_ZU'],
  ['Ebullioskopie', 'Kryoskopie', 'AEHNLICH_ZU'],
  ['Polarographie', 'Polarimetrie', 'AEHNLICH_ZU'],
  ['Coulometrie', 'Elektrochemische Analyse', 'RELATED_TO'],
  ['Gravimetrie', 'Elektrochemische Analyse', 'RELATED_TO'],
  ['ICP-MS', 'Massenspektrometrie', 'RELATED_TO'],
  ['ICP-MS', 'Massenspektrometrie (MS)', 'RELATED_TO'],
  ['XPS', 'SEM', 'RELATED_TO'],
  ['XPS', 'AFM', 'RELATED_TO'],
  ['Fluoreszenzspektroskopie', 'Spektroskopie', 'RELATED_TO'],
  ['Atomabsorptionsspektrometrie', 'Spektroskopie', 'RELATED_TO'],
  ['Kristallisation', 'Sublimation', 'AEHNLICH_ZU'],
  ['Zentrifugation', 'Filtration', 'RELATED_TO'],
  ['Zentrifugation', 'Destillation', 'RELATED_TO'],
  ['Schwingungsspektroskopie', 'IR-Spektroskopie', 'RELATED_TO'],
  ['Sublimation', 'Destillation', 'RELATED_TO'],
  // Personen
  ['Marie Curie', 'Uran', 'RELATED_TO'],
  ['Emil Fischer', 'Enzyme', 'RELATED_TO'],
  ['Erwin Schrödinger', 'Niels Bohr', 'AEHNLICH_ZU'],
  ['Erwin Schrödinger', 'Werner Heisenberg', 'AEHNLICH_ZU'],
  ['Niels Bohr', 'Werner Heisenberg', 'AEHNLICH_ZU'],
  ['Max Planck', 'Quantenzahlen', 'RELATED_TO'],
  ['John Dalton', 'Atomradius', 'RELATED_TO'],
  ['John Dalton', 'Daltonsches Partialdruckgesetz', 'RELATED_TO'],
  ['Glenn Seaborg', 'Uran', 'RELATED_TO'],
  ['Ahmed Zewail', 'Fluoreszenzspektroskopie', 'RELATED_TO'],
  ['Robert Grubbs', 'Yves Chauvin', 'AEHNLICH_ZU'],
  ['Robert Burns Woodward', 'Robert Grubbs', 'AEHNLICH_ZU'],
  ['John B. Goodenough', 'Supraleiter', 'RELATED_TO'],
  ['Ilya Prigogine', 'Thermodynamik', 'RELATED_TO'],
  ['Fraser Stoddart', 'Jean-Pierre Sauvage', 'AEHNLICH_ZU'],
  // Verbleibende isolierte Entities (16 Stück)
  ['aufbauprinzip', 'pauli-prinzip', 'RELATED_TO'],
  ['aufbauprinzip', 'hundsche regel', 'RELATED_TO'],
  ['aufbauprinzip', 'quantenzahlen', 'RELATED_TO'],
  ['duromere', 'Polymerisation', 'RELATED_TO'],
  ['duromere', 'Polykondensation', 'RELATED_TO'],
  ['lactame', 'Amine', 'RELATED_TO'],
  ['lactame', 'Carbonsaeuren', 'RELATED_TO'],
  ['ligandenfeldtheorie', 'Koordinationschemie', 'RELATED_TO'],
  ['ligandenfeldtheorie', 'kristallfeldtheorie', 'AEHNLICH_ZU'],
  ['Ei-ichi Negishi', 'Kreuzkupplung', 'RELATED_TO'],
  ['Ei-ichi Negishi', 'Suzuki-Kupplung', 'AEHNLICH_ZU'],
  ['Jacobus Henricus van t Hoff', 'Thermodynamik', 'RELATED_TO'],
  ['Rosalind Franklin', 'Roenntgenstrukturanalyse', 'RELATED_TO'],
  ['robinson-annulation', 'Kondensationsreaktion', 'RELATED_TO'],
  ['Ethan (C2H6)', 'Alkane', 'RELATED_TO'],
  ['Kaliumdichromat (K2Cr2O7)', 'Oxidation', 'RELATED_TO'],
  ['Natriumhypochlorit (NaOCl)', 'Oxidation', 'RELATED_TO'],
  ['Polytetrafluorethylen (PTFE)', 'Polymerisation', 'RELATED_TO'],
  ['Polytetrafluorethylen (PTFE)', 'duromere', 'AEHNLICH_ZU'],
  ['Zeolith', 'katalyse', 'RELATED_TO'],
  ['biogas', 'Methan (CH4)', 'RELATED_TO'],
  ['biogas', 'Treibhausgase', 'RELATED_TO'],
  ['coenzym a', 'Enzyme', 'RELATED_TO'],
  ['coenzym a', 'Glykolyse', 'RELATED_TO'],
  ['coenzym a', 'Citratzyklus', 'RELATED_TO'],
];

// ── Namens-Normalisierung ────────────────────────────────────────────────

function normalize(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[äöüß]/g, function (c) {
      return { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c];
    })
    .replace(/[()\-/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(name) {
  return normalize(name).split(' ').filter(Boolean);
}

function wordJaccard(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  let inter = 0;
  setA.forEach(function (t) {
    if (setB.has(t)) inter++;
  });
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

// ── Phase 1: Kuratierte Verknüpfungen ────────────────────────────────────

async function phaseCurated(session) {
  console.log('\n[enrich] Phase 1: Curated pairs (' + CURATED.length + ')...');
  let created = 0;
  let missing = 0;
  for (const [a, b, rel] of CURATED) {
    try {
      const res = await session.run(
        `MATCH (a:Entity) WHERE toLower(trim(a.name)) = toLower(trim($a)) AND a.kategorie IN $cats
         MATCH (b:Entity) WHERE toLower(trim(b.name)) = toLower(trim($b)) AND b.kategorie IN $cats
         MERGE (a)-[:${rel}]->(b)
         RETURN count(*) AS n`,
        { a: a, b: b, cats: CATS }
      );
      if (res.records[0].get('n').toNumber() > 0) {
        created++;
      } else {
        missing++;
        console.log('  MISSING: "' + a + '" ↔ "' + b + '"');
      }
    } catch (err) {
      console.error('  ERROR ' + a + '↔' + b + ': ' + err.message);
    }
  }
  console.log('  Created: ' + created + ', missing endpoints: ' + missing);
  return created;
}

// ── Phase 2: Namens-Ähnlichkeit (AEHNLICH_ZU) ────────────────────────────

async function phaseNameSimilarity(session) {
  console.log('\n[enrich] Phase 2: Name similarity (AEHNLICH_ZU)...');
  const res = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats
     RETURN e.name AS name, id(e) AS id`,
    { cats: CATS }
  );
  const entities = res.records.map(function (r) {
    return { id: r.get('id'), name: r.get('name'), norm: normalize(r.get('name')) };
  });
  console.log('  Loaded ' + entities.length + ' entities');

  // Stopwörter, die nichts bedeuten (vermeiden triviale Treffer)
  const STOP = new Set(['der', 'die', 'das', 'von', 'und', 'in', 'zu', 'des', 'den']);
  const pairs = [];
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const ti = tokens(entities[i].name);
      const tj = tokens(entities[j].name);
      const sim = wordJaccard(entities[i].name, entities[j].name);
      // Mindestens 1 signifikantes gemeinsames Token UND keine Dubletten
      const shared = ti.some((t) => !STOP.has(t) && tj.includes(t));
      if (sim >= 0.33 && shared && entities[i].norm !== entities[j].norm) {
        pairs.push({ a: entities[i], b: entities[j], sim });
      }
    }
  }
  pairs.sort((a, b) => b.sim - a.sim);
  console.log('  Similar pairs: ' + pairs.length);

  if (DRY_RUN) {
    pairs
      .slice(0, 15)
      .forEach((p) =>
        console.log(
          '    AEHNLICH_ZU: "' + p.a.name + '" ↔ "' + p.b.name + '" (sim=' + p.sim.toFixed(2) + ')'
        )
      );
    return 0;
  }

  let created = 0;
  let errors = 0;
  for (const p of pairs) {
    try {
      const r = await session.run(
        `MATCH (a:Entity) WHERE id(a) = $aId
         MATCH (b:Entity) WHERE id(b) = $bId
         MERGE (a)-[:AEHNLICH_ZU]->(b)
         MERGE (b)-[:AEHNLICH_ZU]->(a)
         RETURN count(*) AS n`,
        { aId: p.a.id, bId: p.b.id }
      );
      if (r.records[0].get('n').toNumber() > 0) created++;
    } catch (err) {
      errors++;
      if (errors <= 3) console.error('  ERROR: ' + err.message);
    }
  }
  console.log('  Created: ' + created + ', errors: ' + errors);
  return created;
}

// ── Phase 3: Description-Mining ──────────────────────────────────────────

async function phaseDescriptionMining(session) {
  console.log('\n[enrich] Phase 3: Description mining...');
  // Isolierte Entities (ohne semantische Verknüpfung)
  const isoRes = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats
       AND NOT (e)-[:RELATED_TO|AEHNLICH_ZU|BEINHALTET|VERALLGEMEINERT|BESCHREIBT|DEMONSTRIERT|ERZEUGT|ENTDECKT|PREREQUISITE|CONSISTS_OF|BESTEHT_AUS|VERGLEICHBAR|BETEILIGT_AN|WENDET_AN|QUELLE_VON|COVERS_TOPIC]-()
     RETURN e.name AS name, id(e) AS id`,
    { cats: CATS }
  );
  const isolated = isoRes.records.map((r) => ({
    id: r.get('id'),
    name: r.get('name'),
    norm: normalize(r.get('name')),
  }));
  console.log('  Isolated entities: ' + isolated.length);

  if (isolated.length === 0) return 0;

  // Descriptions aller Entities laden
  const descRes = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats AND coalesce(e.description, '') <> ''
     RETURN e.name AS name, id(e) AS id, e.description AS desc`,
    { cats: CATS }
  );
  const withDesc = descRes.records.map((r) => ({
    id: r.get('id'),
    name: r.get('name'),
    desc: String(r.get('desc') || ''),
  }));
  console.log('  Entities with descriptions: ' + withDesc.length);

  // Für jede isolierte Entity: In Descriptions nach (signifikanten) Namens-Tokens suchen
  let candidates = [];
  for (const iso of isolated) {
    const toks = tokens(iso.name).filter((t) => t.length >= 4);
    if (toks.length === 0) continue;
    for (const anchor of withDesc) {
      if (anchor.id === iso.id) continue;
      const dLow = anchor.desc.toLowerCase();
      // Ganzwort-Match (Name oder Kern-Token)
      const normName = normalize(iso.name);
      const hasFull =
        dLow.includes(normName) || anchor.desc.toLowerCase().includes(iso.name.toLowerCase());
      const hasToken = toks.some((t) => {
        return new RegExp('\\b' + t + '\\b', 'i').test(anchor.desc);
      });
      if (hasFull || hasToken) {
        candidates.push({ iso, anchor, score: hasFull ? 2 : 1 });
      }
    }
  }
  console.log('  Candidates: ' + candidates.length);
  if (DRY_RUN) {
    candidates
      .slice(0, 15)
      .forEach((c) =>
        console.log(
          '    RELATED_TO: "' + c.iso.name + '" → "' + c.anchor.name + '" (score=' + c.score + ')'
        )
      );
    return 0;
  }

  let created = 0;
  let errors = 0;
  const seen = new Set();
  for (const c of candidates) {
    const key = c.iso.id + '|' + c.anchor.id;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const r = await session.run(
        `MATCH (a:Entity) WHERE id(a) = $aId
         MATCH (b:Entity) WHERE id(b) = $bId
         MERGE (a)-[:RELATED_TO]->(b)
         RETURN count(*) AS n`,
        { aId: c.iso.id, bId: c.anchor.id }
      );
      if (r.records[0].get('n').toNumber() > 0) created++;
    } catch (err) {
      errors++;
      if (errors <= 3) console.error('  ERROR: ' + err.message);
    }
  }
  console.log('  Created: ' + created + ', errors: ' + errors);
  return created;
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });
  console.log('URI: ' + NEO4J_URI + ' (dry-run: ' + DRY_RUN + ')');
  try {
    await phaseCurated(session);
    await phaseNameSimilarity(session);
    await phaseDescriptionMining(session);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
