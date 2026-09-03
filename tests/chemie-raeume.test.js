/**
 * chemie-raeume directory — render test (jsdom).
 * Verifies every manifest element becomes its own tile linking to its
 * per-element room on the GitHub Pages periodic table. Hubs links were
 * removed (deprecated for promotion) — none may be rendered.
 */
const path = require('path');

describe('chemie-raeume directory', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chemie-raeume-grid"></div>';
    vi.resetModules();
    require(path.resolve(__dirname, '../myhugoapp/static/js/chemie-raeume.js'));
  });

  test('renders one tile per element, linking to its room', () => {
    const manifest = {
      elements: [
        {
          symbol: 'H',
          name: 'Wasserstoff',
          group: 'nonmetal',
          roomUrl: 'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/001-hydrogen.html',
        },
        {
          symbol: 'He',
          name: 'Helium',
          group: 'nobleGas',
          roomUrl: 'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/002-helium.html',
        },
      ],
    };
    window.ChemieRaeume.render(manifest);
    const tiles = document.querySelectorAll('#chemie-raeume-grid .cr-tile');
    expect(tiles).toHaveLength(2);
    expect(tiles[0].getAttribute('href')).toBe(
      'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/001-hydrogen.html'
    );
    expect(tiles[0].querySelector('.cr-sym').textContent).toBe('H');
  });

  test('renders no Hubs badges or hubs links (deprecated)', () => {
    // Even if a stale manifest still carries hubRoomUrl, nothing may render it.
    const manifest = {
      elements: [
        {
          symbol: 'He',
          name: 'Helium',
          group: 'nobleGas',
          roomUrl: 'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/002-helium.html',
          hubRoomUrl: 'https://hubs.chemie-lernen.org/62gXwd7/chemie-raum',
        },
      ],
    };
    window.ChemieRaeume.render(manifest);
    expect(document.querySelector('.cr-hub')).toBeNull();
    expect(document.querySelector('a[href*="hubs.chemie-lernen.org"]')).toBeNull();
  });

  test('empty manifest shows a friendly message', () => {
    window.ChemieRaeume.render({ elements: [] });
    expect(document.getElementById('chemie-raeume-grid').textContent).toContain(
      'Keine Elementräume'
    );
  });

  test('escape-html prevents attribute injection', () => {
    const manifest = {
      elements: [
        {
          symbol: 'X',
          name: '"><img src=x>',
          group: 'metal',
          roomUrl: 'https://tobias-weiss-ai-xr.github.io/periodic-table/rooms/000-x.html',
        },
      ],
    };
    window.ChemieRaeume.render(manifest);
    expect(document.querySelector('#chemie-raeume-grid img')).toBeNull();
  });
});
