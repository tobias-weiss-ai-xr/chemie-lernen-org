describe('Interactive Gas Law Simulator', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="gas-law-simulator">
        <div class="gas-law-controls">
          <select id="titration-type" class="form-control">
            <option value="strong-strong">Starke Säure - Starke Base</option>
          </select>
          <input type="range" id="temp-slider" min="200" max="500" value="300">
          <input type="range" id="pressure-slider" min="0.5" max="3.0" value="1.0" step="0.1">
          <input type="range" id="volume-slider" min="10" max="40" value="22.4" step="0.5">
        </div>
      </div>
      <canvas id="ph-scale-canvas" width="600" height="400"></canvas>
      <canvas id="titration-canvas" width="600" height="400"></canvas>
    `;
  });

  test('should initialize temperature display', () => {
    const tempSlider = document.getElementById('temp-slider');
    const tempDisplay = document.getElementById('temp-display');
    
    tempSlider.value = 350;
    const event = new Event('input', { bubbles: true });
    tempSlider.dispatchEvent(event);
    
    expect(tempDisplay.textContent).toBe('350 K');
  });

  test('should initialize pressure display', () => {
    const pressureSlider = document.getElementById('pressure-slider');
    const pressureDisplay = document.getElementById('pressure-display');
    
    pressureSlider.value = 2.0;
    const event = new Event('input', { bubbles: true });
    pressureSlider.dispatchEvent(event);
    
    expect(pressureDisplay.textContent).toBe('2.0 atm');
  });

  test('should initialize volume display', () => {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    
    volumeSlider.value = 30.0;
    const event = new Event('input', { bubbles: true });
    volumeSlider.dispatchEvent(event);
    
    expect(volumeDisplay.textContent).toBe('30.0 L');
  });

  test('should update law formula display', () => {
    const formulaEl = document.getElementById('law-formula');
    
    expect(formulaEl.textContent).toContain('p₁V₁ = p₂V₂');
  });

  test('should handle Boyle-Mariotte calculations', () => {
    const pressure = 2.0;
    const volume = 15.0;
    const p1V1 = pressure * volume;
    
    expect(p1V1).toBe(30.0);
    
    const newPressure1 = p1V1 / (volume * 0.8);
    const newPressure2 = p1V1 / (volume * 1.2);
    
    expect(newPressure1).toBe(37.5);
    expect(newPressure2).toBe(25.0);
  });

  test('should handle ideal gas law calculations', () => {
    const pressure = 1.5;
    const volume = 20.0;
    const temperature = 300;
    const R = 0.08206;
    const n = 1.0;
    
    const pv = pressure * volume;
    const nrt = n * R * temperature;
    const nCalculated = pv / (R * temperature);
    
    expect(pv).toBe(30.0);
    expect(nrt).toBeCloseTo(24.618, 2);
    expect(nCalculated).toBeCloseTo(1.218, 2);
  });

  test('should update particle colors based on temperature', () => {
    const simulator = new InteractiveGasLawSimulator();
    
    simulator.temperature = 200;
    const coldColor = simulator.getParticleColor();
    
    simulator.temperature = 500;
    const hotColor = simulator.getParticleColor();
    
    expect(coldColor).toMatch(/rgb\(\d+, \d+, 255\)/);
    expect(hotColor).toMatch(/rgb\(255, \d+, \d+\)/);
  });
});

describe('Molar Mass Visualizer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="molar-mass-visualizer">
        <input type="text" id="formula-input" class="form-control">
        <div id="formula-error" class="error-message"></div>
        <div id="result-formula"></div>
        <div id="result-mass"></div>
        <div id="breakdown-content"></div>
      </div>
    `;
  });

  test('should parse simple formula H2O', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    const elements = visualizer.parseChemicalFormula('H2O');
    
    expect(elements.get('H')).toBe(2);
    expect(elements.get('O')).toBe(1);
    expect(elements.size).toBe(2);
  });

  test('should parse complex formula C6H12O6', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    const elements = visualizer.parseChemicalFormula('C6H12O6');
    
    expect(elements.get('C')).toBe(6);
    expect(elements.get('H')).toBe(12);
    expect(elements.get('O')).toBe(6);
  });

  test('should calculate molar mass of water', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    visualizer.selectedElements = new Map([['H', 2], ['O', 1]]);
    
    visualizer.calculateMolarMass();
    
    expect(visualizer.molarMass).toBeCloseTo(18.015, 3);
  });

  test('should calculate molar mass of glucose', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    visualizer.selectedElements = new Map([
      ['C', 6], ['H', 12], ['O', 6]
    ]);
    
    visualizer.calculateMolarMass();
    
    expect(visualizer.molarMass).toBeCloseTo(180.156, 3);
  });

  test('should handle formula errors gracefully', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    
    expect(() => {
      visualizer.parseChemicalFormula('XyZ');
    }).toThrow('Unbekanntes Element: X');
  });

  test('should display results correctly', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    visualizer.formula = 'NaCl';
    visualizer.molarMass = 58.44;
    visualizer.selectedElements = new Map([['Na', 1], ['Cl', 1]]);
    
    visualizer.displayResult();
    
    const resultFormula = document.getElementById('result-formula');
    const resultMass = document.getElementById('result-mass');
    
    expect(resultFormula.textContent).toBe('NaCl');
    expect(resultMass.textContent).toBe('58.440');
  });

  test('should format subscripts correctly', () => {
    const visualizer = new InteractiveMolarMassVisualizer();
    
    expect(visualizer.formatSubscript(1)).toBe('');
    expect(visualizer.formatSubscript(2)).toBe('₂');
    expect(visualizer.formatSubscript(3)).toBe('₃');
    expect(visualizer.formatSubscript(10)).toBe('₁₀');
  });
});

describe('Enhanced pH Visualization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="enhanced-ph-viz">
        <input type="range" id="ph-slider" min="0" max="14" step="0.1" value="7">
        <span id="ph-value"></span>
        <div id="indicator-grid"></div>
        <div id="equivalence-point"></div>
      </div>
      <canvas id="titration-canvas" width="600" height="400"></canvas>
    `;
  });

  test('should update pH value on slider change', () => {
    const phSlider = document.getElementById('ph-slider');
    const phValue = document.getElementById('ph-value');
    
    phSlider.value = 8.5;
    const event = new Event('input', { bubbles: true });
    phSlider.dispatchEvent(event);
    
    expect(phValue.textContent).toBe('8.5');
  });

  test('should identify suitable indicators', () => {
    const phViz = new EnhancedPHVisualization();
    phViz.currentPH = 9.0;
    
    phViz.updateIndicators();
    
    const indicatorGrid = document.getElementById('indicator-grid');
    expect(indicatorGrid.innerHTML).toContain('Phenolphthalein');
    expect(indicatorGrid.innerHTML).toContain('Bromthymolblau');
  });

  test('should show no indicators for extreme pH', () => {
    const phViz = new EnhancedPHVisualization();
    phViz.currentPH = 1.5;
    
    phViz.updateIndicators();
    
    const indicatorGrid = document.getElementById('indicator-grid');
    expect(indicatorGrid.innerHTML).toContain('Keine Indikatoren geeignet');
  });

  test('should generate titration data for strong-strong', () => {
    const phViz = new EnhancedPHVisualization();
    
    const data = phViz.generateTitrationData('strong-strong');
    
    expect(data).toHaveLength(100);
    expect(data[0].ph).toBeCloseTo(1.0, 1);
    expect(data[99].ph).toBeCloseTo(13.0, 1);
  });

  test('should animate pH transitions smoothly', (done) => {
    const phViz = new EnhancedPHVisualization();
    phViz.currentPH = 7.0;
    
    phViz.animateToPH(9.0);
    
    setTimeout(() => {
      expect(phViz.currentPH).toBeCloseTo(9.0, 0.1);
      done();
    }, 1100);
  });

  test('should get correct solution colors', () => {
    const phViz = new EnhancedPHVisualization();
    
    expect(phViz.getSolutionColor(1)).toBe('#ff0000');
    expect(phViz.getSolutionColor(7)).toBe('#66ff00');
    expect(phViz.getSolutionColor(14)).toBe('#0066ff');
  });
});