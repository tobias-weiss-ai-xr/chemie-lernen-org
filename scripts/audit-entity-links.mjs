#!/usr/bin/env node
/**
 * Link audit — walks a built Hugo public/ tree and fails on any /entity/
 * href that resolves to neither a canonical entity page nor a legacy alias
 * (redirect) page. Runs as a Docker build stage and as
 * `node scripts/audit-entity-links.mjs [publicDir]`.
 *
 * The canonical-slug mapping is delegated to the shared slugs module
 * (scripts/lib/slugs.mjs) so the browser, the page generator and the
 * audit can never drift apart.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './lib/slugs.mjs';

const SCRIPT_RE = /<script[^>]*>[\s\S]*?<\/script>/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const HREF_RE = /<a[^>]+href=([^\s>]+)/gi;

/**
 * Extract real <a href> values pointing at /entity/… (absolute or
 * same-origin), URL-decoded. Inline <script> bodies and HTML comments are
 * stripped first so comments mentioning `<script>` and generated
 * client-side anchors can never fake or hide a broken link.
 */
export function extractEntityHrefs(html) {
  const stripped = html.replace(COMMENT_RE, '').replace(SCRIPT_RE, '');
  const out = [];
  let m;
  while ((m = HREF_RE.exec(stripped)) !== null) {
    let href = m[1].replace(/^["']|["']$/g, '').split('#')[0].split('?')[0];
    if (href.startsWith('//')) continue;
    if (href.startsWith('http')) {
      try {
        const u = new URL(href);
        if (u.hostname !== 'chemie-lernen.org') continue;
        href = u.pathname;
      } catch {
        continue;
      }
    }
    if (href.startsWith('/entity/')) {
      try {
        out.push(decodeURIComponent(href));
      } catch {
        out.push(href);
      }
    }
  }
  return out;
}

/**
 * Which hrefs do NOT map to a known canonical slug?
 * Root links (/entity/, breadcrumbs to the index) are valid and skipped.
 */
export function findBrokenLinks(hrefs, knownSlugs) {
  const problems = [];
  for (const href of hrefs) {
    const slug = href.replace(/^\/entity\//, '').replace(/\/+$/, '');
    if (!slug) continue; // breadcrumb / index links to /entity/ itself
    const canonical = slugify(slug);
    if (!knownSlugs.has(canonical)) {
      problems.push({ href, canonical });
    }
  }
  return problems;
}

/**
 * Missing page files for the given hrefs inside a built tree.
 * Every /entity/X/ href must have an index.html — either the canonical
 * page or a Hugo-generated legacy alias (redirect) page.
 */
export function missingPages(root, hrefs) {
  const missing = [];
  for (const href of hrefs) {
    if (href === '/entity/' || href === '/entity') continue; // breadcrumb to the index
    const rel = href.replace(/^\/+/, '');
    const file = join(root, rel, 'index.html'); // href ends with '/'
    if (!existsSync(file)) missing.push(href);
  }
  return missing;
}

function collectHrefs(root, out = []) {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== 'pagefind') collectHrefs(full, out);
    } else if (entry.endsWith('.html')) {
      try {
        out.push(...extractEntityHrefs(readFileSync(full, 'utf8')));
      } catch {
        /* skip unreadable */
      }
    }
  }
  return out;
}

function main() {
  const root = resolve(process.argv[2] || 'myhugoapp/public');
  if (!existsSync(root)) {
    console.error('[audit] public dir not found: ' + root);
    process.exit(1);
  }
  const hrefs = [...new Set(collectHrefs(root))];
  console.log('[audit] /entity/ hrefs found: ' + hrefs.length);

  // Known slugs: every directory directly under public/entity/
  const entityDir = join(root, 'entity');
  const knownSlugs = existsSync(entityDir)
    ? readdirSync(entityDir).filter((e) => statSync(join(entityDir, e)).isDirectory())
    : [];
  const canonicalBroken = findBrokenLinks(hrefs, new Set(knownSlugs));
  const missing = missingPages(root, hrefs);

  console.log('[audit] canonical-mismatch: ' + canonicalBroken.length);
  for (const p of canonicalBroken)
    console.log('  ✗ ' + p.href + ' → canonical ' + p.canonical + ' (currently missing)');
  console.log('[audit] missing files: ' + missing.length);
  for (const p of missing) console.log('  ✗ ' + p);

  if (canonicalBroken.length > 0 || missing.length > 0) {
    console.error('[audit] FAIL: dead /entity/ links detected');
    process.exit(1);
  }
  console.log('[audit] OK: all entity links resolvable');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}