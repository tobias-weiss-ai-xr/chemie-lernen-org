import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { execSync } from 'node:child_process';
import { storeArticleWithEntities, close as closeKg } from './knowledge-graph.mjs';
import { buildEntityGraph } from '@graphwiz/builder';
import { setTimeout } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const FEEDS_PATH = join(__dirname, 'feeds.json');
const POSTS_DIR = join(REPO_ROOT, 'myhugoapp', 'content', 'posts');
const URLS_DB = join(POSTS_DIR, '.urls.json');
const MAX_ARTICLES = 3;
const LITELLM_URL = 'http://localhost:4000/chat/completions';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || '';
const LITELLM_MODEL = process.env.LITELLM_MODEL || 'saia/qwen3.5-397b-a17b';

// ===== CALCULATOR AUTO-LINKING =====
const CALCULATOR_MAP = [
  {
    path: '/ph-rechner/',
    keywords: ['ph', 'säure', 'base', 'wasserstoffionen', 'ph-wert', 'acid', 'alkalisch'],
  },
  {
    path: '/stoechiometrie-rechner/',
    keywords: [
      'stöchiometrie',
      'stoffmenge',
      'mol',
      'reaktionsgleichung',
      ' stoichiometr',
      'molverhältnis',
    ],
  },
  {
    path: '/molare-masse-rechner/',
    keywords: ['molare masse', 'molekulargewicht', 'molmasse', 'molekülmasse', 'molar mass'],
  },
  {
    path: '/konzentrationsumrechner/',
    keywords: ['konzentration', 'molar', 'verdünnung', 'einheiten', 'concentration', 'dilution'],
  },
  {
    path: '/titrations-simulator/',
    keywords: ['titration', 'äquivalenzpunkt', 'neutralisation', 'titrieren', 'titrimetrie'],
  },
  {
    path: '/redox-potenzial-rechner/',
    keywords: ['redox', 'oxidation', 'reduktion', 'spannung', 'nernst', 'potential', 'oxidat'],
  },
  {
    path: '/loeslichkeitsprodukt-rechner/',
    keywords: ['löslichkeit', 'ksp', 'fällung', 'löslichkeitsprodukt', 'solubility', 'precipitate'],
  },
  {
    path: '/gasgesetz-rechner/',
    keywords: ['gasgesetz', 'pvnrt', 'boyle', 'gay-lussac', 'ideales gas', 'gas law', 'pressure'],
  },
  {
    path: '/gasgesetz-simulator/',
    keywords: ['gasgesetz', 'pvnrt', 'boyle', 'gay-lussac', 'ideales gas'],
  },
  {
    path: '/verbrennungsrechner/',
    keywords: ['verbrennung', 'heizwert', 'brennwert', 'co2', 'emission', 'combustion'],
  },
  {
    path: '/sauren-basen-gleichgewicht/',
    keywords: [
      'säure-base',
      'gleichgewicht',
      'henderson',
      'hasselbalch',
      'puffer',
      'puffersystem',
      'buffer',
    ],
  },
  {
    path: '/bindungspotential/',
    keywords: ['bindung', 'potential', 'energieprofil', 'aktivierungsenergie', 'morse', 'binding'],
  },
  {
    path: '/hess-gesetz/',
    keywords: ['hess', 'enthalpie', 'thermochemie', 'reaktionswärme', 'energieerhaltung'],
  },
  {
    path: '/reaktionskinetik-simulator/',
    keywords: ['kinetik', 'reaktionsgeschwindigkeit', 'arrhenius', 'reaction rate', 'kinetic'],
  },
  {
    path: '/chemisches-gleichgewicht/',
    keywords: ['gleichgewicht', 'massenwirkungsgesetz', 'le chatelier', 'equilibrium', 'mwg'],
  },
  {
    path: '/perioden-system-der-elemente/',
    keywords: ['periodensystem', 'pse', 'element', 'gruppen', 'perioden', 'periodic table'],
  },
  {
    path: '/periodische-trends/',
    keywords: [
      'trends',
      'atomradius',
      'ionisierungsenergie',
      'elektronegativität',
      'periodic trends',
    ],
  },
  {
    path: '/molekuelorbitale/',
    keywords: ['orbital', 'molekülorbital', 'mo-theorie', 'hybridisierung', 'molecular orbital'],
  },
  {
    path: '/elektrochemie-teilchenebene/',
    keywords: ['elektrochemie', 'elektrolyse', 'galvanisch', 'elektrode', 'electrochem'],
  },
  {
    path: '/molekuel-studio/',
    keywords: ['molekül', 'molekülgeometrie', '3d', 'vsepr', 'molecular', 'molecule'],
  },
  {
    path: '/atomenergieniveaus/',
    keywords: ['atom', 'energieniveau', 'bohr', 'spektrum', 'atommodell', 'electron config'],
  },
  {
    path: '/temperatur-teilchenbewegung/',
    keywords: ['temperatur', 'teilchenbewegung', 'kinetisch', 'thermisch', 'wärme'],
  },
  {
    path: '/waermeleitung/',
    keywords: ['wärmeleitung', 'konduktion', 'wärmeübertragung', 'thermal conduction'],
  },
  { path: '/konvektion/', keywords: ['konvektion', 'strömung', 'wärmeübertragung', 'convection'] },
  {
    path: '/druck-flaechen-rechner/',
    keywords: ['druck', 'kraft', 'fläche', 'pascal', 'pressure', 'force'],
  },
  {
    path: '/atmosphaerendruck-alltag/',
    keywords: ['luftdruck', 'atmosphärendruck', 'barometer', 'atmospheric pressure'],
  },
  {
    path: '/saeuren-basen-gleichgewicht/',
    keywords: ['säure', 'base', 'gleichgewicht', 'henderson', 'hasselbalch', 'puffer'],
  },
  {
    path: '/uebungsgenerator/',
    keywords: ['übung', 'aufgabe', 'quiz', 'test', 'practice', 'exercise'],
  },
  { path: '/lernpfad/', keywords: ['lernpfad', 'lernweg', 'guided', 'tour', 'tutorial'] },
  { path: '/lueckentexte/', keywords: ['lückentext', 'cloze', 'drag', 'drop', 'fill'] },
];

// Chemistry relevance scoring
const CHEMISTRY_KEYWORDS = [
  'chem',
  'molecul',
  'atom',
  'bond',
  'reaction',
  'cataly',
  'synthesis',
  'compound',
  'element',
  'periodic',
  'electron',
  'proton',
  'neutron',
  'ph ',
  'acid',
  'base',
  'buffer',
  'titration',
  'redox',
  'oxidation',
  'reduction',
  'equilibrium',
  'kinetic',
  'thermodynam',
  'enthalpy',
  'entropy',
  'gibbs',
  'gas law',
  'solution',
  'concentration',
  'molar',
  'spectroscop',
  'nmr',
  'ir ',
  'mass spec',
  'crystal',
  'solid state',
  'organic',
  'inorganic',
  'polymer',
  'nanomater',
  'electrochem',
  'photochem',
  'biochem',
  'protein',
  'enzyme',
  'catalyst',
  'ligand',
  'coordination',
  'ionic',
  'covalent',
  'metallic',
  'hybrid',
  'orbital',
  'quantum chem',
  'materials sci',
  'battery',
  'fuel cell',
  'solar',
  'perovskite',
  'superconduct',
  'zeolite',
  'metal org',
  'wasserstoff',
  'saeure',
  'base',
  'salz',
  'metall',
  'oxid',
  'katalys',
  'synthese',
  'reaktion',
  'loesung',
  'gleichgewicht',
  'thermodynamik',
  'kinetik',
  'spektroskop',
  'elektrochem',
];

const NON_CHEMISTRY_KEYWORDS = [
  'machine learning',
  'deep learning',
  'neural network',
  'ai ',
  'artificial intelligence',
  'llm',
  'large language model',
  'transformer',
  'reinforcement learning',
  'computer vision',
  'nlp',
  'natural language',
  'autonomous',
  'robot',
  'software',
  'algorithm',
  'data science',
  'big data',
  'cloud',
  'blockchain',
  'cryptocurrenc',
];

function chemistryScore(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  for (const kw of CHEMISTRY_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score += 2;
  }
  for (const kw of NON_CHEMISTRY_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score -= 3;
  }
  return score;
}

// ===== RETRY UTILITY =====
async function withRetry(fn, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
      console.log(
        `[pipeline] Retry ${attempt}/${maxRetries} for "${label}" in ${delay}ms: ${err.message}`
      );
      await setTimeout(delay);
    }
  }
}

// Map article text to relevant calculators
function findRelatedCalculators(title, description, tags) {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  const matched = [];
  for (const calc of CALCULATOR_MAP) {
    for (const kw of calc.keywords) {
      if (text.includes(kw.toLowerCase())) {
        matched.push(calc);
        break; // One match per calculator is enough
      }
    }
  }
  return matched;
}

function buildRelatedSection(calculators) {
  if (calculators.length === 0) return '';
  // Deduplicate by path
  const seen = new Set();
  const unique = [];
  for (const c of calculators) {
    if (!seen.has(c.path)) {
      seen.add(c.path);
      unique.push(c);
    }
  }
  // Limit to 4
  const items = unique.slice(0, 4);
  const links = items
    .map((c) => `🔬 [${c.path.replace(/\//g, ' ').trim()} →](${c.path})`)
    .join('\n');
  return `\n\n---\n\n### 🧪 Verwandte Rechner\n\nMit diesen interaktiven Werkzeugen können Sie das Thema vertiefen:\n\n${links}\n`;
}

const FEED_UA = 'Mozilla/5.0 (compatible; chemie-lernen-article-bot/1.0)';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  maxDepth: 0,
});

const SYSTEM_PROMPT = `Du bist ein Chemie-Redakteur für chemie-lernen.org.
Fasse den folgenden Artikel auf Deutsch zusammen (max. 300 Wörter).
Ergänze Hintergrundwissen wenn relevant.
Formatiere chemische Formeln mit KaTeX ($...$ oder $$...$$).

Antworte GENAU in diesem Format:

Titel: <max 80 Zeichen, aussagekräftig>

<Deutsche Zusammenfassung, max 300 Wörter>

Hintergrund: <optional, 1-2 Sätze Hintergrundwissen>

Tags: <3-5 tags, kommagetrennt, z.B. chemie, bindung, quantenchemie>

Entitäten: <pro Zeile eine Entität im Format: name | kategorie>
Mögliche Kategorien: stoff, konzept, methode, person, reaktion

Die Entitäten-Liste sollte 5-10 Einträge umfassen. Wähle die für den Artikel spezifischsten und wichtigsten Begriffe aus — vermeide sehr allgemeine Begriffe wie "wasser", "sauerstoff", "kohlenstoff" oder "chemie". Bevorzuge spezifische Fachbegriffe, Verbindungsnamen, Reaktionstypen, Katalysatoren, Analysemethoden oder beteiligte Forschungseinrichtungen.

Beispiel:
Entitäten:
ammoniak | stoff
photokatalyse | konzept
hdx-massenspektrometrie | methode
martin-luther-universität | person
kunststoffabbau | reaktion

Wichtig: Tags und Entitäten nur Kleinschreibung, keine Sternchen oder Formatierung.`;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function dateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoDateStr() {
  return new Date().toISOString().replace(/\.\d{3}Z/, '+02:00');
}

async function fetchFeed(url, feedErrors) {
  const headers = { 'User-Agent': FEED_UA };
  // If feed errored in last hour, skip
  const errorState = feedErrors.get(url);
  if (errorState && Date.now() - errorState.ts < 3600000) {
    console.log(`[pipeline]  Skipping ${url} (had error ${errorState.diff}s ago)`);
    return null;
  }
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parser.parse(await res.text());
}

function extractItems(parsed) {
  if (parsed.rss?.channel?.item) {
    const items = parsed.rss.channel.item;
    return Array.isArray(items) ? items : [items];
  }
  const feed = parsed.feed || parsed['feed'] || null;
  if (feed?.entry) {
    return Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  }
  const rdf = parsed['rdf:RDF'] || null;
  if (rdf?.item) {
    return Array.isArray(rdf.item) ? rdf.item : [rdf.item];
  }
  return [];
}

function extractTitle(item) {
  const t = item.title || item['title'] || item['title$t'] || '';
  if (typeof t === 'string') return t;
  if (t['#text']) return t['#text'];
  return '';
}

function extractLink(item) {
  const link = item.link || item['link'];
  if (typeof link === 'string') return link;
  if (link?.['@_href']) return link['@_href'];
  if (Array.isArray(link)) {
    for (const l of link) {
      if (typeof l === 'string') return l;
      if (l['@_href']) return l['@_href'];
    }
  }
  return '';
}

function extractDescription(item) {
  const raw =
    item.description ||
    item['description'] ||
    item.summary ||
    item['summary'] ||
    item['content'] ||
    item['content:encoded'] ||
    '';
  if (typeof raw === 'string') return raw.replace(/<[^>]*>/g, '').trim();
  if (raw['#text']) return raw['#text'].replace(/<[^>]*>/g, '').trim();
  return '';
}

async function _generateArticleRaw(title, description, sourceUrl) {
  const headers = { 'Content-Type': 'application/json' };
  if (LITELLM_API_KEY) headers['Authorization'] = `Bearer ${LITELLM_API_KEY}`;
  const res = await fetch(LITELLM_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: LITELLM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Quelle: ${sourceUrl}\n\nTitel: ${title}\n\nText:\n${description.slice(0, 3000)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`litellm HTTP ${res.status}`);
  const msg = (await res.json()).choices[0].message;
  return (msg.content || msg.reasoning_content || '').trim();
}

// Wrapper with retry
async function generateArticle(title, description, sourceUrl) {
  return withRetry(
    () => _generateArticleRaw(title, description, sourceUrl),
    `generate "${title.slice(0, 50)}"`,
    3
  );
}

function parseGeneratedText(text) {
  let title = '';
  let tags = [];
  let entities = [];
  let description = '';

  const titleMatch = text.match(/^Titel:\s*(.+)/m);
  if (titleMatch) {
    title = titleMatch[1].replace(/[*#]/g, '').trim();
  }

  const tagMatch = text.match(/Tags?:?\s*(.+)/i);
  if (tagMatch) {
    tags = tagMatch[1]
      .split(',')
      .map((t) =>
        t
          .trim()
          .replace(/^[*#\s]+|[*#]+$/g, '')
          .toLowerCase()
      )
      .filter(Boolean);
  }

  // Parse entities — supports multi-line "name | category" or comma-separated
  const entitySection = text.match(
    /Entitäten?:?\s*([\s\S]*?)(?:\n\s*\n|\n(?=Tags?:|Titel:|Hintergrund:|$))/i
  );
  if (entitySection) {
    const raw = entitySection[1].trim();
    entities = raw
      .split('\n')
      .map((line) => {
        // Extract name before optional "|" separator
        let name = line.split('|')[0].trim();
        // Remove bullet points, asterisks, dashes
        name = name.replace(/^[-*•\s]+|[-*]+$/g, '').trim();
        return name.toLowerCase();
      })
      .filter((e) => e.length > 2 && !e.match(/^[,;\s]+$/));
    // Fallback: if no newlines, try comma-separated
    if (entities.length <= 1 && raw.indexOf('\n') === -1) {
      entities = raw
        .split(',')
        .map((e) =>
          e
            .trim()
            .replace(/^[*#\s]+|[*#]+$/g, '')
            .toLowerCase()
        )
        .filter((e) => e.length > 2);
    }
  }

  // Extract first meaningful sentence as description
  const bodyLines = text
    .split('\n')
    .filter((l) => !l.match(/^(Titel|Tags?|Hintergrund|Entitäten?):/i) && l.trim());
  for (const line of bodyLines) {
    const clean = line.replace(/[*#$]/g, '').trim();
    if (clean.length > 30) {
      description = clean.slice(0, 200);
      break;
    }
  }

  if (!title) {
    const firstLine = text.split('\n').find((l) => l.trim());
    title = (firstLine || '').replace(/^#\s*/, '').replace(/[*"]/g, '').trim().slice(0, 80);
  }

  return { title, tags: tags.length ? tags : ['chemie', 'forschung'], entities, description };
}

// ===== SOURCE VERIFICATION =====

async function verifySource(sourceUrl) {
  const result = { available: false, statusCode: 0, paperLinks: [] };
  try {
    const res = await fetch(sourceUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': FEED_UA },
    });
    result.statusCode = res.status;
    result.available = res.ok;

    // Only fetch body if we got a 200
    if (res.ok) {
      const body = await (
        await fetch(sourceUrl, {
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': FEED_UA },
        })
      ).text();

      // Normalize DOI URL to canonical form
      const normalizeDoiUrl = (url) => {
        const doiMatch = url.match(/10\.\d{4,}\/[^\s"<>?]+/);
        return doiMatch ? `https://doi.org/${doiMatch[0].replace(/["'.]+$/, '')}` : url;
      };
      const linkSet = new Set();
      const patterns = [
        /https?:\/\/(?:dx\.)?doi\.org\/[^\s"<>]+/gi,
        /https?:\/\/arxiv\.org\/(?:abs|pdf)\/[^\s"<>]+/gi,
        /https?:\/\/pubs\.acs\.org\/doi\/[^\s"<>]+/gi,
        /https?:\/\/(?:www\.)?nature\.com\/articles\/[^\s"<>]+/gi,
        /https?:\/\/(?:www\.)?science\.org\/doi\/[^\s"<>]+/gi,
        /https?:\/\/pubs\.rsc\.org\/[^\s"<>]+/gi,
        /https?:\/\/onlinelibrary\.wiley\.com\/doi\/[^\s"<>]+/gi,
      ];
      for (const pat of patterns) {
        for (const m of body.matchAll(pat)) {
          linkSet.add(normalizeDoiUrl(m[0].replace(/["']$/, '')));
        }
      }
      // Also extract bare DOIs (without https://doi.org/)
      const bareDoiPat = /\b(10\.\d{4,}\/[^\s"<>]+)/gi;
      for (const m of body.matchAll(bareDoiPat)) {
        const doi = m[1].replace(/["']/g, '').replace(/\.$/, '');
        if (doi.length > 5 && doi.length < 100) {
          linkSet.add(`https://doi.org/${doi}`);
        }
      }
      result.paperLinks = [...linkSet].slice(0, 3);
    }
  } catch {
    result.statusCode = 0;
    result.available = false;
  }
  return result;
}

function buildFrontmatter(title, date, tags, description, sourceUrl) {
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedDesc = (description || '').replace(/"/g, '\\"').slice(0, 200);
  const tagLines = tags.map((t) => `  - "${t}"`).join('\n');
  return `---
title: "${escapedTitle}"
date: "${date}"
description: "${escapedDesc}"
source: "${sourceUrl}"
tags:
${tagLines}
categories: ["forschung"]
draft: false
---`;
}

function buildMarkdown(frontmatter, bodyContent, relatedSection, sourceUrl, verification) {
  const body = bodyContent
    .split('\n')
    .filter((l) => !l.match(/^(Titel|Tags?):/i) && !l.match(/^#\s+.+/))
    .join('\n')
    .trim();

  let sourceSection = `\n\n---\n\n### 📄 Quelle\n\n[Nachrichten-Artikel](${sourceUrl})`;

  if (verification) {
    if (!verification.available) {
      sourceSection += ` ⚠️ (Status ${verification.statusCode || 'nicht erreichbar'})`;
    }
    if (verification.paperLinks && verification.paperLinks.length > 0) {
      sourceSection +=
        '\n\n' +
        verification.paperLinks.map((link) => `📄 [Original-Publikation](${link})`).join('\n');
    }
  }

  sourceSection += '\n';
  return `${frontmatter}\n\n${body}\n${sourceSection}\n${relatedSection}\n`;
}

async function loadSeenUrls() {
  try {
    return new Set(JSON.parse(await readFile(URLS_DB, 'utf-8')));
  } catch {
    return new Set();
  }
}

async function saveSeenUrl(url) {
  const seen = await loadSeenUrls();
  seen.add(url);
  await writeFile(URLS_DB, JSON.stringify([...seen], null, 2));
}

async function run() {
  const startTime = Date.now();
  console.log(`[pipeline] Starting at ${new Date().toISOString()}`);

  const currentModel = process.env.LITELLM_MODEL || 'saia/qwen3.5-397b-a17b';
  const metrics = {
    startedAt: new Date().toISOString(),
    articlesGenerated: 0,
    articlesFailed: 0,
    feedErrors: 0,
    kgErrors: 0,
    durationMs: 0,
    model: currentModel,
  };

  const feeds = JSON.parse(await readFile(FEEDS_PATH, 'utf-8'));
  const seenUrls = await loadSeenUrls();
  const feedErrors = new Map();
  const candidates = [];

  // Parallel feed fetching
  const feedResults = await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        console.log(`[pipeline] Fetching ${feed.url}`);
        const parsed = await fetchFeed(feed.url, feedErrors);
        if (!parsed) return [];
        const items = extractItems(parsed);
        console.log(`[pipeline]   Got ${items.length} items from ${feed.url}`);
        return items.map((item) => ({
          title: extractTitle(item),
          description: extractDescription(item),
          url: extractLink(item),
          lang: feed.lang,
        }));
      } catch (err) {
        feedErrors.set(feed.url, { ts: Date.now(), err: err.message });
        metrics.feedErrors++;
        console.error(`[pipeline] Error fetching ${feed.url}: ${err.message}`);
        return [];
      }
    })
  );

  for (const result of feedResults) {
    for (const item of result.status === 'fulfilled' ? result.value : []) {
      if (!item.url || seenUrls.has(item.url)) continue;
      if (item.description.length < 100) continue;
      candidates.push(item);
    }
  }

  // Sort by chemistry relevance, then description length as tiebreaker
  candidates.sort((a, b) => {
    const scoreDiff =
      chemistryScore(b.title, b.description) - chemistryScore(a.title, a.description);
    if (scoreDiff !== 0) return scoreDiff;
    return b.description.length - a.description.length;
  });
  const selected = candidates.slice(0, MAX_ARTICLES);
  console.log(
    `[pipeline] Selected ${selected.length} articles to generate (${candidates.length} total candidates)`
  );

  if (!existsSync(POSTS_DIR)) {
    await mkdir(POSTS_DIR, { recursive: true });
  }

  const kgDumpArticles = [];
  const aggregatedEntityCategories = new Map();

  for (const article of selected) {
    try {
      console.log(`[pipeline] Generating: ${article.title}`);
      const generated = await generateArticle(article.title, article.description, article.url);
      const { title, tags, entities, description } = parseGeneratedText(generated);
      const slug = slugify(title);
      const filename = `${dateStr()}-${slug}.md`;

      // Append related calculators
      const relatedCalcs = findRelatedCalculators(title, article.description, tags);
      const relatedSection = buildRelatedSection(relatedCalcs);
      if (relatedCalcs.length > 0) {
        console.log(`[pipeline]   Linked ${relatedCalcs.length} calculator(s) for "${title}"`);
      }

      // Verify source and extract paper links
      console.log(`[pipeline]   Verifying source: ${article.url}`);
      const verification = await verifySource(article.url);
      if (verification.available) {
        console.log(`[pipeline]   Source is available (HTTP ${verification.statusCode})`);
        if (verification.paperLinks.length > 0) {
          console.log(
            `[pipeline]   Found ${verification.paperLinks.length} paper link(s): ${verification.paperLinks.join(', ')}`
          );
        }
      } else {
        console.log(`[pipeline]   Source status: ${verification.statusCode || 'unreachable'}`);
      }

      const frontmatter = buildFrontmatter(title, isoDateStr(), tags, description, article.url);
      const markdown = buildMarkdown(
        frontmatter,
        generated,
        relatedSection,
        article.url,
        verification
      );
      await writeFile(join(POSTS_DIR, filename), markdown);
      await saveSeenUrl(article.url);
      console.log(`[pipeline] Wrote ${filename}`);

      // Store in Knowledge Graph (article + tags + entities)
      try {
        const kgUrl = `https://chemie-lernen.org/posts/${filename.replace(/\.md$/, '/')}`;

        // Extract entity categories from raw LLM output (format: "name|kategorie")
        const entityCategories = {};
        const entitySection = generated.match(
          /Entitäten?:?\s*([\s\S]*?)(?:\n\s*\n|\n(?=Tags?:|Titel:|Hintergrund:|$))/i
        );
        if (entitySection) {
          entitySection[1]
            .trim()
            .split('\n')
            .forEach((line) => {
              const parts = line.split('|');
              if (parts.length >= 2) {
                const name = parts[0]
                  .trim()
                  .replace(/^[-*•\s]+|[-*]+$/g, '')
                  .trim()
                  .toLowerCase();
                const category = parts[1].trim();
                if (name.length > 2) entityCategories[name] = category;
              }
            });
        }

        await storeArticleWithEntities({
          title,
          source: article.url,
          date: isoDateStr(),
          description,
          tags,
          entities,
          url: kgUrl,
          entityCategories: Object.keys(entityCategories).length ? entityCategories : undefined,
        });

        // Aggregate categories for the dump
        for (const [name, cat] of Object.entries(entityCategories)) {
          if (!aggregatedEntityCategories.has(name)) {
            aggregatedEntityCategories.set(name, cat);
          }
        }
        if (entities.length > 0) {
          console.log(
            `[pipeline]   Stored in KG with ${entities.length} entit(ies): ${entities.join(', ')}`
          );
        } else {
          console.log(`[pipeline]   Stored in KG (no entities extracted)`);
        }

        // Accumulate for KG data dump
        kgDumpArticles.push({ title, url: kgUrl, description, tags, entities, date: isoDateStr() });
        metrics.articlesGenerated++;
      } catch (kgErr) {
        metrics.kgErrors++;
        console.error(`[pipeline]   KG store error: ${kgErr.message}`);
      }
    } catch (err) {
      metrics.articlesFailed++;
      console.error(`[pipeline] Error generating "${article.title}": ${err.message}`);
    }
  }

  // Write KG data dump for Hugo frontend
  try {
    const kgDataDir = join(REPO_ROOT, 'myhugoapp', 'data');
    await mkdir(kgDataDir, { recursive: true });
    // Build unique entity index from all articles
    const entityMap = new Map();
    for (const a of kgDumpArticles) {
      for (const e of a.entities || []) {
        if (!entityMap.has(e)) {
          entityMap.set(e, {
            name: e,
            articleCount: 0,
            articles: [],
            category: null,
            relatedEntities: [],
          });
        }
        entityMap.get(e).articleCount++;
        entityMap.get(e).articles.push(a.title);
      }
    }

    // Compute co-occurrence (related entities) via @graphwiz/builder
    const coGraph = buildEntityGraph(kgDumpArticles);
    for (const edge of coGraph.edges) {
      const e1 = entityMap.get(edge.source);
      const e2 = entityMap.get(edge.target);
      if (e1 && !e1.relatedEntities.includes(edge.target)) e1.relatedEntities.push(edge.target);
      if (e2 && !e2.relatedEntities.includes(edge.source)) e2.relatedEntities.push(edge.source);
    }

    // Apply aggregated categories
    for (const [name, category] of aggregatedEntityCategories) {
      const entry = entityMap.get(name);
      if (entry) entry.category = category;
    }

    const kgDump = {
      articles: kgDumpArticles,
      entities: [...entityMap.values()].sort((a, b) => b.articleCount - a.articleCount),
      updatedAt: isoDateStr(),
    };
    await writeFile(join(kgDataDir, 'kg_data.json'), JSON.stringify(kgDump, null, 2));
    console.log(`[pipeline] Wrote kg_data.json (${kgDumpArticles.length} articles)`);
  } catch (dumpErr) {
    console.error(`[pipeline] KG dump error: ${dumpErr.message}`);
  }

  // Write pipeline status for monitoring
  metrics.durationMs = Date.now() - startTime;
  metrics.durationMin = (metrics.durationMs / 60000).toFixed(1);
  try {
    const statusPath = join(REPO_ROOT, 'myhugoapp', 'static', 'data');
    await mkdir(statusPath, { recursive: true });
    await writeFile(join(statusPath, 'pipeline-status.json'), JSON.stringify(metrics, null, 2));
    console.log(
      `[pipeline] Pipeline status: ${metrics.articlesGenerated} OK, ${metrics.articlesFailed} failed, ${metrics.feedErrors} feed errs, ${metrics.durationMin}min`
    );
  } catch (statusErr) {
    console.error(`[pipeline] Status write error: ${statusErr.message}`);
  }

  // Append to pipeline history
  try {
    const historyPath = join(REPO_ROOT, 'myhugoapp', 'static', 'data', 'pipeline-history.json');
    let history = [];
    try {
      history = JSON.parse(await readFile(historyPath, 'utf-8'));
      if (!Array.isArray(history)) history = [];
    } catch {
      /* file may not exist yet */
    }
    history.push(metrics);
    await mkdir(dirname(historyPath), { recursive: true });
    await writeFile(historyPath, JSON.stringify(history, null, 2));
  } catch (histErr) {
    console.error(`[pipeline] History write error: ${histErr.message}`);
  }

  if (selected.length > 0) {
    try {
      console.log(`[pipeline] Committing and pushing...`);
      // Targeted add: never sweep unrelated working-tree junk (coverage/,
      // logs/, *.bak, ...) into the auto-commit.
      execSync(
        'git add myhugoapp/content/posts myhugoapp/static/data myhugoapp/data',
        { cwd: REPO_ROOT, stdio: 'pipe' }
      );
      execSync(`git commit -m "articles: ${dateStr()}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
      execSync('git push', { cwd: REPO_ROOT, stdio: 'pipe' });
      console.log(`[pipeline] Pushed successfully`);
    } catch (err) {
      console.error(`[pipeline] Git error: ${err.message}`);
    }
  }

  // Close KG connection
  try {
    await closeKg();
  } catch {
    /* ignore */
  }

  console.log(`[pipeline] Done`);
}

run().catch((err) => {
  console.error(`[pipeline] Fatal: ${err.message}`);
  process.exit(1);
});
