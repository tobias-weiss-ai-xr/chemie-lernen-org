/**
 * Periodic Table Visualizer
 * Enhanced interactive periodic table with visualizations
 */

const PeriodicTableViz = {
  elementData: null,

  /**
   * Initialize element data
   */
  async initElementData() {
    if (this.elementData) return;

    try {
      const response = await fetch('/data/elements.json');
      this.elementData = await response.json();
    } catch (error) {
      console.error('Failed to load element data:', error);
      this.elementData = this.getDefaultElementData();
    }
  },

  /**
   * Get default element data (subset)
   */
  getDefaultElementData() {
    return {
      H: { number: 1, name: 'Wasserstoff', symbol: 'H', mass: 1.008, category: 'nonmetal' },
      He: { number: 2, name: 'Helium', symbol: 'He', mass: 4.003, category: 'noble' },
      Li: { number: 3, name: 'Lithium', symbol: 'Li', mass: 6.941, category: 'alkali' },
      Be: { number: 4, name: 'Beryllium', symbol: 'Be', mass: 9.012, category: 'alkaline' },
      B: { number: 5, name: 'Bor', symbol: 'B', mass: 10.81, category: 'metalloid' },
      C: { number: 6, name: 'Kohlenstoff', symbol: 'C', mass: 12.01, category: 'nonmetal' },
      N: { number: 7, name: 'Stickstoff', symbol: 'N', mass: 14.01, category: 'nonmetal' },
      O: { number: 8, name: 'Sauerstoff', symbol: 'O', mass: 16.00, category: 'nonmetal' },
      F: { number: 9, name: 'Fluor', symbol: 'F', mass: 19.00, category: 'halogen' },
      Ne: { number: 10, name: 'Neon', symbol: 'Ne', mass: 20.18, category: 'noble' },
      Na: { number: 11, name: 'Natrium', symbol: 'Na', mass: 22.99, category: 'alkali' },
      Mg: { number: 12, name: 'Magnesium', symbol: 'Mg', mass: 24.31, category: 'alkaline' },
      Al: { number: 13, name: 'Aluminium', symbol: 'Al', mass: 26.98, category: 'metal' },
      Si: { number: 14, name: 'Silicium', symbol: 'Si', mass: 28.09, category: 'metalloid' },
      P: { number: 15, name: 'Phosphor', symbol: 'P', mass: 30.97, category: 'nonmetal' },
      S: { number: 16, name: 'Schwefel', symbol: 'S', mass: 32.06, category: 'nonmetal' },
      Cl: { number: 17, name: 'Chlor', symbol: 'Cl', mass: 35.45, category: 'halogen' },
      Ar: { number: 18, name: 'Argon', symbol: 'Ar', mass: 39.95, category: 'noble' },
      K: { number: 19, name: 'Kalium', symbol: 'K', mass: 39.10, category: 'alkali' },
      Ca: { number: 20, name: 'Calcium', symbol: 'Ca', mass: 40.08, category: 'alkaline' }
    };
  },

  /**
   * Create interactive periodic table
   */
  async create(options = {}) {
    const {
      containerId,
      viewMode = 'standard', // standard, properties, trends, electronegativity
      interactive = true,
      showLegend = true
    } = options;

    await this.initElementData();

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const table = document.createElement('div');
    table.className = 'periodic-table-viz';
    table.dataset.viewMode = viewMode;

    // Create grid
    const grid = this.createGrid(viewMode, interactive);
    table.appendChild(grid);

    // Create legend
    if (showLegend) {
      const legend = this.createLegend(viewMode);
      table.appendChild(legend);
    }

    container.appendChild(table);
    this.addStyles();

    // Add interactivity
    if (interactive) {
      this.addInteractivity(table);
    }

    return table;
  },

  /**
   * Create periodic table grid
   */
  createGrid(viewMode, interactive) {
    const grid = document.createElement('div');
    grid.className = 'pt-grid';

    const layout = this.getPeriodicTableLayout();

    layout.forEach((row, rowIndex) => {
      row.forEach((element, colIndex) => {
        const cell = document.createElement('div');
        cell.className = 'pt-cell';
        cell.dataset.row = rowIndex;
        cell.dataset.col = colIndex;

        if (element) {
          const data = this.elementData[element];
          if (data) {
            cell.className += ` pt-${data.category}`;
            cell.dataset.element = element;
            cell.dataset.category = data.category;

            const content = this.getCellContent(data, viewMode);
            cell.innerHTML = content;

            if (interactive) {
              cell.className += ' interactive';
              cell.tabIndex = 0;
            }
          }
        } else {
          cell.className += ' pt-empty';
        }

        grid.appendChild(cell);
      });
    });

    return grid;
  },

  /**
   * Get periodic table layout
   */
  getPeriodicTableLayout() {
    return [
      ['H', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'He'],
      ['Li', 'Be', null, null, null, null, null, null, null, null, null, null, 'B', 'C', 'N', 'O', 'F', 'Ne'],
      ['Na', 'Mg', null, null, null, null, null, null, null, null, null, null, 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
      ['K', 'Ca', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
    ];
  },

  /**
   * Get cell content based on view mode
   */
  getCellContent(data, viewMode) {
    const baseContent = `
      <span class="pt-number">${data.number}</span>
      <span class="pt-symbol">${data.symbol}</span>
      <span class="pt-name">${data.name}</span>
    `;

    switch (viewMode) {
      case 'properties':
        return `
          ${baseContent}
          <span class="pt-mass">${data.mass.toFixed(2)}</span>
        `;

      case 'trends':
        return `
          <span class="pt-number">${data.number}</span>
          <span class="pt-symbol">${data.symbol}</span>
          <span class="pt-trend">${this.calculateTrendValue(data)}</span>
        `;

      case 'electronegativity':
        const en = this.getElectronegativity(data.symbol);
        return `
          <span class="pt-symbol">${data.symbol}</span>
          <span class="pt-en">${en !== null ? en.toFixed(2) : 'N/A'}</span>
        `;

      default:
        return baseContent;
    }
  },

  /**
   * Calculate trend value (atomic radius example)
   */
  calculateTrendValue(data) {
    // Simplified atomic radius trend (decreases across period, increases down group)
    const period = Math.ceil(data.number / 18);
    const baseRadius = 200 - (data.number % 18) * 5 + period * 30;
    return baseRadius.toFixed(0) + ' pm';
  },

  /**
   * Get electronegativity value
   */
  getElectronegativity(symbol) {
    const values = {
      H: 2.20, He: null,
      Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Ne: null,
      Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16, Ar: null,
      K: 0.82, Ca: 1.00
    };
    return values[symbol] !== undefined ? values[symbol] : null;
  },

  /**
   * Create legend
   */
  createLegend(viewMode) {
    const legend = document.createElement('div');
    legend.className = 'pt-legend';

    if (viewMode === 'standard') {
      const categories = [
        { key: 'alkali', label: 'Alkalimetalle' },
        { key: 'alkaline', label: 'Erdalkalimetalle' },
        { key: 'metal', label: 'Übergangsmetalle' },
        { key: 'metalloid', label: 'Metalloide' },
        { key: 'nonmetal', label: 'Nichtmetalle' },
        { key: 'halogen', label: 'Halogene' },
        { key: 'noble', label: 'Edelgase' }
      ];

      categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
          <span class="legend-color pt-${cat.key}"></span>
          <span class="legend-label">${cat.label}</span>
        `;
        legend.appendChild(item);
      });
    } else if (viewMode === 'electronegativity') {
      legend.innerHTML = `
        <div class="legend-gradient">
          <span>Low (0.7)</span>
          <div class="gradient-bar"></div>
          <span>High (4.0)</span>
        </div>
      `;
    }

    return legend;
  },

  /**
   * Add interactivity to periodic table
   */
  addInteractivity(table) {
    const cells = table.querySelectorAll('.pt-cell.interactive');

    cells.forEach(cell => {
      // Hover effect
      cell.addEventListener('mouseenter', () => {
        this.showElementTooltip(cell);
      });

      cell.addEventListener('mouseleave', () => {
        this.hideElementTooltip();
      });

      // Click to select
      cell.addEventListener('click', () => {
        this.selectElement(cell);
      });

      // Keyboard support
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectElement(cell);
        }
      });
    });

    // Add tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'pt-tooltip';
    tooltip.id = 'pt-tooltip';
    document.body.appendChild(tooltip);
  },

  /**
   * Show element tooltip
   */
  showElementTooltip(cell) {
    const element = cell.dataset.element;
    if (!element) return;

    const data = this.elementData[element];
    if (!data) return;

    const tooltip = document.getElementById('pt-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-symbol">${data.symbol}</span>
        <span class="tooltip-name">${data.name}</span>
      </div>
      <div class="tooltip-details">
        <div><strong>Ordnungszahl:</strong> ${data.number}</div>
        <div><strong>Atommasse:</strong> ${data.mass} u</div>
        <div><strong>Kategorie:</strong> ${this.getCategoryName(data.category)}</div>
      </div>
    `;

    const rect = cell.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 10) + 'px';
    tooltip.classList.add('visible');
  },

  /**
   * Hide element tooltip
   */
  hideElementTooltip() {
    const tooltip = document.getElementById('pt-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  },

  /**
   * Select element
   */
  selectElement(cell) {
    // Remove previous selection
    document.querySelectorAll('.pt-cell.selected').forEach(c => {
      c.classList.remove('selected');
    });

    // Add selection to clicked cell
    cell.classList.add('selected');

    // Dispatch custom event
    const event = new CustomEvent('elementSelected', {
      detail: {
        element: cell.dataset.element,
        data: this.elementData[cell.dataset.element]
      }
    });
    document.dispatchEvent(event);
  },

  /**
   * Get category display name
   */
  getCategoryName(category) {
    const names = {
      alkali: 'Alkalimetall',
      alkaline: 'Erdalkalimetall',
      metal: 'Metall',
      metalloid: 'Metalloid',
      nonmetal: 'Nichtmetall',
      halogen: 'Halogen',
      noble: 'Edelgas'
    };
    return names[category] || category;
  },

  /**
   * Update view mode
   */
  updateViewMode(containerId, viewMode) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const table = container.querySelector('.periodic-table-viz');
    if (!table) return;

    table.dataset.viewMode = viewMode;

    // Update grid
    const oldGrid = table.querySelector('.pt-grid');
    const newGrid = this.createGrid(viewMode, true);
    table.replaceChild(newGrid, oldGrid);

    // Update legend
    const oldLegend = table.querySelector('.pt-legend');
    if (oldLegend) {
      const newLegend = this.createLegend(viewMode);
      table.replaceChild(newLegend, oldLegend);
    }

    // Re-add interactivity
    this.addInteractivity(table);
  },

  /**
   * Highlight elements by category
   */
  highlightCategory(containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cells = container.querySelectorAll('.pt-cell');
    cells.forEach(cell => {
      if (category === 'all' || cell.dataset.category === category) {
        cell.classList.add('highlighted');
        cell.classList.remove('dimmed');
      } else {
        cell.classList.add('dimmed');
        cell.classList.remove('highlighted');
      }
    });
  },

  /**
   * Clear highlights
   */
  clearHighlights(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cells = container.querySelectorAll('.pt-cell');
    cells.forEach(cell => {
      cell.classList.remove('highlighted', 'dimmed');
    });
  },

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('periodic-table-viz-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'periodic-table-viz-styles';
    style.textContent = `
      .periodic-table-viz {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin: 20px 0;
      }

      .pt-grid {
        display: grid;
        grid-template-columns: repeat(18, 1fr);
        gap: 4px;
        margin-bottom: 20px;
      }

      .pt-cell {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 10px;
        text-align: center;
        padding: 4px;
        transition: all 0.3s ease;
        position: relative;
      }

      .pt-cell.pt-empty {
        visibility: hidden;
      }

      .pt-cell.interactive {
        cursor: pointer;
      }

      .pt-cell.interactive:hover {
        transform: scale(1.1);
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      .pt-cell.selected {
        outline: 3px solid #2196F3;
        outline-offset: 2px;
      }

      .pt-cell.highlighted {
        transform: scale(1.05);
        box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
      }

      .pt-cell.dimmed {
        opacity: 0.3;
      }

      .pt-number {
        font-size: 8px;
        color: #666;
        position: absolute;
        top: 2px;
        left: 4px;
      }

      .pt-symbol {
        font-size: 16px;
        font-weight: bold;
        margin: 4px 0;
      }

      .pt-name {
        font-size: 7px;
        line-height: 1.2;
      }

      .pt-mass {
        font-size: 7px;
        color: #666;
        margin-top: 2px;
      }

      /* Category colors */
      .pt-alkali { background: #FF6B6B; color: #fff; }
      .pt-alkaline { background: #4ECDC4; color: #fff; }
      .pt-metal { background: #95E1D3; color: #333; }
      .pt-metalloid { background: #F38181; color: #fff; }
      .pt-nonmetal { background: #AA96DA; color: #fff; }
      .pt-halogen { background: #FCBAD3; color: #333; }
      .pt-noble { background: #FFFFD2; color: #333; }

      /* Legend */
      .pt-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        justify-content: center;
        font-size: 12px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 3px;
      }

      .legend-gradient {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .gradient-bar {
        width: 200px;
        height: 20px;
        background: linear-gradient(to right, #FFE0B2, #FF6B6B);
        border-radius: 3px;
      }

      /* Tooltip */
      .pt-tooltip {
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        min-width: 200px;
      }

      .pt-tooltip.visible {
        opacity: 1;
      }

      .tooltip-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.2);
      }

      .tooltip-symbol {
        font-size: 24px;
        font-weight: bold;
      }

      .tooltip-name {
        font-size: 14px;
      }

      .tooltip-details div {
        margin: 4px 0;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .periodic-table-viz {
          background: #2c2c2c;
        }

        .pt-cell {
          color: #fff;
        }

        .pt-number {
          color: #aaa;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .pt-grid {
          gap: 2px;
        }

        .pt-cell {
          font-size: 8px;
        }

        .pt-symbol {
          font-size: 12px;
        }

        .pt-name {
          display: none;
        }
      }
    `;

    document.head.appendChild(style);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PeriodicTableViz;
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.PeriodicTableViz = PeriodicTableViz;
}
