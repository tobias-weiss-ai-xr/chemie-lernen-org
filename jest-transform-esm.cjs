/**
 * jest-transform-esm.cjs
 *
 * Minimal ESM → CommonJS transformer for Jest.
 *
 * The project mixes module systems:
 *   - `scripts/*.mjs` and `api/**` (api/package.json has "type": "module") are ESM
 *   - everything else is CJS / plain-script
 *
 * Jest 30 requires `--experimental-vm-modules` (via NODE_OPTIONS) to execute
 * ESM. All npm test scripts set that flag, but bare `npx jest` does not —
 * which used to fail the ESM test suites with "A dynamic import callback was
 * invoked without --experimental-vm-modules". This transformer lets those
 * tests load the ESM modules as CJS, so the full suite runs under ANY
 * invocation (npm scripts or bare jest).
 *
 * Only applied to the handful of ESM files under test. All of them use simple
 * named `export function` / `export const` syntax — no default exports, no
 * top-level await, no dynamic imports inside the modules themselves.
 */

module.exports = {
  process(sourceText, sourcePath, options) {
    // When Jest runs with NODE_OPTIONS=--experimental-vm-modules, ESM files
    // are loaded as native ES modules — no transformation needed (transforming
    // them to CJS would fail: `require`/`module` are undefined in ESM context).
    if (options && options.supportsStaticESM) {
      return { code: sourceText, map: null };
    }

    const exported = [];
    let code = sourceText
      // import default from 'x'
      .replace(
        /^import\s+([A-Za-z_$][\w$]*)\s+from\s+(['"][^'"]+['"])\s*;?$/gm,
        'const $1 = require($2);'
      )
      // import { a, b as c } from 'x'
      .replace(
        /^import\s*\{([^}]*)\}\s*from\s+(['"][^'"]+['"])\s*;?$/gm,
        'const { $1 } = require($2);'
      )
      // import * as ns from 'x'
      .replace(
        /^import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s+(['"][^'"]+['"])\s*;?$/gm,
        'const $1 = require($2);'
      )
      // import 'x' (side-effect only)
      .replace(/^import\s+(['"][^'"]+['"])\s*;?$/gm, 'require($1);')
      // import.meta.url → CJS: delete `__filename`/`__dirname` recreation lines
      // (CJS injects both as wrapper params; redeclaring them is a SyntaxError).
      .replace(
        /^const\s+(__dirname|__filename)\s*=\s*(?:path\.dirname\(fileURLToPath\(import\.meta\.url\)\)|fileURLToPath\(import\.meta\.url\)|path\.dirname\(__filename\)|__filename)\s*;?$/gm,
        ''
      )
      .replace(/import\.meta\.url/g, 'require("url").pathToFileURL(__filename).href')
      // export const x / export function x / export class x / export let x / export var x
      .replace(
        /^export\s+(?:(async)\s+)?(const|function|class|let|var)\s+([A-Za-z_$][\w$]*)/gm,
        (m, asyncKw, kw, name) => {
          exported.push(name);
          return `${asyncKw ? 'async ' : ''}${kw} ${name}`;
        }
      )
      // export { a, b as c }  (single line only)
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('export {')) return line;
        if (!(trimmed.endsWith('}') || trimmed.endsWith('};'))) return line;
        const inner = trimmed.slice(trimmed.indexOf('{') + 1, trimmed.lastIndexOf('}')).trim();
        if (!inner) return '';
        for (const part of inner.split(',')) {
          const name = part.trim();
          if (!name) continue;
          const asIdx = name.indexOf(' as ');
          exported.push((asIdx === -1 ? name : name.slice(0, asIdx)).trim());
        }
        return '';
      })
      .join('\n')
      // export default async function name(...) / export default class name(...)
      .replace(
        /^export\s+default\s+(?:async\s+)?(function|class)\s+([A-Za-z_$][\w$]*)/gm,
        (m, kw, name) => {
          exported.push(name);
          return `${kw} ${name}`;
        }
      )
      // export default <expr> (none used; strip keyword defensively)
      .replace(/^export\s+default\s+/gm, '');

    if (exported.length > 0) {
      code += `\nmodule.exports = { ${[...new Set(exported)].join(', ')} };\n`;
    }

    return { code, map: null };
  },

  /**
   * Include the ESM/CJS mode in the cache key. Without this, a transform
   * cached in one mode (e.g. bare `npx jest`) would be reused in the other
   * (NODE_OPTIONS=--experimental-vm-modules), producing "require is not
   * defined" / "module is not defined" errors from stale cached output.
   */
  getCacheKey(sourceText, sourcePath, configString, options) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(sourceText)
      .update(sourcePath)
      .update(JSON.stringify(configString))
      .update(options && options.supportsStaticESM ? 'esm' : 'cjs')
      .digest('hex');
  },
};
