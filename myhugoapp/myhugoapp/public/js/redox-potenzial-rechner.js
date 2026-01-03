/**
 * Redox Potential Calculator
 * Calculates cell potentials, Gibbs free energy, and equilibrium constants for redox reactions
 */

// Constants
const FARADAY_CONSTANT = 96485; // C/mol
const GAS_CONSTANT = 8.314; // J/(mol·K)
const STANDARD_TEMPERATURE = 298.15; // K (25°C)

// Parse input number
function parseNumber(value) {
  value = value.trim();
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Ungültige Zahl: ' + value);
  }
  return num;
}

// Format number for display
function formatNumber(value, decimals = 3) {
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
    return value.toExponential(decimals - 1);
  }
  return value.toFixed(decimals);
}

// Calculate standard cell potential
function calculateCellPotential() {
  const cathodeInput = document.getElementById('cathode-potential').value.trim();
  const anodeInput = document.getElementById('anode-potential').value.trim();
  const electronsInput = document.getElementById('electrons').value.trim();

  if (!cathodeInput || !anodeInput || !electronsInput) {
    showError('Bitte füllen Sie alle Felder aus.');
    return;
  }

  try {
    const cathodePotential = parseNumber(cathodeInput);
    const anodePotential = parseNumber(anodeInput);
    const n = parseInt(electronsInput);

    if (n < 1 || n > 10) {
      showError('Anzahl der Elektronen muss zwischen 1 und 10 liegen.');
      return;
    }

    // Calculate cell potential: E°cell = E°cathode - E°anode
    const cellPotential = cathodePotential - anodePotential;

    // Calculate Gibbs free energy
    const deltaG = -n * FARADAY_CONSTANT * cellPotential; // J/mol

    // Calculate equilibrium constant
    // K = exp(-ΔG°/RT) = exp(nFE°/RT)
    const k = Math.exp((n * FARADAY_CONSTANT * cellPotential) / (GAS_CONSTANT * STANDARD_TEMPERATURE));

    // Determine spontaneity
    let spontaneity, spontaneityClass;
    if (cellPotential > 0.001) {
      spontaneity = 'Spontan (exergonisch)';
      spontaneityClass = 'success';
    } else if (cellPotential < -0.001) {
      spontaneity = 'Nicht spontan (endergonisch)';
      spontaneityClass = 'danger';
    } else {
      spontaneity = 'Gleichgewicht';
      spontaneityClass = 'warning';
    }

    // Display results
    displayCellPotentialResults(cathodePotential, anodePotential, cellPotential,
                                n, deltaG, k, spontaneity, spontaneityClass);

  } catch (error) {
    showError(error.message);
  }
}

// Calculate Nernst equation potential
function calculateNernstPotential() {
  const cathodeInput = document.getElementById('nernst-cathode').value.trim();
  const anodeInput = document.getElementById('nernst-anode').value.trim();
  const nInput = document.getElementById('nernst-electrons').value.trim();
  const tempInput = document.getElementById('temperature').value.trim();
  const oxidizedInput = document.getElementById('oxidized-conc').value.trim();
  const reducedInput = document.getElementById('reduced-conc').value.trim();

  if (!cathodeInput || !anodeInput || !nInput || !tempInput || !oxidizedInput || !reducedInput) {
    showError('Bitte füllen Sie alle Felder aus.');
    return;
  }

  try {
    const cathodePotential = parseNumber(cathodeInput);
    const anodePotential = parseNumber(anodeInput);
    const n = parseInt(nInput);
    const T = parseNumber(tempInput);
    const [ox] = parseNumber(oxidizedInput);
    const [red] = parseNumber(reducedInput);

    if (n < 1 || n > 10) {
      showError('Anzahl der Elektronen muss zwischen 1 und 10 liegen.');
      return;
    }

    // Calculate standard cell potential
    const e0 = cathodePotential - anodePotential;

    // Calculate reaction quotient Q
    // For a simple reaction: ox + ne⁻ → red
    // Q = [ox]/[red] for cathode, Q = [red]/[ox] for overall cell
    const Q = ox / red;

    // Calculate Nernst potential
    // E = E° - (RT/nF) · ln(Q)
    const nernstTerm = (GAS_CONSTANT * T) / (n * FARADAY_CONSTANT) * Math.log(Q);
    const eCell = e0 - nernstTerm;

    // Also calculate in log10 form (common at 25°C)
    const log10Term = (0.0592 / n) * Math.log10(Q);
    const eCellLog10 = e0 - log10Term;

    // Display results
    displayNernstResults(e0, n, T, ox, red, Q, nernstTerm, eCell, log10Term, eCellLog10);

  } catch (error) {
    showError(error.message);
  }
}

// Calculate Gibbs free energy and equilibrium constant
function calculateGibbsEnergy() {
  const eCellInput = document.getElementById('cell-potential').value.trim();
  const nInput = document.getElementById('gibbs-electrons').value.trim();
  const tempInput = document.getElementById('gibbs-temp').value.trim();

  if (!eCellInput || !nInput || !tempInput) {
    showError('Bitte füllen Sie alle Felder aus.');
    return;
  }

  try {
    const eCell = parseNumber(eCellInput);
    const n = parseInt(nInput);
    const T = parseNumber(tempInput);

    if (n < 1 || n > 10) {
      showError('Anzahl der Elektronen muss zwischen 1 und 10 liegen.');
      return;
    }

    // Calculate Gibbs free energy
    // ΔG° = -nFE°
    const deltaG = -n * FARADAY_CONSTANT * eCell; // J/mol
    const deltaGKJ = deltaG / 1000; // kJ/mol

    // Calculate equilibrium constant
    // K = exp(-ΔG°/RT) = exp(nFE°/RT)
    const k = Math.exp((n * FARADAY_CONSTANT * eCell) / (GAS_CONSTANT * T));

    // Determine spontaneity
    let spontaneity, spontaneityClass;
    if (deltaG < -100) {
      spontaneity = 'Spontan (exergonisch)';
      spontaneityClass = 'success';
    } else if (deltaG > 100) {
      spontaneity = 'Nicht spontan (endergonisch)';
      spontaneityClass = 'danger';
    } else {
      spontaneity = 'Gleichgewicht';
      spontaneityClass = 'warning';
    }

    // Display results
    displayGibbsResults(eCell, n, T, deltaG, deltaGKJ, k, spontaneity, spontaneityClass);

  } catch (error) {
    showError(error.message);
  }
}

// Display cell potential calculation results
function displayCellPotentialResults(cathodeE, anodeE, cellE, n, deltaG, k, spontaneity, spontaneityClass) {
  const mainResult = document.getElementById('main-result');
  const additionalResult = document.getElementById('additional-result');
  const details = document.getElementById('calculation-details');
  const title = document.getElementById('result-title');
  const additionalTitle = document.getElementById('additional-title');

  title.textContent = 'Zellpotential';
  additionalTitle.textContent = 'Energetik & Gleichgewicht';

  // Main result
  mainResult.innerHTML = `
    <div class="result-value-large">
      <span class="result-number ${cellE > 0 ? 'positive' : cellE < 0 ? 'negative' : 'neutral'}">
        ${formatNumber(cellE)} V
      </span>
    </div>
    <p class="result-label">Standard-Zellpotential E°zelle</p>
    <div class="spontaneity-indicator ${spontaneityClass}">
      <i class="fa fa-${spontaneityClass === 'success' ? 'check' : spontaneityClass === 'danger' ? 'times' : 'minus'}-circle"></i>
      ${spontaneity}
    </div>
  `;

  // Additional results
  additionalResult.innerHTML = `
    <div class="additional-item">
      <span class="additional-label">Gibbs-Energie (ΔG°):</span>
      <span class="additional-value">${formatNumber(deltaG / 1000)} kJ/mol</span>
    </div>
    <div class="additional-item">
      <span class="additional-label">Gleichgewichtskonstante (K):</span>
      <span class="additional-value">${formatKValue(k)}</span>
    </div>
  `;

  // Calculation details
  details.innerHTML = `
    <div class="calculation-step">
      <h4>Gegebene Potentiale:</h4>
      <p class="formula">E°(Kathode) = ${formatNumber(cathodeE)} V</p>
      <p class="formula">E°(Anode) = ${formatNumber(anodeE)} V</p>
      <p class="formula">n = ${n} Elektronen</p>
    </div>
    <div class="calculation-step">
      <h4>Zellpotential berechnen:</h4>
      <p class="formula">E°zelle = E°kathode - E°anode</p>
      <p class="formula">E°zelle = ${formatNumber(cathodeE)} V - (${formatNumber(anodeE)} V)</p>
      <p class="formula">E°zelle = ${formatNumber(cellE)} V</p>
    </div>
    <div class="calculation-step">
      <h4>Gibbs-Energie (ΔG°):</h4>
      <p class="formula">ΔG° = -n · F · E°zelle</p>
      <p class="formula">ΔG° = -${n} · 96485 C/mol · ${formatNumber(cellE)} V</p>
      <p class="formula">ΔG° = ${formatNumber(deltaG / 1000)} kJ/mol</p>
    </div>
    <div class="calculation-step">
      <h4>Gleichgewichtskonstante (K):</h4>
      <p class="formula">K = exp(n · F · E°zelle / R · T)</p>
      <p class="formula">K = exp(${n} · 96485 · ${formatNumber(cellE)} / 8.314 · ${STANDARD_TEMPERATURE})</p>
      <p class="formula">K = ${formatKValue(k)}</p>
    </div>
    <div class="calculation-step">
      <h4>Spontanität:</h4>
      <p>${spontaneity}</p>
      <p class="formula">E°zelle ${cellE > 0 ? '>' : cellE < 0 ? '<' : '='} 0 → ${spontaneity.toLowerCase()}</p>
    </div>
  `;

  showResults();
}

// Display Nernst equation results
function displayNernstResults(e0, n, T, ox, red, Q, nernstTerm, eCell, log10Term, eCellLog10) {
  const mainResult = document.getElementById('main-result');
  const additionalResult = document.getElementById('additional-result');
  const details = document.getElementById('calculation-details');
  const title = document.getElementById('result-title');
  const additionalTitle = document.getElementById('additional-title');

  title.textContent = 'Zellpotential (Nernst)';
  additionalTitle.textContent = 'Nernst-Terme';

  // Main result
  mainResult.innerHTML = `
    <div class="result-value-large">
      <span class="result-number ${eCell > 0 ? 'positive' : eCell < 0 ? 'negative' : 'neutral'}">
        ${formatNumber(eCell)} V
      </span>
    </div>
    <p class="result-label">Zellpotential unter Nicht-Standard-Bedingungen</p>
  `;

  // Additional results
  additionalResult.innerHTML = `
    <div class="additional-item">
      <span class="additional-label">Standard E°zelle:</span>
      <span class="additional-value">${formatNumber(e0)} V</span>
    </div>
    <div class="additional-item">
      <span class="additional-label">Reaktionsquotient (Q):</span>
      <span class="additional-value">${formatNumber(Q)}</span>
    </div>
    <div class="additional-item">
      <span class="additional-label">Nernst-Korrektur:</span>
      <span class="additional-value">${formatNumber(nernstTerm * 1000)} mV</span>
    </div>
    ${Math.abs(eCell - eCellLog10) > 0.001 ? `
    <div class="additional-item">
      <span class="additional-label">E (log₁₀-Form):</span>
      <span class="additional-value">${formatNumber(eCellLog10)} V</span>
    </div>
    ` : ''}
  `;

  // Calculation details
  details.innerHTML = `
    <div class="calculation-step">
      <h4>Gegebene Werte:</h4>
      <p class="formula">E°zelle = ${formatNumber(e0)} V</p>
      <p class="formula">n = ${n} Elektronen</p>
      <p class="formula">T = ${formatNumber(T)} K</p>
      <p class="formula">[ox] = ${formatNumber(ox)} mol/L</p>
      <p class="formula">[red] = ${formatNumber(red)} mol/L</p>
    </div>
    <div class="calculation-step">
      <h4>Reaktionsquotient:</h4>
      <p class="formula">Q = [ox]/[red]</p>
      <p class="formula">Q = ${formatNumber(ox)}/${formatNumber(red)}</p>
      <p class="formula">Q = ${formatNumber(Q)}</p>
    </div>
    <div class="calculation-step">
      <h4>Nernst-Gleichung (natürlicher Logarithmus):</h4>
      <p class="formula">E = E° - (RT/nF) · ln(Q)</p>
      <p class="formula">E = ${formatNumber(e0)} - (${formatNumber(GAS_CONSTANT * T / (n * FARADAY_CONSTANT))}) · ln(${formatNumber(Q)})</p>
      <p class="formula">E = ${formatNumber(e0)} - ${formatNumber(nernstTerm * 1000)} mV</p>
      <p class="formula">E = ${formatNumber(eCell)} V</p>
    </div>
    <div class="calculation-step">
      <h4>Nernst-Gleichung (log₁₀ bei 25°C):</h4>
      <p class="formula">E = E° - (0.0592 V/n) · log₁₀(Q)</p>
      <p class="formula">E = ${formatNumber(e0)} - (0.0592/${n}) · log₁₀(${formatNumber(Q)})</p>
      <p class="formula">E = ${formatNumber(e0)} - ${formatNumber(log10Term * 1000)} mV</p>
      <p class="formula">E = ${formatNumber(eCellLog10)} V</p>
    </div>
  `;

  showResults();
}

// Display Gibbs energy results
function displayGibbsResults(eCell, n, T, deltaG, deltaGKJ, k, spontaneity, spontaneityClass) {
  const mainResult = document.getElementById('main-result');
  const additionalResult = document.getElementById('additional-result');
  const details = document.getElementById('calculation-details');
  const title = document.getElementById('result-title');
  const additionalTitle = document.getElementById('additional-title');

  title.textContent = 'Gibbs-Energie';
  additionalTitle.textContent = 'Gleichgewichtskonstante';

  // Main result
  mainResult.innerHTML = `
    <div class="result-value-large">
      <span class="result-number ${deltaG < 0 ? 'negative' : deltaG > 0 ? 'positive' : 'neutral'}">
        ${formatNumber(deltaGKJ)} kJ/mol
      </span>
    </div>
    <p class="result-label">Gibbs-Energie (ΔG°)</p>
    <div class="spontaneity-indicator ${spontaneityClass}">
      <i class="fa fa-${spontaneityClass === 'success' ? 'check' : spontaneityClass === 'danger' ? 'times' : 'minus'}-circle"></i>
      ${spontaneity}
    </div>
  `;

  // Additional results
  additionalResult.innerHTML = `
    <div class="additional-item">
      <span class="additional-label">Zellpotential E°:</span>
      <span class="additional-value">${formatNumber(eCell)} V</span>
    </div>
    <div class="additional-item">
      <span class="additional-label">Gleichgewichtskonstante (K):</span>
      <span class="additional-value">${formatKValue(k)}</span>
    </div>
    ${k > 1e10 ? '<p class="k-note"><small>⚠️ Sehr großes K: Reaktion läuft praktisch vollständig ab</small></p>' : ''}
    ${k < 1e-10 ? '<p class="k-note"><small>⚠️ Sehr kleines K: Reaktion läuft praktisch nicht ab</small></p>' : ''}
  `;

  // Calculation details
  details.innerHTML = `
    <div class="calculation-step">
      <h4>Gegebene Werte:</h4>
      <p class="formula">E°zelle = ${formatNumber(eCell)} V</p>
      <p class="formula">n = ${n} Elektronen</p>
      <p class="formula">T = ${formatNumber(T)} K</p>
    </div>
    <div class="calculation-step">
      <h4>Gibbs-Energie berechnen:</h4>
      <p class="formula">ΔG° = -n · F · E°zelle</p>
      <p class="formula">ΔG° = -${n} · 96485 C/mol · ${formatNumber(eCell)} V</p>
      <p class="formula">ΔG° = ${formatNumber(deltaG)} J/mol</p>
      <p class="formula">ΔG° = ${formatNumber(deltaGKJ)} kJ/mol</p>
    </div>
    <div class="calculation-step">
      <h4>Gleichgewichtskonstante berechnen:</h4>
      <p class="formula">K = exp(-ΔG°/RT) = exp(n · F · E°zelle / R · T)</p>
      <p class="formula">K = exp(${n} · 96485 · ${formatNumber(eCell)} / 8.314 · ${formatNumber(T)})</p>
      <p class="formula">K = exp(${formatNumber((n * FARADAY_CONSTANT * eCell) / (GAS_CONSTANT * T))})</p>
      <p class="formula">K = ${formatKValue(k)}</p>
    </div>
    <div class="calculation-step">
      <h4>Spontanität:</h4>
      <p>${spontaneity}</p>
      <p class="formula">ΔG° ${deltaG < -100 ? '<' : deltaG > 100 ? '>' : '≈'} 0 → ${spontaneity.toLowerCase()}</p>
      <p class="formula">E°zelle ${eCell > 0 ? '>' : eCell < 0 ? '<' : '='} 0 → ${spontaneity.toLowerCase()}</p>
    </div>
  `;

  showResults();
}

// Format K value for display
function formatKValue(k) {
  if (k === 0) return '0';
  if (k === Infinity) return '∞';
  if (!isFinite(k)) return 'N/A';

  if (k < 1e-10) {
    return k.toExponential(2);
  } else if (k > 1e10) {
    return k.toExponential(2);
  } else if (k < 0.01 || k > 1000) {
    return k.toExponential(3);
  } else {
    return k.toFixed(3);
  }
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
  // Standard cell potential examples
  document.querySelectorAll('.example-btn').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('cathode-potential').value = this.dataset.cathode;
      document.getElementById('anode-potential').value = this.dataset.anode;
      document.getElementById('electrons').value = this.dataset.electrons;
    });
  });

  // Nernst equation examples
  document.querySelectorAll('.example-btn-nernst').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('nernst-cathode').value = this.dataset.cathode;
      document.getElementById('nernst-anode').value = this.dataset.anode;
      document.getElementById('nernst-electrons').value = this.dataset.n;
      document.getElementById('temperature').value = this.dataset.temp;
      document.getElementById('oxidized-conc').value = this.dataset.ox;
      document.getElementById('reduced-conc').value = this.dataset.red;
    });
  });

  // Gibbs energy examples
  document.querySelectorAll('.example-btn-gibbs').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('cell-potential').value = this.dataset.e;
      document.getElementById('gibbs-electrons').value = this.dataset.n;
      document.getElementById('gibbs-temp').value = this.dataset.temp;
    });
  });

  // Enable Enter key for inputs
  const inputs = document.querySelectorAll('.form-control');
  inputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const section = this.closest('.tab-pane');
        if (section.id === 'standard-cell') {
          calculateCellPotential();
        } else if (section.id === 'nernst') {
          calculateNernstPotential();
        } else if (section.id === 'gibbs') {
          calculateGibbsEnergy();
        }
      }
    });
  });
});
