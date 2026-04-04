/**
 * Unit Tests for CheatSheetsSystem
 */

const { CheatSheetsSystem } = require('../myhugoapp/static/js/cheatsheets-system.js');

// Clear localStorage before each test to prevent state leakage
// (CheatSheetsSystem constructor calls this.load() which reads from localStorage)
beforeEach(() => {
  localStorage.clear();
});

function createTestSheet(overrides = {}) {
  return {
    title: overrides.title || 'Test Sheet',
    category: overrides.category || 'Chemie',
    gradeLevel: overrides.gradeLevel || 'Klasse 10',
    content: overrides.content || [
      {
        title: 'Section 1',
        text: 'Content about Säuren and Basen',
        formulas: ['pH = -log[H+]'],
        examples: [],
      },
    ],
    keywords: overrides.keywords || ['säuren', 'basen', 'pH'],
  };
}

describe('CheatSheetsSystem - Construction', () => {
  test('should create instance with default storageKey', () => {
    const cs = new CheatSheetsSystem();
    expect(cs.storageKey).toBe('chemie-lernen-cheatsheets');
  });

  test('should create instance with custom storageKey', () => {
    const cs = new CheatSheetsSystem({ storageKey: 'custom' });
    expect(cs.storageKey).toBe('custom');
  });

  test('should initialize with empty sheets', () => {
    const cs = new CheatSheetsSystem();
    expect(Object.keys(cs.sheets).length).toBe(0);
  });

  test('should initialize with empty bookmarks and history', () => {
    const cs = new CheatSheetsSystem();
    expect(cs.bookmarks).toEqual([]);
    expect(cs.readHistory).toEqual([]);
  });
});

describe('CheatSheetsSystem - registerSheet', () => {
  test('should register a cheat sheet', () => {
    const cs = new CheatSheetsSystem();
    const sheet = cs.registerSheet('test-sheet', createTestSheet());
    expect(sheet.id).toBe('test-sheet');
    expect(sheet.title).toBe('Test Sheet');
  });

  test('should set default values for missing fields', () => {
    const cs = new CheatSheetsSystem();
    const sheet = cs.registerSheet('minimal', { title: 'Minimal' });
    expect(sheet.category).toBe('Allgemein');
    expect(sheet.gradeLevel).toBe('Alle');
    expect(sheet.content).toEqual([]);
    expect(sheet.keywords).toEqual([]);
  });

  test('should initialize view stats', () => {
    const cs = new CheatSheetsSystem();
    const sheet = cs.registerSheet('test', createTestSheet());
    expect(sheet.viewCount).toBe(0);
    expect(sheet.lastViewed).toBeNull();
  });
});

describe('CheatSheetsSystem - getSheet / getAllSheets', () => {
  test('getSheet should return registered sheet', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    expect(cs.getSheet('test')).not.toBeNull();
    expect(cs.getSheet('test').title).toBe('Test Sheet');
  });

  test('getSheet should return null for unknown id', () => {
    const cs = new CheatSheetsSystem();
    expect(cs.getSheet('nonexistent')).toBeNull();
  });

  test('getAllSheets should return all registered sheets', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('sheet1', createTestSheet({ title: 'Sheet 1' }));
    cs.registerSheet('sheet2', createTestSheet({ title: 'Sheet 2' }));
    expect(cs.getAllSheets().length).toBe(2);
  });
});

describe('CheatSheetsSystem - getSheetsByCategory', () => {
  test('should filter sheets by category', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet({ category: 'Chemie' }));
    cs.registerSheet('s2', createTestSheet({ category: 'Physik' }));
    cs.registerSheet('s3', createTestSheet({ category: 'Chemie' }));
    expect(cs.getSheetsByCategory('Chemie').length).toBe(2);
  });

  test('should return empty array for unknown category', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet());
    expect(cs.getSheetsByCategory('Biologie').length).toBe(0);
  });
});

describe('CheatSheetsSystem - getSheetsByGradeLevel', () => {
  test('should filter sheets by grade level', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet({ gradeLevel: 'Klasse 10' }));
    cs.registerSheet('s2', createTestSheet({ gradeLevel: 'Klasse 8' }));
    const result = cs.getSheetsByGradeLevel('Klasse 10');
    expect(result.length).toBe(1);
    expect(result[0].gradeLevel).toBe('Klasse 10');
  });

  test('should include "Alle" grade level sheets', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet({ gradeLevel: 'Alle' }));
    cs.registerSheet('s2', createTestSheet({ gradeLevel: 'Klasse 10' }));
    const result = cs.getSheetsByGradeLevel('Klasse 10');
    expect(result.length).toBe(2);
  });
});

describe('CheatSheetsSystem - viewSheet', () => {
  test('should increment view count', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.viewSheet('test');
    cs.viewSheet('test');
    expect(cs.getSheet('test').viewCount).toBe(2);
  });

  test('should set lastViewed timestamp', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    const result = cs.viewSheet('test');
    expect(result.lastViewed).not.toBeNull();
  });

  test('should add to history', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.viewSheet('test');
    expect(cs.getHistory()).toContain('test');
  });

  test('should return null for unknown sheet', () => {
    const cs = new CheatSheetsSystem();
    expect(cs.viewSheet('nonexistent')).toBeNull();
  });
});

describe('CheatSheetsSystem - History', () => {
  test('should add most recent to front of history', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet());
    cs.registerSheet('s2', createTestSheet());
    cs.viewSheet('s1');
    cs.viewSheet('s2');
    expect(cs.getHistory()[0]).toBe('s2');
  });

  test('should respect maxHistory limit', () => {
    const cs = new CheatSheetsSystem();
    cs.settings.maxHistory = 3;
    for (let i = 0; i < 5; i++) {
      cs.registerSheet(`s${i}`, createTestSheet());
      cs.viewSheet(`s${i}`);
    }
    expect(cs.getHistory().length).toBeLessThanOrEqual(3);
  });
});

describe('CheatSheetsSystem - Bookmarks', () => {
  test('should bookmark a sheet', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.bookmarkSheet('test');
    expect(cs.isBookmarked('test')).toBe(true);
  });

  test('should not double-bookmark', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.bookmarkSheet('test');
    cs.bookmarkSheet('test');
    expect(cs.bookmarks.length).toBe(1);
  });

  test('should unbookmark a sheet', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.bookmarkSheet('test');
    cs.unbookmarkSheet('test');
    expect(cs.isBookmarked('test')).toBe(false);
  });

  test('toggleBookmark should toggle correctly', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    expect(cs.toggleBookmark('test')).toBe(true);
    expect(cs.toggleBookmark('test')).toBe(false);
  });

  test('getBookmarkedSheets should return sheet objects', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet({ title: 'Bookmarked' }));
    cs.registerSheet('s2', createTestSheet({ title: 'Not Bookmarked' }));
    cs.bookmarkSheet('s1');
    const bookmarked = cs.getBookmarkedSheets();
    expect(bookmarked.length).toBe(1);
    expect(bookmarked[0].title).toBe('Bookmarked');
  });
});

describe('CheatSheetsSystem - searchSheets', () => {
  test('should search by keyword', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet({ keywords: ['oxidation', 'reduktion'] }));
    cs.registerSheet('s2', createTestSheet({ keywords: ['säuren', 'basen'] }));
    const results = cs.searchSheets('oxidation');
    expect(results.length).toBe(1);
  });

  test('should return empty array for empty query', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet());
    expect(cs.searchSheets('')).toEqual([]);
  });

  test('should return empty array for non-string query', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet());
    expect(cs.searchSheets(null)).toEqual([]);
    expect(cs.searchSheets(undefined)).toEqual([]);
    expect(cs.searchSheets(123)).toEqual([]);
  });
});

describe('CheatSheetsSystem - getRecentSheets', () => {
  test('should return recent sheets from history', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet());
    cs.registerSheet('s2', createTestSheet());
    cs.viewSheet('s1');
    cs.viewSheet('s2');
    const recent = cs.getRecentSheets();
    expect(recent.length).toBe(2);
  });

  test('should respect limit parameter', () => {
    const cs = new CheatSheetsSystem();
    for (let i = 0; i < 5; i++) {
      cs.registerSheet(`s${i}`, createTestSheet());
      cs.viewSheet(`s${i}`);
    }
    expect(cs.getRecentSheets(3).length).toBe(3);
  });
});

describe('CheatSheetsSystem - formatSheetAsHTML', () => {
  test('should return not-found message for unknown sheet', () => {
    const cs = new CheatSheetsSystem();
    const html = cs.formatSheetAsHTML('nonexistent');
    expect(html).toContain('Sheet not found');
  });

  test('should render sheet with title', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet({ title: 'My Sheet' }));
    const html = cs.formatSheetAsHTML('test');
    expect(html).toContain('My Sheet');
  });

  test('should escape HTML in title (XSS prevention)', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('xss', createTestSheet({ title: '<script>alert("xss")</script>' }));
    const html = cs.formatSheetAsHTML('xss');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('should escape HTML in content text', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('xss-content', {
      title: 'Safe',
      content: [
        { title: 'Section', text: '<img src=x onerror=alert(1)>', formulas: [], examples: [] },
      ],
      keywords: [],
    });
    const html = cs.formatSheetAsHTML('xss-content');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('CheatSheetsSystem - exportSheet / importSheet', () => {
  test('exportSheet should return sheet data', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet({ title: 'Export Test' }));
    const exported = cs.exportSheet('test');
    expect(exported).not.toBeNull();
    expect(exported.title).toBe('Export Test');
  });

  test('importSheet should import from exported data', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet({ title: 'Original' }));
    const exported = cs.exportSheet('test');

    const cs2 = new CheatSheetsSystem();
    const result = cs2.importSheet(exported);
    expect(result.success).toBe(true);
    expect(cs2.getSheet(result.sheetId)).toBeDefined();
  });
});

describe('CheatSheetsSystem - clearAll', () => {
  test('clearAll should clear bookmarks and history', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.bookmarkSheet('test');
    cs.viewSheet('test');
    cs.clearAll();
    expect(cs.bookmarks).toEqual([]);
    expect(cs.readHistory).toEqual([]);
  });
});

describe('CheatSheetsSystem - Statistics', () => {
  test('getSheetStats should return stats for a sheet', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('test', createTestSheet());
    cs.viewSheet('test');
    cs.viewSheet('test');
    const stats = cs.getSheetStats('test');
    expect(stats).toHaveProperty('viewCount');
    expect(stats.viewCount).toBe(2);
  });

  test('getUsageStats should return overall stats', () => {
    const cs = new CheatSheetsSystem();
    cs.registerSheet('s1', createTestSheet());
    cs.registerSheet('s2', createTestSheet());
    cs.viewSheet('s1');
    const stats = cs.getUsageStats();
    expect(stats).toHaveProperty('totalSheets');
    expect(stats.totalSheets).toBe(2);
  });
});
