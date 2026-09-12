/**
 * Guard-Tests für die Vitest-Projekt-Zuordnung (vitest.config.ts).
 *
 * Die node-/happy-dom-Listen werden manuell regeneriert (Kommentare in der
 * Config) — diese Tests verhindern Drift:
 *  - node-env-Files dürfen KEINE direkten DOM-Referenzen haben.
 *  - happy-dom-Files dürfen KEINE <script>-Injection nutzen (braucht jsdom
 *    runScripts:'dangerously' — vgl. lazy-loader/ui-utils, die zurückgestuft
 *    wurden).
 */
const fs = require('fs');
const path = require('path');

const MY = path.join(__dirname, '..', 'myhugoapp');
const TESTS = path.join(__dirname);
const read = (p) => fs.readFileSync(path.join(TESTS, p), 'utf8');

const list = (f) =>
  read(f)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

describe('Vitest-Projekt-Listen: Konsistenz-Guards', () => {
  test('node-env-Files: keine DOM-Referenzen im Test-Source', () => {
    for (const f of list('node-env-files.txt')) {
      const src = fs.readFileSync(path.join(TESTS, f), 'utf8');
      expect([
        f,
        /document\.|window\.|HTMLElement|localStorage|navigator|DOMParser|jsdom/.test(src),
      ]).toEqual([f, false]);
    }
  });

  test('happy-dom-Files: keine <script>-Injection (braucht jsdom)', () => {
    for (const f of list('happy-dom-files.txt')) {
      const src = fs.readFileSync(path.join(TESTS, f), 'utf8');
      expect([
        f,
        /createElement\(\s*['"]script['"]\s*\)|window\.eval|\.appendChild\(/.test(src),
      ]).toEqual([f, false]);
    }
  });

  test('Listen überlappen nicht und decken nur existierende Files ab', () => {
    const node = new Set(list('node-env-files.txt'));
    const happy = new Set(list('happy-dom-files.txt'));
    for (const f of happy) {
      expect([f, node.has(f)]).toEqual([f, false]);
      expect(fs.existsSync(path.join(TESTS, f))).toBe(true);
    }
    for (const f of node) {
      expect(fs.existsSync(path.join(TESTS, f))).toBe(true);
    }
  });
});
