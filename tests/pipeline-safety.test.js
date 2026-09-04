/**
 * pipeline-safety.test.js — regression guards for the article-pipeline + kg_data
 * contract that cost us ~620 live entity pages on 2026-09-04.
 *
 * The 04:42 timer run (scripts/article-pipeline.mjs) USED to overwrite the
 * canonical build-time myhugoapp/data/kg_data.json with an article-scoped dump
 * ({articles:[...], entities:[]}), collapsing 715 -> 0 entities. CI's prebuild
 * (generate-entity-pages.mjs) then synced content/entity/ against that subset
 * and pruned the entity directory in production.
 *
 * These tests guard the fix so a refactor never silently restores the clobber:
 *  - the pipeline writes its run-scoped snapshot to kg_data.run.json (gitignored)
 *  - the pipeline NEVER writes directly to the shared myhugoapp/data/kg_data.json
 *  - kg_data.run.json is in .gitignore
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const GITIGNORE = path.join(REPO_ROOT, '.gitignore');
const ARTICLE_PIPELINE = path.join(REPO_ROOT, 'scripts', 'article-pipeline.mjs');
const RUN_DUMP = 'kg_data.run.json';
const BUILD_INPUT = 'kg_data.json';

describe('pipeline: kg_data clobber prevention', () => {
  const src = fs.readFileSync(ARTICLE_PIPELINE, 'utf8');

  test('pipeline writes its dump to the run-scoped kg_data.run.json', () => {
    expect(src).toMatch(new RegExp(`['"\`]${RUN_DUMP}['"\`]`));
  });

  test('pipeline never writes to the shared build-time kg_data.json', () => {
    // No writeFile/appendFile targeting the build input (the export script is
    // the only component allowed to refresh it, via scripts/export-kg-data.mjs).
    expect(src).not.toMatch(new RegExp(`writeFile\\([^)]*${BUILD_INPUT}`));
    expect(src).not.toMatch(new RegExp(`appendFile\\([^)]*${BUILD_INPUT}`));
  });

  test('kg_data.run.json is git-ignored', () => {
    const gi = fs.readFileSync(GITIGNORE, 'utf8');
    expect(gi).toMatch(/myhugoapp\/data\/kg_data\.run\.json/);
    // And the canonical full export is tracked, not ignored.
    expect(
      // strip comments before checking the effective ignore spec
      gi
        .split('\n')
        .filter((l) => !l.trim().startsWith('#'))
        .some((l) => l.includes('myhugoapp/data/kg_data.json'))
    ).toBe(false);
  });

  test('the canonical kg_data.json is tracked, the run dump is not', () => {
    const lsFiles = (f) =>
      execSync(`git ls-files ${f}`, { cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
        .toString()
        .trim();
    expect(lsFiles('myhugoapp/data/kg_data.json')).toBe('myhugoapp/data/kg_data.json');
    expect(lsFiles('myhugoapp/data/kg_data.run.json')).toBe('');
  });
});
