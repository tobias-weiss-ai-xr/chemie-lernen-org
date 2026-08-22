#!/usr/bin/env node
/**
 * generate-learning-paths.mjs — Generate per-state learning paths from
 * imported curriculum data (Sprint 30).
 *
 * Reads all 16 state JSON files from myhugoapp/data/curricula/??.json,
 * groups SubTopics by curriculum state, and creates a learning-path
 * structure with links to related themenbereiche articles.
 *
 * Usage:
 *   node scripts/generate-learning-paths.mjs
 *   node scripts/generate-learning-paths.mjs --dry-run
 *
 * Output: myhugoapp/data/learning-paths.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(REPO_ROOT, 'myhugoapp', 'data', 'curricula');
const OUTPUT_FILE = path.join(REPO_ROOT, 'myhugoapp', 'data', 'learning-paths.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const ALL_STATES = [
  'bb',
  'be',
  'bw',
  'by',
  'hb',
  'he',
  'hh',
  'mv',
  'ni',
  'nw',
  'rp',
  'sh',
  'sn',
  'st',
  'th',
];

const STATE_LABELS = {
  bb: 'Brandenburg',
  be: 'Berlin',
  bw: 'Baden-Württemberg',
  by: 'Bayern',
  hb: 'Bremen',
  he: 'Hessen',
  hh: 'Hamburg',
  mv: 'Mecklenburg-Vorpommern',
  ni: 'Niedersachsen',
  nw: 'Nordrhein-Westfalen',
  rp: 'Rheinland-Pfalz',
  sh: 'Schleswig-Holstein',
  sn: 'Sachsen',
  st: 'Sachsen-Anhalt',
  th: 'Thüringen',
};

// ── Content-links lazy loader ─────────────────────────────────────

var _contentLinks = null;

function loadContentLinks() {
  if (_contentLinks) return _contentLinks;
  var fp = path.join(DATA_DIR, 'content-links.json');
  try {
    _contentLinks = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    _contentLinks = {};
  }
  return _contentLinks;
}

/**
 * Find articles matching a topic name via content-links.json.
 * Uses keyword extraction from the topic name to find links.
 */
function findArticlesForTopic(topicName) {
  if (!topicName) return [];
  var links = loadContentLinks();
  var results = [];
  var matched = {};

  // Extract keywords from topic name
  var keywords = topicName
    .toLowerCase()
    .replace(/[.,!?;:()"']/g, '')
    .split(/\s+/)
    .filter(function (w) {
      return w.length > 2;
    })
    .filter(function (w) {
      return (
        [
          'der',
          'die',
          'das',
          'den',
          'dem',
          'des',
          'ein',
          'eine',
          'einen',
          'einer',
          'eines',
          'mit',
          'von',
          'und',
          'oder',
          'fur',
          'für',
          'aus',
          'bei',
          'nach',
          'zum',
          'zur',
          'vom',
          'durch',
          'uber',
          'über',
          'auch',
          'nur',
          'noch',
          'schon',
          'wird',
          'werden',
          'sich',
          'ihre',
          'ihrer',
          'ihren',
          'sein',
          'seine',
          'ist',
          'sind',
          'hat',
          'haben',
          'wurde',
          'würde',
          'kann',
          'konnen',
          'können',
          'soll',
          'sollen',
          'muss',
          'müssen',
          'dass',
          'diese',
          'dieser',
          'dieses',
          'wenn',
          'nicht',
          'immer',
          'nun',
          'alle',
          'alles',
          'wie',
          'zum',
          'zur',
          'beim',
          'einer',
          'eines',
          'einem',
          'einen',
        ].indexOf(w) === -1
      );
    });

  if (keywords.length === 0) return [];

  // Search content-links keys for matches
  for (var key in links) {
    var keyLower = key.toLowerCase();
    var matchCount = 0;
    for (var ki = 0; ki < keywords.length; ki++) {
      if (keyLower.indexOf(keywords[ki]) !== -1) matchCount++;
    }
    // Require at least 50% of keywords to match
    if (matchCount > 0 && matchCount >= Math.ceil(keywords.length / 2)) {
      for (var li = 0; li < links[key].length; li++) {
        var item = links[key][li];
        var dedupKey = item.url + '|' + item.type;
        if (!matched[dedupKey]) {
          matched[dedupKey] = true;
          results.push({
            title: item.title || '',
            url: item.url || '',
            type: item.type || 'article',
          });
        }
      }
    }
  }

  // Deduplicate by URL and limit
  var seen = {};
  var unique = [];
  for (var ri = 0; ri < results.length; ri++) {
    var r = results[ri];
    if (!seen[r.url]) {
      seen[r.url] = true;
      unique.push(r);
    }
  }

  return unique.slice(0, 8);
}

// ── Extract topic name short form ────────────────────────────────

function getTopicShortName(fullTitle) {
  // Remove "Lernbereich N:" prefix
  var short = fullTitle.replace(/^Lernbereich\s+\d+:\s*/i, '');
  // Remove time suffix like "(ca. 25 Std.)"
  short = short.replace(/\s*\([^)]*\)\s*$/, '');
  // Take first 50 chars as the short name
  if (short.length > 60) short = short.slice(0, 57) + '...';
  return short;
}

// ── Load state data ──────────────────────────────────────────────

function loadStateData(code) {
  var fp = path.join(DATA_DIR, code + '.json');
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Build grade ranges ───────────────────────────────────────────

function parseGradeRange(grade) {
  if (!grade) return '?';
  var g = String(grade).trim();
  // Already a range like "7-10"
  if (/^\d+-\d+$/.test(g)) return g;
  // Single grade
  if (/^\d+$/.test(g)) return g;
  // Q-phase
  if (/^q/i.test(g)) return '11-12';
  // Sek I / Sek II
  if (/sek\s*i/i.test(g) && !/sek\s*ii/i.test(g)) return '7-10';
  if (/sek\s*ii/i.test(g)) return '11-13';
  if (/gesamt/i.test(g)) return '7-13';
  // E-phase
  if (/^e/i.test(g)) return '10';
  return g;
}

// ── Main generation ──────────────────────────────────────────────

function generate() {
  var output = [];
  var generatedCount = 0;

  for (var si = 0; si < ALL_STATES.length; si++) {
    var code = ALL_STATES[si];
    var data = loadStateData(code);
    if (!data) {
      console.log('  - %s: no data, skipping', code.toUpperCase());
      continue;
    }

    var stateName = data.state || STATE_LABELS[code] || code.toUpperCase();
    var stateAbbr = (data.state_abbr || code).toUpperCase();
    var schoolCurricula = data.school_curricula || [];

    if (schoolCurricula.length === 0) {
      console.log('  - %s: empty school_curricula, skipping', stateAbbr);
      continue;
    }

    // Aggregate all topics across school types and grade levels
    var allTopics = [];
    var gradeSet = {};

    for (var sci = 0; sci < schoolCurricula.length; sci++) {
      var sc = schoolCurricula[sci];
      var gradeLevels = sc.grade_levels || [];

      for (var gli = 0; gli < gradeLevels.length; gli++) {
        var gl = gradeLevels[gli];
        var grade = gl.grade || '?';
        var gradeRange = parseGradeRange(grade);
        gradeSet[gradeRange] = true;

        var topics = gl.topics || [];
        for (var ti = 0; ti < topics.length; ti++) {
          var topic = topics[ti];
          var subTopics = topic.sub_topics || [];

          var objectives;
          if (subTopics.length > 0) {
            // States with structured sub_topics (e.g. Bayern)
            for (var sti = 0; sti < subTopics.length; sti++) {
              var name = subTopics[sti].title;
              if (!name) continue;

              // Get objectives for this subtopic
              objectives = topic.learning_objectives || [];

              allTopics.push({
                name: getTopicShortName(name),
                fullName: name,
                grade: gradeRange,
                schoolType: sc.school_type || '',
                topicGroup: topic.title,
                objectiveCount: objectives.length,
                objectives: objectives.slice(0, 10).map(function (o) {
                  return typeof o === 'object' && o.text
                    ? o.text.slice(0, 200)
                    : String(o).slice(0, 200);
                }),
              });
            }
          } else {
            // States without sub_topics (just objectives at topic level)
            objectives = topic.learning_objectives || [];
            allTopics.push({
              name: getTopicShortName(topic.title),
              fullName: topic.title,
              grade: gradeRange,
              schoolType: sc.school_type || '',
              topicGroup: '',
              objectiveCount: objectives.length,
              objectives: objectives.slice(0, 10).map(function (o) {
                return typeof o === 'object' && o.text
                  ? o.text.slice(0, 200)
                  : String(o).slice(0, 200);
              }),
            });
          }
        }
      }
    }

    if (allTopics.length === 0) {
      console.log('  - %s: no topics extracted, skipping', stateAbbr);
      continue;
    }

    // Sort by grade then by name
    allTopics.sort(function (a, b) {
      if (a.grade !== b.grade) return a.grade < b.grade ? -1 : 1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });

    // Build grade range string
    var grades = Object.keys(gradeSet).sort();
    var gradeStr = grades.join(', ');

    // Build topics array with articles
    var pathTopics = [];
    for (var ti2 = 0; ti2 < allTopics.length; ti2++) {
      var tp = allTopics[ti2];
      var articles = findArticlesForTopic(tp.fullName || tp.name);
      pathTopics.push({
        name: tp.name,
        grade: tp.grade,
        schoolType: tp.schoolType,
        objectives: tp.objectiveCount,
        objectiveTexts: tp.objectives,
        articles: articles.map(function (a) {
          return a.url;
        }),
        articleTitles: articles.map(function (a) {
          return a.title;
        }),
      });
    }

    var entry = {
      state: stateAbbr,
      name: stateName + ' Chemie Lehrplan',
      grade: gradeStr,
      schoolTypes: schoolCurricula
        .map(function (sc) {
          return sc.school_type || '';
        })
        .filter(Boolean),
      topicCount: pathTopics.length,
      totalObjectives: pathTopics.reduce(function (s, t) {
        return s + t.objectives;
      }, 0),
      topics: pathTopics,
    };

    output.push(entry);
    generatedCount++;
    console.log(
      '  ✓ %s (%s): %d topics, %d objectives, grades %s',
      stateAbbr,
      stateName,
      pathTopics.length,
      entry.totalObjectives,
      gradeStr
    );
  }

  if (DRY_RUN) {
    console.log('\n[Dry-run] Would write %d learning paths to %s', generatedCount, OUTPUT_FILE);
    return;
  }

  // Ensure output directory exists
  var outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log('\n✓ Written %d learning paths to %s', generatedCount, OUTPUT_FILE);
}

// ── Run ──────────────────────────────────────────────────────────

console.log('Generating per-state learning paths from curriculum data...');
console.log('Data directory:', DATA_DIR);
console.log('');

try {
  generate();
  process.exit(0);
} catch (err) {
  console.error('Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
