#!/usr/bin/env node
/**
 * link-articles-to-entities.mjs — Verknüpft Content-Nodes (Artikel/Rechner)
 * mit Entities über Titel- und URL-Slug-Matching (Säule 4 der KG-Roadmap).
 *
 * Strategie (konservativ):
 *   1. Titel-Wort-Matching: Entity-Name (mehrwortig) kommt wortweise im
 *      Content-Titel vor → MENTIONS-Kante
 *   2. Slug-Matching: Entity-Slug (normalisiert) kommt im URL-Pfad vor
 *   3. Singular/Plural-Varianten: Entity "Säure" matcht "Säuren" im Titel
 *
 * Idempotent: MERGE. Nur für Content-Nodes ohne bestehende MENTIONS.
 * Dry-Run: node - --dry-run
 *
 * Läuft im chemie-chat-api-Container:
 *   cat scripts/link-articles-to-entities.mjs | docker exec -i chemie-chat-api node -
 */

import neo4j from 'neo4j-driver';

const DRY_RUN = process.argv.includes('--dry-run');
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://chemie-kg:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'chemie_knowledge_2024';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'chemie';

const CATS = ['konzept', 'stoff', 'reaktion', 'methode', 'person', 'quelle'];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c])
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Slug aus Entity-Name (wie in URLs)
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c])
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Entity-Name im Content-Titel (mehrwortig: alle Wörter; einwort: >=5 Zeichen)
function titleMatch(entityName, title) {
  const tokens = norm(entityName).split(' ').filter(Boolean);
  if (tokens.length === 0) return false;
  if (tokens.length === 1 && norm(entityName).length < 5) return false;
  const t = ' ' + norm(title) + ' ';
  // Singular/Plural-Toleranz: letzte Buchstaben 'en'/'e' ignorieren beim Match
  return tokens.every(
    (tok) =>
      t.indexOf(' ' + tok + ' ') !== -1 ||
      t.indexOf(' ' + tok + 'en ') !== -1 ||
      t.indexOf(' ' + tok + 'e ') !== -1
  );
}

// Entity-Slug im URL-Pfad (Wortgrenzen: /slug/ oder -slug-)
function urlMatch(entityName, url) {
  const slug = slugify(entityName);
  if (slug.length < 4) return false;
  return (
    url.indexOf('/' + slug + '/') !== -1 ||
    url.endsWith('/' + slug + '/') ||
    url.indexOf('-' + slug + '-') !== -1 ||
    url.endsWith('-' + slug)
  );
}

async function loadEntities(session) {
  const res = await session.run(
    `MATCH (e:Entity)
     WHERE e.kategorie IN $cats
     RETURN e.name AS name, id(e) AS id`,
    { cats: CATS }
  );
  return res.records.map((r) => ({
    id: r.get('id').toNumber ? r.get('id').toNumber() : r.get('id'),
    name: r.get('name'),
  }));
}

async function loadContent(session) {
  const res = await session.run(
    `MATCH (c:Content)
     WHERE coalesce(c.title, '') <> ''
       AND NOT (c)-[:MENTIONS]->(:Entity)
     RETURN id(c) AS id, c.title AS title, coalesce(c.url, '') AS url, c.type AS type`,
    {}
  );
  return res.records.map((r) => ({
    id: r.get('id').toNumber ? r.get('id').toNumber() : r.get('id'),
    title: String(r.get('title') || ''),
    url: String(r.get('url') || ''),
    type: r.get('type'),
  }));
}

async function main() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session({ database: NEO4J_DATABASE });
  console.log(`URI: ${NEO4J_URI} (dry-run: ${DRY_RUN})`);

  try {
    const entities = await loadEntities(session);
    const content = await loadContent(session);
    console.log(`Entities: ${entities.length}, Content ohne MENTIONS: ${content.length}`);

    let links = 0;
    let linkedContent = 0;
    for (const c of content) {
      const matched = [];
      for (const e of entities) {
        if (titleMatch(e.name, c.title) || urlMatch(e.name, c.url)) {
          matched.push(e);
        }
      }
      if (matched.length === 0) continue;

      if (DRY_RUN) {
        console.log(
          `\n[${c.type}] ${c.title} → ${matched
            .slice(0, 6)
            .map((m) => m.name)
            .join(', ')}${matched.length > 6 ? ' +' + (matched.length - 6) : ''}`
        );
      } else {
        for (const e of matched) {
          await session.run(
            `MATCH (c:Content) WHERE id(c) = $cid
             MATCH (e:Entity) WHERE id(e) = $eid
             MERGE (c)-[:MENTIONS]->(e)`,
            { cid: c.id, eid: e.id }
          );
          links++;
        }
      }
      linkedContent++;
    }
    console.log(`\nFertig: ${links} MENTIONS-Kanten über ${linkedContent} Content-Nodes.`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
