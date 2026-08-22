#!/usr/bin/env node

/**
 * generate-themenbereich-entities.mjs
 *
 * Scans all entity pages under myhugoapp/content/entity/ and maps them
 * to the 12 Themenbereiche based on keyword matching in entity name,
 * description, relatedEntities, and category.
 *
 * Output: myhugoapp/data/themenbereich-entities.json
 *         A JSON object keyed by themenbereich slug, each containing
 *         an array of {name, slug, count (article mentions), size (rem for cloud)}.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENTITY_DIR = path.join(__dirname, '..', 'myhugoapp', 'content', 'entity');
const OUTPUT_PATH = path.join(__dirname, '..', 'myhugoapp', 'data', 'themenbereich-entities.json');

// Themenbereich → keyword map for entity matching
export const THEMENBEREICHE_KEYWORDS = {
  'einfuehrung-chemie': {
    name: 'Einführung in die Chemie',
    keywords: [
      'stoff',
      'element',
      'verbindung',
      'gemisch',
      'trennverfahren',
      'messen',
      'einheit',
      'labor',
      'sicherheit',
      'molekül',
      'atom',
      'zustand',
      'aggregat',
      'phasenübergang',
    ],
  },
  'aufbau-materie': {
    name: 'Aufbau der Materie',
    keywords: [
      'atom',
      'elektron',
      'proton',
      'neutron',
      'kern',
      'schale',
      'orbital',
      'isotop',
      'ionen',
      'elektronenkonfiguration',
      'quantenzahl',
      'atommodell',
      'bohr',
      'rutherford',
      'bindungsenergie',
      'ionisierungsenergie',
    ],
  },
  energetik: {
    name: 'Energetik',
    keywords: [
      'energie',
      'enthalpie',
      'enthalpi',
      'entropi',
      'exotherm',
      'endotherm',
      'kalorimetri',
      'hess',
      'reaktionswärme',
      'bildungsenthalpie',
      'verbrennungsenthalpie',
      'gibbs',
      'aktivierungsenergie',
    ],
  },
  'saeuren-basen': {
    name: 'Säuren und Basen',
    keywords: [
      'säure',
      'base',
      'saeure',
      'basen',
      'ph-wert',
      'ph-',
      'neutralisation',
      'neutralis',
      'puffer',
      'indikator',
      'titration',
      'titrat',
      'proton',
      'oxonium',
      'dissoziation',
      'pks',
      'pka',
      'laug',
      'alkali',
    ],
  },
  'redox-elektrochemie': {
    name: 'Redox und Elektrochemie',
    keywords: [
      'oxidation',
      'reduktion',
      'redox',
      'elektrochemi',
      'galvanisch',
      'elektrolys',
      'korrosion',
      'elektrode',
      'zelle',
      'spannung',
      'potential',
      'strom',
      'kathode',
      'anode',
      'ladung',
      'elektronenübertragung',
      'oxidationszahl',
      'oxidations',
    ],
  },
  'gleichgewicht-geschwindigkeit': {
    name: 'Gleichgewicht und Kinetik',
    keywords: [
      'gleichgewicht',
      'kinetik',
      'geschwindigkeit',
      'reaktionsgeschwindigkeit',
      'katalysator',
      'le chatelier',
      'equilibrium',
      'ratenkonstante',
      'halbwertszeit',
      'prinzip',
      'verschiebung',
      'ordnung',
    ],
  },
  'erdoel-organische-stoffklassen': {
    name: 'Erdöl und Organische Stoffklassen',
    keywords: [
      'kohlenwasserstoff',
      'alkan',
      'alken',
      'alkin',
      'aromat',
      'benzol',
      'erdoel',
      'erdöl',
      'petrol',
      'funktionelle gruppe',
      'alkohol',
      'ether',
      'carbonsäur',
      'ester',
      'amin',
      'halogenalkan',
    ],
  },
  'reaktionstypen-organisch': {
    name: 'Reaktionstypen der Organischen Chemie',
    keywords: [
      'substitution',
      'nukleophil',
      'elektrophil',
      'addition',
      'eliminierung',
      'kondensation',
      'polymerisation',
      'veresterung',
      'hydrierung',
      'dehydratisierung',
      'oxidation organis',
      'reduktion organis',
    ],
  },
  'produkte-organisch': {
    name: 'Organische Produkte im Alltag',
    keywords: [
      'kunststoff',
      'polymer',
      'plastik',
      'kunstfaser',
      'farbstoff',
      'pigment',
      'aroma',
      'duftstoff',
      'waschmittel',
      'tensid',
      'seife',
      'kosmetik',
      'klebstoff',
      'lack',
      'pharma',
    ],
  },
  'anorganische-verbindungen': {
    name: 'Anorganische Verbindungen',
    keywords: [
      'metall',
      'nichtmetall',
      'halogen',
      'edelgas',
      'oxid',
      'hydroxid',
      'sulfid',
      'carbonat',
      'nitrat',
      'chlorid',
      'sulfat',
      'phosphat',
      'komplex',
      'ligand',
      'übergangsmetall',
      'salz',
      'kristall',
      'ionengitter',
    ],
  },
  'analytische-methoden': {
    name: 'Analytische Methoden',
    keywords: [
      'chromatographi',
      'spektroskop',
      'massenspektrometri',
      'nmr',
      'ir-spektroskop',
      'uv-vis',
      'titration',
      'gravimetri',
      'photometri',
      'nachweisreaktion',
      'qualitativ',
      'quantitativ',
      'analytik',
    ],
  },
  biochemie: {
    name: 'Biochemie',
    keywords: [
      'enzym',
      'protein',
      'dna',
      'rna',
      'nukleinsäur',
      'kohlenhydrat',
      'zucker',
      'fett',
      'lipid',
      'membran',
      'aminosäur',
      'biokatalys',
      'fermentation',
      'photosynthese',
      'atp',
      'metabol',
      'biochemi',
    ],
  },
  'tipps-tricks': {
    name: 'Tipps und Tricks',
    keywords: [
      'lernen',
      'lernstrategi',
      'formel',
      'gleichung',
      'aufgabe',
      'prüfung',
      'experiment',
      'labor',
      'fehler',
      'tipps',
    ],
  },
};

/**
 * Read frontmatter from an entity index.md.
 */
export function readEntityFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  for (const line of match[1].split('\n')) {
    if (line.includes(':')) {
      const [key, ...valParts] = line.split(':');
      const val = valParts
        .join(':')
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (val) fm[key] = val;
    }
  }
  return fm;
}

/**
 * Score how well an entity matches a Themenbereich.
 */
export function scoreEntity(entity, keywords) {
  let score = 0;
  const name = (entity.title || entity.slug || '').toLowerCase();
  const desc = (entity.description || '').toLowerCase();
  const relEntities = (entity.relatedEntities || []).map((e) => e.toLowerCase());

  for (const kw of keywords) {
    if (name.includes(kw)) score += 3; // Name match = strongest signal
    if (desc.includes(kw)) score += 1;
    if (relEntities.some((re) => re.includes(kw))) score += 2;
  }
  return score;
}

// ── Main ─────────────────────────────────────────────────────

// Runs only when invoked directly (not when imported for unit tests).
const isMain = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isMain) {
  console.log('[themenbereich-entities] Scanning entity pages...');

  const entityDirs = fs
    .readdirSync(ENTITY_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`[themenbereich-entities] Found ${entityDirs.length} entity directories`);

  // Read all entities
  const entities = [];
  for (const dirName of entityDirs) {
    const indexFile = path.join(ENTITY_DIR, dirName, 'index.md');
    if (!fs.existsSync(indexFile)) continue;

    const fm = readEntityFrontmatter(indexFile);
    if (!fm || !fm.slug) continue;

    entities.push({
      slug: fm.slug,
      title: fm.title || fm.slug,
      description: fm.description || '',
      category: fm.category || '',
      articleCount: parseInt(fm.articleCount, 10) || 0,
      relatedEntities: (fm.relatedEntities || '').split('\n').filter(Boolean),
    });
  }

  console.log(`[themenbereich-entities] Parsed ${entities.length} entities with frontmatter`);

  // Score each entity against each Themenbereich
  const mapping = {};

  for (const [tbSlug, tbData] of Object.entries(THEMENBEREICHE_KEYWORDS)) {
    const scored = [];

    for (const entity of entities) {
      const s = scoreEntity(entity, tbData.keywords);
      if (s >= 2) {
        scored.push({ ...entity, score: s });
      }
    }

    // Deduplicate (an entity might match multiple areas — keep top score)
    // Sort by score desc, take top 20
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 20);

    // Calculate cloud font size (1.0 to 2.0 based on score)
    const maxScore = top.length > 0 ? top[0].score : 1;
    const minScore = top.length > 0 ? top[top.length - 1].score : 1;

    mapping[tbSlug] = top.map((e) => {
      const normalized = maxScore !== minScore ? (e.score - minScore) / (maxScore - minScore) : 0.5;
      const size = (1.0 + normalized * 1.0).toFixed(1); // 1.0 to 2.0 rem
      return {
        name: e.title.replace(/\s*\(.*?\)\s*/g, '').trim(), // Clean title
        slug: e.slug,
        count: e.articleCount || 1,
        size,
      };
    });

    if (mapping[tbSlug].length > 0) {
      console.log(`  ${tbSlug}: ${mapping[tbSlug].length} entities`);
    }
  }

  // Write output
  const outputDir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
  console.log(`[themenbereich-entities] Written to ${OUTPUT_PATH}`);
}
