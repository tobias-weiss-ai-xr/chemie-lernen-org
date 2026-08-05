/**
 * Tests for the RAG context builder and source extractor in api/server.js.
 *
 * Validates:
 *   - extractSourceNames parses the new format (Score, Definition, Kategorie)
 *   - pickSystemPromptLang: de / en / empty
 *   - buildSystemPrompt: includes currentEntity, ragContext, citation rule,
 *     uses German by default and English when Accept-Language starts with en
 */

const {
  extractSourceNames,
  pickSystemPromptLang,
  buildSystemPrompt,
} = require('../api/_rag-helpers.cjs');

describe('extractSourceNames', () => {
  test('returns empty array for null/empty input', () => {
    expect(extractSourceNames(null)).toEqual([]);
    expect(extractSourceNames('')).toEqual([]);
    expect(extractSourceNames('no dash lines here')).toEqual([]);
  });

  test('parses single source with score and category', () => {
    const ctx =
      'Folgende Entitäten sind relevant:\n- Ammoniak | Score: 12.0 | Kategorie: stoff | Definition: NH3, farbloses Gas';
    const out = extractSourceNames(ctx);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Ammoniak');
    expect(out[0].category).toBe('stoff');
    expect(out[0].score).toBe(12.0);
    expect(out[0].definition).toBe('NH3, farbloses Gas');
  });

  test('parses multiple sources and dedupes by name', () => {
    const ctx = [
      'Header line',
      '- Wasser | Score: 10.0 | Kategorie: stoff',
      '- Wasserstoff | Score: 6.0 | Kategorie: stoff',
      '- Wasser | Score: 99.0 | Kategorie: stoff',
    ].join('\n');
    const out = extractSourceNames(ctx);
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe('Wasser');
    expect(out[0].score).toBe(10.0);
    expect(out[1].name).toBe('Wasserstoff');
  });

  test('replaces dashes in nameDisplay for pretty rendering', () => {
    const ctx = '- Sauerstoff-Verbindungen | Score: 3.0';
    const out = extractSourceNames(ctx);
    expect(out[0].nameDisplay).toBe('Sauerstoff Verbindungen');
  });

  test('handles missing score gracefully (no NaN in payload)', () => {
    const ctx = '- Salz | Kategorie: stoff';
    const out = extractSourceNames(ctx);
    expect(out[0].name).toBe('Salz');
    expect(out[0].category).toBe('stoff');
    expect(out[0].score).toBeUndefined();
  });

  test('captures raw line when state is prefixed (no Klasse match)', () => {
    const ctx = '- Salzsäure | Score: 5.0 | Kategorie: stoff | BY, Klasse 9, Gymnasium';
    const out = extractSourceNames(ctx);
    expect(out[0].name).toBe('Salzsäure');
    expect(out[0].score).toBe(5.0);
    expect(out[0].category).toBe('stoff');
  });
});

describe('pickSystemPromptLang', () => {
  test('returns "de" for undefined / empty / non-en', () => {
    expect(pickSystemPromptLang(undefined)).toBe('de');
    expect(pickSystemPromptLang('')).toBe('de');
    expect(pickSystemPromptLang(null)).toBe('de');
    expect(pickSystemPromptLang('de-DE,de;q=0.9')).toBe('de');
    expect(pickSystemPromptLang('fr-FR,fr;q=0.9')).toBe('de');
  });

  test('returns "en" when Accept-Language starts with en', () => {
    expect(pickSystemPromptLang('en-US,en;q=0.9')).toBe('en');
    expect(pickSystemPromptLang('en')).toBe('en');
    expect(pickSystemPromptLang('en-GB,en;q=0.8')).toBe('en');
  });
});

describe('buildSystemPrompt', () => {
  test('uses German by default and includes plaintext rules', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('Chemie-Assistent');
    expect(prompt).toContain('Klartext');
  });

  test('switches to English when Accept-Language starts with en', () => {
    const prompt = buildSystemPrompt({ lang: 'en-US' });
    expect(prompt).toContain('chemistry assistant');
    expect(prompt).toContain('without Markdown');
  });

  test('includes currentEntity context when provided', () => {
    const prompt = buildSystemPrompt({ currentEntity: 'Ammoniak' });
    expect(prompt).toContain('Du liest gerade die Seite zu „Ammoniak"');
  });

  test('English currentEntity phrasing is also generated', () => {
    const prompt = buildSystemPrompt({ lang: 'en-US', currentEntity: 'Ammonia' });
    expect(prompt).toContain('currently reading the page about "Ammonia"');
  });

  test('includes ragContext when provided', () => {
    const prompt = buildSystemPrompt({ ragContext: '- Wasser | Score: 10.0' });
    expect(prompt).toContain('Kontext aus dem Wissensgraph');
    expect(prompt).toContain('- Wasser | Score: 10.0');
  });

  test('trims and sanitizes currentEntity (newlines, length)', () => {
    const prompt = buildSystemPrompt({ currentEntity: 'a\nb'.repeat(50) });
    expect(prompt).not.toContain('\n\n\n');
    expect(prompt.length).toBeLessThan(2000);
  });

  test('ignores non-string currentEntity', () => {
    const prompt = buildSystemPrompt({ currentEntity: 42 });
    expect(prompt).not.toContain('Du liest gerade');
  });
});
