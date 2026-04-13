/**
 * Gas Law Calculator
 * Calculates with Boyle-Mariotte, Gay-Lussac, and Ideal Gas Law
 */

// Constants
const R_BAR = 0.08314; // L·bar/(mol·K)

// Unit conversion factors
const pressureConversions = {
  bar: { toBar: 1, toAtm: 0.986923, toPa: 100000, toMmHg: 750.062 },
  Pa: { toBar: 0.00001, toAtm: 0.00000987, toPa: 1, toMmHg: 0.00750062 },
  kPa: { toBar: 0.01, toAtm: 0.00986923, toPa: 1000, toMmHg: 7.50062 },
  atm: { toBar: 1.01325, toAtm: 1, toPa: 101325, toMmHg: 760 },
  mmHg: { toBar: 0.00133322, toAtm: 0.00131579, toPa: 133.322, toMmHg: 1 },
};

const volumeConversions = {
  L: { toL: 1, toM3: 0.001, toML: 1000 },
  m3: { toL: 1000, toM3: 1, toML: 1000000 },
  mL: { toL: 0.001, toM3: 0.000001, toML: 1 },
  cm3: { toL: 0.001, toM3: 0.000001, toML: 1 },
};

const amountConversions = {
  mol: { toMol: 1, toMmol: 1000 },
  mmol: { toMol: 0.001, toMmol: 1 },
};

// Convert pressure to bar
function convertPressureToBar(value, unit) {
  return value * pressureConversions[unit].toBar;
}

// Convert volume to liters
function convertVolumeToLiters(value, unit) {
  return value * volumeConversions[unit].toL;
}

// Convert amount to moles
function convertAmountToMoles(value, unit) {
  return value * amountConversions[unit].toMol;
}

// Convert Celsius to Kelvin
function celsiusToKelvin(celsius) {
  return celsius + 273.15;
}

// Format number for display
function formatNumber(value, decimals = 3) {
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 10000) {
    return value.toExponential(decimals - 1);
  }
  return value.toFixed(decimals);
}

// Ideal Gas Law Calculator
// eslint-disable-next-line no-unused-vars
function calculateIdealGas(calculateWhat) {
  const pressureInput = document.getElementById('ig-pressure').value.trim();
  const pressureUnit = document.getElementById('ig-pressure-unit').value;
  const volumeInput = document.getElementById('ig-volume').value.trim();
  const volumeUnit = document.getElementById('ig-volume-unit').value;
  const amountInput = document.getElementById('ig-amount').value.trim();
  const amountUnit = document.getElementById('ig-amount-unit').value;
  const temperatureInput = document.getElementById('ig-temperature').value.trim();
  const tempUnit = document.getElementById('ig-temp-unit').value;

  // Count how many values are provided (we need 3 to calculate the 4th)
  const provided = {};
  if (pressureInput) provided.pressure = true;
  if (volumeInput) provided.volume = true;
  if (amountInput) provided.amount = true;
  if (temperatureInput) provided.temperature = true;

  if (Object.keys(provided).length < 3) {
    showError('Bitte geben Sie mindestens 3 der 4 Größen ein.');
    return;
  }

  try {
    let pressure = pressureInput ? parseFloat(pressureInput) : null;
    let volume = volumeInput ? parseFloat(volumeInput) : null;
    let amount = amountInput ? parseFloat(amountInput) : null;
    let temperature = temperatureInput ? parseFloat(temperatureInput) : null;

    // Convert to standard units
    if (pressure !== null) pressure = convertPressureToBar(pressure, pressureUnit);
    if (volume !== null) volume = convertVolumeToLiters(volume, volumeUnit);
    if (amount !== null) amount = convertAmountToMoles(amount, amountUnit);
    if (temperature !== null && tempUnit === 'C') temperature = celsiusToKelvin(temperature);

    // Calculate the missing value
    let result = null;
    let resultUnit = '';
    let formula = '';

    switch (calculateWhat) {
      case 'pressure':
        if (!volume || !amount || !temperature) {
          showError('Bitte geben Sie Volumen, Stoffmenge und Temperatur ein.');
          return;
        }
        result = (amount * R_BAR * temperature) / volume;
        resultUnit = 'bar';
        formula = `p = nRT/V = (${formatNumber(amount)} mol × ${formatNumber(R_BAR)} L·bar/(mol·K) × ${formatNumber(temperature)} K) / ${formatNumber(volume)} L`;
        break;

      case 'volume':
        if (!pressure || !amount || !temperature) {
          showError('Bitte geben Sie Druck, Stoffmenge und Temperatur ein.');
          return;
        }
        result = (amount * R_BAR * temperature) / pressure;
        resultUnit = 'L';
        formula = `V = nRT/p = (${formatNumber(amount)} mol × ${formatNumber(R_BAR)} L·bar/(mol·K) × ${formatNumber(temperature)} K) / ${formatNumber(pressure)} bar`;
        break;

      case 'amount':
        if (!pressure || !volume || !temperature) {
          showError('Bitte geben Sie Druck, Volumen und Temperatur ein.');
          return;
        }
        result = (pressure * volume) / (R_BAR * temperature);
        resultUnit = 'mol';
        formula = `n = pV/RT = (${formatNumber(pressure)} bar × ${formatNumber(volume)} L) / (${formatNumber(R_BAR)} L·bar/(mol·K) × ${formatNumber(temperature)} K)`;
        break;

      case 'temperature':
        if (!pressure || !volume || !amount) {
          showError('Bitte geben Sie Druck, Volumen und Stoffmenge ein.');
          return;
        }
        result = (pressure * volume) / (amount * R_BAR);
        resultUnit = 'K';
        formula = `T = pV/nR = (${formatNumber(pressure)} bar × ${formatNumber(volume)} L) / (${formatNumber(amount)} mol × ${formatNumber(R_BAR)} L·bar/(mol·K))`;
        break;
    }

    displayIdealGasResult(
      calculateWhat,
      result,
      resultUnit,
      formula,
      pressure,
      volume,
      amount,
      temperature
    );
  } catch (error) {
    showError(error.message);
  }
}

// Boyle-Mariotte Law Calculator
function calculateBoyleMariotte() {
  const p1 = parseFloat(document.getElementById('bm-p1').value.trim());
  const v1 = parseFloat(document.getElementById('bm-v1').value.trim());
  const p2Input = document.getElementById('bm-p2').value.trim();
  const v2Input = document.getElementById('bm-v2').value.trim();

  if (!p1 || !v1) {
    showError('Bitte geben Sie p₁ und V₁ ein.');
    return;
  }

  if (!p2Input && !v2Input) {
    showError('Bitte geben Sie entweder p₂ oder V₂ ein.');
    return;
  }

  try {
    const p2 = p2Input ? parseFloat(p2Input) : null;
    const v2 = v2Input ? parseFloat(v2Input) : null;

    let result = null;
    let resultType = '';
    let formula = '';

    if (p2 && !v2) {
      // Calculate V2
      result = (p1 * v1) / p2;
      resultType = 'V₂';
      document.getElementById('bm-v2').value = result.toFixed(3);
      formula = `V₂ = p₁V₁/p₂ = (${formatNumber(p1)} bar × ${formatNumber(v1)} L) / ${formatNumber(p2)} bar`;
    } else if (!p2 && v2) {
      // Calculate p2
      result = (p1 * v1) / v2;
      resultType = 'p₂';
      document.getElementById('bm-p2').value = result.toFixed(3);
      formula = `p₂ = p₁V₁/V₂ = (${formatNumber(p1)} bar × ${formatNumber(v1)} L) / ${formatNumber(v2)} L`;
    } else {
      showError('Bitte geben Sie nur EINEN der Werte p₂ oder V₂ ein (nicht beide).');
      return;
    }

    displayBoyleMariotteResult(resultType, result, formula, p1, v1, p2, v2);
  } catch (error) {
    showError(error.message);
  }
}

// Gay-Lussac Law Calculator
function calculateGayLussac() {
  const lawType = document.getElementById('gl-law-type').value;
  const v1 = parseFloat(document.getElementById('gl-v1').value.trim());
  const t1 = parseFloat(document.getElementById('gl-t1').value.trim());
  const v2Input = document.getElementById('gl-v2').value.trim();
  const t2Input = document.getElementById('gl-t2').value.trim();

  if (!v1 || !t1) {
    showError('Bitte geben Sie die Ausgangswerte ein.');
    return;
  }

  if (!v2Input && !t2Input) {
    showError('Bitte geben Sie entweder den Endwert für Volumen/Druck oder Temperatur ein.');
    return;
  }

  try {
    const v2 = v2Input ? parseFloat(v2Input) : null;
    const t2 = t2Input ? parseFloat(t2Input) : null;

    let result = null;
    let resultType = '';
    let formula = '';

    if (lawType === 'isobar') {
      // V1/T1 = V2/T2 (isobar)
      if (v2 && !t2) {
        result = (v2 * t1) / v1;
        resultType = 'T₂';
        document.getElementById('gl-t2').value = result.toFixed(3);
        formula = `T₂ = V₂T₁/V₁ = (${formatNumber(v2)} L × ${formatNumber(t1)} K) / ${formatNumber(v1)} L`;
      } else if (!v2 && t2) {
        result = (v1 * t2) / t1;
        resultType = 'V₂';
        document.getElementById('gl-v2').value = result.toFixed(3);
        formula = `V₂ = V₁T₂/T₁ = (${formatNumber(v1)} L × ${formatNumber(t2)} K) / ${formatNumber(t1)} K`;
      }
    } else {
      // p1/T1 = p2/T2 (isochor)
      if (v2 && !t2) {
        result = (v2 * t1) / v1;
        resultType = 'T₂';
        document.getElementById('gl-t2').value = result.toFixed(3);
        formula = `T₂ = p₂T₁/p₁ = (${formatNumber(v2)} bar × ${formatNumber(t1)} K) / ${formatNumber(v1)} bar`;
      } else if (!v2 && t2) {
        result = (v1 * t2) / t1;
        resultType = 'p₂';
        document.getElementById('gl-v2').value = result.toFixed(3);
        formula = `p₂ = p₁T₂/T₁ = (${formatNumber(v1)} bar × ${formatNumber(t2)} K) / ${formatNumber(t1)} K`;
      }
    }

    displayGayLussacResult(lawType, resultType, result, formula, v1, t1, v2, t2);
  } catch (error) {
    showError(error.message);
  }
}

// Combined Gas Law Calculator
function calculateCombinedGasLaw() {
  const p1 = parseFloat(document.getElementById('cg-p1').value.trim());
  const v1 = parseFloat(document.getElementById('cg-v1').value.trim());
  const t1 = parseFloat(document.getElementById('cg-t1').value.trim());
  const p2Input = document.getElementById('cg-p2').value.trim();
  const v2Input = document.getElementById('cg-v2').value.trim();
  const t2Input = document.getElementById('cg-t2').value.trim();

  if (!p1 || !v1 || !t1) {
    showError('Bitte geben Sie p₁, V₁ und T₁ ein.');
    return;
  }

  const provided = [];
  if (p2Input) provided.push('p2');
  if (v2Input) provided.push('v2');
  if (t2Input) provided.push('t2');

  if (provided.length !== 2) {
    showError('Bitte geben Sie genau 2 der 3 Endwerte ein.');
    return;
  }

  try {
    const p2 = p2Input ? parseFloat(p2Input) : null;
    const v2 = v2Input ? parseFloat(v2Input) : null;
    const t2 = t2Input ? parseFloat(t2Input) : null;

    let result = null;
    let resultType = '';
    let formula = '';

    // p1V1/T1 = p2V2/T2
    if (!p2) {
      result = (p1 * v1 * t2) / (v2 * t1);
      resultType = 'p₂';
      document.getElementById('cg-p2').value = result.toFixed(3);
      formula = `p₂ = p₁V₁T₂/(V₂T₁) = (${formatNumber(p1)} × ${formatNumber(v1)} × ${formatNumber(t2)}) / (${formatNumber(v2)} × ${formatNumber(t1)})`;
    } else if (!v2) {
      result = (p1 * v1 * t2) / (p2 * t1);
      resultType = 'V₂';
      document.getElementById('cg-v2').value = result.toFixed(3);
      formula = `V₂ = p₁V₁T₂/(p₂T₁) = (${formatNumber(p1)} × ${formatNumber(v1)} × ${formatNumber(t2)}) / (${formatNumber(p2)} × ${formatNumber(t1)})`;
    } else if (!t2) {
      result = (p2 * v2 * t1) / (p1 * v1);
      resultType = 'T₂';
      document.getElementById('cg-t2').value = result.toFixed(3);
      formula = `T₂ = p₂V₂T₁/(p₁V₁) = (${formatNumber(p2)} × ${formatNumber(v2)} × ${formatNumber(t1)}) / (${formatNumber(p1)} × ${formatNumber(v1)})`;
    }

    displayCombinedGasLawResult(resultType, result, formula, p1, v1, t1, p2, v2, t2);
  } catch (error) {
    showError(error.message);
  }
}

// Display functions
function displayIdealGasResult(calculateWhat, result, unit, formula, p, V, n, T) {
  const labels = {
    pressure: 'Druck p',
    volume: 'Volumen V',
    amount: 'Stoffmenge n',
    temperature: 'Temperatur T',
  };

  const resultHtml = `
    <div class="result-highlight">
      <div class="result-value">${formatNumber(result, 4)} ${unit}</div>
      <div class="result-label">${labels[calculateWhat]}</div>
    </div>
  `;

  const detailsHtml = `
    <div class="calculation-step">
      <h4>Ideales Gasgesetz: pV = nRT</h4>
      <p><strong>Gegebene Größen:</strong></p>
      <ul>
        ${p !== null ? `<li>Druck: ${formatNumber(p, 3)} bar</li>` : ''}
        ${V !== null ? `<li>Volumen: ${formatNumber(V, 3)} L</li>` : ''}
        ${n !== null ? `<li>Stoffmenge: ${formatNumber(n, 3)} mol</li>` : ''}
        ${T !== null ? `<li>Temperatur: ${formatNumber(T, 2)} K (${formatNumber(T - 273.15, 2)} °C)</li>` : ''}
      </ul>
      <p><strong>Berechnung:</strong></p>
      <p class="formula">${formula}</p>
      <p class="formula">= ${formatNumber(result, 4)} ${unit}</p>
    </div>
    <div class="calculation-step">
      <h4>Gaskonstante</h4>
      <p>Verwendete Gaskonstante: R = ${formatNumber(R_BAR)} L·bar/(mol·K)</p>
      <p><strong>Normvolumen (STP):</strong> 22.414 L/mol bei 0°C und 1.013 bar</p>
    </div>
  `;

  const appHtml = `
    <div class="application-item">
      <span class="app-label">Praktische Anwendung:</span>
      <span class="app-value">${getApplicationForGas(calculateWhat)}</span>
    </div>
  `;

  document.getElementById('calculation-result').innerHTML = resultHtml;
  document.getElementById('calculation-details').innerHTML = detailsHtml;
  document.getElementById('application-info').innerHTML = appHtml;

  showResults();
}

function displayBoyleMariotteResult(resultType, result, formula, p1, v1, p2, v2) {
  const resultHtml = `
    <div class="result-highlight">
      <div class="result-value">${formatNumber(result, 4)}</div>
      <div class="result-label">${resultType}</div>
    </div>
  `;

  const detailsHtml = `
    <div class="calculation-step">
      <h4>Boyle-Mariotte-Gesetz: p₁V₁ = p₂V₂ (T = konst.)</h4>
      <p><strong>Ausgangszustand (1):</strong></p>
      <ul>
        <li>Druck p₁ = ${formatNumber(p1, 3)} bar</li>
        <li>Volumen V₁ = ${formatNumber(v1, 3)} L</li>
      </ul>
      <p><strong>Endzustand (2):</strong></p>
      <ul>
        <li>Druck p₂ = ${p2 !== null ? formatNumber(p2, 3) + ' bar' : 'berechnet'}</li>
        <li>Volumen V₂ = ${v2 !== null ? formatNumber(v2, 3) + ' L' : 'berechnet'}</li>
      </ul>
      <p><strong>Berechnung:</strong></p>
      <p class="formula">${formula}</p>
      <p class="formula">= ${formatNumber(result, 4)} (${resultType === 'p₂' ? 'bar' : 'L'})</p>
    </div>
  `;

  const appHtml = `
    <div class="application-item">
      <span class="app-label">Praktische Anwendung:</span>
      <span class="app-value">Kompression von Gasen, Gasmessung, Druckgasflaschen</span>
    </div>
  `;

  document.getElementById('calculation-result').innerHTML = resultHtml;
  document.getElementById('calculation-details').innerHTML = detailsHtml;
  document.getElementById('application-info').innerHTML = appHtml;

  showResults();
}

function displayGayLussacResult(lawType, resultType, result, formula, v1, t1, v2, t2) {
  const lawName = lawType === 'isobar' ? 'Isobares Gesetz' : 'Ichores Gesetz';
  const lawFormula =
    lawType === 'isobar' ? 'V₁/T₁ = V₂/T₂ (p = konst.)' : 'p₁/T₁ = p₂/T₂ (V = konst.)';
  const quantity = lawType === 'isobar' ? 'Volumen' : 'Druck';

  const resultHtml = `
    <div class="result-highlight">
      <div class="result-value">${formatNumber(result, 4)}</div>
      <div class="result-label">${resultType}</div>
    </div>
  `;

  const detailsHtml = `
    <div class="calculation-step">
      <h4>Gay-Lussac: ${lawName}</h4>
      <p><strong>${lawFormula}</strong></p>
      <p><strong>Ausgangszustand (1):</strong></p>
      <ul>
        <li>${quantity}₁ = ${formatNumber(v1, 3)} ${lawType === 'isobar' ? 'L' : 'bar'}</li>
        <li>Temperatur T₁ = ${formatNumber(t1, 2)} K (${formatNumber(t1 - 273.15, 2)} °C)</li>
      </ul>
      <p><strong>Endzustand (2):</strong></p>
      <ul>
        <li>${quantity}₂ = ${v2 !== null ? formatNumber(v2, 3) : 'berechnet'}</li>
        <li>Temperatur T₂ = ${t2 !== null ? formatNumber(t2, 2) + ' K' : 'berechnet'}</li>
      </ul>
      <p><strong>Berechnung:</strong></p>
      <p class="formula">${formula}</p>
      <p class="formula">= ${formatNumber(result, 4)}</p>
    </div>
  `;

  const appHtml = `
    <div class="application-item">
      <span class="app-label">Praktische Anwendung:</span>
      <span class="app-value">${lawType === 'isobar' ? 'Heißluftballon, Thermik, Volumenausdehnung' : 'Autoreifen, Druckkessel, Sicherheitsventile'}</span>
    </div>
  `;

  document.getElementById('calculation-result').innerHTML = resultHtml;
  document.getElementById('calculation-details').innerHTML = detailsHtml;
  document.getElementById('application-info').innerHTML = appHtml;

  showResults();
}

function displayCombinedGasLawResult(resultType, result, formula, p1, v1, t1, p2, v2, t2) {
  const resultHtml = `
    <div class="result-highlight">
      <div class="result-value">${formatNumber(result, 4)}</div>
      <div class="result-label">${resultType}</div>
    </div>
  `;

  const detailsHtml = `
    <div class="calculation-step">
      <h4>Kombiniertes Gasgesetz: p₁V₁/T₁ = p₂V₂/T₂</h4>
      <p><strong>Ausgangszustand (1):</strong></p>
      <ul>
        <li>Druck p₁ = ${formatNumber(p1, 3)} bar</li>
        <li>Volumen V₁ = ${formatNumber(v1, 3)} L</li>
        <li>Temperatur T₁ = ${formatNumber(t1, 2)} K</li>
      </ul>
      <p><strong>Endzustand (2):</strong></p>
      <ul>
        <li>Druck p₂ = ${p2 !== null ? formatNumber(p2, 3) : 'berechnet'} bar</li>
        <li>Volumen V₂ = ${v2 !== null ? formatNumber(v2, 3) : 'berechnet'} L</li>
        <li>Temperatur T₂ = ${t2 !== null ? formatNumber(t2, 2) : 'berechnet'} K</li>
      </ul>
      <p><strong>Berechnung:</strong></p>
      <p class="formula">${formula}</p>
      <p class="formula">= ${formatNumber(result, 4)}</p>
    </div>
  `;

  const appHtml = `
    <div class="application-item">
      <span class="app-label">Praktische Anwendung:</span>
      <span class="app-value">Scuba-Tauchen, Verbrennungsmotoren, Luftfahrt, meteorologische Prozesse</span>
    </div>
  `;

  document.getElementById('calculation-result').innerHTML = resultHtml;
  document.getElementById('calculation-details').innerHTML = detailsHtml;
  document.getElementById('application-info').innerHTML = appHtml;

  showResults();
}

function getApplicationForGas(type) {
  const applications = {
    pressure: 'Druckmessung, Kompressoren, Druckbehälter',
    volume: 'Gaszähler, Atemvolumen, Ballons',
    amount: 'Stoffmengenberechnung, chemische Synthese',
    temperature: 'Temperaturmessung, Thermodynamik, Wärmekraftmaschinen',
  };
  return applications[type] || 'Allgemeine Gasanwendungen';
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

// Setup event handlers
document.addEventListener('DOMContentLoaded', function () {
  // Example buttons
  document.querySelectorAll('.example-btn').forEach((button) => {
    button.addEventListener('click', function () {
      const type = this.dataset.type;

      if (type === 'stp') {
        document.getElementById('ig-pressure').value = '1.013';
        document.getElementById('ig-pressure-unit').value = 'bar';
        document.getElementById('ig-volume').value = '';
        document.getElementById('ig-amount').value = '1';
        document.getElementById('ig-amount-unit').value = 'mol';
        document.getElementById('ig-temperature').value = '273.15';
        document.getElementById('ig-temp-unit').value = 'K';
      } else if (type === 'room') {
        document.getElementById('ig-pressure').value = '1';
        document.getElementById('ig-pressure-unit').value = 'bar';
        document.getElementById('ig-volume').value = '';
        document.getElementById('ig-amount').value = '1';
        document.getElementById('ig-amount-unit').value = 'mol';
        document.getElementById('ig-temperature').value = '298.15';
        document.getElementById('ig-temp-unit').value = 'K';
      } else if (type === 'high-pressure') {
        document.getElementById('ig-pressure').value = '10';
        document.getElementById('ig-pressure-unit').value = 'bar';
        document.getElementById('ig-volume').value = '';
        document.getElementById('ig-amount').value = '1';
        document.getElementById('ig-amount-unit').value = 'mol';
        document.getElementById('ig-temperature').value = '298.15';
        document.getElementById('ig-temp-unit').value = 'K';
      }
    });
  });

  // Gay-Lussac law type change
  document.getElementById('gl-law-type').addEventListener('change', function () {
    const isIsobar = this.value === 'isobar';
    document.getElementById('gl-v1-label').textContent = isIsobar ? 'Volumen V₁:' : 'Druck p₁:';
    document.getElementById('gl-v2-label').textContent = isIsobar ? 'Volumen V₂:' : 'Druck p₂:';
    document.getElementById('gl-v1-unit').textContent = isIsobar ? 'L' : 'bar';
    document.getElementById('gl-v2-unit').textContent = isIsobar ? 'L' : 'bar';
  });

  // Enable Enter key for inputs
  const inputs = document.querySelectorAll('.form-control');
  inputs.forEach((input) => {
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        // Determine which tab is active and call appropriate function
        const activeTab = document.querySelector('.nav-tabs li.active a').getAttribute('href');
        if (activeTab === '#ideal-gas') {
          // For ideal gas, need to know which button to click
          // This is handled by the individual buttons
        } else if (activeTab === '#boyle-mariotte') {
          calculateBoyleMariotte();
        } else if (activeTab === '#gay-lussac') {
          calculateGayLussac();
        } else if (activeTab === '#combined') {
          calculateCombinedGasLaw();
        }
      }
    });
  });
});
