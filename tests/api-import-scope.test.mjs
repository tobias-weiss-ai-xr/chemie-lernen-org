/**
 * Regression guard: API Docker image layout.
 *
 * The API image is built with build context ./api ONLY — repo-root paths
 * (e.g. scripts/) are absent inside the container. A relative import that
 * escapes the api/ root (like '../../scripts/...' from api/services/) loads
 * fine in the repo checkout but crashes the container at boot with
 * ERR_MODULE_NOT_FOUND → production /api/health → 502.
 *
 * This happened with api/services/zpd-engine.js after the Bloom×ZPD core
 * merge (3 consecutive failed deploys). Fix + guard: see 1d0f0aff.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_DIR = path.join(REPO_ROOT, 'api');

/** Collect every JS module under a directory (excluding node_modules). */
function collectJsFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectJsFiles(full));
    else if (/\.(?:js|cjs|mjs)$/.test(entry.name)) found.push(full);
  }
  return found;
}

/** Strip block + line comments so doc examples don't create false positives. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Extract relative ('.'-prefixed) import/require specifiers from source. */
function relativeSpecifiers(src) {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s*['"](\.[^'"]+)['"]/g,
    /\bimport\s*['"](\.[^'"]+)['"]/g,
    /require\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(src))) specifiers.add(match[1]);
  }
  return [...specifiers];
}

const CANDIDATE_SUFFIXES = ['', '.js', '.mjs', '.cjs', '.json'];

/** Resolve a relative specifier and check it exists (with Node resolution quirks). */
function resolveExists(baseDir, spec) {
  const resolved = path.resolve(baseDir, spec);
  return (
    CANDIDATE_SUFFIXES.some((suffix) => fs.existsSync(resolved + suffix)) ||
    fs.existsSync(path.join(resolved, 'index.js'))
  );
}

describe('api import scope (Docker image layout)', () => {
  it('every relative import stays inside api/ and resolves to an existing file', () => {
    const violations = [];
    for (const file of collectJsFiles(API_DIR)) {
      const src = stripComments(fs.readFileSync(file, 'utf8'));
      const dir = path.dirname(file);
      for (const spec of relativeSpecifiers(src)) {
        const resolved = path.resolve(dir, spec);
        const insideApi = resolved === API_DIR || resolved.startsWith(API_DIR + path.sep);
        if (!insideApi || !resolveExists(dir, spec)) {
          violations.push(`${path.relative(API_DIR, file)} -> '${spec}'`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
