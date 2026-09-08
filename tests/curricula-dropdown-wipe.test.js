/**
 * UXF-043 Regression-Tests: Bundesland-Dropdown vs. curricula-overview.js
 *
 * Hintergrund (Bug-Session 2026-09-08): Der Wrapper des Dropdowns hieß
 * ursprünglich `id="curricula-grid"`. curricula-overview.js renderGrid()
 * fand damit sein Ziel-Element und überschrieb grid.innerHTML mit den
 * API-Karten — das statische Dropdown wurde im Browser weggeblasen
 * (curl sah es, Playwright nicht). Fix: Wrapper-ID → bundesland-select-wrap,
 * renderGrid() exited sauber via `if (!grid) return`.
 *
 * Diese Tests verriegeln beide Seiten des Fixes:
 *  1. jsdom-Interaktion: curricula-overview.js läuft gegen das Dropdown-DOM
 *     ohne es zu zerstören (kein fetch, kein innerHTML-Wipe).
 *  2. Layout-Contract: der Wrapper darf nie wieder `curricula-grid` heißen.
 *
 * WHO: mem_mtpfx28t_mtshvkha (Deploy-Blocker-Kette, Root Cause Nr. 3)
 */

const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
// describe/it/expect/vi kommen aus vitest globals (vitest.config.ts: globals: true)

const OVERVIEW_SRC = readFileSync(
  resolve(__dirname, '../myhugoapp/static/js/curricula-overview.js'),
  'utf-8'
);
const LAYOUT_HTML = readFileSync(
  resolve(__dirname, '../myhugoapp/layouts/_default/curricula-index.html'),
  'utf-8'
);

// Exakter Wrapper aus dem Layout (UIF-043 Dropdown)
const DROPDOWN_HTML = `
  <div id="bundesland-select-wrap" class="curricula-grid bundesland-dropdown" aria-label="Bundesländer-Lehrpläne">
    <label for="state-select">Bundesland auswählen:</label>
    <select id="state-select" onchange="if(this.value)location.href='/curricula/'+this.value+'/'" aria-label="Bundesland Lehrplan auswählen">
      <option value="" selected disabled>-- Bundesland auswählen --</option>
      <option value="bw">Baden-Württemberg</option>
      <option value="be">Berlin</option>
      <option value="bb">Brandenburg</option>
      <option value="by">Bayern</option>
      <option value="hb">Bremen</option>
      <option value="hh">Hamburg</option>
      <option value="he">Hessen</option>
      <option value="mv">Mecklenburg-Vorpommern</option>
      <option value="ni">Niedersachsen</option>
      <option value="nw">Nordrhein-Westfalen</option>
      <option value="rp">Rheinland-Pfalz</option>
      <option value="sl">Saarland</option>
      <option value="sn">Sachsen</option>
      <option value="st">Sachsen-Anhalt</option>
      <option value="sh">Schleswig-Holstein</option>
      <option value="th">Thüringen</option>
    </select>
  </div>`;

// Elemente, die curricula-overview.js per getElementById erwartet (falls
// init() jemals weiterläuft) — verhindern Crashs im Test-DOM
const SUPPORT_IDS = [
  'curricula-summary',
  'curricula-filter-bar',
  'curricula-filter-school',
  'curricula-filter-grade',
  'curricula-filter-count',
  'curricula-sort-wrap',
  'curricula-compare-check',
  'curricula-compare-panel',
  'tab-overview',
  'tab-advanced',
  'tab-btn-overview',
  'tab-btn-advanced',
]
  .map((id) => `<div id="${id}"></div>`)
  .join('\n');

describe('UXF-043: Dropdown überlebt curricula-overview.js (JS-Wipe-Regression)', () => {
  beforeEach(() => {
    document.body.innerHTML = DROPDOWN_HTML + '\n' + SUPPORT_IDS;
  });

  it('init() darf ohne #curricula-grid kein fetch starten und das Dropdown unangetastet lassen', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // Script in jsdom injizieren (vitest config: runScripts: 'dangerously').
    // document.readyState ist zu diesem Zeitpunkt nicht 'loading' →
    // ready(fn) ruft fn() synchron auf → init() läuft sofort.
    const script = document.createElement('script');
    script.textContent = OVERVIEW_SRC;
    expect(() => document.body.appendChild(script)).not.toThrow();

    // init() muss früh exiten: kein #curricula-grid im DOM → kein fetch
    const select = document.getElementById('state-select');
    expect(select).toBeTruthy();
    expect(select.options.length).toBe(17);

    const wrap = document.getElementById('bundesland-select-wrap');
    expect(wrap).toBeTruthy();
    expect(wrap.querySelector('#state-select')).toBe(select);

    if (fetchSpy) {
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    }
  });

  it('renderGrid() exits sauber, wenn das Zielelement fehlt (Guard vorhanden)', () => {
    const script = document.createElement('script');
    script.textContent = OVERVIEW_SRC;
    document.body.appendChild(script);

    // Nach dem Load darf das Dropdown identisch sein (innerHTML unverändert)
    const wrap = document.getElementById('bundesland-select-wrap');
    expect(wrap.innerHTML).toContain('Bundesland auswählen:');
    expect(wrap.innerHTML).toContain('Baden-Württemberg');
    expect(wrap.querySelectorAll('option').length).toBe(17);

    // Kein Karten-Rerender: keine .curricula-card im Wrapper
    expect(wrap.querySelectorAll('.curricula-card').length).toBe(0);
    // Kein Skeleton/Empty-State wurde reingeworfen
    expect(wrap.querySelectorAll('.curricula-loading, .empty-state').length).toBe(0);
  });
});

describe('UXF-043: Layout-Contract — Wrapper-ID darf nie curricula-grid sein', () => {
  it('curricula-index.html nutzt bundesland-select-wrap (nicht curricula-grid)', () => {
    expect(LAYOUT_HTML).toContain('id="bundesland-select-wrap"');
    // Die ID curricula-grid gehört renderGrid() — wenn das Markup sie am
    // Dropdown-Wrapper vergibt, wird das Dropdown weggeblasen (Urbug).
    expect(LAYOUT_HTML).not.toContain('id="curricula-grid"');
  });

  it('Dropdown-Markup vollständig: state-select, 16 Bundesländer, Placeholder', () => {
    expect(LAYOUT_HTML).toContain('id="state-select"');
    const codes = [
      'bw',
      'by',
      'be',
      'bb',
      'hb',
      'he',
      'hh',
      'mv',
      'ni',
      'nw',
      'rp',
      'sl',
      'sn',
      'st',
      'sh',
      'th',
    ];
    for (const code of codes) {
      expect(LAYOUT_HTML).toContain(`value="${code}"`);
    }
    expect(LAYOUT_HTML).toContain('selected disabled');
  });
});
