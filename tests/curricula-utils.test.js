/**
 * tests/curricula-utils.test.js — Tests für UXF-002/007 Pure Functions
 */
const {
  parseUrlState,
  buildUrl,
  buildCompareCsv,
} = require('../myhugoapp/static/js/utils/curricula-utils.js');

describe('CurriculaUtils.parseUrlState (UXF-002)', () => {
  test('leere URL → Default-State', () => {
    expect(parseUrlState('', '')).toEqual({
      tab: null,
      schulform: null,
      klasse: null,
      vergleich: [],
    });
  });

  test('tab=advanced wird erkannt', () => {
    expect(parseUrlState('?tab=advanced', '').tab).toBe('advanced');
  });

  test('ungültiger tab → null', () => {
    expect(parseUrlState('?tab=hack', '').tab).toBeNull();
  });

  test('schulform und klasse werden gelesen', () => {
    const s = parseUrlState('?schulform=Gymnasium&klasse=11', '');
    expect(s.schulform).toBe('Gymnasium');
    expect(s.klasse).toBe('11');
  });

  test('vergleich aus Query', () => {
    expect(parseUrlState('?vergleich=BB,BY', '').vergleich).toEqual(['BB', 'BY']);
  });

  test('vergleich aus Hash (fallback)', () => {
    expect(parseUrlState('', '#vergleich=bb,by,sh').vergleich).toEqual(['BB', 'BY', 'SH']);
  });

  test('vergleich auf max 3 begrenzt', () => {
    expect(parseUrlState('?vergleich=BB,BY,SH,TH', '').vergleich).toEqual(['BB', 'BY', 'SH']);
  });

  test('leere vergleich-Einträge werden gefiltert', () => {
    expect(parseUrlState('?vergleich=BB,,BY', '').vergleich).toEqual(['BB', 'BY']);
  });

  test('malformed URL wirft nicht', () => {
    expect(() => parseUrlState('%%%%', '####')).not.toThrow();
  });
});

describe('CurriculaUtils.buildUrl (UXF-002)', () => {
  test('setzt tab-Parameter', () => {
    const url = buildUrl({ tab: 'advanced' }, 'https://chemie-lernen.org/curricula/');
    expect(url).toBe('https://chemie-lernen.org/curricula/?tab=advanced');
  });

  test('setzt mehrere Parameter', () => {
    const url = buildUrl(
      { tab: 'overview', schulform: 'Gymnasium', klasse: '11', vergleich: ['BB', 'BY'] },
      'https://x.org/curricula/'
    );
    const qs = new URLSearchParams(url.split('?')[1]);
    expect(qs.get('tab')).toBe('overview');
    expect(qs.get('schulform')).toBe('Gymnasium');
    expect(qs.get('klasse')).toBe('11');
    expect(qs.get('vergleich')).toBe('BB,BY');
  });

  test('entfernt leere Parameter', () => {
    const url = buildUrl(
      { tab: null, schulform: '' },
      'https://x.org/curricula/?tab=advanced&schulform=GS'
    );
    expect(url).toBe('https://x.org/curricula/');
  });

  test('vergleich nur ab 2 Einträgen', () => {
    const one = buildUrl({ vergleich: ['BB'] }, 'https://x.org/c/');
    expect(one).toBe('https://x.org/c/');
    const two = buildUrl({ vergleich: ['BB', 'BY'] }, 'https://x.org/c/');
    // URLSearchParams kodiert Komma als %2C — via get() dekodiert
    const qs = new URLSearchParams(two.split('?')[1]);
    expect(qs.get('vergleich')).toBe('BB,BY');
  });

  test('fremde Parameter bleiben erhalten', () => {
    const url = buildUrl({ tab: 'advanced' }, 'https://x.org/c/?utm_source=test&tab=overview');
    const qs = new URLSearchParams(url.split('?')[1]);
    expect(qs.get('utm_source')).toBe('test');
    expect(qs.get('tab')).toBe('advanced');
  });

  test('Hash wird entfernt', () => {
    const url = buildUrl({ tab: 'advanced' }, 'https://x.org/c/#section');
    expect(url).toBe('https://x.org/c/?tab=advanced');
  });
});

describe('CurriculaUtils.buildCompareCsv (UXF-007)', () => {
  const sets = [
    { code: 'BB', labels: ['Säure-Base', 'Redox'] },
    { code: 'BY', labels: ['Säure-Base', 'Stöchiometrie'] },
  ];
  const all = ['Redox', 'Säure-Base', 'Stöchiometrie'];
  const names = { BB: 'Brandenburg', BY: 'Bayern' };
  const nameFor = (c) => names[c] || c;

  test('Header-Zeile mit Bundesland-Namen', () => {
    const csv = buildCompareCsv(sets, all, nameFor);
    expect(csv.split('\r\n')[0]).toBe('Thema;Brandenburg;Bayern');
  });

  test('✓/– korrekt je Bundesland', () => {
    const csv = buildCompareCsv(sets, all, nameFor);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe('Redox;✓;–');
    expect(lines[2]).toBe('Säure-Base;✓;✓');
    expect(lines[3]).toBe('Stöchiometrie;–;✓');
  });

  test('Labels mit Semikolon werden gequoted', () => {
    const tricky = [{ code: 'BB', labels: ['A;B'] }];
    const csv = buildCompareCsv(tricky, ['A;B'], (c) => c);
    expect(csv).toContain('"A;B"');
  });

  test('CRLF-Zeilenenden (Excel-kompatibel)', () => {
    const csv = buildCompareCsv(sets, all, nameFor);
    expect(csv).toContain('\r\n');
    expect(csv).not.toMatch(/[^\r]\n/);
  });

  test('ohne nameFor → Code-Fallback', () => {
    const csv = buildCompareCsv(sets, all, undefined);
    expect(csv.split('\r\n')[0]).toBe('Thema;BB;BY');
  });
});
