class InteractiveMolarMassVisualizer {
  constructor() {
    this.container = null;
    this.elements = new Map();
    this.formula = '';
    this.molarMass = 0;
    this.selectedElements = [];
    this.particleAnimation = null;

    this.init();
  }

  init() {
    this.createElementDatabase();
    this.createVisualization();
    this.createControls();
    this.setupEventListeners();
  }

  createElementDatabase() {
    this.elements.set('H', { name: 'Wasserstoff', mass: 1.008, color: '#ffffff' });
    this.elements.set('He', { name: 'Helium', mass: 4.003, color: '#d9ffff' });
    this.elements.set('Li', { name: 'Lithium', mass: 6.941, color: '#cc80ff' });
    this.elements.set('Be', { name: 'Beryllium', mass: 9.012, color: '#c2ff00' });
    this.elements.set('B', { name: 'Bor', mass: 10.811, color: '#ffb5b5' });
    this.elements.set('C', { name: 'Kohlenstoff', mass: 12.011, color: '#909090' });
    this.elements.set('N', { name: 'Stickstoff', mass: 14.007, color: '#3050f8' });
    this.elements.set('O', { name: 'Sauerstoff', mass: 15.999, color: '#ff0d0d' });
    this.elements.set('F', { name: 'Fluor', mass: 18.998, color: '#90e050' });
    this.elements.set('Ne', { name: 'Neon', mass: 20.180, color: '#b3e3f5' });
    this.elements.set('Na', { name: 'Natrium', mass: 22.990, color: '#ab5cf2' });
    this.elements.set('Mg', { name: 'Magnesium', mass: 24.305, color: '#8aff00' });
    this.elements.set('Al', { name: 'Aluminium', mass: 26.982, color: '#bfa6a6' });
    this.elements.set('Si', { name: 'Silicium', mass: 28.085, color: '#f0c8a0' });
    this.elements.set('P', { name: 'Phosphor', mass: 30.974, color: '#ff8000' });
    this.elements.set('S', { name: 'Schwefel', mass: 32.065, color: '#ffff30' });
    this.elements.set('Cl', { name: 'Chlor', mass: 35.453, color: '#1ff01f' });
    this.elements.set('Ar', { name: 'Argon', mass: 39.948, color: '#80d1e3' });
    this.elements.set('K', { name: 'Kalium', mass: 39.098, color: '#8f40d4' });
    this.elements.set('Ca', { name: 'Calcium', mass: 40.078, color: '#3dff00' });
    this.elements.set('Fe', { name: 'Eisen', mass: 55.845, color: '#e06633' });
    this.elements.set('Cu', { name: 'Kupfer', mass: 63.546, color: '#c78033' });
    this.elements.set('Zn', { name: 'Zink', mass: 65.38, color: '#7d80b0' });
    this.elements.set('Ag', { name: 'Silber', mass: 107.868, color: '#c0c0c0' });
    this.elements.set('Au', { name: 'Gold', mass: 196.967, color: '#ffd123' });
  }

  createVisualization() {
    const container = document.querySelector('.molar-mass-visualizer');
    if (!container) {
      console.warn('Molar mass visualizer container not found');
      return;
    }

    this.container = container;

    const vizDiv = document.createElement('div');
    vizDiv.className = 'molar-viz-container';
    vizDiv.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    `;

    const periodicTableDiv = document.createElement('div');
    periodicTableDiv.className = 'periodic-table-mini';
    periodicTableDiv.innerHTML = this.createMiniPeriodicTable();

    const moleculeDiv = document.createElement('div');
    moleculeDiv.className = 'molecule-visualization';
    moleculeDiv.innerHTML = `
      <h4>Molekülansicht</h4>
      <div id="molecule-canvas" style="width: 100%; height: 300px; border: 2px solid #28a745; border-radius: 8px; background: #f8f9fa; position: relative;">
        <div id="molecule-display" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #666;">
          Geben Sie eine Formel ein
        </div>
      </div>
    `;

    vizDiv.appendChild(periodicTableDiv);
    vizDiv.appendChild(moleculeDiv);
    container.appendChild(vizDiv);

    this.addPeriodicTableStyles();
  }

  createMiniPeriodicTable() {
    let html = '<h4>Elemente auswählen</h4>';
    html += '<div class="element-grid" style="display: grid; grid-template-columns: repeat(9, 1fr); gap: 5px;">';

    const commonElements = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
                         'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
                         'Fe', 'Cu', 'Zn', 'Ag', 'Au'];

    commonElements.forEach(symbol => {
      const element = this.elements.get(symbol);
      if (element) {
        html += `
          <div class="element-btn" data-element="${symbol}"
               style="background: ${element.color}; color: ${symbol === 'C' || symbol === 'Fe' || symbol === 'Cu' ? '#fff' : '#000'};
                      border: 2px solid #ddd; border-radius: 4px; padding: 8px; text-align: center;
                      cursor: pointer; font-weight: bold; font-size: 12px; transition: all 0.3s;">
            <div>${symbol}</div>
            <div style="font-size: 8px; font-weight: normal;">${element.mass.toFixed(1)}</div>
          </div>
        `;
      }
    });

    html += '</div>';
    return html;
  }

  createControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'molar-controls';
    controlsDiv.style.cssText = `
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid #dee2e6;
    `;

    controlsDiv.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h4>Formeleingabe</h4>
          <div class="input-group">
            <input type="text" id="formula-input" class="form-control"
                   placeholder="z.B. H2O, C6H12O6, NaCl"
                   style="font-size: 16px; font-weight: bold;">
            <span class="input-group-btn">
              <button class="btn btn-success" id="calculate-btn">Berechnen</button>
            </span>
          </div>
          <div id="formula-error" class="error-message" style="color: #dc3545; margin-top: 5px; display: none;"></div>
        </div>
        <div class="col-md-6">
          <h4>Schnellformeln</h4>
          <div class="quick-formulas">
            <button class="btn btn-outline-success formula-btn" data-formula="H2O">Wasser</button>
            <button class="btn btn-outline-success formula-btn" data-formula="CO2">Kohlendioxid</button>
            <button class="btn btn-outline-success formula-btn" data-formula="NaCl">Kochsalz</button>
            <button class="btn btn-outline-success formula-btn" data-formula="C6H12O6">Glucose</button>
            <button class="btn btn-outline-success formula-btn" data-formula="CH3COOH">Essigsäure</button>
            <button class="btn btn-outline-success formula-btn" data-formula="H2SO4">Schwefelsäure</button>
          </div>
        </div>
      </div>
      <div class="row" style="margin-top: 20px;">
        <div class="col-md-12">
          <div class="calculation-result" id="calculation-result" style="display: none;">
            <h5>Ergebnis:</h5>
            <div class="result-details">
              <div class="formula-display">
                <strong>Formel:</strong> <span id="result-formula" style="font-size: 18px;"></span>
              </div>
              <div class="molar-mass-display">
                <strong>Molare Masse:</strong> <span id="result-mass" style="font-size: 24px; color: #28a745; font-weight: bold;"></span> g/mol
              </div>
              <div class="element-breakdown" id="element-breakdown">
                <h6>Elementanalyse:</h6>
                <div id="breakdown-content"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(controlsDiv);
  }

  setupEventListeners() {
    const formulaInput = document.getElementById('formula-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const elementBtns = document.querySelectorAll('.element-btn');
    const formulaBtns = document.querySelectorAll('.formula-btn');

    formulaInput.addEventListener('input', () => this.parseFormulaInput());

    calculateBtn.addEventListener('click', () => this.calculateMolarMass());

    formulaInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.calculateMolarMass();
      }
    });

    elementBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const element = btn.dataset.element;
        this.addToFormula(element);
      });
    });

    formulaBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const formula = btn.dataset.formula;
        document.getElementById('formula-input').value = formula;
        this.calculateMolarMass();
      });
    });

    elementBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.1)';
        btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
      });
    });
  }

  addToFormula(element) {
    const input = document.getElementById('formula-input');
    input.value += element;
    this.parseFormulaInput();
  }

  parseFormulaInput() {
    const input = document.getElementById('formula-input').value;
    if (input === '') {
      this.clearResult();
      return;
    }

    this.formula = input;
    this.selectedElements = this.parseChemicalFormula(input);
    this.updateMoleculeDisplay();
  }

  parseChemicalFormula(formula) {
    const elements = new Map();
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;

    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2]) || 1;

      if (this.elements.has(element)) {
        elements.set(element, (elements.get(element) || 0) + count);
      } else {
        throw new Error(`Unbekanntes Element: ${element}`);
      }
    }

    return elements;
  }

  calculateMolarMass() {
    const input = document.getElementById('formula-input').value;
    const errorDiv = document.getElementById('formula-error');

    if (!input.trim()) {
      this.showError('Bitte geben Sie eine chemische Formel ein.');
      return;
    }

    try {
      this.selectedElements = this.parseChemicalFormula(input);
      this.formula = input;

      this.molarMass = 0;
      this.selectedElements.forEach((count, element) => {
        const elementData = this.elements.get(element);
        this.molarMass += elementData.mass * count;
      });

      this.displayResult();
      errorDiv.style.display = 'none';

    } catch (error) {
      this.showError(error.message);
    }
  }

  displayResult() {
    const resultDiv = document.getElementById('calculation-result');
    const resultFormula = document.getElementById('result-formula');
    const resultMass = document.getElementById('result-mass');
    const breakdownContent = document.getElementById('breakdown-content');

    resultFormula.textContent = this.formula;
    resultMass.textContent = this.molarMass.toFixed(3);

    let breakdownHTML = '<div class="element-breakdown-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">';

    this.selectedElements.forEach((count, element) => {
      const elementData = this.elements.get(element);
      const contribution = elementData.mass * count;
      const percentage = (contribution / this.molarMass) * 100;

      breakdownHTML += `
        <div class="element-breakdown-item" style="background: #e9ecef; padding: 10px; border-radius: 5px; border-left: 4px solid ${elementData.color};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span><strong>${element}</strong> ${this.formatSubscript(count)}</span>
            <span>${elementData.mass.toFixed(3)} × ${count} = ${contribution.toFixed(3)} g/mol</span>
          </div>
          <div style="margin-top: 5px; background: #fff; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #28a745; height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
          </div>
          <small style="color: #666;">${percentage.toFixed(1)}% der Masse</small>
        </div>
      `;
    });

    breakdownHTML += '</div>';
    breakdownContent.innerHTML = breakdownHTML;

    resultDiv.style.display = 'block';
    this.animateResult();
  }

  formatSubscript(number) {
    const subscripts = '₀₁₂₃₄₅₆₇₈₉';
    return number === 1 ? '' : subscripts[number] || number.toString();
  }

  updateMoleculeDisplay() {
    const display = document.getElementById('molecule-display');
    if (this.selectedElements.size === 0) {
      display.innerHTML = 'Geben Sie eine Formel ein';
      return;
    }

    let moleculeHTML = '<div style="text-align: center;">';
    this.selectedElements.forEach((count, element) => {
      const elementData = this.elements.get(element);
      moleculeHTML += `
        <div style="display: inline-block; margin: 5px; text-align: center;">
          <div style="width: 40px; height: 40px; background: ${elementData.color};
                      border-radius: 50%; display: flex; align-items: center;
                      justify-content: center; font-weight: bold; margin: 0 auto 5px;">
            ${element}
          </div>
          <div style="font-size: 14px; color: #666;">
            ${this.formatSubscript(count)}
          </div>
        </div>
      `;
    });
    moleculeHTML += '</div>';

    display.innerHTML = moleculeHTML;
  }

  showError(message) {
    const errorDiv = document.getElementById('formula-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    this.clearResult();
  }

  clearResult() {
    const resultDiv = document.getElementById('calculation-result');
    resultDiv.style.display = 'none';
  }

  animateResult() {
    const resultDiv = document.getElementById('calculation-result');
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(20px)';

    setTimeout(() => {
      resultDiv.style.transition = 'all 0.5s ease';
      resultDiv.style.opacity = '1';
      resultDiv.style.transform = 'translateY(0)';
    }, 100);
  }

  addPeriodicTableStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .element-grid {
        gap: 4px !important;
      }
      .element-btn:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
      }
      .formula-btn {
        margin: 3px;
        font-size: 12px;
        padding: 5px 10px;
      }
      .element-breakdown-item {
        animation: slideIn 0.3s ease;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {

  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.molar-mass-visualizer')) {
    const molarVisualizer = new InteractiveMolarMassVisualizer();
    window.molarVisualizer = molarVisualizer;
  }
});