/**
 * Tests für UXF-043: Bundesland-Dropdown auf /curricula/
 * Jest-compatible (kein jsdom nötig, nur String-Analyse)
 */
const { readFileSync } = require('fs');
const { resolve } = require('path');

const REPO = process.cwd();
const HTML_FILE = resolve(REPO, 'myhugoapp/layouts/_default/curricula-index.html');
const html = readFileSync(HTML_FILE, 'utf-8');

const BUNDESLANDER = [
  { code: 'bw', name: 'Baden-Württemberg' },
  { code: 'by', name: 'Bayern' },
  { code: 'be', name: 'Berlin' },
  { code: 'bb', name: 'Brandenburg' },
  { code: 'hb', name: 'Bremen' },
  { code: 'hh', name: 'Hamburg' },
  { code: 'he', name: 'Hessen' },
  { code: 'mv', name: 'Mecklenburg-Vorpommern' },
  { code: 'ni', name: 'Niedersachsen' },
  { code: 'nw', name: 'Nordrhein-Westfalen' },
  { code: 'rp', name: 'Rheinland-Pfalz' },
  { code: 'sl', name: 'Saarland' },
  { code: 'sn', name: 'Sachsen' },
  { code: 'st', name: 'Sachsen-Anhalt' },
  { code: 'sh', name: 'Schleswig-Holstein' },
  { code: 'th', name: 'Thüringen' },
];

describe('UXF-043: Lehrpläne Bundesland-Dropdown', () => {
  describe('HTML-Struktur', () => {
    test('sollte Dropdown-Element mit id state-select enthalten', () => {
      expect(html).toContain('id="state-select"');
    });

    test('sollte Label für Dropdown enthalten', () => {
      expect(html).toContain('Bundesland auswählen:');
    });

    test('sollte onchange Handler haben', () => {
      expect(html).toContain('onchange=');
    });

    test('sollte innerhalb von curricula-grid sein', () => {
      expect(html).toContain('class="curricula-grid bundesland-dropdown"');
    });
  });

  describe('Alle 16 Bundesländer', () => {
    BUNDESLANDER.forEach(({ code, name }) => {
      test(`sollte Option ${code} (${name}) enthalten`, () => {
        expect(html).toContain(`value="${code}">${name}</option>`);
      });
    });

    test('sollte Platzhalter-Option haben', () => {
      expect(html).toContain('<option value="" selected disabled>');
    });
  });

  describe('CSS', () => {
    test('sollte bundesland-dropdown Klasse haben', () => {
      expect(html).toContain('.bundesland-dropdown');
    });

    test('sollte CSS für select haben', () => {
      expect(html).toContain('.bundesland-dropdown select');
    });

    test('sollte Hover/Focus Styles haben', () => {
      expect(html).toContain('.bundesland-dropdown select:hover');
      expect(html).toContain('.bundesland-dropdown select:focus');
    });
  });

  describe('a11y', () => {
    test('sollte aria-label haben', () => {
      expect(html).toContain('aria-label="Bundesland Lehrplan auswählen"');
    });

    test('sollte label mit for Attribut haben', () => {
      expect(html).toContain('for="state-select"');
    });
  });

  describe('Alte Elemente entfernt', () => {
    test('sollte kein curricula-skeleton HTML haben', () => {
      expect(html).not.toContain('<div class="curricula-skeleton"');
    });

    test('sollte kein curricula-state-card HTML haben', () => {
      expect(html).not.toContain('<button class="curricula-state-card');
    });

    test('sollte UXF-043 Marker haben', () => {
      expect(html).toContain('UXF-043 Dropdown');
    });
  });

  describe('Navigation', () => {
    test('sollte location.href Navigation haben', () => {
      expect(html).toContain("location.href='/curricula/'");
    });
  });
});
