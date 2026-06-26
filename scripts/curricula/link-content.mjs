#!/usr/bin/env node
/**
 * link-content.mjs v3 — Map curriculum topics to platform content.
 *
 * Strategy: extract significant keywords from content (articles, calculators),
 * then find curriculum topics whose names contain those keywords (substring match).
 * No generic domain keyword list — direct name matching avoids false positives.
 *
 * Usage:
 *   node scripts/curricula/link-content.mjs          # full run
 *   node scripts/curricula/link-content.mjs --dry-run # print stats
 *   node scripts/curricula/link-content.mjs --out ../path
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const THEMENS_DIR = join(ROOT, 'myhugoapp', 'content', 'themenbereiche');
const CONTENT_DIR = join(ROOT, 'myhugoapp', 'content');
const CURRICULA_DIR = join(ROOT, 'myhugoapp', 'data', 'curricula');
const DEFAULT_OUTPUT = join(CURRICULA_DIR, 'content-links.json');
const CACHE_DIR = join(ROOT, '.omo', 'evidence');

const STOPWORDS = new Set([
  'und',
  'die',
  'der',
  'das',
  'von',
  'mit',
  'fuer',
  'auf',
  'bei',
  'aus',
  'durch',
  'nach',
  'dem',
  'den',
  'des',
  'ein',
  'eine',
  'einer',
  'eines',
  'nicht',
  'sich',
  'auch',
  'als',
  'im',
  'am',
  'um',
  'zum',
  'zur',
  'oder',
  'in',
  'an',
  'zu',
  'ist',
  'werden',
  'wird',
  'sind',
  'ueber',
  'vor',
  'bis',
  'haben',
  'hat',
  'ihre',
  'sein',
  'kein',
  'uebungen',
  'aufgaben',
  'rechner',
  'grundlagen',
  'verstehen',
]);

// Single-word stop tokens that should never match as substrings
// These are too generic and cause false positives
const STOP_TOKENS = new Set([
  'rechner',
  'grundlagen',
  'verstehen',
  'berechnen',
  'interaktiv',
  'uebungen',
  'aufgaben',
  'aufgabe',
  'lernen',
  'erklaerung',
  'chemie',
  'organische',
  'anorganische',
  'wichtig',
  'verschiedene',
  'verschieden',
]);

// Pages to exclude from matching (non-chemistry content)
const SKIP_PAGES = new Set([
  'dashboard.md',
  'datenschutz.md',
  'impressum.md',
  'der-hackprozess.md',
  'pwa-offline.md',
  'unterstuetzen.md',
  'fortschritt.md',
]);

function parseFrontmatter(text) {
  const meta = {};
  const lines = text.split('\n');
  let i = 0;
  if (lines[i] && lines[i].trim() === '---') i++;
  else return meta;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') break;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith('[') && value.endsWith(']')) {
      const arr = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''));
      meta[key] = arr;
    } else {
      meta[key] = value;
    }
  }
  return meta;
}

function tokenize(text) {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return [...new Set(words)];
}

function normalizeUmlaut(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/**
 * Extract meaningful keyword tokens from content metadata.
 * Returns tokens that can be used for substring matching against topic names.
 */
function extractContentKeywords(title, description, tags, teilgebiet) {
  const sourceText = [
    normalizeUmlaut(title || ''),
    normalizeUmlaut(description || ''),
    ...(Array.isArray(tags) ? tags : tags ? [tags] : []).map((t) => normalizeUmlaut(t)),
    ...(Array.isArray(teilgebiet) ? teilgebiet : teilgebiet ? [teilgebiet] : []).map((tg) =>
      normalizeUmlaut(tg)
    ),
  ].join(' ');

  const tokens = tokenize(sourceText);
  // Filter out generic stop tokens and very short tokens
  return tokens.filter((t) => !STOP_TOKENS.has(t));
}

/**
 * Normalize topic name for matching.
 */
function normalizeTopicName(name) {
  return normalizeUmlaut(name)
    .replace(/^lernbereich\s+\d+:?\s*/i, '')
    .replace(/^inhalt\s+\d+:?\s*/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\d+[.-]\d+/g, '')
    .replace(/\d+\.\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function scanArticles() {
  const articles = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.md') && entry !== '_index.md') {
        const fm = parseFrontmatter(readFileSync(full, 'utf8'));
        if (fm.title) {
          const url = '/' + full.replace(ROOT + '/myhugoapp/content/', '').replace(/\.md$/, '/');
          const keywords = extractContentKeywords(fm.title, fm.description, fm.tags, fm.teilgebiet);
          if (keywords.length > 0) {
            articles.push({
              type: 'article',
              title: fm.title,
              url,
              keywords,
            });
          }
        }
      }
    }
  }
  walk(THEMENS_DIR);
  return articles;
}

function scanCalculatorPages() {
  const calculators = [];
  for (const file of readdirSync(CONTENT_DIR)) {
    if (!file.endsWith('.md')) continue;
    const full = join(CONTENT_DIR, file);
    if (!statSync(full).isFile()) continue;
    // Skip _index.md (section pages) and excluded pages
    if (file === '_index.md' || SKIP_PAGES.has(file)) continue;
    const fm = parseFrontmatter(readFileSync(full, 'utf8'));
    if (fm.title) {
      const keywords = extractContentKeywords(fm.title, fm.description, fm.tags, fm.teilgebiet);
      if (keywords.length > 0) {
        calculators.push({
          type: 'calculator',
          title: fm.title,
          url: '/' + file.replace(/\.md$/, '/'),
          keywords,
        });
      }
    }
  }
  return calculators;
}

function scanCurriculumTopics() {
  const topics = [];
  const files = readdirSync(CURRICULA_DIR).filter(
    (f) =>
      f.endsWith('.json') && !['index.json', 'checksums.json', 'content-links.json'].includes(f)
  );
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(CURRICULA_DIR, file), 'utf8'));
    if (!data.school_curricula) continue;
    for (const sc of data.school_curricula) {
      for (const gl of sc.grade_levels) {
        for (const t of gl.topics) {
          const normalized = normalizeTopicName(t.title);
          const objTexts = (t.learning_objectives || []).map((o) => o.text).join(' ');
          const objKeywords = tokenize(normalizeUmlaut(objTexts));
          topics.push({
            name: t.title,
            normalized,
            state: data.state,
            stateAbbr: data.state_abbr,
            schoolType: sc.school_type,
            grade: gl.grade,
            objKeywords,
          });
        }
      }
    }
  }
  return topics;
}

/**
 * Match content item to curriculum topics using direct keyword substring matching.
 * A content keyword matches a topic if it appears as a substring in the normalized topic name.
 */
function matchContentToTopics(contentItem, topics) {
  const matches = [];

  for (const topic of topics) {
    const matchedKeywords = [];

    for (const kw of contentItem.keywords) {
      // Check if content keyword appears in normalized topic name
      if (topic.normalized.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }

    if (matchedKeywords.length > 0) {
      matches.push({
        name: topic.name,
        state: topic.state,
        stateAbbr: topic.stateAbbr,
        schoolType: topic.schoolType,
        grade: topic.grade,
        matchedKeywords,
        score: matchedKeywords.length,
      });
    }
  }

  // Sort by score descending, then by keyword specificity (prefer longer keywords)
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aLen = a.matchedKeywords.reduce((s, k) => s + k.length, 0);
    const bLen = b.matchedKeywords.reduce((s, k) => s + k.length, 0);
    return bLen - aLen;
  });

  return matches;
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const useNeo4j = args.includes('--neo4j');
  const outIdx = args.indexOf('--out');
  const outputPath = outIdx !== -1 ? args[outIdx + 1] : DEFAULT_OUTPUT;

  console.log('[link-content] Scanning articles...');
  const articles = scanArticles();
  console.log('  ' + articles.length + ' articles with keywords');
  for (const a of articles) {
    console.log('    ' + a.title.padEnd(50) + ' [' + a.keywords.join(', ') + ']');
  }

  console.log('\n[link-content] Scanning calculator pages...');
  const calculators = scanCalculatorPages();
  console.log('  ' + calculators.length + ' calculators with keywords');
  for (const c of calculators) {
    console.log('    ' + c.title.padEnd(50) + ' [' + c.keywords.join(', ') + ']');
  }

  console.log('\n[link-content] Reading curriculum topics...');
  const allTopics = scanCurriculumTopics();
  console.log('  ' + allTopics.length + ' total topics');

  const allContent = [...articles, ...calculators];

  const linkMap = new Map();
  let totalLinks = 0;
  const linkedTopics = new Set();

  for (const content of allContent) {
    const matches = matchContentToTopics(content, allTopics);

    // Only keep matches with score >= 1
    const validMatches = matches.filter((m) => m.score >= 1);

    if (validMatches.length > 0) {
      // Limit to top 20 per content item
      const topMatches = validMatches.slice(0, 20);
      for (const match of topMatches) {
        if (!linkMap.has(match.name)) {
          linkMap.set(match.name, []);
        }
        linkMap.get(match.name).push({
          type: content.type,
          title: content.title,
          url: content.url,
          matchedKeywords: match.matchedKeywords,
          score: match.score,
        });
        totalLinks++;
        linkedTopics.add(match.name);
      }
    }
  }

  const nameMatchCount = linkMap.size;

  console.log('\n[link-content] Results:');
  console.log('  Topics linked (name match): ' + linkedTopics.size + ' / ' + allTopics.length);
  console.log('  Total relations: ' + totalLinks);
  console.log('  Avg per linked topic: ' + (totalLinks / (linkedTopics.size || 1)).toFixed(1));
  console.log(
    '  Content items matched: ' +
      allContent.filter((c) => {
        for (const [, v] of linkMap) {
          if (v.some((l) => l.title === c.title)) return true;
        }
        return false;
      }).length +
      ' / ' +
      allContent.length
  );

  if (nameMatchCount > 0) {
    const sorted = [...linkMap.entries()]
      .map(([k, v]) => ({
        name: k,
        count: v.length,
        score: v.reduce((s, l) => s + l.score, 0) / v.length,
      }))
      .sort((a, b) => b.count - a.count);

    console.log('\n  Top 15 most linked topics:');
    sorted
      .slice(0, 15)
      .forEach((t) =>
        console.log(
          '    ' +
            t.name.slice(0, 47).padEnd(47) +
            ' ' +
            t.count +
            ' links (avg score ' +
            t.score.toFixed(1) +
            ')'
        )
      );

    console.log('\n  Top 15 content items (by links made):');
    const contentLinkCount = {};
    for (const [, v] of linkMap) {
      for (const l of v) {
        const key = l.title;
        if (!contentLinkCount[key])
          contentLinkCount[key] = { title: l.title, type: l.type, url: l.url, count: 0 };
        contentLinkCount[key].count++;
      }
    }
    const sortedContent = Object.values(contentLinkCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    sortedContent.forEach((c) =>
      console.log(
        '    [' +
          c.type.slice(0, 1) +
          '] ' +
          c.title.slice(0, 44).padEnd(44) +
          ' ' +
          c.count +
          ' topics'
      )
    );
  }

  if (isDryRun) {
    console.log('\n  --dry-run: no output written');
    return;
  }

  const output = {};
  for (const [k, v] of linkMap) {
    output[k] = v;
  }
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  const outSize = (JSON.stringify(output).length / 1024).toFixed(0);
  console.log(
    '\n[link-content] Written to ' +
      outputPath +
      ' (' +
      Object.keys(output).length +
      ' topics, ' +
      outSize +
      ' KB)'
  );

  if (existsSync(CACHE_DIR)) {
    const stats = {
      articles: articles.length,
      calculators: calculators.length,
      contentTotal: allContent.length,
      topics: allTopics.length,
      linkedTopics: linkedTopics.size,
      totalLinks,
      coverage: Math.round((linkedTopics.size / allTopics.length) * 100),
    };
    writeFileSync(
      join(CACHE_DIR, 'link-content-stats.json'),
      JSON.stringify(stats, null, 2),
      'utf8'
    );
  }

  // A5: Optional Neo4j import of content links as node properties
  if (useNeo4j && !isDryRun) {
    (async () => {
      console.log('\n[link-content] Importing to Neo4j...');
      try {
        const __require = createRequire(import.meta.url);
        const neo4j = __require('neo4j-driver');
        const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
        const NEO4J_PASS = process.env.NEO4J_PASS || 'chemie_knowledge_2024';
        const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASS));
        const session = driver.session({ database: 'chemie' });
        let stored = 0;
        let failed = 0;
        let skipped = 0;
        for (const [topicName, links] of linkMap) {
          try {
            const topLinks = links
              .slice(0, 30)
              .map((l) => ({ type: l.type, title: l.title, url: l.url }));
            const result = await session.run(
              'MATCH (e:Entity {name: $name}) SET e.contentLinks = $links RETURN e.name',
              { name: topicName, links: JSON.stringify(topLinks) }
            );
            if (result.records.length > 0) {
              stored++;
            } else {
              skipped++;
            }
          } catch (e) {
            failed++;
            if (failed <= 3)
              console.warn(
                '    [warn] Neo4j set failed for "' + topicName.slice(0, 40) + '": ' + e.message
              );
          }
        }
        await session.close();
        await driver.close();
        console.log(
          '  Neo4j: ' + stored + ' topics updated, ' + skipped + ' not found, ' + failed + ' errors'
        );
      } catch (e) {
        console.warn('[link-content] Neo4j import error: ' + e.message);
      }
    })();
  }
}

main();
