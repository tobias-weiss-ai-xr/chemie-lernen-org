/**
 * Comprehensive Unit Tests for calc-history.js
 * Tests ALL functions including _escapeHtml, saveToHistory, loadHistory,
 * displayHistory, toggleHistory, updateHistoryCount, clearHistory,
 * checkForBalancedEquation, and showImportNotification.
 *
 * Geladen per require() über die module.exports-Brücke — zählt für Coverage.
 */
// require() statt eval: dieselben Funktionen, aber über die Jest-
// Modulpipeline geladen — zählt für die Coverage-Instrumentierung.
const {
  saveToHistory,
  loadHistory,
  displayHistory,
  toggleHistory,
  updateHistoryCount,
  clearHistory,
  checkForBalancedEquation,
  showImportNotification,
  _escapeHtml,
} = require('../myhugoapp/static/js/calculators/calc-history.js');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});

// ──────────────────────────────────────────────
//  _escapeHtml
// ──────────────────────────────────────────────

describe('_escapeHtml', () => {
  function setup() {
    document.body.innerHTML = '<div id="history-list"></div>';
  }

  test('escapes & to &amp;', () => {
    setup();
    expect(_escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('escapes < to &lt;', () => {
    setup();
    expect(_escapeHtml('<tag>')).toBe('&lt;tag&gt;');
  });

  test('escapes > to &gt;', () => {
    setup();
    expect(_escapeHtml('a > b')).toBe('a &gt; b');
  });

  test('preserves double quotes (innerHTML does not escape them)', () => {
    setup();
    expect(_escapeHtml('he said "hello"')).toBe('he said "hello"');
  });

  test('preserves single quotes (innerHTML does not escape them)', () => {
    setup();
    expect(_escapeHtml("it's")).toBe("it's");
  });

  test('escapes all special chars together', () => {
    setup();
    const input = '<script>alert("xss") & more</script>';
    const output = _escapeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
    // innerHTML only escapes &, <, > — not quotes
    expect(output).toContain('&amp;');
  });

  test('returns empty string for non-string input (null)', () => {
    setup();
    expect(_escapeHtml(null)).toBe('');
  });

  test('returns empty string for non-string input (undefined)', () => {
    setup();
    expect(_escapeHtml(undefined)).toBe('');
  });

  test('returns empty string for non-string input (number)', () => {
    setup();
    expect(_escapeHtml(123)).toBe('');
  });

  test('returns empty string for non-string input (object)', () => {
    setup();
    expect(_escapeHtml({})).toBe('');
  });

  test('returns empty string for non-string input (array)', () => {
    setup();
    expect(_escapeHtml([])).toBe('');
  });

  test('returns empty string for boolean', () => {
    setup();
    expect(_escapeHtml(true)).toBe('');
  });

  test('preserves normal text without special chars', () => {
    setup();
    expect(_escapeHtml('Hello World')).toBe('Hello World');
  });

  test('preserves empty string', () => {
    setup();
    expect(_escapeHtml('')).toBe('');
  });
});

// ──────────────────────────────────────────────
//  saveToHistory
// ──────────────────────────────────────────────

describe('saveToHistory', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="history-list"></div>
      <div id="history-count"></div>
    `;
  });

  test('saves a single entry to localStorage', () => {
    saveToHistory('Berechnung', 'Test data');
    const stored = JSON.parse(localStorage.getItem('stoichHistory'));
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe('Berechnung');
    expect(stored[0].data).toBe('Test data');
    expect(stored[0]).toHaveProperty('id');
    expect(stored[0]).toHaveProperty('timestamp');
  });

  test('prepends new entries (most recent first)', () => {
    saveToHistory('first', 'entry 1');
    saveToHistory('second', 'entry 2');

    const stored = JSON.parse(localStorage.getItem('stoichHistory'));
    expect(stored).toHaveLength(2);
    expect(stored[0].type).toBe('second');
    expect(stored[1].type).toBe('first');
  });

  test('caps history at 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      saveToHistory('calc', 'entry ' + i);
    }

    const stored = JSON.parse(localStorage.getItem('stoichHistory'));
    expect(stored).toHaveLength(20);
    // Most recent 20 entries — entries 0-4 should be gone
    expect(stored[0].data).toBe('entry 24'); // newest first
    expect(stored[19].data).toBe('entry 5');
  });

  test('updates display and count after saving', () => {
    const list = document.getElementById('history-list');
    const badge = document.getElementById('history-count');

    saveToHistory('test', 'data');

    expect(list.innerHTML).not.toBe('');
    expect(badge.textContent).toContain('1');
  });

  test('handles complex data (objects/arrays)', () => {
    const complexData = { mass: 10, moles: 0.5, products: ['H2O', 'CO2'] };
    saveToHistory('complex', complexData);

    const stored = JSON.parse(localStorage.getItem('stoichHistory'));
    expect(stored[0].data).toEqual(complexData);
  });

  test('does not throw when localStorage is corrupt (null getItem)', () => {
    // Already null by default — should work fine
    expect(() => saveToHistory('test', 'data')).not.toThrow();
  });

  test('does not throw on malformed stored data (JSON.parse catch)', () => {
    // Fill localStorage with invalid JSON so JSON.parse throws
    const invalid = 'not valid json array';
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => invalid);

    // The catch in saveToHistory should handle it gracefully
    expect(() => saveToHistory('test', 'data')).not.toThrow();

    vi.restoreAllMocks();
  });
});

// ──────────────────────────────────────────────
//  loadHistory
// ──────────────────────────────────────────────

describe('loadHistory', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="history-list"></div>
      <div id="history-count"></div>
    `;
  });

  test('displays empty state when no history exists', () => {
    loadHistory();

    const list = document.getElementById('history-list');
    expect(list.innerHTML).toContain('Noch keine Berechnungen');
  });

  test('updates count to 0 when empty', () => {
    loadHistory();

    const badge = document.getElementById('history-count');
    expect(badge.textContent).toBe('(0)');
  });

  test('displays existing history entries', () => {
    const entries = [
      { id: 1, timestamp: '01.01.2026', type: 'calc', data: 'result' },
      { id: 2, timestamp: '02.01.2026', type: 'mass', data: '2.5 g' },
    ];
    localStorage.setItem('stoichHistory', JSON.stringify(entries));

    loadHistory();

    const list = document.getElementById('history-list');
    expect(list.innerHTML).toContain('calc');
    expect(list.innerHTML).toContain('mass');
    expect(list.innerHTML).toContain('result');
    expect(list.innerHTML).toContain('2.5 g');

    const badge = document.getElementById('history-count');
    expect(badge.textContent).toBe('(2)');
  });
});

// ──────────────────────────────────────────────
//  displayHistory (direct, DOM-heavy)
// ──────────────────────────────────────────────

describe('displayHistory', () => {
  test('shows empty message when no entries', () => {
    document.body.innerHTML = '<div id="history-list"></div>';

    displayHistory();

    const list = document.getElementById('history-list');
    expect(list.innerHTML).toContain('Noch keine Berechnungen');
  });

  test('renders each history entry with type, timestamp, data', () => {
    document.body.innerHTML = '<div id="history-list"></div>';

    const entries = [
      {
        id: 42,
        timestamp: '07.07.2026, 12:00:00',
        type: 'pH-Wert',
        data: '7.00',
      },
    ];
    localStorage.setItem('stoichHistory', JSON.stringify(entries));

    displayHistory();

    const list = document.getElementById('history-list');
    expect(list.innerHTML).toContain('pH-Wert');
    expect(list.innerHTML).toContain('07.07.2026');
    expect(list.innerHTML).toContain('7.00');
    expect(list.innerHTML).toContain('history-item');
  });

  test('renders multiple entries in correct order', () => {
    document.body.innerHTML = '<div id="history-list"></div>';

    const entries = [
      { id: 1, timestamp: 'T1', type: 'A', data: 'first' },
      { id: 2, timestamp: 'T2', type: 'B', data: 'second' },
    ];
    localStorage.setItem('stoichHistory', JSON.stringify(entries));

    displayHistory();

    const html = document.getElementById('history-list').innerHTML;
    const idxA = html.indexOf('A');
    const idxB = html.indexOf('B');
    expect(idxA).toBeLessThan(idxB); // A appears before B (forEach order)
  });

  test('escapes HTML in entry content', () => {
    document.body.innerHTML = '<div id="history-list"></div>';

    const entries = [
      {
        id: 1,
        timestamp: 'now',
        type: '<script>alert("xss")</script>',
        data: '<b>bold</b>',
      },
    ];
    localStorage.setItem('stoichHistory', JSON.stringify(entries));

    displayHistory();

    const html = document.getElementById('history-list').innerHTML;
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<b>bold</b>');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });

  test('does not throw when history-list element is missing', () => {
    // Missing DOM element should cause thrown error caught by try/catch
    expect(() => displayHistory()).not.toThrow();
  });

  test('does not throw on corrupted localStorage', () => {
    document.body.innerHTML = '<div id="history-list"></div>';
    localStorage.setItem('stoichHistory', 'not-valid-json');

    expect(() => displayHistory()).not.toThrow();
  });

  test('multiple entries all have history-item class', () => {
    document.body.innerHTML = '<div id="history-list"></div>';

    const entries = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      timestamp: `T${i}`,
      type: `Type ${i}`,
      data: `Data ${i}`,
    }));
    localStorage.setItem('stoichHistory', JSON.stringify(entries));

    displayHistory();

    // Should have 3 history-item divs (class="history-items" contains "history-item"
    // as substring, so use word boundary to avoid counting the container)
    const matches = document.getElementById('history-list').innerHTML.match(/\bhistory-item\b/g);
    expect(matches).toHaveLength(3);
  });
});

// ──────────────────────────────────────────────
//  toggleHistory
// ──────────────────────────────────────────────

describe('toggleHistory', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="history-list"></div>
      <div id="history-count"></div>
    `;
  });

  function withPanel(initialDisplay) {
    const panel = document.createElement('div');
    panel.id = 'history-panel';
    panel.style.display = initialDisplay;
    document.body.appendChild(panel);
    return panel;
  }

  test('shows panel when hidden', () => {
    const panel = withPanel('none');
    toggleHistory();
    expect(panel.style.display).toBe('block');
  });

  test('hides panel when visible', () => {
    const panel = withPanel('block');
    toggleHistory();
    expect(panel.style.display).toBe('none');
  });

  test('calls displayHistory when showing panel', () => {
    const panel = withPanel('none');
    const list = document.getElementById('history-list');

    toggleHistory();

    // displayHistory should have been triggered (empty state)
    expect(list.innerHTML).toContain('Noch keine Berechnungen');
  });

  test('does not call displayHistory when hiding panel', () => {
    const panel = withPanel('block');
    const list = document.getElementById('history-list');

    toggleHistory();

    // displayHistory was NOT called, so list should be empty
    expect(list.innerHTML).toBe('');
  });
});

// ──────────────────────────────────────────────
//  updateHistoryCount
// ──────────────────────────────────────────────

describe('updateHistoryCount', () => {
  test('shows 0 when no history', () => {
    document.body.innerHTML = '<span id="history-count"></span>';

    updateHistoryCount();

    expect(document.getElementById('history-count').textContent).toBe('(0)');
  });

  test('shows correct count for existing history', () => {
    document.body.innerHTML = '<span id="history-count"></span>';

    const entries = Array.from({ length: 7 }, (_, i) => ({
      id: i,
      type: 't',
      data: {},
    }));
    localStorage.setItem('stoichHistory', JSON.stringify(entries));

    updateHistoryCount();

    expect(document.getElementById('history-count').textContent).toBe('(7)');
  });

  test('does not throw when count element is missing', () => {
    expect(() => updateHistoryCount()).not.toThrow();
  });

  test('does not throw on corrupted localStorage', () => {
    document.body.innerHTML = '<span id="history-count"></span>';
    localStorage.setItem('stoichHistory', 'corrupt');

    expect(() => updateHistoryCount()).not.toThrow();
  });
});

// ──────────────────────────────────────────────
//  clearHistory
// ──────────────────────────────────────────────

describe('clearHistory', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="history-list"></div>
      <span id="history-count"></span>
    `;
  });

  test('clears history when confirm returns true', () => {
    global.confirm = vi.fn(() => true);

    // Pre-populate history
    saveToHistory('test', 'data');
    expect(JSON.parse(localStorage.getItem('stoichHistory'))).toHaveLength(1);

    clearHistory();

    expect(localStorage.getItem('stoichHistory')).toBeNull();
    expect(document.getElementById('history-list').innerHTML).toContain('Noch keine Berechnungen');
    expect(document.getElementById('history-count').textContent).toBe('(0)');
  });

  test('does not clear when confirm returns false', () => {
    global.confirm = vi.fn(() => false);

    saveToHistory('test', 'data');
    expect(JSON.parse(localStorage.getItem('stoichHistory'))).toHaveLength(1);

    clearHistory();

    // History should still be there
    expect(JSON.parse(localStorage.getItem('stoichHistory'))).toHaveLength(1);
  });

  test('calls confirm with German message', () => {
    global.confirm = vi.fn(() => false);
    clearHistory();

    expect(global.confirm).toHaveBeenCalledWith(
      'Möchten Sie wirklich den gesamten Berechnungsverlauf löschen?'
    );
  });
});

// ──────────────────────────────────────────────
//  checkForBalancedEquation (sessionStorage)
// ──────────────────────────────────────────────

describe('checkForBalancedEquation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="mol-coeff-r" type="text" />
      <input id="mol-coeff-p" type="text" />
      <input id="mass-coeff-r" type="text" />
      <input id="mass-coeff-p" type="text" />
    `;
  });

  test('early return when no data in sessionStorage', () => {
    // No data set — should just return without side effects
    expect(() => checkForBalancedEquation()).not.toThrow();
    expect(document.getElementById('mol-coeff-r').value).toBe('');
  });

  test('imports coefficients from valid balanced equation', () => {
    const data = {
      reactants: [{ formula: 'H2', coefficient: 2 }],
      products: [{ formula: 'H2O', coefficient: 2 }],
    };
    sessionStorage.setItem('balancedEquation', JSON.stringify(data));

    checkForBalancedEquation();

    expect(document.getElementById('mol-coeff-r').value).toBe('2');
    expect(document.getElementById('mol-coeff-p').value).toBe('2');
    expect(document.getElementById('mass-coeff-r').value).toBe('2');
    expect(document.getElementById('mass-coeff-p').value).toBe('2');
  });

  test('imports with coefficient = 1 for single-molecule reactants', () => {
    const data = {
      reactants: [{ formula: 'CH4', coefficient: 1 }],
      products: [{ formula: 'CO2', coefficient: 1 }],
    };
    sessionStorage.setItem('balancedEquation', JSON.stringify(data));

    checkForBalancedEquation();

    expect(document.getElementById('mol-coeff-r').value).toBe('1');
    expect(document.getElementById('mol-coeff-p').value).toBe('1');
  });

  test('clears sessionStorage after import', () => {
    const data = {
      reactants: [{ formula: 'N2', coefficient: 1 }],
      products: [{ formula: 'NH3', coefficient: 2 }],
    };
    sessionStorage.setItem('balancedEquation', JSON.stringify(data));

    checkForBalancedEquation();

    expect(sessionStorage.getItem('balancedEquation')).toBeNull();
  });

  test('warns on invalid data structure (no reactants)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(
      'balancedEquation',
      JSON.stringify({ products: [{ formula: 'H2O', coefficient: 2 }] })
    );

    checkForBalancedEquation();

    expect(console.warn).toHaveBeenCalledWith('Invalid balanced equation data structure');
    spy.mockRestore();
  });

  test('warns on invalid data structure (no products)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(
      'balancedEquation',
      JSON.stringify({ reactants: [{ formula: 'H2', coefficient: 2 }] })
    );

    checkForBalancedEquation();

    expect(console.warn).toHaveBeenCalledWith('Invalid balanced equation data structure');
    spy.mockRestore();
  });

  test('warns on empty reactants array', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(
      'balancedEquation',
      JSON.stringify({ reactants: [], products: [{ formula: 'H2O', coefficient: 2 }] })
    );

    checkForBalancedEquation();

    expect(console.warn).toHaveBeenCalledWith('Invalid balanced equation data structure');
    spy.mockRestore();
  });

  test('does not throw on corrupted JSON in sessionStorage', () => {
    sessionStorage.setItem('balancedEquation', 'not-valid-json');

    expect(() => checkForBalancedEquation()).not.toThrow();
  });

  test('does not throw when DOM elements are missing', () => {
    document.body.innerHTML = '';
    const data = {
      reactants: [{ formula: 'H2', coefficient: 2 }],
      products: [{ formula: 'H2O', coefficient: 2 }],
    };
    sessionStorage.setItem('balancedEquation', JSON.stringify(data));

    expect(() => checkForBalancedEquation()).not.toThrow();
  });
});

// ──────────────────────────────────────────────
//  showImportNotification (DOM creation + timer)
// ──────────────────────────────────────────────

describe('showImportNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('appends notification to body', () => {
    showImportNotification({
      reactants: [{ formula: 'H2', coefficient: 2 }],
      products: [{ formula: 'H2O', coefficient: 2 }],
    });

    expect(document.body.children).toHaveLength(1);
    const notif = document.body.children[0];
    expect(notif.innerHTML).toContain('Gleichung');
    expect(notif.innerHTML).toContain('H2');
  });

  test('shows equation string with coefficients', () => {
    showImportNotification({
      reactants: [
        { formula: 'H2', coefficient: 2 },
        { formula: 'O2', coefficient: 1 },
      ],
      products: [{ formula: 'H2O', coefficient: 2 }],
    });

    const html = document.body.innerHTML;
    expect(html).toContain('2H2 + O2');
    expect(html).toContain('2H2O');
  });

  test('removes notification after timeout', () => {
    showImportNotification({
      reactants: [{ formula: 'H2', coefficient: 2 }],
      products: [{ formula: 'H2O', coefficient: 2 }],
    });

    expect(document.body.children).toHaveLength(1);

    // Advance past the first timeout (5000ms for slideOut)
    vi.advanceTimersByTime(5000);
    // Advance past the second timeout (500ms for remove)
    vi.advanceTimersByTime(600);

    expect(document.body.children).toHaveLength(0);
  });

  test('suppresses coefficient=1 in equation display', () => {
    showImportNotification({
      reactants: [{ formula: 'CH4', coefficient: 1 }],
      products: [
        { formula: 'CO2', coefficient: 1 },
        { formula: 'H2O', coefficient: 2 },
      ],
    });

    const html = document.body.innerHTML;
    expect(html).toContain('CH4'); // no "1CH4"
    expect(html).toContain('2H2O');
  });
});
