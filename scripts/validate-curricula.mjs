#!/usr/bin/env node
/**
 * validate-curricula.mjs
 *
 * Validates all curriculum JSON files in myhugoapp/data/curricula/.
 * Produces a JSON report with per-state quality scores.
 * Always exits 0 — CI integration should inspect the report, not the exit code.
 *
 * Checks:
 *   - Required top-level fields (state, state_abbr, school_curricula)
 *   - Topic count and objective count per state
 *   - Flags states with <10 topics or <50 objectives as degraded
 *   - Flags states with >5% garbled text (non-ASCII control characters)
 *
 * Usage: node scripts/validate-curricula.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'myhugoapp', 'data', 'curricula');

const REQUIRED_FIELDS = ['state', 'state_abbr', 'school_curricula'];

// Non-ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F-0x9F)
// Excluding standard whitespace (tab 0x09, LF 0x0A, CR 0x0D)
// eslint-disable-next-line no-control-regex
const GARBLED_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g;

const TOPIC_MIN = 10;
const OBJECTIVE_MIN = 50;
const GARBLED_RATIO_MAX = 0.05;

function analyze(filePath, code) {
  const result = {
    file: code + '.json',
    state: code.toUpperCase(),
    valid: false,
    issues: [],
    topics: 0,
    objectives: 0,
    cleanTopics: 0,
    garbledTopics: 0,
    garbledChars: 0,
    totalChars: 0,
    score: 0,
    grade: 'F',
  };

  try {
    if (!existsSync(filePath)) {
      result.issues.push('File not found');
      return result;
    }

    const raw = readFileSync(filePath, 'utf-8');
    result.totalChars = raw.length;

    // Count garbled characters
    while (GARBLED_RE.exec(raw) !== null) {
      result.garbledChars++;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      result.issues.push('Invalid JSON: ' + parseErr.message);
      return result;
    }

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!data[field]) {
        result.issues.push('Missing required field: ' + field);
      }
    }

    if (data.state) result.state = data.state;
    if (data.state_abbr) result.state = data.state_abbr.toUpperCase();

    // Check source_urls (optional but recommended)
    if (!data.source_urls || data.source_urls.length === 0) {
      result.issues.push('No source_urls (missing or empty)');
    }

    // Analyze school_curricula structure
    const schoolCurricula = data.school_curricula || [];
    if (schoolCurricula.length === 0) {
      result.issues.push('school_curricula is empty');
    }

    for (const sc of schoolCurricula) {
      const gradeLevels = sc.grade_levels || [];
      if (gradeLevels.length === 0) {
        result.issues.push('grade_levels is empty in school_type: ' + (sc.school_type || '?'));
      }

      for (const gl of gradeLevels) {
        const topics = gl.topics || [];
        for (const topic of topics) {
          result.topics++;
          const objectives = topic.learning_objectives || [];
          result.objectives += objectives.length;

          // Check if topic title is garbled
          const titleText = topic.title || '';
          const titleGarbled = (titleText.match(GARBLED_RE) || []).length;
          const objTexts = objectives.map((o) => o.text || '').join(' ');
          const objGarbled = (objTexts.match(GARBLED_RE) || []).length;

          if (titleGarbled > 0 || objGarbled > 0) {
            result.garbledTopics++;
          } else {
            result.cleanTopics++;
          }
        }
      }
    }

    // Score calculation (0-100)
    // 40 points: topic count sufficiency
    let topicScore = result.topics >= TOPIC_MIN ? 40 : (result.topics / TOPIC_MIN) * 40;
    // 30 points: objective count sufficiency
    let objScore = result.objectives >= OBJECTIVE_MIN ? 30 : (result.objectives / OBJECTIVE_MIN) * 30;
    // 30 points: data cleanliness (inverse of garbled ratio)
    let garbledRatio = result.totalChars > 0 ? result.garbledChars / result.totalChars : 0;
    let cleanScore = garbledRatio <= GARBLED_RATIO_MAX ? 30 : Math.max(0, 30 * (1 - garbledRatio / 0.2));

    result.score = Math.round(Math.min(100, topicScore + objScore + cleanScore));

    // Grade mapping
    if (result.score >= 90) result.grade = 'A';
    else if (result.score >= 70) result.grade = 'B';
    else if (result.score >= 50) result.grade = 'C';
    else if (result.score >= 25) result.grade = 'D';
    else result.grade = 'F';

    // Flag degradation
    if (result.topics < TOPIC_MIN) {
      result.issues.push('Degraded: only ' + result.topics + ' topics (min ' + TOPIC_MIN + ')');
    }
    if (result.objectives < OBJECTIVE_MIN) {
      result.issues.push(
        'Degraded: only ' + result.objectives + ' objectives (min ' + OBJECTIVE_MIN + ')'
      );
    }
    if (garbledRatio > GARBLED_RATIO_MAX) {
      result.issues.push(
        'Degraded: ' +
          (garbledRatio * 100).toFixed(1) +
          '% garbled characters (max ' +
          GARBLED_RATIO_MAX * 100 +
          '%)'
      );
    }

    result.valid = result.issues.length === 0;
    return result;
  } catch (err) {
    result.issues.push('Unexpected error: ' + err.message);
    return result;
  }
}

// ── Main ──────────────────────────────────────────
function main() {
  const startTime = Date.now();

  // Known state codes for completeness check (18 Bundesländer including city-states)
  const KNOWN_STATES = [
    'bb', 'be', 'bw', 'by', 'hb', 'he', 'hh',
    'mv', 'ni', 'nw', 'rp', 'sh', 'sl', 'sn', 'st', 'th',
  ];

  const results = {};
  let totalTopics = 0;
  let totalObjectives = 0;
  let validCount = 0;
  let degradedCount = 0;

  for (const code of KNOWN_STATES) {
    const filePath = join(DATA_DIR, code + '.json');
    const result = analyze(filePath, code);
    results[code.toUpperCase()] = result;
    totalTopics += result.topics;
    totalObjectives += result.objectives;
    if (result.valid) validCount++;
    if (result.issues.length > 0) degradedCount++;
  }

  // Build report
  const report = {
    generated: new Date().toISOString(),
    duration: Date.now() - startTime,
    summary: {
      totalStates: KNOWN_STATES.length,
      validStates: validCount,
      statesWithIssues: degradedCount,
      totalTopics,
      totalObjectives,
      averageScore: Math.round(
        KNOWN_STATES.reduce((s, c) => s + (results[c.toUpperCase()]?.score || 0), 0) /
          KNOWN_STATES.length
      ),
    },
    states: results,
  };

  // Write report
  const reportPath = join(DATA_DIR, 'quality-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // Console summary
  console.log('=== Curriculum Validation Report ===');
  console.log('Generated:', new Date().toISOString());
  console.log('');
  console.log('Code  | State                | Topics | Objvs | Grade | Issues');
  console.log('------+----------------------+--------+-------+-------+-------');

  for (const code of KNOWN_STATES) {
    const r = results[code.toUpperCase()];
    const stateLabel = r.state.padEnd(20).slice(0, 20);
    const topicsStr = String(r.topics).padStart(6);
    const objsStr = String(r.objectives).padStart(5);
    const gradeStr = r.grade.padEnd(5);
    const issueCount = r.issues.length;
    const issueIcon = issueCount === 0 ? '✅' : issueCount <= 2 ? '⚠️' : '❌';
    console.log(
      `${code.toUpperCase().padEnd(5)}| ${stateLabel} | ${topicsStr} | ${objsStr} | ${gradeStr} | ${issueIcon} ${issueCount}`
    );
  }

  console.log('');
  console.log('--- Summary ---');
  console.log('States examined:', KNOWN_STATES.length);
  console.log('Valid states:', validCount);
  console.log('States with issues:', degradedCount);
  console.log('Total topics:', totalTopics);
  console.log('Total objectives:', totalObjectives);
  console.log('Average quality score:', report.summary.averageScore);
  console.log('Report written to: data/curricula/quality-report.json');
  console.log('');
  console.log('Validation complete (exit 0)');

  // Always exit 0 — CI checks the report, not the exit code
  process.exit(0);
}

main();
