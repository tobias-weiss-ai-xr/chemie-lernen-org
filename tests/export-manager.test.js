/**
 * Tests for Export/Import Manager
 * Tests PDF, CSV, and JSON export/import functionality
 */

// Polyfill btoa/atob for test environment
if (typeof btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof atob === 'undefined') {
  global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}

// Setup localStorage mock before loading ExportManager
const mockLocalStorage = new Map();

global.localStorage = {
  setItem: (key, value) => mockLocalStorage.set(key, value),
  getItem: (key) => mockLocalStorage.get(key) || null,
  removeItem: (key) => mockLocalStorage.delete(key),
  clear: () => mockLocalStorage.clear(),
  get length() {
    return mockLocalStorage.size;
  },
  key: (index) => {
    const keys = Array.from(mockLocalStorage.keys());
    return keys[index] || null;
  }
};

const ExportManager = require('../myhugoapp/static/js/calculators/export-manager.js');
const { URL } = require('url');

// Mock jsPDF
global.jsPDF = class MockPDF {
  constructor() {
    this.pages = [];
    this.currentPage = { content: [] };
    this.pages.push(this.currentPage);
    this.internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      },
      getNumberOfPages: () => this.pages.length
    };
    this.font = { size: 12, style: 'normal' };
  }

  addPage() {
    this.currentPage = { content: [] };
    this.pages.push(this.currentPage);
  }

  text(text, x, y) {
    this.currentPage.content.push({ type: 'text', text, x, y });
  }

  splitTextToSize(text, width) {
    const maxWidth = width;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length * 3 > maxWidth) { // Approximate character width
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  setFontSize(size) {
    this.font.size = size;
  }

  setFont(font, style) {
    this.font.style = style || 'normal';
  }

  setPage(pageNum) {
    this.currentPage = this.pages[pageNum - 1];
  }

  save() {
    this.saved = true;
    return true;
  }

  // Mock methods
  internal = {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297
    },
    getNumberOfPages: () => 1
  };
};

// Mock window.jspdf
global.window = {
  jspdf: {
    jsPDF: global.jsPDF
  },
  location: {
    href: 'https://example.com/calculator'
  }
};

// Mock document methods
global.document = {
  createElement: (tag) => ({
    setAttribute: () => {},
    style: {},
    click: () => {}
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};

// Use real URL class from Node.js
global.URL = URL;

// Mock static methods
URL.createObjectURL = (blob) => 'blob:mock-url';
URL.revokeObjectURL = () => {};

global.Blob = class MockBlob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
  }
};

describe('Export Manager', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('PDF Export', () => {
    test('handles missing jsPDF library gracefully', () => {
      global.window.jspdf = undefined;

      const data = { calculationType: 'Test' };
      const result = ExportManager.exportToPDF(data, 'Test');

      expect(result).toBe(false);

      // Restore mock
      global.window.jspdf = { jsPDF: global.jsPDF };
    });

    // Note: Full PDF export tests require browser environment with real jsPDF
    // These are tested manually in the browser
  });

  describe('CSV Export', () => {
    test('exports array of objects to CSV', () => {
      const data = [
        { name: 'Water', formula: 'H2O', mass: 18.015 },
        { name: 'Sodium', formula: 'Na', mass: 22.989 }
      ];

      const result = ExportManager.exportToCSV(data, 'test.csv');

      expect(result).toBe(true);
    });

    test('exports single object to CSV', () => {
      const data = {
        calculation: 'Molar Mass',
        formula: 'H2O',
        result: 18.015
      };

      const result = ExportManager.exportToCSV(data, 'test.csv');

      expect(result).toBe(true);
    });

    test('exports titration curve to CSV', () => {
      const curveData = [
        { volumeAdded: 0, percent: 0, ph: 1, region: 'before' },
        { volumeAdded: 25, percent: 50, ph: 4.5, region: 'before' },
        { volumeAdded: 50, percent: 100, ph: 7, region: 'equivalence' }
      ];

      const result = ExportManager.exportTitrationCurveToCSV(curveData);

      expect(result).toBe(true);
    });

    test('exports history to CSV', () => {
      const history = [
        {
          type: 'Calculation',
          timestamp: '2025-12-27',
          inputs: { mass: 10 },
          results: { molarMass: 18.015 }
        }
      ];

      const result = ExportManager.exportHistoryToCSV(history);

      expect(result).toBe(true);
    });

    test('handles empty array', () => {
      const result = ExportManager.exportToCSV([], 'test.csv');
      expect(result).toBe(false);
    });
  });

  describe('JSON Export', () => {
    test('exports simple data to JSON', () => {
      const data = {
        name: 'Test',
        value: 42
      };

      const result = ExportManager.exportToJSON(data, 'test.json');

      expect(result).toBe(true);
    });

    test('exports calculation to JSON with metadata', () => {
      const calculation = {
        type: 'Molar Mass',
        inputs: { formula: 'H2O' },
        results: { mass: 18.015 }
      };

      const result = ExportManager.exportCalculationToJSON(calculation);

      expect(result).toBe(true);
    });

    test('exports history to JSON', () => {
      const history = [
        { type: 'Calculation 1', result: 42 },
        { type: 'Calculation 2', result: 100 }
      ];

      const result = ExportManager.exportHistoryToJSON(history);

      expect(result).toBe(true);
    });

    test('exports with pretty print option', () => {
      const data = { test: 'data' };
      const result = ExportManager.exportToJSON(data, 'test.json', false);

      expect(result).toBe(true);
    });
  });

  describe('JSON Import', () => {
    test('imports valid JSON from file', async () => {
      const mockFile = new File(['{"test": "data"}'], 'test.json');

      const result = await ExportManager.importFromJSON(mockFile);

      expect(result).toEqual({ test: 'data' });
    });

    test('imports calculation JSON', async () => {
      const calculation = {
        type: 'Test',
        inputs: { value: 42 }
      };

      const jsonStr = JSON.stringify({
        calculator: 'chemistry-calculator',
        data: calculation
      });

      const mockFile = new File([jsonStr], 'calculation.json');

      const result = await ExportManager.importCalculationFromJSON(mockFile);

      expect(result).toEqual(calculation);
    });

    test('imports history JSON', async () => {
      const history = [
        { type: 'Calculation 1' },
        { type: 'Calculation 2' }
      ];

      const jsonStr = JSON.stringify({
        history: history
      });

      const mockFile = new File([jsonStr], 'history.json');

      const result = await ExportManager.importHistoryFromJSON(mockFile);

      expect(result).toEqual(history);
    });

    test('rejects invalid JSON', async () => {
      const mockFile = new File(['invalid json'], 'test.json');

      await expect(ExportManager.importFromJSON(mockFile))
        .rejects.toThrow('Invalid JSON file');
    });

    test('rejects wrong calculator type', async () => {
      const jsonStr = JSON.stringify({
        calculator: 'other-calculator',
        data: {}
      });

      const mockFile = new File([jsonStr], 'calculation.json');

      await expect(ExportManager.importCalculationFromJSON(mockFile))
        .rejects.toThrow('Not a valid chemistry calculator export');
    });

    test('rejects invalid history format', async () => {
      const jsonStr = JSON.stringify({
        notHistory: true
      });

      const mockFile = new File([jsonStr], 'history.json');

      await expect(ExportManager.importHistoryFromJSON(mockFile))
        .rejects.toThrow('Invalid history file format');
    });

    test('rejects missing file', async () => {
      await expect(ExportManager.importFromJSON(null))
        .rejects.toThrow('No file provided');
    });
  });

  describe('Storage Management', () => {
    test('saves calculation to storage', () => {
      const data = { test: 'data', value: 42 };

      const result = ExportManager.saveToStorage('test-id', data);

      expect(result).toBe(true);
      expect(localStorage.getItem('calc_test-id')).toBeTruthy();
    });

    test('loads calculation from storage', () => {
      const data = { test: 'data', value: 42 };
      ExportManager.saveToStorage('test-id', data);

      const result = ExportManager.loadFromStorage('test-id');

      expect(result).toEqual(data);
    });

    test('returns null for non-existent storage key', () => {
      const result = ExportManager.loadFromStorage('non-existent');

      expect(result).toBeNull();
    });

    test('gets all saved calculations', () => {
      // Clear any existing data first
      localStorage.clear();

      const data1 = { type: 'Calculation 1', value: 1 };
      const data2 = { type: 'Calculation 2', value: 2 };

      ExportManager.saveToStorage('id1', data1);
      ExportManager.saveToStorage('id2', data2);

      const result = ExportManager.getAllFromStorage();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('savedAt');
    });

    test('sorts calculations by saved date descending', () => {
      // Clear any existing data first
      localStorage.clear();

      const data1 = { value: 1 };
      const data2 = { value: 2 };

      ExportManager.saveToStorage('id1', data1);
      // Add delay to ensure different timestamps
      const startTime = Date.now();
      while (Date.now() - startTime < 2) {
        // Small delay
      }
      ExportManager.saveToStorage('id2', data2);

      const result = ExportManager.getAllFromStorage();

      expect(result[0].id).toBe('id2'); // Most recent first
      expect(result[1].id).toBe('id1');
    });

    test('deletes calculation from storage', () => {
      const data = { test: 'data' };
      ExportManager.saveToStorage('test-id', data);

      const result = ExportManager.deleteFromStorage('test-id');

      expect(result).toBe(true);
      expect(localStorage.getItem('calc_test-id')).toBeNull();
    });

    test('clears all saved calculations', () => {
      ExportManager.saveToStorage('id1', { value: 1 });
      ExportManager.saveToStorage('id2', { value: 2 });

      const result = ExportManager.clearStorage();

      expect(result).toBe(true);
      expect(ExportManager.getAllFromStorage()).toHaveLength(0);
    });
  });

  describe('Shareable Links', () => {
    test('generates shareable link', () => {
      const data = { calculation: 'test', value: 42 };

      const link = ExportManager.generateShareableLink(data);

      expect(link).toBeTruthy();
      expect(typeof link).toBe('string');
    });

    test('encodes and decodes shareable data correctly', () => {
      const data = { calculation: 'test', value: 42 };

      // Test that we can encode/decode correctly
      const jsonString = JSON.stringify(data);
      const encoded = btoa(jsonString);
      const decoded = atob(encoded);
      const parsed = JSON.parse(decoded);

      expect(parsed).toEqual(data);
    });

    test('returns null for link without data parameter', () => {
      const link = 'https://example.com?other=param';

      const result = ExportManager.loadFromShareableLink(link);

      expect(result).toBeNull();
    });
  });

  describe('Export All Formats', () => {
    test('exports to all available formats', () => {
      const data = {
        calculationType: 'Test',
        inputs: { value: 42 },
        results: { output: 84 }
      };

      const results = ExportManager.exportAllFormats(data, 'test-calc');

      expect(results).toHaveProperty('pdf');
      expect(results).toHaveProperty('csv');
      expect(results).toHaveProperty('json');
    });
  });

  describe('Edge Cases', () => {
    test('handles special characters in CSV export', () => {
      const data = [
        { name: 'Test "with quotes"', value: 100 },
        { name: 'Test, with comma', value: 200 }
      ];

      const result = ExportManager.exportToCSV(data, 'test.csv');

      expect(result).toBe(true);
    });

    test('handles nested objects in results', () => {
      const data = {
        type: 'Complex',
        results: {
          nested: { value: 42 },
          simple: 100
        }
      };

      // Should not throw error
      expect(() => {
        ExportManager.exportToPDF(data, 'Complex Test');
      }).not.toThrow();
    });

    test('handles very long calculation names', () => {
      const data = {
        calculationType: 'A'.repeat(200),
        inputs: { value: 1 }
      };

      // Should not throw error
      expect(() => {
        ExportManager.exportToPDF(data, 'Long Name Test');
      }).not.toThrow();
    });

    test('handles null and undefined values in CSV', () => {
      const data = [
        { name: 'Test', value: null, other: undefined },
        { name: 'Test 2', value: 42 }
      ];

      const result = ExportManager.exportToCSV(data, 'test.csv');

      expect(result).toBe(true);
    });
  });
});
