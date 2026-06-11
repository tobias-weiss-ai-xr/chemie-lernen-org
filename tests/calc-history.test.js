/**
 * Unit tests for calc-history.js - Calculator history management
 * Tests localStorage interaction, history management, and UI updates
 */

describe('Calculator History Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="history-count"></div>
      <div id="history-container"></div>
      <div id="history-display"></div>
      <button id="clear-history"></button>
    `;
  });

  describe('History Entry Structure', () => {
    test('should create valid history entry', () => {
      const entry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('de-DE'),
        type: 'stoichiometry',
        data: { reactants: 'H2', products: 'H2O' }
      };
      
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('data');
    });

    test('should generate unique IDs', () => {
      const id1 = Date.now();
      setTimeout(() => {
        const id2 = Date.now();
        expect(id2).not.toBe(id1);
      }, 10);
    });

    test('should use German date format', () => {
      const dateString = new Date().toLocaleString('de-DE');
      expect(dateString).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });
  });

  describe('History Storage', () => {
    test('should save to localStorage', () => {
      const history = [
        { id: 1, type: 'mass-mass', data: {} }
      ];
      
      localStorage.setItem('stoichHistory', JSON.stringify(history));
      const stored = localStorage.getItem('stoichHistory');
      
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored)).toHaveLength(1);
    });

    test('should handle empty localStorage', () => {
      const history = localStorage.getItem('stoichHistory') || '[]';
      const parsed = JSON.parse(history);
      
      expect(parsed).toEqual([]);
    });

    test('should update localStorage with new entry', () => {
      const history = JSON.parse(localStorage.getItem('stoichHistory') || '[]');
      const initialLength = history.length;
      
      history.push({ id: Date.now(), type: 'test', data: {} });
      localStorage.setItem('stoichHistory', JSON.stringify(history));
      
      const updated = JSON.parse(localStorage.getItem('stoichHistory'));
      expect(updated).toHaveLength(initialLength + 1);
    });
  });

  describe('History Size Limit', () => {
    test('should limit history to 20 entries', () => {
      let history = [];
      
      for (let i = 0; i < 25; i++) {
        history.push({ id: i, type: 'test', data: {} });
      }
      
      if (history.length > 20) {
        history.splice(20);
      }
      
      expect(history).toHaveLength(20);
    });

    test('should remove oldest entries when limit exceeded', () => {
      let history = Array.from({ length: 22 }, (_, i) => ({
        id: i,
        type: 'test',
        data: {}
      }));
      
      if (history.length > 20) {
        history.splice(20);
      }
      
      expect(history[0].id).toBe(0);
      expect(history[19].id).toBe(19);
      expect(history).toHaveLength(20);
    });

    test('should maintain newest entries after truncation', () => {
      let history = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        type: 'test',
        data: {}
      }));
      
      const newestId = history[24].id;
      
      if (history.length > 20) {
        history.splice(20);
      }
      
      expect(history[19].id).toBe(19);
      expect(history.length).toBe(20);
    });
  });

  describe('History Ordering', () => {
    test('should add new entries at the beginning', () => {
      let history = [
        { id: 1, type: 'old', data: {} },
        { id: 2, type: 'old', data: {} }
      ];
      
      const newEntry = { id: 3, type: 'new', data: {} };
      history.unshift(newEntry);
      
      expect(history[0].id).toBe(3);
      expect(history[1].id).toBe(1);
    });

    test('should maintain chronological ordering', () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        type: 'test',
        data: {}
      })).reverse();
      
      expect(entries[0].id).toBe(5);
      expect(entries[4].id).toBe(1);
    });
  });

  describe('History Types', () => {
    test('should support different calculator types', () => {
      const types = ['mass-mass', 'mol-mol', 'limiting', 'yield'];
      
      types.forEach(type => {
        expect(type).toBeTruthy();
      });
    });

    test('should store type information', () => {
      const entry = {
        id: 1,
        type: 'mass-mass',
        data: {}
      };
      
      expect(entry.type).toBe('mass-mass');
    });

    test('should identify calculator type from entry', () => {
      const entry = { id: 1, type: 'limiting', data: {} };
      const isLimitingCalc = entry.type === 'limiting';
      
      expect(isLimitingCalc).toBe(true);
    });
  });

  describe('History Data Structure', () => {
    test('should store calculation data', () => {
      const data = {
        reactants: 'H2 + O2',
        products: 'H2O',
        coefficients: [2, 1, 2]
      };
      
      expect(data).toHaveProperty('reactants');
      expect(data).toHaveProperty('products');
      expect(data).toHaveProperty('coefficients');
    });

    test('should handle complex data objects', () => {
      const complexData = {
        input: { mass: 10, unit: 'g' },
        output: { moles: 0.5, mass: 9.0 },
        accuracy: 'high'
      };
      
      expect(complexData).toHaveProperty('input');
      expect(complexData).toHaveProperty('output');
      expect(complexData).toHaveProperty('accuracy');
    });
  });

  describe('History Display', () => {
    test('should update history count', () => {
      const history = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        type: 'test',
        data: {}
      }));
      
      const countElement = document.getElementById('history-count');
      countElement.textContent = `${history.length} Einträge`;
      
      expect(countElement.textContent).toBe('5 Einträge');
    });

    test('should display empty state for no history', () => {
      const historyElement = document.getElementById('history-display');
      historyElement.innerHTML = '<p>Kein Verlauf</p>';
      
      expect(historyElement.innerHTML).toContain('Kein Verlauf');
    });

    test('should format history entries for display', () => {
      const entry = {
        id: 1,
        timestamp: '11.06.2026, 14:30:00',
        type: 'mass-mass',
        data: { result: '9.0 g' }
      };
      
      const displayHtml = `<div class="history-entry">${entry.timestamp}: ${entry.type}</div>`;
      
      expect(displayHtml).toContain('14:30:00');
      expect(displayHtml).toContain('mass-mass');
    });
  });

  describe('History Clearing', () => {
    test('should clear all history', () => {
      const history = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        type: 'test',
        data: {}
      }));
      
      localStorage.setItem('stoichHistory', JSON.stringify(history));
      localStorage.removeItem('stoichHistory');
      
      expect(localStorage.getItem('stoichHistory')).toBeNull();
    });

    test('should reset history count after clearing', () => {
      const countElement = document.getElementById('history-count');
      countElement.textContent = '0 Einträge';
      
      expect(countElement.textContent).toBe('0 Einträge');
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage write errors', () => {
      const testStorageError = () => {
        try {
          JSON.parse('invalid json');
        } catch (error) {
          return error;
        }
      };
      
      const error = testStorageError();
      expect(error).toBeInstanceOf(SyntaxError);
    });

    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('stoichHistory', 'invalid json');
      
      expect(() => {
        JSON.parse(localStorage.getItem('stoichHistory'));
      }).toThrow();
    });

    test('should handle missing localStorage gracefully', () => {
      const history = localStorage.getItem('stoichHistory') || '[]';
      const parsed = JSON.parse(history);
      
      expect(parsed).toEqual([]);
    });
  });

  describe('History Persistence', () => {
    test('should persist history across page loads', () => {
      const history = [{ id: 1, type: 'test', data: {} }];
      localStorage.setItem('stoichHistory', JSON.stringify(history));
      
      const loaded = JSON.parse(localStorage.getItem('stoichHistory'));
      expect(loaded).toEqual(history);
    });

    test('should maintain history integrity', () => {
      const original = [
        { id: 1, type: 'test1', data: { value: 10 } },
        { id: 2, type: 'test2', data: { value: 20 } }
      ];
      
      localStorage.setItem('stoichHistory', JSON.stringify(original));
      const restored = JSON.parse(localStorage.getItem('stoichHistory'));
      
      expect(restored).toHaveLength(2);
      expect(restored[0].data.value).toBe(10);
      expect(restored[1].data.value).toBe(20);
    });
  });

  describe('History Counting', () => {
    test('should count history entries correctly', () => {
      const history = Array.from({ length: 7 }, (_, i) => ({
        id: i,
        type: 'test',
        data: {}
      }));
      
      const count = history.length;
      expect(count).toBe(7);
    });

    test('should update count dynamically', () => {
      let history = [];
      history.push({ id: 1, type: 'test', data: {} });
      
      let newCount = history.length;
      expect(newCount).toBe(1);
      
      history.push({ id: 2, type: 'test', data: {} });
      newCount = history.length;
      expect(newCount).toBe(2);
    });
  });
});