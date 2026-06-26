#!/usr/bin/env node
/**
 * kg-enrich.mjs — Cached View Generator.
 *
 * Reads kg_data.json (Neo4j export) and produces kg_rich_data.json with:
 * - Entity relations grouped by semantic type
 * - Graph statistics
 * - Co-occurrence similarity from article entity mentions
 *
 * Usage:  node scripts/kg-enrich.mjs
 * Input:  myhugoapp/data/kg_data.json
 * Output: myhugoapp/data/kg_rich_data.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'myhugoapp', 'data');
const INPUT = join(DATA_DIR, 'kg_data.json');
const OUTPUT = join(DATA_DIR, 'kg_rich_data.json');

const RELATION_TYPES = [
  { type: 'VERALLGEMEINERT',  label: 'Verallgemeinert',  color: '#6366f1' },
  { type: 'BESCHREIBT',       label: 'Beschreibt',       color: '#8b5cf6' },
  { type: 'AEHNLICH_ZU',      label: 'Ähnlich zu',       color: '#06b6d4' },
  { type: 'DEMONSTRIERT',     label: 'Demonstriert',     color: '#f59e0b' },
  { type: 'ERZEUGT',          label: 'Erzeugt',          color: '#10b981' },
  { type: 'ENTDECKT',         label: 'Entdeckt',         color: '#f97316' },
  { type: 'BEINHALTET',       label: 'Beinhaltet',       color: '#3b82f6' },
  { type: 'VERGLEICHBAR',     label: 'Vergleichbar',     color: '#14b8a6' },
  { type: 'BETEILIGT_AN',     label: 'Beteiligt an',     color: '#a855f7' },
  { type: 'WENDET_AN',        label: 'Wendet an',        color: '#ec4899' },
  { type: 'QUELLE_VON',       label: 'Quelle von',       color: '#78716c' },
  { type: 'VERWENDET',        label: 'Verwendet',        color: '#eab308' },
  { type: 'WIRD_VERWENDET_IN',label: 'Wird verwendet in',color: '#84cc16' },
  { type: 'RELATED_TO',       label: 'Verknüpft',        color: '#a3a3a3' },
  { type: 'ERFUELLT',         label: 'Erfüllt',          color: '#64748b' },
  { type: 'BESTEHT_AUS',      label: 'Besteht aus',      color: '#94a3b8' },
];

const TYPE_MATRIX = {
  'stoff__stoff':      'AEHNLICH_ZU',
  'stoff__konzept':    'BEINHALTET',
  'stoff__reaktion':   'BETEILIGT_AN',
  'stoff__methode':    'WIRD_VERWENDET_IN',
  'konzept__konzept':  'VERALLGEMEINERT',
  'konzept__stoff':    'BESCHREIBT',
  'konzept__reaktion': 'BESCHREIBT',
  'reaktion__reaktion':'VERGLEICHBAR',
  'reaktion__stoff':   'ERZEUGT',
  'reaktion__konzept': 'DEMONSTRIERT',
  'methode__stoff':    'VERWENDET',
  'methode__konzept':  'WENDET_AN',
  'person__stoff':     'ENTDECKT',
  'person__konzept':   'ENTDECKT',
  'person__reaktion':  'ENTDECKT',
  'quelle__stoff':     'QUELLE_VON',
  'quelle__konzept':   'QUELLE_VON',
  'quelle__reaktion':  'QUELLE_VON',
  'quelle__methode':   'QUELLE_VON',
  'quelle__person':    'QUELLE_VON',
};

function inferType(srcCat, tgtCat) {
  return TYPE_MATRIX[srcCat + '__' + tgtCat] || 'RELATED_TO';
}

function main() {
  if (!existsSync(INPUT)) {
    console.log('[kg-enrich] Input not found: ' + INPUT);
    console.log('[kg-enrich] Run export-kg-data.mjs first. Exiting (no-op).');
    return;
  }

  let raw;
  try { raw = JSON.parse(readFileSync(INPUT, 'utf-8')); }
  catch (err) {
    console.log('[kg-enrich] Failed to parse: ' + err.message);
    return;
  }

  const entities = raw.entities || [];
  const articles = raw.articles || [];

  if (entities.length === 0) {
    console.log('[kg-enrich] No entities found. Exiting (no-op).');
    return;
  }

  console.log('[kg-enrich] Processing ' + entities.length + ' entities, ' + articles.length + ' articles');

  // Entity index
  const eIdx = {};
  const eList = [];
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    eIdx[e.name] = i;
    eList.push({
      id: e.id || ('e' + i),
      name: e.name,
      category: e.category || 'konzept',
      articleCount: e.articleCount || 0,
      articles: e.articles || [],
      relatedEntities: e.relatedEntities || [],
      components: e.components || [],
    });
  }

  // Co-occurrence map
  const coMap = {};
  for (const a of articles) {
    const ents = a.entities || [];
    for (let i = 0; i < ents.length; i++) {
      for (let j = i + 1; j < ents.length; j++) {
        const src = ents[i], tgt = ents[j];
        if (src === tgt) continue;
        if (!coMap[src]) coMap[src] = {};
        coMap[src][tgt] = (coMap[src][tgt] || 0) + 1;
      }
    }
  }

  console.log('[kg-enrich] Co-occurrence entities: ' + Object.keys(coMap).length);

  // Enrich
  const enriched = {};
  const stats = { totalEntities: eList.length, totalRelations: 0, byType: {}, byCategory: {}, coOccurrenceEdges: 0 };

  for (const e of eList) {
    stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
  }

  for (const e of eList) {
    const rels = {};

    for (const rn of (e.relatedEntities || [])) {
      const ti = eIdx[rn];
      if (ti === undefined) continue;
      const t = eList[ti].category;
      const rt = inferType(e.category, t);
      if (!rels[rt]) rels[rt] = [];
      rels[rt].push({ target: rn, targetCategory: t, weight: 1 });
    }

    for (const cn of (e.components || [])) {
      if (!rels['BESTEHT_AUS']) rels['BESTEHT_AUS'] = [];
      rels['BESTEHT_AUS'].push({
        target: cn,
        targetCategory: eIdx[cn] !== undefined ? eList[eIdx[cn]].category : null,
        weight: 1,
      });
    }

    for (const [co, w] of Object.entries(coMap[e.name] || {})) {
      if (eIdx[co] === undefined) continue;
      if (!rels['AEHNLICH_ZU']) rels['AEHNLICH_ZU'] = [];
      if (!rels['AEHNLICH_ZU'].some((r) => r.target === co)) {
        rels['AEHNLICH_ZU'].push({
          target: co,
          targetCategory: eList[eIdx[co]].category,
          weight: Math.min(w, 10),
          source: 'co-occurrence',
        });
        stats.coOccurrenceEdges++;
      }
    }

    for (const [rt, rl] of Object.entries(rels)) {
      stats.byType[rt] = (stats.byType[rt] || 0) + rl.length;
      stats.totalRelations += rl.length;
    }

    enriched[e.name] = { id: e.id, name: e.name, category: e.category, articleCount: e.articleCount, articles: e.articles, relations: rels };
  }

  const output = {
    exportedAt: raw.exportedAt || new Date().toISOString(),
    enrichedAt: new Date().toISOString(),
    source: 'kg-enrich',
    relationTypes: RELATION_TYPES,
    statistics: stats,
    entities: enriched,
  };

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
  console.log('[kg-enrich] Written: ' + OUTPUT);
  console.log('[kg-enrich] ' + stats.totalEntities + ' entities, ' + stats.totalRelations + ' relations (' + Object.keys(stats.byType).length + ' types), ' + stats.coOccurrenceEdges + ' co-occurrence edges');
}

main();
