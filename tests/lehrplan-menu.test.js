/**
 * Tests für UXF-042: Bundesland-Menu-Einträge -> 1 aggregierter Eintrag
 * Jest-compatible
 */
const { readFileSync, readdirSync } = require('fs');
const { resolve } = require('path');

const REPO = process.cwd();
const CONTENT_DIR = resolve(REPO, 'myhugoapp/content/curricula');

const STATES = [
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
  'sl',
  'sn',
  'st',
  'th',
];

describe('UXF-042: Lehrpläne Menü-Bereinigung', () => {
  describe('State-Pages ohne Menu-Einträge', () => {
    STATES.forEach((state) => {
      test(`State ${state} sollte keinen Menu-Block haben`, () => {
        const filepath = resolve(CONTENT_DIR, state, '_index.md');
        const content = readFileSync(filepath, 'utf-8');
        expect(content).not.toContain('menu:');
        expect(content).not.toContain('parent:');
        expect(content).not.toContain('lehrende');
      });
    });
  });

  describe('Central Curricula Index', () => {
    let indexContent;
    beforeAll(() => {
      indexContent = readFileSync(resolve(CONTENT_DIR, '_index.md'), 'utf-8');
    });

    test('sollte Menu-Block haben', () => {
      expect(indexContent).toContain('menu:');
    });

    test('sollte parent lehrende haben', () => {
      expect(indexContent).toContain("parent: 'lehrende'");
    });

    test('sollte weight 80 haben', () => {
      expect(indexContent).toContain('weight: 80');
    });

    test('sollte korrekten Titel haben', () => {
      expect(indexContent).toContain("title: 'Lehrpläne & Curricula'");
    });
  });

  describe('Verzeichnis-Struktur', () => {
    test('sollte alle 16 Bundesland-Verzeichnisse haben', () => {
      const dirs = readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((d) => !d.startsWith('_'))
        .sort();
      expect(dirs).toEqual(STATES.sort());
    });
  });

  describe('YAML Validität', () => {
    STATES.forEach((state) => {
      test(`State ${state} sollte valides YAML Frontmatter haben`, () => {
        const filepath = resolve(CONTENT_DIR, state, '_index.md');
        const content = readFileSync(filepath, 'utf-8');
        expect(content.trim()).toMatch(/^---/);
        const frontmatterEnd = content.indexOf('---', 3);
        expect(frontmatterEnd).not.toBe(-1);
        const frontmatter = content.slice(0, frontmatterEnd + 3);
        expect(frontmatter).not.toContain('lehrende');
      });
    });
  });
});
