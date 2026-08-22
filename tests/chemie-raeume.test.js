/**
 * chemie-raeume directory — render test (jsdom).
 * Verifies every manifest element becomes its own tile linking to its room,
 * and that the Hubs badge only appears when a hubRoomUrl exists.
 */
const path = require('path');

describe('chemie-raeume directory', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chemie-raeume-grid"></div>';
    jest.resetModules();
    require(path.resolve(__dirname, '../myhugoapp/static/js/chemie-raeume.js'));
  });

  test('renders one tile per element, linking to its room', () => {
    const manifest = {
      elements: [
        {
          symbol: 'H',
          name: 'Wasserstoff',
          group: 'nonmetal',
          roomUrl: 'https://app/?room=H',
          hubRoomUrl: null,
        },
        {
          symbol: 'He',
          name: 'Helium',
          group: 'nobleGas',
          roomUrl: 'https://app/?room=He',
          hubRoomUrl: 'https://hubs/?he',
        },
      ],
    };
    window.ChemieRaeume.render(manifest);
    const tiles = document.querySelectorAll('#chemie-raeume-grid .cr-tile');
    expect(tiles).toHaveLength(2);
    expect(tiles[0].getAttribute('href')).toBe('https://app/?room=H');
    expect(tiles[0].querySelector('.cr-sym').textContent).toBe('H');
    expect(tiles[0].classList.contains('no-hub')).toBe(true);
    expect(document.querySelector('.cr-hub')).not.toBeNull();
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
          roomUrl: 'https://app/?room=X',
          hubRoomUrl: null,
        },
      ],
    };
    window.ChemieRaeume.render(manifest);
    expect(document.querySelector('#chemie-raeume-grid img')).toBeNull();
  });
});
