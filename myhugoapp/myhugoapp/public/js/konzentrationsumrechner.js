/**
 * Concentration Converter
 * Converts between various concentration units for chemical solutions
 */

// Parse input number
function parseNumber(value) {
  value = value.trim();
  value = value.replace(/,/g, '.'); // Handle both comma and decimal point
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Ungültige Zahl: ' + value);
  }
  return num;
}

// Format number for display
function formatNumber(value, decimals = 4) {
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 10000) {
    return value.toExponential(decimals - 1);
  }
  return value.toFixed(decimals);
}

// Convert all concentrations to/from a common internal format
// Internal format: moles of solute per kg of solution
class ConcentrationConverter {
  constructor(molarMass, density, temperature) {
    this.molarMass = molarMass; // g/mol
    this.density = density; // g/mL = kg/L
    this.temperature = temperature; // °C
  }

  // Convert from input unit to internal format (mol/kg solution)
  fromUnit(value, unit) {
    switch(unit) {
      case 'M': { // Molar: mol/L solution
        // Convert mol/L to mol/kg solution
        // 1 L solution = density kg
        return value / this.density;
      }

      case 'm': { // Molal: mol/kg solvent
        // Approximate: assuming dilute solution where kg solvent ≈ kg solution
        // For precise calculation, we'd need iterative solution
        // Using approximation: kg_solvent ≈ kg_solution - mass_solute
        // For dilute solutions: kg_solvent ≈ kg_solution
        return value * 0.999; // Approximate correction
      }

      case 'percent_ww': { // Mass percent: g solute / 100 g solution
        // Convert to mass fraction, then to mol/kg
        const massFraction = value / 100;
        const molesPerKg = (massFraction * 1000) / this.molarMass;
        return molesPerKg;
      }

      case 'percent_vv': { // Volume percent: mL solute / 100 mL solution
        // Need to assume density of pure solute ≈ molar mass / 1000 for liquids
        // This is an approximation
        const volFraction = value / 100;
        const massSolute = volFraction * this.density * 1000; // g per L solution
        const moles = massSolute / this.molarMass;
        return moles / this.density; // Convert to mol/kg solution
      }

      case 'percent_wv': { // Mass/volume percent: g solute / 100 mL solution
        const massPer100mL = value; // g
        const massPerL = massPer100mL * 10; // g/L solution
        const molesPerL = massPerL / this.molarMass;
        return molesPerL / this.density;
      }

      case 'ppm': { // Parts per million (mg/kg)
        // Convert mg/kg to g/kg, then to mol/kg
        const gPerKg = value / 1000;
        return gPerKg / this.molarMass;
      }

      case 'ppb': { // Parts per billion (µg/kg)
        const gPerKgPpb = value / 1000000;
        return gPerKgPpb / this.molarMass;
      }

      case 'g_L': { // g/L
        const molesPerL_gL = value / this.molarMass;
        return molesPerL_gL / this.density;
      }

      case 'mg_L': { // mg/L
        const molesPerL_mgL = (value / 1000) / this.molarMass;
        return molesPerL_mgL / this.density;
      }

      case 'mole_fraction': { // Mole fraction (dimensionless)
        // X = n_solute / (n_solute + n_solvent)
        // For dilute solutions: X ≈ n_solute / n_solvent
        // n_solvent ≈ (1000 g - mass_solute) / 18.015 (water)
        // This is an iterative calculation
        // Approximation for dilute solutions:
        return value / 18.015; // Rough approximation for aqueous solutions
      }

      case 'normality': { // Normality (N)
        // Assume monovalent for now (valence = 1)
        // For polyvalent ions, N = M × valence
        // N ≈ M for monovalent, N = 2×M for divalent, etc.
        return value / this.density; // Treat as molar for monovalent
      }

      default:
        throw new Error('Unbekannte Einheit: ' + unit);
    }
  }

  // Convert from internal format (mol/kg) to output unit
  toUnit(molesPerKg, unit) {
    switch(unit) {
      case 'M': { // Molar: mol/L solution
        return molesPerKg * this.density;
      }

      case 'm': { // Molal: mol/kg solvent
        // Reverse approximation
        return molesPerKg / 0.999;
      }

      case 'percent_ww': { // Mass percent
        const massSolute = molesPerKg * this.molarMass; // g/kg solution
        return (massSolute / 1000) * 100;
      }

      case 'percent_vv': { // Volume percent
        // Approximation assuming ideal mixing
        const massSolute_vv = molesPerKg * this.molarMass;
        const volSolute = massSolute_vv / this.density; // mL/L solution
        return (volSolute / 1000) * 100;
      }

      case 'percent_wv': { // Mass/volume percent
        const massSolute_wv = molesPerKg * this.molarMass * this.density; // g/L solution
        return (massSolute_wv / 1000) * 100;
      }

      case 'ppm': { // Parts per million
        const massSolute_ppm = molesPerKg * this.molarMass * 1000; // mg/kg
        return massSolute_ppm;
      }

      case 'ppb': { // Parts per billion
        const massSolute_ppb = molesPerKg * this.molarMass * 1000000; // µg/kg
        return massSolute_ppb;
      }

      case 'g_L': { // g/L
        const massPerL = molesPerKg * this.molarMass * this.density;
        return massPerL;
      }

      case 'mg_L': { // mg/L
        const massPerL_mg = molesPerKg * this.molarMass * this.density * 1000;
        return massPerL_mg;
      }

      case 'mole_fraction': { // Mole fraction
        // Approximate for aqueous solutions
        // X_solute = n_solute / (n_solute + n_solvent)
        // n_solvent ≈ (1000 - mass_solute_g) / 18.015
        const massSolute_g = molesPerKg * this.molarMass;
        const massWater = 1000 - massSolute_g; // g
        const molesWater = massWater / 18.015;
        return molesPerKg / (molesPerKg + molesWater);
      }

      case 'normality': { // Normality
        // Assume monovalent
        return molesPerKg * this.density;
      }

      default:
        throw new Error('Unbekannte Einheit: ' + unit);
    }
  }

  // Convert between any two units
  convert(value, fromUnit, toUnit) {
    const molesPerKg = this.fromUnit(value, fromUnit);
    return this.toUnit(molesPerKg, toUnit);
  }

  // Get all concentrations
  getAllConcentrations(value, fromUnit) {
    const molesPerKg = this.fromUnit(value, fromUnit);

    const units = [
      { id: 'M', name: 'Molar (M)', symbol: 'M' },
      { id: 'm', name: 'Molal (m)', symbol: 'm' },
      { id: 'percent_ww', name: 'Massenprozent', symbol: '% w/w' },
      { id: 'percent_vv', name: 'Volumenprozent', symbol: '% v/v' },
      { id: 'percent_wv', name: 'Massen-/Volumenprozent', symbol: '% w/v' },
      { id: 'ppm', name: 'Parts per Million', symbol: 'ppm' },
      { id: 'ppb', name: 'Parts per Billion', symbol: 'ppb' },
      { id: 'g_L', name: 'Gramm pro Liter', symbol: 'g/L' },
      { id: 'mg_L', name: 'Milligramm pro Liter', symbol: 'mg/L' },
      { id: 'mole_fraction', name: 'Molenbruch', symbol: 'X' },
      { id: 'normality', name: 'Normalität', symbol: 'N' }
    ];

    const results = {};
    units.forEach(unit => {
      const converted = this.toUnit(molesPerKg, unit.id);
      results[unit.id] = {
        name: unit.name,
        symbol: unit.symbol,
        value: converted
      };
    });

    return results;
  }
}

// Main conversion function
function convertConcentration() {
  const valueInput = document.getElementById('concentration-value').value.trim();
  const unit = document.getElementById('concentration-unit').value;
  const molarMassInput = document.getElementById('molar-mass').value.trim();
  const densityInput = document.getElementById('density').value.trim();
  const tempInput = document.getElementById('temperature').value.trim();

  if (!valueInput || !molarMassInput) {
    showError('Bitte geben Sie den Konzentrationswert und die molare Masse ein.');
    return;
  }

  try {
    const value = parseNumber(valueInput);
    const molarMass = parseNumber(molarMassInput);
    const density = densityInput ? parseNumber(densityInput) : 1.00;
    const temperature = tempInput ? parseNumber(tempInput) : 20;

    if (molarMass <= 0) {
      showError('Die molare Masse muss positiv sein.');
      return;
    }

    if (density <= 0) {
      showError('Die Dichte muss positiv sein.');
      return;
    }

    // Create converter
    const converter = new ConcentrationConverter(molarMass, density, temperature);

    // Get all concentrations
    const allConcentrations = converter.getAllConcentrations(value, unit);

    // Display results
    displayResults(value, unit, allConcentrations, molarMass, density, temperature);

  } catch (error) {
    showError(error.message);
  }
}

// Display conversion results
function displayResults(inputValue, inputUnit, concentrations, molarMass, density, temperature) {
  const allConc = document.getElementById('all-concentrations');
  const details = document.getElementById('calculation-details');
  const comparison = document.getElementById('comparison-values');

  // Display all concentrations
  let html = '<div class="concentrations-grid">';

  const unitOrder = ['M', 'm', 'percent_ww', 'percent_vv', 'percent_wv', 'ppm', 'ppb',
                      'g_L', 'mg_L', 'mole_fraction', 'normality'];

  unitOrder.forEach(unitId => {
    const conc = concentrations[unitId];
    const isInput = unitId === inputUnit;
    const valueClass = getValueClass(unitId, conc.value);

    html += `
      <div class="concentration-item ${isInput ? 'input-unit' : ''} ${valueClass}">
        <div class="conc-name">${conc.name}</div>
        <div class="conc-value">${formatNumber(conc.value, getDecimals(unitId))}</div>
        <div class="conc-symbol">${conc.symbol}</div>
        ${isInput ? '<div class="input-badge">Eingabe</div>' : ''}
      </div>
    `;
  });

  html += '</div>';
  allConc.innerHTML = html;

  // Calculation details
  const soluteName = document.getElementById('solute-name').value.trim() || 'Stoff';
  details.innerHTML = `
    <div class="calculation-step">
      <h4>Eingabewerte:</h4>
      <p><strong>${soluteName}</strong></p>
      <p>Molare Masse: ${formatNumber(molarMass)} g/mol</p>
      <p>Dichte: ${formatNumber(density)} g/mL</p>
      <p>Temperatur: ${formatNumber(temperature)} °C</p>
      <p><strong>Eingegebene Konzentration:</strong> ${formatNumber(inputValue, getDecimals(inputUnit))} ${getUnitSymbol(inputUnit)}</p>
    </div>
    <div class="calculation-step">
      <h4>Umrechnungsprinzip:</h4>
      <p>Alle Konzentrationen werden in ein internes Format umgewandelt (Mol pro kg Lösung) und dann in alle Einheiten zurückgerechnet.</p>
      <p class="formula">c_intern = fromUnit(${formatNumber(inputValue)}, ${getUnitSymbol(inputUnit)})</p>
      <p class="formula">c_ausgabe = toUnit(c_intern, Zieleinheit)</p>
    </div>
    <div class="calculation-step">
      <h4>Hinweise zur Genauigkeit:</h4>
      <ul>
        <li>Dichte und Volumen sind temperaturabhängig</li>
        <li>Fur verdünnte Lösungen (< 0.1 M): M ≈ m</li>
        <li>Bei % v/v: Annahme idealer Mischung</li>
        <li>Normalität: Monovalent angenommen</li>
        <li>Molenbruch: Für wässrige Lösungen approximiert</li>
      </ul>
    </div>
  `;

  // Comparison values
  const molar = concentrations.M.value;
  const ppm = concentrations.ppm.value;
  const percent = concentrations.percent_ww.value;

  comparison.innerHTML = `
    <div class="comparison-item">
      <span class="comparison-label">Konzentrationsbereich:</span>
      <span class="comparison-value">${getConcentrationRange(percent)}</span>
    </div>
    <div class="comparison-item">
      <span class="comparison-label">Molare Masse:</span>
      <span class="comparison-value">${formatNumber(molarMass)} g/mol</span>
    </div>
    <div class="comparison-item">
      <span class="comparison-label">Verdünnungsgrad:</span>
      <span class="comparison-value">${getDilutionLevel(percent)}</span>
    </div>
    <div class="comparison-item">
      <span class="comparison-label">Typische Anwendung:</span>
      <span class="comparison-value">${getApplication(molar, ppm)}</span>
    </div>
  `;

  showResults();
}

// Helper functions
function getDecimals(unit) {
  const decimals = {
    'M': 4,
    'm': 4,
    'percent_ww': 3,
    'percent_vv': 3,
    'percent_wv': 3,
    'ppm': 2,
    'ppb': 0,
    'g_L': 3,
    'mg_L': 1,
    'mole_fraction': 6,
    'normality': 4
  };
  return decimals[unit] || 4;
}

function getUnitSymbol(unit) {
  const symbols = {
    'M': 'M',
    'm': 'm',
    'percent_ww': '% w/w',
    'percent_vv': '% v/v',
    'percent_wv': '% w/v',
    'ppm': 'ppm',
    'ppb': 'ppb',
    'g_L': 'g/L',
    'mg_L': 'mg/L',
    'mole_fraction': 'X',
    'normality': 'N'
  };
  return symbols[unit] || unit;
}

function getValueClass(unit, value) {
  if (unit === 'percent_ww') {
    if (value < 0.1) return 'very-dilute';
    if (value < 1) return 'dilute';
    if (value < 10) return 'moderate';
    return 'concentrated';
  }
  if (unit === 'M') {
    if (value < 0.01) return 'very-dilute';
    if (value < 0.1) return 'dilute';
    if (value < 1) return 'moderate';
    return 'concentrated';
  }
  return '';
}

function getConcentrationRange(percent) {
  if (percent < 0.01) return 'Sehr verdünnt (< 0.01%)';
  if (percent < 0.1) return 'Verdünnt (0.01% - 0.1%)';
  if (percent < 1) return 'Schwach konzentriert (0.1% - 1%)';
  if (percent < 10) return 'Mäßig konzentriert (1% - 10%)';
  if (percent < 50) return 'Konzentriert (10% - 50%)';
  return 'Sehr konzentriert (> 50%)';
}

function getDilutionLevel(percent) {
  if (percent < 0.01) return 'Spurenelement';
  if (percent < 0.1) return 'Hoch verdünnt';
  if (percent < 1) return 'Verdünnt';
  if (percent < 10) return 'Mäßig';
  if (percent < 50) return 'Konzentriert';
  return 'Hoch konzentriert';
}

function getApplication(molar, ppm) {
  if (ppm < 1) return 'Ultra-Spurenanalytik';
  if (ppm < 100) return 'Spurenelementbestimmung';
  if (molar < 0.001) return 'Umweltanalytik';
  if (molar < 0.01) return 'Wasseranalytik';
  if (molar < 0.1) return 'Labormäßige Konzentration';
  if (molar < 1) return 'Chemische Synthese';
  return 'Industrielle Prozesse';
}

// Show results section, hide error
function showResults() {
  document.getElementById('results-section').style.display = 'block';
  document.getElementById('error-section').style.display = 'none';

  // Scroll to results
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show error
function showError(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-section').style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
}

// Setup example button handlers
document.addEventListener('DOMContentLoaded', function() {
  // Example buttons
  document.querySelectorAll('.example-btn').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('concentration-value').value = this.dataset.value;
      document.getElementById('concentration-unit').value = this.dataset.unit;
      document.getElementById('molar-mass').value = this.dataset.mmass;
    });
  });

  // Enable Enter key for inputs
  const inputs = document.querySelectorAll('.form-control');
  inputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        convertConcentration();
      }
    });
  });
});
