/**
 * Export/Import Manager
 * Handles PDF, CSV, and JSON export/import for calculator data
 */

const ExportManager = {
  /**
   * Export calculation results to PDF
   * @param {object} data - Calculation results
   * @param {string} title - Document title
   * @param {string} filename - Output filename
   */
  exportToPDF(data, title, filename = 'calculation-results.pdf') {
    if (typeof jsPDF === 'undefined') {
      console.error('jsPDF library not loaded');
      return false;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      let yPos = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;
      const contentWidth = doc.internal.pageSize.getWidth() - 2 * marginLeft;

      // Title
      doc.setFontSize(20);
      doc.text(title, marginLeft, yPos);
      yPos += 15;

      // Timestamp
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, yPos);
      yPos += 15;

      // Content
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      // Helper function to add text with page break
      const addText = (text, fontSize = 12, isBold = false) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont(undefined, 'bold');
        } else {
          doc.setFont(undefined, 'normal');
        }

        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, marginLeft, yPos);
        yPos += lines.length * (fontSize * 0.5) + 5;

        return yPos;
      };

      // Add calculation type
      if (data.calculationType) {
        yPos = addText(`Calculation Type: ${data.calculationType}`, 14, true);
        yPos += 5;
      }

      // Add input parameters
      if (data.inputs && Object.keys(data.inputs).length > 0) {
        yPos = addText('Input Parameters:', 14, true);
        yPos += 5;

        for (const [key, value] of Object.entries(data.inputs)) {
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const displayValue = typeof value === 'number' ? value.toFixed(4) : value;
          yPos = addText(`${displayKey}: ${displayValue}`, 11);
        }
        yPos += 5;
      }

      // Add results
      if (data.results && Object.keys(data.results).length > 0) {
        yPos = addText('Results:', 14, true);
        yPos += 5;

        for (const [key, value] of Object.entries(data.results)) {
          if (typeof value === 'object' && value !== null) {
            yPos = addText(`${key}:`, 12, true);
            for (const [subKey, subValue] of Object.entries(value)) {
              const displaySubKey = subKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const displaySubValue = typeof subValue === 'number' ? subValue.toFixed(4) : subValue;
              yPos = addText(`  ${displaySubKey}: ${displaySubValue}`, 10);
            }
          } else {
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = typeof value === 'number' ? value.toFixed(4) : value;
            yPos = addText(`${displayKey}: ${displayValue}`, 11);
          }
        }
        yPos += 5;
      }

      // Add steps for multi-step calculations
      if (data.steps && data.steps.length > 0) {
        yPos = addText('Calculation Steps:', 14, true);
        yPos += 5;

        data.steps.forEach((step, index) => {
          yPos = addText(`Step ${index + 1}:`, 12, true);
          for (const [key, value] of Object.entries(step)) {
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = typeof value === 'number' ? value.toFixed(4) : value;
            yPos = addText(`  ${displayKey}: ${displayValue}`, 10);
          }
          yPos += 3;
        });
      }

      // Add notes if present
      if (data.notes) {
        yPos = addText('Notes:', 14, true);
        yPos = addText(data.notes, 10);
      }

      // Add footer to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${totalPages} | Chemistry Calculator | chemie-lernen.org`,
          marginLeft,
          pageHeight - 10
        );
      }

      // Save PDF
      doc.save(filename);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  },

  /**
   * Export calculation history to PDF
   * @param {array} history - Array of calculation records
   * @param {string} filename - Output filename
   */
  exportHistoryToPDF(history, filename = 'calculation-history.pdf') {
    if (!Array.isArray(history) || history.length === 0) {
      console.error('Invalid history data');
      return false;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      let yPos = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;

      // Title
      doc.setFontSize(20);
      doc.text('Calculation History', marginLeft, yPos);
      yPos += 10;

      // Summary
      doc.setFontSize(10);
      doc.text(`Total Calculations: ${history.length}`, marginLeft, yPos);
      doc.text(`Export Date: ${new Date().toLocaleString()}`, marginLeft + 80, yPos);
      yPos += 20;

      // History entries
      history.forEach((entry, index) => {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
        }

        // Entry header
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${entry.type || 'Calculation'}`, marginLeft, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Date: ${entry.timestamp || new Date().toLocaleString()}`, marginLeft + 5, yPos);
        yPos += 7;

        // Key results
        if (entry.results) {
          for (const [key, value] of Object.entries(entry.results).slice(0, 5)) {
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = 20;
            }
            const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
            const displayValue = typeof value === 'number' ? value.toFixed(4) : String(value).substring(0, 60);
            doc.text(`${displayKey}: ${displayValue}`, marginLeft + 5, yPos);
            yPos += 6;
          }
        }

        yPos += 10;
      });

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${totalPages} | chemie-lernen.org`,
          marginLeft,
          pageHeight - 10
        );
      }

      doc.save(filename);
      return true;
    } catch (error) {
      console.error('Error exporting history to PDF:', error);
      return false;
    }
  },

  /**
   * Export data to CSV
   * @param {object|array} data - Data to export
   * @param {string} filename - Output filename
   */
  exportToCSV(data, filename = 'calculation-data.csv') {
    try {
      let csv = '';

      if (Array.isArray(data)) {
        // Array of objects
        if (data.length === 0) {
          return false;
        }

        // Headers
        const headers = Object.keys(data[0]);
        csv += headers.join(',') + '\n';

        // Rows
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) {
              return '';
            }
            if (typeof value === 'number') {
              return value.toString();
            }
            // Escape quotes and wrap in quotes
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
          });
          csv += values.join(',') + '\n';
        });
      } else if (typeof data === 'object') {
        // Single object
        const headers = Object.keys(data);
        const values = Object.values(data).map(value => {
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'number') {
            return value.toString();
          }
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        });
        csv += headers.join(',') + '\n';
        csv += values.join(',') + '\n';
      } else {
        return false;
      }

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return false;
    }
  },

  /**
   * Export titration curve data to CSV
   * @param {array} curveData - Titration curve points
   * @param {string} filename - Output filename
   */
  exportTitrationCurveToCSV(curveData, filename = 'titration-curve.csv') {
    if (!Array.isArray(curveData)) {
      return false;
    }

    const formattedData = curveData.map(point => ({
      'Volume Added (mL)': point.volumeAdded.toFixed(2),
      'Percent to Equivalence': point.percent.toFixed(1),
      'pH': point.ph.toFixed(2),
      'Region': point.region
    }));

    return this.exportToCSV(formattedData, filename);
  },

  /**
   * Export calculation history to CSV
   * @param {array} history - History array
   * @param {string} filename - Output filename
   */
  exportHistoryToCSV(history, filename = 'calculation-history.csv') {
    if (!Array.isArray(history)) {
      return false;
    }

    const formattedHistory = history.map(entry => {
      const flat = {
        'Timestamp': entry.timestamp || new Date().toISOString(),
        'Type': entry.type || 'Calculation'
      };

      // Flatten nested objects
      if (entry.inputs) {
        for (const [key, value] of Object.entries(entry.inputs)) {
          flat[`Input: ${key}`] = typeof value === 'number' ? value.toFixed(4) : value;
        }
      }

      if (entry.results) {
        for (const [key, value] of Object.entries(entry.results)) {
          if (typeof value !== 'object') {
            flat[`Result: ${key}`] = typeof value === 'number' ? value.toFixed(4) : value;
          }
        }
      }

      return flat;
    });

    return this.exportToCSV(formattedHistory, filename);
  },

  /**
   * Export data to JSON
   * @param {object|array} data - Data to export
   * @param {string} filename - Output filename
   * @param {boolean} pretty - Pretty print JSON
   */
  exportToJSON(data, filename = 'calculation-data.json', pretty = true) {
    try {
      const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      return false;
    }
  },

  /**
   * Export calculation with metadata to JSON
   * @param {object} calculation - Calculation data
   * @param {string} filename - Output filename
   */
  exportCalculationToJSON(calculation, filename) {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      calculator: 'chemistry-calculator',
      data: calculation
    };

    const defaultFilename = filename || `calculation-${Date.now()}.json`;
    return this.exportToJSON(exportData, defaultFilename, true);
  },

  /**
   * Export history to JSON
   * @param {array} history - History array
   * @param {string} filename - Output filename
   */
  exportHistoryToJSON(history, filename = 'calculation-history.json') {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalEntries: history.length,
      calculator: 'chemistry-calculator',
      history
    };

    return this.exportToJSON(exportData, filename, true);
  },

  /**
   * Import data from JSON
   * @param {file} file - File object to import
   * @returns {Promise<object>} - Parsed JSON data
   */
  importFromJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  },

  /**
   * Import calculation from JSON
   * @param {file} file - File object
   * @returns {Promise<object>} - Imported calculation data
   */
  importCalculationFromJSON(file) {
    return this.importFromJSON(file).then(data => {
      if (data.calculator !== 'chemistry-calculator') {
        throw new Error('Not a valid chemistry calculator export');
      }
      return data.data;
    });
  },

  /**
   * Import history from JSON
   * @param {file} file - File object
   * @returns {Promise<array>} - Imported history array
   */
  importHistoryFromJSON(file) {
    return this.importFromJSON(file).then(data => {
      if (!Array.isArray(data.history)) {
        throw new Error('Invalid history file format');
      }
      return data.history;
    });
  },

  /**
   * Save calculation to browser storage
   * @param {string} id - Unique identifier
   * @param {object} data - Calculation data
   */
  saveToStorage(id, data) {
    try {
      const storageKey = `calc_${id}`;
      const record = {
        data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(record));
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  },

  /**
   * Load calculation from browser storage
   * @param {string} id - Unique identifier
   * @returns {object|null} - Saved calculation data
   */
  loadFromStorage(id) {
    try {
      const storageKey = `calc_${id}`;
      const record = localStorage.getItem(storageKey);

      if (!record) {
        return null;
      }

      return JSON.parse(record).data;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  },

  /**
   * Get all saved calculations from storage
   * @returns {array} - Array of saved calculations
   */
  getAllFromStorage() {
    try {
      const calculations = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('calc_')) {
          const record = JSON.parse(localStorage.getItem(key));
          calculations.push({
            id: key.replace('calc_', ''),
            ...record.data,
            savedAt: record.savedAt
          });
        }
      }

      return calculations.sort((a, b) =>
        new Date(b.savedAt) - new Date(a.savedAt)
      );
    } catch (error) {
      console.error('Error getting all from storage:', error);
      return [];
    }
  },

  /**
   * Delete calculation from storage
   * @param {string} id - Unique identifier
   * @returns {boolean} - Success status
   */
  deleteFromStorage(id) {
    try {
      const storageKey = `calc_${id}`;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Error deleting from storage:', error);
      return false;
    }
  },

  /**
   * Clear all saved calculations
   * @returns {boolean} - Success status
   */
  clearStorage() {
    try {
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('calc_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Generate shareable link
   * @param {object} data - Calculation data to share
   * @returns {string} - Shareable URL
   */
  generateShareableLink(data) {
    try {
      // Compress data to base64
      const jsonString = JSON.stringify(data);
      const compressed = btoa(jsonString);

      // Create URL with data parameter
      const url = new URL(window.location.href);
      url.searchParams.set('data', compressed);

      return url.toString();
    } catch (error) {
      console.error('Error generating shareable link:', error);
      return null;
    }
  },

  /**
   * Load calculation from shareable link
   * @param {string} url - URL with data parameter
   * @returns {object|null} - Loaded calculation data
   */
  loadFromShareableLink(url) {
    try {
      const urlObj = new URL(url);
      const dataParam = urlObj.searchParams.get('data');

      if (!dataParam) {
        return null;
      }

      const jsonString = atob(dataParam);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error loading from shareable link:', error);
      return null;
    }
  },

  /**
   * Export all available formats
   * @param {object} data - Calculation data
   * @param {string} baseFilename - Base filename without extension
   */
  exportAllFormats(data, baseFilename = 'calculation') {
    const results = {
      pdf: this.exportToPDF(data, 'Calculation Results', `${baseFilename}.pdf`),
      csv: this.exportToCSV(data, `${baseFilename}.csv`),
      json: this.exportCalculationToJSON(data, `${baseFilename}.json`)
    };

    return results;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportManager;
}
