#!/usr/bin/env node
/**
 * enrich-entity-descriptions.mjs — Befüllt fehlende Entity-Descriptions.
 *
 * Problem: Nur 5/545 Chemie-Entities haben eine Description. Ohne
 * Beschreibungen sind Entity-Seiten und der KI-Assistent (RAG) informationsarm.
 *
 * Quellen (priorisiert):
 *   1. LearningObjective-Texte über FULFILLS_OBJECTIVE (21.478 Texte)
 *   2. Topic/SubTopic-Titel über COVERS_TOPIC
 *   3. Content-Titel über MENTIONS (Artikel/Rechner)
 *
 * Beschreibungs-Erzeugung: Die kürzesten, vollständigsten Fragmente aus
 * Lernzielen/Topics werden dedupliziert und zu einer kompakten Description
 * zusammengefügt. Nur Entities OHNE Description werden befüllt (idempotent).
 *
 * Läuft im chemie-chat-api-Container:
 *   cat scripts/enrich-entity-descriptions.mjs | docker exec -i chemie-chat-api node -
 * Dry-Run:  ... node - --dry-run
 */

import neo4j from 'neo4j-driver';

const DRY_RUN = process.argv.includes('--dry-run');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const CATS = ['konzept', 'stoff', 'reaktion', 'methode', 'person', 'quelle'];
const MAX_FRAGMENTS = 4;
const MAX_DESC_LEN = 600;

// Fragment-Qualität: kurze, vollständige Sätze (keine Trümmer)
function qualityScore(t, entityName) {
  const s = String(t || '').trim();
  if (s.length < 12) return -1;
  if (s.length > 260) return 1;
  // Nur Entity-Name/Trümmer verwerfen
  if (entityName && s.toLowerCase() === entityName.toLowerCase()) return -1;
  if (/^[a-zäöüß]$/i.test(s)) return -1;
  let score = 10 - Math.min(10, s.length / 40);
  if (/^[A-ZÄÖÜ]/.test(s)) score += 2;
  if (s.endsWith('.')) score += 1;
  if (
    /(darstellen|erklären|beschreiben|kennen|verstehen|untersuchen|ableiten|nennen|einordnen|berechnen|erklärt|ist|sind|wird)/i.test(
      s
    )
  )
    score += 2;
  if (s.indexOf('basiskonzept') !== -1 || s.indexOf('➔') !== -1 || s.indexOf('  ') !== -1)
    score -= 3;
  return score;
}

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = String(x).toLowerCase().trim();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

async function loadEntityCandidates(session) {
  const res = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats AND coalesce(e.description, '') = ''
     RETURN e.name AS name, id(e) AS id, e.kategorie AS kat
     ORDER BY e.name`,
    { cats: CATS }
  );
  return res.records.map((r) => ({
    id: r.get('id').toNumber ? r.get('id').toNumber() : r.get('id'),
    name: r.get('name'),
    kat: r.get('kat'),
  }));
}

async function loadSources(session, id) {
  // 1. LearningObjective-Texte
  const lo = await session.run(
    `MATCH (e:Entity) WHERE id(e) = $id
     MATCH (e)-[r:FULFILLS_OBJECTIVE|COVERS_TOPIC]->(x)
     WHERE x.text IS NOT NULL AND size(x.text) > 5
     RETURN x.text AS text
     LIMIT 12`,
    { id }
  );
  const loTexts = lo.records.map((r) => String(r.get('text') || ''));

  // 2. Topic/SubTopic-Titel
  const tp = await session.run(
    `MATCH (e:Entity) WHERE id(e) = $id
     MATCH (e)-[r:COVERS_TOPIC]->(x)
     WHERE coalesce(x.title, '') <> ''
     RETURN DISTINCT x.title AS title
     LIMIT 8`,
    { id }
  );
  const tpTitles = tp.records.map((r) => String(r.get('title') || ''));

  // 3. Content-Titel (Artikel/Rechner)
  const ct = await session.run(
    `MATCH (e:Entity) WHERE id(e) = $id
     MATCH (e)-[r:MENTIONS]-(c)
     WHERE c:Content AND coalesce(c.title, '') <> ''
     RETURN DISTINCT c.title AS title
     LIMIT 6`,
    { id }
  );
  const ctTitles = ct.records.map((r) => String(r.get('title') || ''));

  // 4. Verwandte Entities (Namen als Kontext-Fallback)
  const rel = await session.run(
    `MATCH (e:Entity) WHERE id(e) = $id
     MATCH (e)-[r:RELATED_TO|AEHNLICH_ZU|BEINHALTET|BESTEHT_AUS|CONSISTS_OF|VERALLGEMEINERT]-(x:Entity)
     WHERE x.kategorie IN $cats AND x.name <> e.name
     RETURN DISTINCT x.name AS name
     LIMIT 10`,
    { id, cats: CATS }
  );
  const relNames = rel.records.map((r) => String(r.get('name') || ''));

  return { loTexts, tpTitles, ctTitles, relNames };
}

function buildDescription(name, kat, sources) {
  const frags = [];

  // Lernziel-Fragmente nach Qualität sortieren
  const scored = sources.loTexts
    .map((t) => ({ t, s: qualityScore(t, name) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  for (const f of scored.slice(0, MAX_FRAGMENTS)) frags.push(f.t);

  // Topic-Titel (falls wenige Lernziele)
  if (frags.length < 2) {
    for (const t of sources.tpTitles.slice(0, 3)) frags.push(t);
  }

  // Content-Titel als Hinweis
  if (frags.length < 2 && sources.ctTitles.length > 0) {
    frags.push('Themen: ' + sources.ctTitles.slice(0, 3).join(', '));
  }

  // Fallback: verwandte Entities nennen (nur wenn noch nichts da ist)
  if (frags.length === 0 && sources.relNames.length > 0) {
    const katLabel =
      {
        konzept: 'Konzept',
        stoff: 'Stoff',
        reaktion: 'Reaktion',
        methode: 'Methode',
        person: 'Person',
        quelle: 'Quelle',
      }[kat] || 'Begriff';
    frags.push(
      katLabel + ' im Chemie-Wissensnetz, verwandt mit: ' + sources.relNames.slice(0, 6).join(', ')
    );
  }

  const clean = dedupe(frags)
    .map((t) => t.trim().replace(/\s+/g, ' '))
    .filter((t) => t.length > 5);

  if (clean.length === 0) return null;

  let desc = clean.join('. ').replace(/(\.\.)/g, '.');
  if (desc.length > MAX_DESC_LEN) desc = desc.slice(0, MAX_DESC_LEN - 1) + '…';
  return desc;
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });
  console.log(`URI: ${NEO4J_URI} (dry-run: ${DRY_RUN})`);

  try {
    const candidates = await loadEntityCandidates(session);
    console.log(`Entities ohne Description: ${candidates.length}`);

    let filled = 0;
    let skipped = 0;
    for (const c of candidates) {
      const sources = await loadSources(session, c.id);
      const desc = buildDescription(c.name, c.kat, sources);
      if (!desc) {
        skipped++;
        continue;
      }
      if (DRY_RUN) {
        if (filled < 8) {
          console.log(`\n[${c.kat}] ${c.name}:`);
          console.log(`  → ${desc.slice(0, 150)}${desc.length > 150 ? '…' : ''}`);
        }
        filled++;
        continue;
      }
      await session.run(
        `MATCH (e:Entity) WHERE id(e) = $id
         SET e.description = $desc`,
        { id: c.id, desc }
      );
      filled++;
    }
    console.log(`\nFertig: ${filled} befüllt, ${skipped} ohne Quellen.`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
