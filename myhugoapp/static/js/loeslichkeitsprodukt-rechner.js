/**
 * Solubility Product (Ksp) Calculator
 * Calculates solubility from Ksp and vice versa for various salt types
 */

// Scientific notation parser
function parseScientificNotation(value) {
  // Clean up the input
  value = value.trim().replace(/×/g, 'e').replace(/·/g, 'e').replace(/⁰¹²³⁴⁵⁶⁷⁸⁹/g, (match) => {
    const superscriptMap = {'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
                             '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'};
    return superscriptMap[match] || '';
  });

  // Parse as float
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Ungültige Zahl: ' + value);
  }
  return num;
}

// Format number in scientific notation
function formatScientific(value, significantFigures = 3) {
  if (value === 0) return '0';

  // For very large or very small numbers, use scientific notation
  if (Math.abs(value) < 0.01 || Math.abs(value) >= 10000) {
    return value.toExponential(significantFigures - 1).replace('e', ' × 10^').replace(/\^(-?\d)/g, '^{$1}');
  }

  // For normal numbers, use appropriate precision
  return value.toFixed(significantFigures - Math.floor(Math.log10(Math.abs(value))) - 1);
}

// Parse chemical formula to get ion stoichiometry
function parseSaltStoichiometry(formula) {
  // Remove spaces and convert to proper format
  formula = formula.trim().replace(/\s+/g, '');

  // Use the chemistry utils to parse the formula
  const composition = window.ChemistryUtils.parseFormula(formula);

  // For simple salts like AgCl, Ca(OH)2, etc., we need to determine
  // the cation and anion stoichiometry

  // This is a simplified approach - we'll count total "parts"
  // A better approach would be to use oxidation states

  // For now, we'll use a lookup table for common salt types
  const commonSalts = {
    'AgCl': {cations: 1, anions: 1},
    'AgBr': {cations: 1, anions: 1},
    'AgI': {cations: 1, anions: 1},
    'Ag2CrO4': {cations: 2, anions: 1},
    'Ag2CO3': {cations: 2, anions: 1},
    'Ag3PO4': {cations: 3, anions: 1},
    'Ca(OH)2': {cations: 1, anions: 2},
    'CaF2': {cations: 1, anions: 2},
    'CaCO3': {cations: 1, anions: 1},
    'CaSO4': {cations: 1, anions: 1},
    'Ca3(PO4)2': {cations: 3, anions: 2},
    'BaSO4': {cations: 1, anions: 1},
    'BaCO3': {cations: 1, anions: 1},
    'PbCl2': {cations: 1, anions: 2},
    'PbSO4': {cations: 1, anions: 1},
    'PbI2': {cations: 1, anions: 2},
    'Mg(OH)2': {cations: 1, anions: 2},
    'Fe(OH)2': {cations: 1, anions: 2},
    'Fe(OH)3': {cations: 1, anions: 3},
    'Al(OH)3': {cations: 1, anions: 3},
    'NaCl': {cations: 1, anions: 1},
    'KCl': {cations: 1, anions: 1},
  };

  if (commonSalts[formula]) {
    return commonSalts[formula];
  }

  // Try to parse the formula automatically
  // Look for pattern: M_a X_b where M is metal and X is nonmetal
  // This is a simplified heuristic

  // For binary compounds with two elements
  const elements = Object.keys(composition);
  if (elements.length === 2) {
    const [elem1, elem2] = elements;
    const count1 = composition[elem1];
    const count2 = composition[elem2];

    // Determine which is cation (metal) and which is anion (nonmetal)
    // Metals are typically on the left side of periodic table
    const metals = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr',
                    'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra',
                    'Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi',
                    'Ag', 'Zn', 'Cd', 'Hg', 'Cu', 'Fe', 'Ni', 'Co',
                    'Cr', 'Mn', 'V', 'Ti'];

    if (metals.includes(elem1)) {
      return {cations: count1, anions: count2};
    } else if (metals.includes(elem2)) {
      return {cations: count2, anions: count1};
    }
  }

  // Default to 1:1 if we can't determine
  console.warn('Could not determine stoichiometry for ' + formula + ', assuming 1:1');
  return {cations: 1, anions: 1};
}

// Calculate solubility from Ksp
function calculateSolubilityFromKsp() {
  const formula = document.getElementById('formula-ksp').value.trim();
  const kspInput = document.getElementById('ksp-value').value.trim();

  if (!formula || !kspInput) {
    showError('Bitte geben Sie sowohl die Formel als auch das Ksp ein.');
    return;
  }

  try {
    const ksp = parseScientificNotation(kspInput);
    const stoichiometry = parseSaltStoichiometry(formula);

    // Calculate solubility based on salt type
    // For: M_aX_b ⇌ a M^b+ + b X^a-
    // Ksp = (a·s)^a · (b·s)^b = a^a · b^b · s^(a+b)
    // s = (Ksp / (a^a · b^b))^(1/(a+b))

    const a = stoichiometry.cations;
    const b = stoichiometry.anions;

    const coefficient = Math.pow(a, a) * Math.pow(b, b);
    const solubility = Math.pow(ksp / coefficient, 1 / (a + b));

    // Calculate ion concentrations
    const cationConc = a * solubility;
    const anionConc = b * solubility;

    // Display results
    displaySolubilityResults(formula, ksp, solubility, cationConc, anionConc, stoichiometry);

  } catch (error) {
    showError(error.message);
  }
}

// Calculate Ksp from solubility
function calculateKspFromSolubility() {
  const formula = document.getElementById('formula-solubility').value.trim();
  const solInput = document.getElementById('solubility-value').value.trim();

  if (!formula || !solInput) {
    showError('Bitte geben Sie sowohl die Formel als auch die Löslichkeit ein.');
    return;
  }

  try {
    const solubility = parseScientificNotation(solInput);
    const stoichiometry = parseSaltStoichiometry(formula);

    // Calculate Ksp based on salt type
    // For: M_aX_b ⇌ a M^b+ + b X^a-
    // Ksp = (a·s)^a · (b·s)^b = a^a · b^b · s^(a+b)

    const a = stoichiometry.cations;
    const b = stoichiometry.anions;

    const coefficient = Math.pow(a, a) * Math.pow(b, b);
    const ksp = coefficient * Math.pow(solubility, a + b);

    // Calculate ion concentrations
    const cationConc = a * solubility;
    const anionConc = b * solubility;

    // Display results
    displayKspResults(formula, solubility, ksp, cationConc, anionConc, stoichiometry);

  } catch (error) {
    showError(error.message);
  }
}

// Check if precipitation occurs
function checkPrecipitation() {
  const formula = document.getElementById('precip-formula').value.trim();
  const kspInput = document.getElementById('precip-ksp').value.trim();
  const cationInput = document.getElementById('cation-conc').value.trim();
  const anionInput = document.getElementById('anion-conc').value.trim();

  if (!formula || !kspInput || !cationInput || !anionInput) {
    showError('Bitte füllen Sie alle Felder aus.');
    return;
  }

  try {
    const ksp = parseScientificNotation(kspInput);
    const cationConc = parseScientificNotation(cationInput);
    const anionConc = parseScientificNotation(anionInput);
    const stoichiometry = parseSaltStoichiometry(formula);

    // Calculate reaction quotient Q
    // Q = [M]^a · [X]^b
    const a = stoichiometry.cations;
    const b = stoichiometry.anions;
    const Q = Math.pow(cationConc, a) * Math.pow(anionConc, b);

    // Determine if precipitation occurs
    let status, message, statusClass;
    if (Q < ksp * 0.99) {
      status = 'Keine Fällung';
      message = 'Q < Ksp: Die Lösung ist ungesättigt. Keine Fällung erfolgt.';
      statusClass = 'success';
    } else if (Q > ksp * 1.01) {
      status = 'Fällung erfolgt';
      message = 'Q > Ksp: Die Lösung ist übersättigt. Fällung erfolgt bis Q = Ksp.';
      statusClass = 'danger';
    } else {
      status = 'Gleichgewicht';
      message = 'Q ≈ Ksp: Die Lösung ist gesättigt. Gleichgewichtszustand.';
      statusClass = 'warning';
    }

    // Display results
    displayPrecipitationResults(formula, ksp, cationConc, anionConc, Q, status, message, statusClass, stoichiometry);

  } catch (error) {
    showError(error.message);
  }
}

// Display solubility calculation results
function displaySolubilityResults(formula, ksp, solubility, cationConc, anionConc, stoichiometry) {
  const mainResult = document.getElementById('main-result');
  const ionConcentrations = document.getElementById('ion-concentrations');
  const details = document.getElementById('calculation-details');

  // Main result
  mainResult.innerHTML = `
    <div class="result-value-large">
      <span class="result-number">${formatScientific(solubility)}</span>
      <span class="result-unit">mol/L</span>
    </div>
    <p class="result-label">Molare Löslichkeit von ${window.ChemistryUtils.formatFormula(formula)}</p>
  `;

  // Ion concentrations
  ionConcentrations.innerHTML = `
    <div class="ion-item">
      <span class="ion-label">Kationen:</span>
      <span class="ion-value">${formatScientific(cationConc)} mol/L</span>
    </div>
    <div class="ion-item">
      <span class="ion-label">Anionen:</span>
      <span class="ion-value">${formatScientific(anionConc)} mol/L</span>
    </div>
  `;

  // Calculation details
  const a = stoichiometry.cations;
  const b = stoichiometry.anions;
  const coefficient = Math.pow(a, a) * Math.pow(b, b);

  details.innerHTML = `
    <div class="calculation-step">
      <h4>Gleichgewichtsreaktion:</h4>
      <p class="formula">${window.ChemistryUtils.formatFormula(formula)} ⇌ ${a > 1 ? a : ''} M^${b}${b > 1 ? b : ''}+ + ${b > 1 ? b : ''} X^${a}${a > 1 ? a : ''}-</p>
    </div>
    <div class="calculation-step">
      <h4>Löslichkeitsprodukt:</h4>
      <p class="formula">Ksp = [M^${b}+]^${a} · [X^${a}-]^${b}</p>
      <p class="formula">Ksp = (${a}·s)^${a} · (${b}·s)^${b}</p>
      <p class="formula">Ksp = ${a}^${a} · ${b}^${b} · s^(${a}+${b})</p>
      <p class="formula">${formatScientific(ksp)} = ${coefficient} · s^${a + b}</p>
    </div>
    <div class="calculation-step">
      <h4>Löslichkeit berechnen:</h4>
      <p class="formula">s = (Ksp / ${coefficient})^(1/${a + b})</p>
      <p class="formula">s = ${formatScientific(ksp / coefficient)}^(1/${a + b})</p>
      <p class="formula">s = ${formatScientific(solubility)} mol/L</p>
    </div>
    <div class="calculation-step">
      <h4>Ionenkonzentrationen:</h4>
      <p class="formula">[M^${b}+] = ${a} · s = ${a} · ${formatScientific(solubility)} = ${formatScientific(cationConc)} mol/L</p>
      <p class="formula">[X^${a}-] = ${b} · s = ${b} · ${formatScientific(solubility)} = ${formatScientific(anionConc)} mol/L</p>
    </div>
  `;

  showResults();
}

// Display Ksp calculation results
function displayKspResults(formula, solubility, ksp, cationConc, anionConc, stoichiometry) {
  const mainResult = document.getElementById('main-result');
  const ionConcentrations = document.getElementById('ion-concentrations');
  const details = document.getElementById('calculation-details');
  const title = document.getElementById('result-title');

  title.textContent = 'Löslichkeitsprodukt (Ksp)';

  // Main result
  mainResult.innerHTML = `
    <div class="result-value-large">
      <span class="result-number">${formatScientific(ksp)}</span>
    </div>
    <p class="result-label">Ksp von ${window.ChemistryUtils.formatFormula(formula)}</p>
  `;

  // Ion concentrations
  ionConcentrations.innerHTML = `
    <div class="ion-item">
      <span class="ion-label">Kationen:</span>
      <span class="ion-value">${formatScientific(cationConc)} mol/L</span>
    </div>
    <div class="ion-item">
      <span class="ion-label">Anionen:</span>
      <span class="ion-value">${formatScientific(anionConc)} mol/L</span>
    </div>
  `;

  // Calculation details
  const a = stoichiometry.cations;
  const b = stoichiometry.anions;
  const coefficient = Math.pow(a, a) * Math.pow(b, b);

  details.innerHTML = `
    <div class="calculation-step">
      <h4>Gegebene Löslichkeit:</h4>
      <p class="formula">s = ${formatScientific(solubility)} mol/L</p>
    </div>
    <div class="calculation-step">
      <h4>Gleichgewichtsreaktion:</h4>
      <p class="formula">${window.ChemistryUtils.formatFormula(formula)} ⇌ ${a > 1 ? a : ''} M^${b}${b > 1 ? b : ''}+ + ${b > 1 ? b : ''} X^${a}${a > 1 ? a : ''}-</p>
    </div>
    <div class="calculation-step">
      <h4>Ionenkonzentrationen:</h4>
      <p class="formula">[M^${b}+] = ${a} · s = ${formatScientific(cationConc)} mol/L</p>
      <p class="formula">[X^${a}-] = ${b} · s = ${formatScientific(anionConc)} mol/L</p>
    </div>
    <div class="calculation-step">
      <h4>Löslichkeitsprodukt berechnen:</h4>
      <p class="formula">Ksp = [M^${b}+]^${a} · [X^${a}-]^${b}</p>
      <p class="formula">Ksp = (${formatScientific(cationConc)})^${a} · (${formatScientific(anionConc)})^${b}</p>
      <p class="formula">Ksp = ${coefficient} · (${formatScientific(solubility)})^${a + b}</p>
      <p class="formula">Ksp = ${formatScientific(ksp)}</p>
    </div>
  `;

  showResults();
}

// Display precipitation check results
function displayPrecipitationResults(formula, ksp, cationConc, anionConc, Q, status, message, statusClass, stoichiometry) {
  const mainResult = document.getElementById('main-result');
  const ionConcentrations = document.getElementById('ion-concentrations');
  const details = document.getElementById('calculation-details');
  const title = document.getElementById('result-title');

  title.textContent = 'Fällungsprüfung';

  // Main result
  mainResult.innerHTML = `
    <div class="result-value-large">
      <span class="result-number ${statusClass}">${status}</span>
    </div>
    <p class="result-label">${message}</p>
  `;

  // Ion concentrations and Q comparison
  const a = stoichiometry.cations;
  const b = stoichiometry.anions;

  ionConcentrations.innerHTML = `
    <div class="ion-item">
      <span class="ion-label">Kationen:</span>
      <span class="ion-value">${formatScientific(cationConc)} mol/L</span>
    </div>
    <div class="ion-item">
      <span class="ion-label">Anionen:</span>
      <span class="ion-value">${formatScientific(anionConc)} mol/L</span>
    </div>
    <div class="ion-item ion-q">
      <span class="ion-label">Ionenprodukt (Q):</span>
      <span class="ion-value">${formatScientific(Q)}</span>
    </div>
    <div class="ion-item">
      <span class="ion-label">Löslichkeitsprodukt (Ksp):</span>
      <span class="ion-value">${formatScientific(ksp)}</span>
    </div>
    <div class="ion-item">
      <span class="ion-label">Verhältnis Q/Ksp:</span>
      <span class="ion-value">${formatScientific(Q / ksp)}</span>
    </div>
  `;

  // Calculation details
  details.innerHTML = `
    <div class="calculation-step">
      <h4>Ionenprodukt berechnen:</h4>
      <p class="formula">Q = [M^${b}+]^${a} · [X^${a}-]^${b}</p>
      <p class="formula">Q = (${formatScientific(cationConc)})^${a} · (${formatScientific(anionConc)})^${b}</p>
      <p class="formula">Q = ${formatScientific(Q)}</p>
    </div>
    <div class="calculation-step">
      <h4>Vergleich Q mit Ksp:</h4>
      <p class="formula">Q = ${formatScientific(Q)}</p>
      <p class="formula">Ksp = ${formatScientific(ksp)}</p>
      <p class="formula">Q ${Q < ksp ? '<' : Q > ksp ? '>' : '≈'} Ksp</p>
    </div>
    <div class="calculation-step">
      <h4>Ergebnis:</h4>
      <p>${message}</p>
    </div>
  `;

  showResults();
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
  // Ksp to Solubility examples
  document.querySelectorAll('.example-btn').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('formula-ksp').value = this.dataset.formula;
      document.getElementById('ksp-value').value = this.dataset.ksp;
    });
  });

  // Solubility to Ksp examples
  document.querySelectorAll('.example-btn-sol').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('formula-solubility').value = this.dataset.formula;
      document.getElementById('solubility-value').value = this.dataset.solubility;
    });
  });

  // Precipitation examples
  document.querySelectorAll('.example-btn-precip').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('precip-formula').value = this.dataset.formula;
      document.getElementById('precip-ksp').value = this.dataset.ksp;
      document.getElementById('cation-conc').value = this.dataset.cation;
      document.getElementById('anion-conc').value = this.dataset.anion;
    });
  });

  // Enable Enter key for inputs
  const inputs = document.querySelectorAll('input[type="text"]');
  inputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const section = this.closest('.tab-pane');
        if (section.id === 'ksp-to-solubility') {
          calculateSolubilityFromKsp();
        } else if (section.id === 'solubility-to-ksp') {
          calculateKspFromSolubility();
        } else if (section.id === 'precipitation') {
          checkPrecipitation();
        }
      }
    });
  });
});
