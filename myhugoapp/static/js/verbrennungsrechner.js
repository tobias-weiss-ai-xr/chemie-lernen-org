/**
 * Combustion Calculator
 * Analyzes combustion reactions for organic compounds
 */

// Parse fuel formula (CxHyOz)
function parseFuelFormula(formula) {
  const parsed = parseFormula(formula);

  const c = parsed.C || 0;
  const h = parsed.H || 0;
  const o = parsed.O || 0;
  const n = parsed.N || 0;
  const s = parsed.S || 0;

  return { c, h, o, n, s };
}

// Calculate molar mass of fuel
function calculateMolarMass(formulaData) {
  const atomicMasses = {
    C: 12.011,
    H: 1.008,
    O: 15.999,
    N: 14.007,
    S: 32.06
  };

  return (formulaData.c * atomicMasses.C) +
         (formulaData.h * atomicMasses.H) +
         (formulaData.o * atomicMasses.O) +
         (formulaData.n * atomicMasses.N) +
         (formulaData.s * atomicMasses.S);
}

// Calculate oxygen required for complete combustion
function calculateOxygenRequired(formulaData) {
  // C_x H_y O_z + (x + y/4 - z/2) O2 -> x CO2 + y/2 H2O
  // For sulfur: S + O2 -> SO2
  // For nitrogen: N2 + O2 -> 2 NO (simplified)

  const oxygenForCarbon = formulaData.c; // Each C needs 1 O2 for CO2
  const oxygenForHydrogen = formulaData.h / 4; // Each 4 H needs 1 O2 for 2 H2O
  const oxygenForSulfur = formulaData.s; // Each S needs 1 O2 for SO2
  const oxygenInFuel = formulaData.o / 2; // O in fuel reduces O2 needed (each O atom = 0.5 O2)

  const oxygenRequired = oxygenForCarbon + oxygenForHydrogen + oxygenForSulfur - oxygenInFuel;

  return Math.max(0, oxygenRequired);
}

// Calculate combustion products
function calculateCombustionProducts(formulaData, fuelMoles, excessAir, efficiency) {
  const oxygenCoeff = calculateOxygenRequired(formulaData);

  // Calculate actual oxygen supplied (with excess air)
  const lambda = 1 + (excessAir / 100);
  const oxygenSupplied = oxygenCoeff * lambda * fuelMoles;

  // Calculate complete combustion products
  const co2Produced = formulaData.c * fuelMoles * efficiency;
  const h2oProduced = (formulaData.h / 2) * fuelMoles * efficiency;
  const so2Produced = formulaData.s * fuelMoles * efficiency;

  // If incomplete combustion, some CO is formed
  const combustionCompleteness = efficiency / 100;
  const coProduced = formulaData.c * fuelMoles * (1 - combustionCompleteness);
  const co2Adjusted = co2Produced - (coProduced); // Adjust CO2 for incomplete combustion

  // Remaining oxygen
  const oxygenConsumed = oxygenCoeff * fuelMoles * combustionCompleteness;
  const oxygenRemaining = Math.max(0, oxygenSupplied - oxygenConsumed);

  // Nitrogen from air (79% N2 by volume in dry air)
  const nitrogenFromAir = (oxygenSupplied / 0.21) * 0.79;

  // NOx production (simplified, assuming small fraction)
  const noProduced = formulaData.n * fuelMoles + (oxygenSupplied * 0.001); // Small amount of NOx

  return {
    co2: Math.max(0, co2Adjusted),
    h2o: h2oProduced,
    so2: so2Produced,
    co: coProduced,
    o2: oxygenRemaining,
    n2: nitrogenFromAir,
    no: noProduced
  };
}

// Calculate air requirements
function calculateAirRequirements(formulaData, fuelMass, excessAir) {
  const molarMass = calculateMolarMass(formulaData);
  const fuelMoles = (fuelMass * 1000) / molarMass; // Convert kg to g

  const oxygenCoeff = calculateOxygenRequired(formulaData);
  const oxygenRequired = oxygenCoeff * fuelMoles;

  // Minimum air required (theoretical)
  // Air is 23.2% O2 by mass, 21% by volume
  const minAirMass = (oxygenRequired * 32.00) / 0.232; // O2 molar mass = 32.00 g/mol

  // Actual air with excess
  const lambda = 1 + (excessAir / 100);
  const actualAirMass = minAirMass * lambda;

  // Convert to kg
  const minAirKg = minAirMass / 1000;
  const actualAirKg = actualAirMass / 1000;

  return {
    minAirKg: minAirKg,
    actualAirKg: actualAirKg,
    lambda: lambda,
    fuelMoles: fuelMoles
  };
}

// Calculate environmental data
function calculateEnvironmentalData(formulaData, fuelMass, products) {
  const molarMass = calculateMolarMass(formulaData);
  const molarMassCO2 = 44.01; // g/mol

  // CO2 emissions per kg fuel
  const co2PerKg = (products.co2 * molarMassCO2) / (fuelMass * 1000);

  // Carbon content
  const carbonMass = formulaData.c * 12.011;
  const carbonPerKg = carbonMass / molarMass;

  // Energy content (approximate)
  // Lower heating value (MJ/kg)
  const energyContent = calculateHeatingValue(formulaData);

  // CO2 per MJ
  const co2PerMJ = co2PerKg / energyContent.lower;

  return {
    co2PerKg: co2PerKg,
    carbonPerKg: carbonPerKg,
    co2PerMJ: co2PerMJ,
    energyContent: energyContent
  };
}

// Calculate heating value (simplified)
function calculateHeatingValue(formulaData) {
  // Approximate heating values based on elemental composition
  // Using typical values (in MJ/kg):

  const carbonContribution = formulaData.c * 33.8; // MJ/kg of C
  const hydrogenContribution = formulaData.h * 144.0; // MJ/kg of H
  const oxygenDeduction = formulaData.o * 19.6; // MJ/kg of O (already bound)
  const sulfurContribution = formulaData.s * 9.0; // MJ/kg of S

  const molarMass = calculateMolarMass(formulaData);
  const lowerHeatingValue = (carbonContribution + hydrogenContribution - oxygenDeduction + sulfurContribution) / molarMass;

  // Higher heating value includes condensation of water
  const waterProduced = formulaData.h / 2;
  const condensationEnergy = (waterProduced * 44.0) / molarMass; // MJ/kg

  const higherHeatingValue = lowerHeatingValue + condensationEnergy;

  return {
    lower: lowerHeatingValue,
    higher: higherHeatingValue
  };
}

// Format combustion equation
function formatCombustionEquation(formulaData, oxygenCoeff) {
  const c = formulaData.c;
  const h = formulaData.h;
  const o = formulaData.o;
  const n = formulaData.n;
  const s = formulaData.s;

  // Build formula string
  let formula = '';
  if (c > 0) formula += `C${c > 1 ? c : ''}`;
  if (h > 0) formula += `H${h > 1 ? h : ''}`;
  if (o > 0) formula += `O${o > 1 ? o : ''}`;
  if (n > 0) formula += `N${n > 1 ? n : ''}`;
  if (s > 0) formula += `S${s > 1 ? s : ''}`;

  // Format coefficient
  const o2Coeff = formatNumber(oxygenCoeff, 2);
  const co2Coeff = c > 0 ? (c > 1 ? c : '') : '';
  const h2oCoeff = h > 0 ? (h/2 > 1 ? h/2 : '') : '';
  const so2Coeff = s > 0 ? (s > 1 ? s : '') : '';

  // Build equation
  let equation = `<div class="equation-display">`;
  equation += `<span class="reactant">${formula}</span>`;
  equation += ` <span class="operator">+</span> `;
  equation += `<span class="reactant">${o2Coeff} O₂</span>`;
  equation += ` <span class="operator">→</span> `;

  let products = [];
  if (c > 0) products.push(`<span class="product">${co2Coeff}CO₂</span>`);
  if (h > 0) products.push(`<span class="product">${h2oCoeff}H₂O</span>`);
  if (s > 0) products.push(`<span class="product">${so2Coeff}SO₂</span>`);

  equation += products.join(' <span class="operator">+</span> ');
  equation += `</div>`;

  return equation;
}

// Format number for display
function formatNumber(value, decimals = 3) {
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 10000) {
    return value.toExponential(decimals - 1);
  }
  return value.toFixed(decimals);
}

// Main calculation function
function calculateCombustion() {
  const formulaInput = document.getElementById('fuel-formula').value.trim();
  const nameInput = document.getElementById('fuel-name').value.trim();
  const massInput = document.getElementById('fuel-mass').value.trim();
  const excessAirInput = document.getElementById('excess-air').value.trim();
  const efficiencyInput = document.getElementById('combustion-efficiency').value.trim();

  if (!formulaInput || !massInput) {
    showError('Bitte geben Sie die Formel und die Menge des Brennstoffes ein.');
    return;
  }

  try {
    const formulaData = parseFuelFormula(formulaInput);
    const fuelMass = parseFloat(massInput);
    const excessAir = parseFloat(excessAirInput) || 0;
    const efficiency = parseFloat(efficiencyInput) || 100;

    if (fuelMass <= 0) {
      showError('Die Brennstoffmenge muss positiv sein.');
      return;
    }

    if (efficiency <= 0 || efficiency > 100) {
      showError('Der Verbrennungswirkungsgrad muss zwischen 0 und 100% liegen.');
      return;
    }

    // Perform calculations
    const oxygenCoeff = calculateOxygenRequired(formulaData);
    const airRequirements = calculateAirRequirements(formulaData, fuelMass, excessAir);
    const products = calculateCombustionProducts(formulaData, airRequirements.fuelMoles, excessAir, efficiency);
    const environmentalData = calculateEnvironmentalData(formulaData, fuelMass, products);

    // Display results
    displayResults(nameInput || formulaInput, formulaData, fuelMass, excessAir, efficiency,
                   oxygenCoeff, airRequirements, products, environmentalData);

  } catch (error) {
    showError(error.message);
  }
}

// Display results
function displayResults(fuelName, formulaData, fuelMass, excessAir, efficiency,
                        oxygenCoeff, airRequirements, products, environmentalData) {
  // Combustion equation
  document.getElementById('combustion-equation').innerHTML = formatCombustionEquation(formulaData, oxygenCoeff);

  // Air requirements
  const airHtml = `
    <div class="data-row">
      <span class="data-label">Luftverhältnis (λ):</span>
      <span class="data-value">${formatNumber(airRequirements.lambda, 3)}</span>
    </div>
    <div class="data-row">
      <span class="data-label">Theoretischer Luftbedarf:</span>
      <span class="data-value">${formatNumber(airRequirements.minAirKg, 3)} kg</span>
    </div>
    <div class="data-row">
      <span class="data-label">Tatsächlicher Luftbedarf:</span>
      <span class="data-value">${formatNumber(airRequirements.actualAirKg, 3)} kg</span>
    </div>
    <div class="data-row ${excessAir > 0 ? 'highlight' : ''}">
      <span class="data-label">Luftüberschuss:</span>
      <span class="data-value">${excessAir.toFixed(1)}%</span>
    </div>
    <hr>
    <h4>Abgaszusammensetzung (mol):</h4>
    <div class="data-row">
      <span class="data-label">CO₂:</span>
      <span class="data-value value-positive">${formatNumber(products.co2, 3)} mol</span>
    </div>
    <div class="data-row">
      <span class="data-label">H₂O:</span>
      <span class="data-value">${formatNumber(products.h2o, 3)} mol</span>
    </div>
    ${products.co > 0.001 ? `
    <div class="data-row">
      <span class="data-label">CO (unvollständig):</span>
      <span class="data-value value-warning">${formatNumber(products.co, 3)} mol</span>
    </div>
    ` : ''}
    ${products.so2 > 0.001 ? `
    <div class="data-row">
      <span class="data-label">SO₂:</span>
      <span class="data-value">${formatNumber(products.so2, 3)} mol</span>
    </div>
    ` : ''}
    <div class="data-row">
      <span class="data-label">O₂ (überschüssig):</span>
      <span class="data-value">${formatNumber(products.o2, 3)} mol</span>
    </div>
    <div class="data-row">
      <span class="data-label">N₂ (aus Luft):</span>
      <span class="data-value">${formatNumber(products.n2, 3)} mol</span>
    </div>
  `;
  document.getElementById('air-requirements').innerHTML = airHtml;

  // Environmental data
  const envHtml = `
    <div class="data-row">
      <span class="data-label">CO₂-Emissionen:</span>
      <span class="data-value value-important">${formatNumber(environmentalData.co2PerKg, 3)} kg CO₂/kg Brennstoff</span>
    </div>
    <div class="data-row">
      <span class="data-label">CO₂ gesamt:</span>
      <span class="data-value value-important">${formatNumber(environmentalData.co2PerKg * fuelMass, 3)} kg</span>
    </div>
    <div class="data-row">
      <span class="data-label">Kohlenstoffgehalt:</span>
      <span class="data-value">${formatNumber(environmentalData.carbonPerKg * 100, 2)} %</span>
    </div>
    <div class="data-row">
      <span class="data-label">CO₂ pro MJ:</span>
      <span class="data-value">${formatNumber(environmentalData.co2PerMJ * 1000, 1)} g/MJ</span>
    </div>
    <hr>
    <h4>Energiegehalt:</h4>
    <div class="data-row">
      <span class="data-label">Heizwert (Hu):</span>
      <span class="data-value">${formatNumber(environmentalData.energyContent.lower, 2)} MJ/kg</span>
    </div>
    <div class="data-row">
      <span class="data-label">Brennwert (Ho):</span>
      <span class="data-value">${formatNumber(environmentalData.energyContent.higher, 2)} MJ/kg</span>
    </div>
    <div class="data-row">
      <span class="data-label">Gesamtenergie:</span>
      <span class="data-value">${formatNumber(environmentalData.energyContent.lower * fuelMass, 2)} MJ</span>
    </div>
  `;
  document.getElementById('environmental-data').innerHTML = envHtml;

  // Detailed analysis
  const molarMass = calculateMolarMass(formulaData);
  const detailHtml = `
    <div class="calculation-step">
      <h4>Analyse von ${fuelName}</h4>
      <p><strong>Molare Masse:</strong> ${formatNumber(molarMass, 3)} g/mol</p>
      <p><strong>Elementaranalyse:</strong></p>
      <ul>
        <li>Kohlenstoff (C): ${formulaData.c} Atome</li>
        <li>Wasserstoff (H): ${formulaData.h} Atome</li>
        ${formulaData.o > 0 ? `<li>Sauerstoff (O): ${formulaData.o} Atome</li>` : ''}
        ${formulaData.n > 0 ? `<li>Stickstoff (N): ${formulaData.n} Atome</li>` : ''}
        ${formulaData.s > 0 ? `<li>Schwefel (S): ${formulaData.s} Atome</li>` : ''}
      </ul>
    </div>
    <div class="calculation-step">
      <h4>Stöchiometrische Berechnungen</h4>
      <p><strong>Sauerstoffbedarf:</strong> ${formatNumber(oxygenCoeff, 3)} mol O₂/mol Brennstoff</p>
      <p><strong>Verhältnis λ:</strong> ${formatNumber(airRequirements.lambda, 3)}
         ${airRequirements.lambda === 1 ? '(stöchiometrisch)' :
           airRequirements.lambda > 1 ? '(mager, überschüssige Luft)' :
           '(fett, unvollständige Verbrennung)'}</p>
      <p><strong>Verbrennungswirkungsgrad:</strong> ${efficiency.toFixed(1)}%
         ${efficiency === 100 ? '(vollständige Verbrennung)' :
           efficiency < 100 ? '(unvollständige Verbrennung)' : ''}</p>
    </div>
    <div class="calculation-step">
      <h4>Umweltbewertung</h4>
      <p><strong>CO₂-Fußabdruck:</strong> ${formatNumber(environmentalData.co2PerKg, 3)} kg CO₂ pro kg Brennstoff</p>
      <p><strong>Energieeffizienz:</strong> ${formatNumber(environmentalData.co2PerMJ * 1000, 1)} g CO₂ pro MJ</p>
      <p class="formula">Zum Vergleich: Kohle ~90-100 g CO₂/MJ, Erdgas ~55 g CO₂/MJ</p>
    </div>
  `;
  document.getElementById('detailed-analysis').innerHTML = detailHtml;

  showResults();
}

// Show results section
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
      document.getElementById('fuel-formula').value = this.dataset.formula;
      document.getElementById('fuel-name').value = this.dataset.name;
    });
  });

  // Enable Enter key for inputs
  const inputs = document.querySelectorAll('.form-control');
  inputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        calculateCombustion();
      }
    });
  });
});
