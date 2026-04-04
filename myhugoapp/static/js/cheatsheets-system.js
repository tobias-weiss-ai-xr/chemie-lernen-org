/**
 * Cheat Sheets & Reference Cards for chemie-lernen.org
 * Quick reference materials for chemistry topics
 */

class CheatSheetsSystem {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'chemie-lernen-cheatsheets';
    this.sheets = {};
    this.bookmarks = [];
    this.readHistory = [];
    this.settings = {
      autoSaveHistory: true,
      maxHistory: 50,
    };
    this.fallbackData = null; // In-memory fallback when localStorage fails

    // Load saved progress
    this.load();
  }

  /**
   * Register a cheat sheet
   */
  registerSheet(sheetId, sheetData) {
    this.sheets[sheetId] = {
      id: sheetId,
      title: sheetData.title,
      category: sheetData.category || 'Allgemein',
      gradeLevel: sheetData.gradeLevel || 'Alle',
      content: sheetData.content || [],
      keywords: sheetData.keywords || [],
      lastViewed: null,
      viewCount: 0,
    };

    return this.sheets[sheetId];
  }

  /**
   * Get all cheat sheets
   */
  getAllSheets() {
    return Object.values(this.sheets);
  }

  /**
   * Get sheet by ID
   */
  getSheet(sheetId) {
    return this.sheets[sheetId] || null;
  }

  /**
   * Get sheets by category
   */
  getSheetsByCategory(category) {
    return Object.values(this.sheets).filter((sheet) => sheet.category === category);
  }

  /**
   * Get sheets by grade level
   */
  getSheetsByGradeLevel(gradeLevel) {
    return Object.values(this.sheets).filter(
      (sheet) => sheet.gradeLevel === gradeLevel || sheet.gradeLevel === 'Alle'
    );
  }

  /**
   * View a cheat sheet
   */
  viewSheet(sheetId) {
    const sheet = this.sheets[sheetId];
    if (!sheet) return null;

    // Update view stats
    sheet.lastViewed = new Date().toISOString();
    sheet.viewCount++;

    // Add to history
    this.addToHistory(sheetId);

    // Save
    this.save();

    return sheet;
  }

  /**
   * Add to reading history
   */
  addToHistory(sheetId) {
    const history = this.readHistory;

    // Remove if already exists
    const index = history.indexOf(sheetId);
    if (index !== -1) {
      history.splice(index, 1);
    }

    // Add to beginning
    history.unshift(sheetId);

    // Keep only max history entries
    if (history.length > this.settings.maxHistory) {
      history.pop();
    }

    if (this.settings.autoSaveHistory) {
      this.save();
    }
  }

  /**
   * Get reading history
   */
  getHistory() {
    return this.readHistory;
  }

  /**
   * Bookmarks
   */
  bookmarkSheet(sheetId) {
    if (!this.bookmarks.includes(sheetId)) {
      this.bookmarks.push(sheetId);
      this.save();
    }
    return this.bookmarks;
  }

  /**
   * Unbookmark sheet
   */
  unbookmarkSheet(sheetId) {
    const index = this.bookmarks.indexOf(sheetId);
    if (index !== -1) {
      this.bookmarks.splice(index, 1);
      this.save();
    }
    return this.bookmarks;
  }

  /**
   * Toggle bookmark status
   */
  toggleBookmark(sheetId) {
    if (this.bookmarks.includes(sheetId)) {
      this.unbookmarkSheet(sheetId);
      return false;
    } else {
      this.bookmarkSheet(sheetId);
      return true;
    }
  }

  /**
   * Get bookmarked sheets
   */
  getBookmarkedSheets() {
    return this.bookmarks.map((id) => this.sheets[id]).filter((sheet) => sheet !== null);
  }

  /**
   * Is sheet bookmarked?
   */
  isBookmarked(sheetId) {
    return this.bookmarks.includes(sheetId);
  }

  /**
   * Search cheat sheets
   */
  searchSheets(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }
    const searchLower = query.toLowerCase();

    return Object.values(this.sheets).filter((sheet) => {
      // Search in title
      if (sheet.title.toLowerCase().includes(searchLower)) return true;

      // Search in keywords
      if (sheet.keywords.some((key) => key.toLowerCase().includes(searchLower))) return true;

      // Search in category
      if (sheet.category.toLowerCase().includes(searchLower)) return true;

      // Search in content
      for (const section of sheet.content) {
        if (typeof section.text === 'string' && section.text.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return false;
    });
  }

  /**
   * Get recent sheets
   */
  getRecentSheets(limit = 5) {
    return this.readHistory
      .map((id) => this.sheets[id])
      .filter((sheet) => sheet !== null)
      .slice(0, limit);
  }

  /**
   * Format cheat sheet as HTML
   */
  formatSheetAsHTML(sheetId) {
    const sheet = this.sheets[sheetId];
    if (!sheet) return '<p>Sheet not found</p>';

    let html = `
      <div class="cheat-sheet">
        <header class="cheat-sheet-header">
          <h2 class="cheat-sheet-title">${this._escapeHtml(sheet.title)}</h2>
          <div class="cheat-sheet-meta">
            <span class="cheat-sheet-category">${this._escapeHtml(sheet.category)}</span>
            <span class="cheat-sheet-grade">Klasse ${this._escapeHtml(String(sheet.gradeLevel))}</span>
          </div>
        </header>
        <div class="cheat-sheet-content">
    `;

    sheet.content.forEach(({ title, text, formulas = [], examples = [] }) => {
      html += `<section class="cheat-sheet-section">`;

      if (title) {
        html += `<h3 class="cheat-sheet-section-title">${this._escapeHtml(title)}</h3>`;
      }

      if (text) {
        html += `<p class="cheat-sheet-section-text">${this._escapeHtml(text)}</p>`;
      }

      if (formulas.length > 0) {
        html += `<div class="cheat-sheet-formulas">`;
        html += `<h4>Wichtige Formeln:</h4>`;
        formulas.forEach((formula) => {
          html += `<div class="cheat-sheet-formula">${this._escapeHtml(formula)}</div>`;
        });
        html += `</div>`;
      }

      if (examples.length > 0) {
        html += `<div class="cheat-sheet-examples">`;
        html += `<h4>Beispiele:</h4>`;
        html += '<ul>';
        examples.forEach((example) => {
          html += `<li>${this._escapeHtml(example)}</li>`;
        });
        html += '</ul>';
        html += `</div>`;
      }

      html += `</section>`;
    });

    html += `</div>
      <footer class="cheat-sheet-footer">
        <span class="cheat-sheet-views">${sheet.viewCount} Aufrufe</span>
        ${sheet.lastViewed ? `<span>Last viewed: ${new Date(sheet.lastViewed).toLocaleDateString()}</span>` : ''}
      </footer>
    </div>
    `;

    return html;
  }

  /**
   * Export cheat sheet as JSON
   */
  exportSheet(sheetId) {
    const sheet = this.sheets[sheetId];
    if (!sheet) return null;

    return {
      id: sheet.id,
      title: sheet.title,
      category: sheet.category,
      gradeLevel: sheet.gradeLevel,
      content: sheet.content,
      keywords: sheet.keywords,
    };
  }

  /**
   * Import cheat sheet from JSON
   */
  importSheet(json) {
    try {
      const sheetId = `imported-${Date.now()}`;
      this.registerSheet(sheetId, {
        title: json.title,
        category: json.category || 'Imported',
        gradeLevel: json.gradeLevel || 'Alle',
        content: json.content,
        keywords: json.keywords,
      });
      return { success: true, sheetId };
    } catch (e) {
      console.error('Error importing cheat sheet:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Get sheet statistics
   */
  getSheetStats(sheetId) {
    const sheet = this.sheets[sheetId];
    if (!sheet) return null;

    return {
      title: sheet.title,
      viewCount: sheet.viewCount,
      lastViewed: sheet.lastViewed,
      bookmarked: this.isBookmarked(sheetId),
      inHistory: this.readHistory.includes(sheetId),
    };
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.readHistory = [];
    this.save();
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.sheets = {};
    this.bookmarks = [];
    this.readHistory = [];
    this.save();
  }

  /**
   * Save to localStorage
   */
  save() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, saving to in-memory fallback');
      this.fallbackData = {
        sheets: this.sheets,
        bookmarks: [...this.bookmarks],
        readHistory: [...this.readHistory],
        settings: { ...this.settings },
      };
      return;
    }

    try {
      const data = {
        sheets: this.sheets,
        bookmarks: this.bookmarks,
        readHistory: this.readHistory,
        settings: this.settings,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Update fallback data on successful save
      this.fallbackData = {
        sheets: JSON.parse(JSON.stringify(this.sheets)),
        bookmarks: [...this.bookmarks],
        readHistory: [...this.readHistory],
        settings: { ...this.settings },
      };
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Using in-memory fallback:', error);
        this.fallbackData = {
          sheets: this.sheets,
          bookmarks: this.bookmarks,
          readHistory: this.readHistory,
          settings: this.settings,
        };
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        this.fallbackData = {
          sheets: this.sheets,
          bookmarks: this.bookmarks,
          readHistory: this.readHistory,
          settings: this.settings,
        };
      } else {
        console.error('Error saving cheat sheets:', error);
        this.fallbackData = {
          sheets: this.sheets,
          bookmarks: this.bookmarks,
          readHistory: this.readHistory,
          settings: this.settings,
        };
      }
    }
  }

  /**
   * Load from localStorage
   */
  load() {
    // Check if localStorage is available (Node.js compatibility)
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available, using in-memory fallback');
      if (this.fallbackData) {
        this.sheets = this.fallbackData.sheets || {};
        this.bookmarks = this.fallbackData.bookmarks || [];
        this.readHistory = this.fallbackData.readHistory || [];
        this.settings = { ...this.settings, ...this.fallbackData.settings };
      }
      return;
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.sheets = parsed.sheets || {};
        this.bookmarks = parsed.bookmarks || [];
        this.readHistory = parsed.readHistory || [];
        this.settings = { ...this.settings, ...parsed.settings };
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded:', error);
        if (this.fallbackData) {
          console.warn('Using saved fallback data due to quota exceeded');
          this.sheets = this.fallbackData.sheets || {};
          this.bookmarks = this.fallbackData.bookmarks || [];
          this.readHistory = this.fallbackData.readHistory || [];
          this.settings = { ...this.settings, ...this.fallbackData.settings };
        }
      } else if (error.name === 'SecurityError') {
        console.error('Storage access blocked (privacy mode or iframe restrictions):', error);
        if (this.fallbackData) {
          this.sheets = this.fallbackData.sheets || {};
          this.bookmarks = this.fallbackData.bookmarks || [];
          this.readHistory = this.fallbackData.readHistory || [];
          this.settings = { ...this.settings, ...this.fallbackData.settings };
        }
      } else {
        console.error('Error loading cheat sheets:', error);
      }
    }
  }

  /**
   * Get all categories
   */
  getAllCategories() {
    const categories = new Set();
    Object.values(this.sheets).forEach((sheet) => {
      categories.add(sheet.category);
    });
    return Array.from(categories).sort();
  }

  /**
   * Get all grade levels
   */
  getAllGradeLevels() {
    const grades = new Set();
    Object.values(this.sheets).forEach((sheet) => {
      grades.add(sheet.gradeLevel);
    });
    return Array.from(grades).sort();
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const totalSheets = Object.keys(this.sheets).length;
    const totalViews = Object.values(this.sheets).reduce((sum, sheet) => sum + sheet.viewCount, 0);
    const totalBookmarks = this.bookmarks.length;
    const totalHistory = this.readHistory.length;

    return {
      totalSheets,
      totalViews,
      averageViewsPerSheet: totalSheets > 0 ? Math.round(totalViews / totalSheets) : 0,
      totalBookmarks,
      totalHistory,
      sheetsViewed: this.readHistory.length,
    };
  }

  /**
   * Print cheat sheet
   */
  printSheet(sheetId) {
    const sheet = this.sheets[sheetId];
    if (!sheet) return;

    const printData = this.formatSheetAsHTML(sheetId);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${sheet.title} - Chemielernen.org</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .cheat-sheet { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .cheat-sheet-header { border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
          .cheat-sheet-title { color: #28a745; margin: 0 0 10px 0; }
          .cheat-sheet-section { margin-bottom: 25px; }
          .cheat-sheet-section-title { color: #333; font-size: 18px; margin-bottom: 10px; }
          .cheat-sheet-section-text { line-height: 1.6; color: #555; }
          .cheat-sheet-formulas { background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
          .cheat-sheet-formula { font-family: monospace; margin: 8px 0; }
          ul { line-height: 1.6; }
          .cheat-sheet-footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #888; font-size: 14px; }
          @media print { .cheat-sheet { box-shadow: none; } body { margin: 0; } }
        </style>
      </head>
      <body>
        ${printData}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for HTML insertion
   */
  _escapeHtml(text) {
    if (typeof text !== 'string') return String(text);
    const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }
}

// Global cheat sheets instance
const chemieCheatsheets = new CheatSheetsSystem({
  storageKey: 'chemie-lernen-cheatsheets',
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CheatSheetsSystem, chemieCheatsheets };
}
