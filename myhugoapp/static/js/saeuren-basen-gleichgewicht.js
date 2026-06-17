/* eslint-disable no-unused-vars */
/**
 * Säuren-Basen-Gleichgewicht Rechner
 * ICE-Tabelle, Henderson-Hasselbalch und Massenwirkungsgesetz
 */

// Store calculation results
let calculationResults = {
  ice: null,
  buffer: null,
  mwg: null,
};

// ===== ICE TABLE CALCULATION =====

function calculateICE() {
  const reactionType = document.getElementById('reaction-type').value;
  const ka = parseFloat(document.getElementById('ka-value').value);
  const initialConc = parseFloat(document.getElementById('initial-concentration').value);

  if (isNaN(ka) || isNaN(initialConc) || ka <= 0 || initialConc <= 0) {
    showToast('Bitte geben Sie gültige Werte ein.', 'error');
    return;
  }

  let iceTable;
  let results;

  if (reactionType === 'weak-acid') {
    iceTable = calculateWeakAcidICE(ka, initialConc);
  } else {
    iceTable = calculateWeakBaseICE(ka, initialConc);
  }

  displayICETable(iceTable);
  calculateEquilibriumResults(iceTable, ka, reactionType);
  checkApproximation(iceTable, ka, initialConc);
}

function calculateWeakAcidICE(ka, initialConc) {
  // HA ⇌ H⁺ + A⁻
  // Ka = [H+][A-]/[HA]
  // Ka = x^2 / (initial - x)
  // x = ( -Ka + sqrt(Ka^2 + 4*Ka*initial) ) / 2

  const discriminant = Math.sqrt(ka * ka + 4 * ka * initialConc);
  const x = (-ka + discriminant) / 2;

  return {
    reaction: 'HA ⇌ H⁺ + A⁻',
    species: ['HA', 'H⁺', 'A⁻'],
    initial: [initialConc, 0, 0],
    change: [-x, x, x],
    equilibrium: [initialConc - x, x, x],
    x: x,
  };
}

function calculateWeakBaseICE(kb, initialConc) {
  // B + H₂O ⇌ BH⁺ + OH⁻
  // Kb = [BH+][OH-]/[B]

  const discriminant = Math.sqrt(kb * kb + 4 * kb * initialConc);
  const x = (-kb + discriminant) / 2;

  return {
    reaction: 'B + H₂O ⇌ BH⁺ + OH⁻',
    species: ['B', 'BH⁺', 'OH⁻'],
    initial: [initialConc, 0, 0],
    change: [-x, x, x],
    equilibrium: [initialConc - x, x, x],
    x: x,
  };
}

function displayICETable(iceTable) {
  const tbody = document.getElementById('ice-table-body');
  tbody.innerHTML = '';

  iceTable.species.forEach((species, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${species}</strong></td>
      <td>${scientificNotation(iceTable.initial[index])}</td>
      <td>${scientificNotation(iceTable.change[index], 'x')}</td>
      <td>${scientificNotation(iceTable.equilibrium[index])}</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('ice-result').style.display = 'block';
}

function calculateEquilibriumResults(iceTable, ka, reactionType) {
  const display = document.getElementById('equilibrium-display');

  let html = '<div class="equilibrium-values">';

  if (reactionType === 'weak-acid') {
    const ph = -Math.log10(iceTable.equilibrium[1]); // [H+]
    html = html.replace('equilibrium-values', 'equilibrium-values weak-acid');
    html += `<div><span class="label">Dissoziation x:</span> <span class="value">${scientificNotation(iceTable.x)}</span></div>`;
    html += `<div><span class="label">[H⁺]eq:</span> <span class="value">${scientificNotation(iceTable.equilibrium[1])}</span></div>`;
    html += `<div><span class="label">pH:</span> <span class="valuehighlight">${ph.toFixed(2)}</span></div>`;
    html += `<div><span class="label">Dissoziationsgrad α:</span> <span class="value">${((iceTable.x / iceTable.initial[0]) * 100).toFixed(2)}%</span></div>`;
  } else {
    const poh = -Math.log10(iceTable.equilibrium[2]); // [OH-]
    const ph = 14 - poh;
    html += `<div><span class="label">Dissoziation x:</span> <span class="value">${scientificNotation(iceTable.x)}</span></div>`;
    html += `<div><span class="label">[OH⁻]eq:</span> <span class="value">${scientificNotation(iceTable.equilibrium[2])}</span></div>`;
    html += `<div><span class="label">pOH:</span> <span class="value">${poh.toFixed(2)}</span></div>`;
    html += `<div><span class="label">pH:</span> <span class="valuehighlight">${ph.toFixed(2)}</span></div>`;
  }

  html += '</div>';
  display.innerHTML = html;
}

function checkApproximation(iceTable, ka, initialConc) {
  const x = iceTable.x;
  const percent = (x / initialConc) * 100;
  const isApproximationValid = percent < 5;

  let html = '<div class="approximation-result">';
  html += `<div><span class="label"> Näherungsfehler: </span>`;
  if (isApproximationValid) {
    html += `<span class="valuehighlight valid">✓ ${percent.toFixed(2)}%</span>`;
    html += '<p class="text-success"><small>Näherung ist gültig (< 5%). Vereinfachte Berechnung möglich.</small></p>';
  } else {
    html += `<span class="valuehighlight invalid">✗ ${percent.toFixed(2)}%</span>`;
    html += '<p class="text-warning"><small>Näherung ist nicht gültig (≥ 5%). Quadratische Gleichung erforderlich.</small></p>';
  }
  html += '</div>';

  document.getElementById('approximation-result').innerHTML = html;
}

// ===== BUFFER pH CALCULATION =====

const BUFFER_PRESETS = {
  acetate: { name: 'Acetatpuffer', pka: 4.76, acid: 'CH₃COOH', base: 'CH₃COO⁻' },
  phosphate: { name: 'Phosphatpuffer', pka: 7.21, acid: 'H₂PO₄⁻', base: 'HPO₄²⁻' },
  ammonium: { name: 'Ammoniumpuffer', pka: 9.25, acid: 'NH₄⁺', base: 'NH₃' },
  carbonate: { name: 'Carbonatpuffer', pka: 10.33, acid: 'HCO₃⁻', base: 'CO₃²⁻' },
  tris: { name: 'TRIS-Puffer', pka: 8.07, acid: 'C₄H₁₁NO₃·H⁺', base: 'C₄H₁₁NO₃' },
  hepes: { name: 'HEPES-Puffer', pka: 7.55, acid: 'HEPES·H⁺', base: 'HEPES' },
  citrate: { name: 'Citratpuffer', pka: 3.13, acid: 'H₃Cit', base: 'H₂Cit⁻' },
  formate: { name: 'Formiatpuffer', pka: 3.75, acid: 'HCOOH', base: 'HCOO⁻' },
};

function loadBufferPreset() {
  const select = document.getElementById('buffer-preset');
  const key = select.value;
  const resultDiv = document.getElementById('buffer-result');
  if (resultDiv) resultDiv.style.display = 'none';
  if (key === 'custom') return;
  const preset = BUFFER_PRESETS[key];
  if (!preset) return;
  document.getElementById('buffer-pka').value = preset.pka;
  document.getElementById('acid-concentration').value = 0.1;
  document.getElementById('base-concentration').value = 0.1;
}

function updateBufferRangeVisual(pka, currentPh) {
  const marker = document.getElementById('buffer-current-marker');
  const bar = document.getElementById('buffer-range-bar');
  if (!marker || !bar) return;
  // pKa ± 1 is the effective buffer range → on 0-14 scale
  const phMin = 0;
  const phMax = 14;
  const range = phMax - phMin;
  const effectiveStart = Math.max(phMin, pka - 1);
  const effectiveEnd = Math.min(phMax, pka + 1);

  // Position of current pH
  const pos = ((currentPh - phMin) / range) * 100;
  marker.style.left = `calc(${pos}% - 2px)`;
  marker.style.display = 'block';

  // Label
  let label = document.getElementById('buffer-range-label');
  if (!label) {
    label = document.createElement('div');
    label.id = 'buffer-range-label';
    label.style.cssText = 'text-align:center;margin-top:8px;font-weight:bold;';
    document.querySelector('.buffer-range-visual')?.appendChild(label);
  }
  if (currentPh >= effectiveStart && currentPh <= effectiveEnd) {
    label.innerHTML = `✅ pH ${currentPh.toFixed(2)} — im effektiven Pufferbereich (pKₐ = ${pka.toFixed(2)} ± 1)`;
    label.style.color = '#27ae60';
  } else {
    label.innerHTML = `⚠️ pH ${currentPh.toFixed(2)} — außerhalb des effektiven Pufferbereichs (pKₐ = ${pka.toFixed(2)} ± 1)`;
    label.style.color = '#e74c3c';
  }
}

function calculateBufferpH() {
  const pka = parseFloat(document.getElementById('buffer-pka').value);
  const acidConc = parseFloat(document.getElementById('acid-concentration').value);
  const baseConc = parseFloat(document.getElementById('base-concentration').value);

  if (isNaN(pka) || isNaN(acidConc) || isNaN(baseConc) || acidConc <= 0 || baseConc <= 0) {
    showToast('Bitte geben Sie gültige Werte ein.', 'error');
    return;
  }

  const ratio = baseConc / acidConc;
  const ph = pka + Math.log10(ratio);

  document.getElementById('buffer-ph').textContent = ph.toFixed(2);
  document.getElementById('buffer-result').style.display = 'block';

  displayBufferCalculation(pka, acidConc, baseConc, ratio);
  determineBufferCapacity(ratio, acidConc + baseConc);
  updateBufferRangeVisual(pka, ph);
}

function displayBufferCalculation(pka, acidConc, baseConc, ratio) {
  const display = document.getElementById('buffer-calculation');
  const ph = pka + Math.log10(ratio);

  display.innerHTML = `
    <div class="calculation-steps">
      <p><span class="step">1.</span> pKₐ = ${pka.toFixed(2)}</p>
      <p><span class="step">2.</span> [A⁻]/[HA] = ${baseConc.toFixed(4)}/${acidConc.toFixed(4)} = ${ratio.toFixed(4)}</p>
      <p><span class="step">3.</span> log₁₀([A⁻]/[HA]) = log₁₀(${ratio.toFixed(4)}) = ${Math.log10(ratio).toFixed(4)}</p>
      <p><span class="step">4.</span> pH = ${pka.toFixed(2)} + ${Math.log10(ratio).toFixed(4)} = ${ph.toFixed(2)}</p>
    </div>
  `;
}

function determineBufferCapacity(ratio, totalConc) {
  const display = document.getElementById('buffer-capacity-result');

  let quality;
  let color;

  if (ratio >= 0.1 && ratio <= 10) {
    if (ratio >= 0.333 && ratio <= 3) {
      quality = 'Optimal';
      color = 'success';
    } else {
      quality = 'Gut';
      color = 'info';
    }
  } else {
    quality = 'Schwach';
    color = 'warning';
  }

  display.innerHTML = `
    <div class="capacity-result">
      <p><span class="label"> Verhältnis [A⁻]/[HA]: </span> <span class="value">${ratio.toFixed(2)}</span></p>
      <p><span class="label"> Gesamtkonzentration: </span> <span class="value">${totalConc.toFixed(4)} mol/L</span></p>
      <p><span class="label"> Pufferqualität: </span> <span class="badge bg-${color}">${quality}</span></p>
      <p class="help-block">Optimaler Bereich: [A⁻]/[HA] zwischen 0.1 und 10</p>
    </div>
  `;
}

// ===== MASS ACTION LAW CALCULATION =====

function calculateMWG() {
  const product1 = parseFloat(document.getElementById('product1').value);
  const product2 = parseFloat(document.getElementById('product2').value);
  const reactant1 = parseFloat(document.getElementById('reactant1').value);
  const ka = parseFloat(document.getElementById('ka-comparison').value);

  if (isNaN(product1) || isNaN(product2) || isNaN(reactant1) || isNaN(ka)) {
    showToast('Bitte geben Sie gültige Werte ein.', 'error');
    return;
  }

  const Q = (product1 * product2) / reactant1;
  let direction;
  let directionClass;

  if (Q < ka) {
    direction = '→ Produkte (hin)';
    directionClass = 'forward';
  } else if (Q > ka) {
    direction = '← Edukte (zurück)';
    directionClass = 'backward';
  } else {
    direction = '⇌ Gleichgewicht';
    directionClass = 'equilibrium';
  }

  document.getElementById('quotient-value').textContent = scientificNotation(Q);
  document.getElementById('reaction-direction-badge').textContent = direction;
  document.getElementById('reaction-direction-badge').className = `badge ${directionClass}`;
  document.getElementById('mwg-result').style.display = 'block';

  displayMWGExplanation(Q, ka, direction);
}

function displayMWGExplanation(Q, ka, direction) {
  const display = document.getElementById('mwg-explanation');

  let explanation = '<div class="explanation-text">';
  explanation += `<p><strong>Reaktionsquotient Q:</strong> ${scientificNotation(Q)}</p>`;
  explanation += `<p><strong>Gleichgewichtskonstante Kₐ:</strong> ${scientificNotation(ka)}</p>`;
  explanation += '<p><strong>Vergleich:</strong></p>';

  if (Q < ka) {
    explanation += `<p>Q (${scientificNotation(Q)}) < Kₐ (${scientificNotation(ka)})</p>`;
    explanation += '<p>Die Reaktion läuft in Richtung der Produkte, um den Quotienten zu erhöhen.</p>';
  } else if (Q > ka) {
    explanation += `<p>Q (${scientificNotation(Q)}) > Kₐ (${scientificNotation(ka)})</p>`;
    explanation += '<p>Die Reaktion läuft in Richtung der Edukte, um den Quotienten zu verringern.</p>';
  } else {
    explanation += `<p>Q = Kₐ = ${scientificNotation(ka)}</p>`;
    explanation += '<p>Das System befindet sich bereits im Gleichgewicht.</p>';
  }

  explanation += '</div>';
  display.innerHTML = explanation;
}

// ===== UTILITY FUNCTIONS =====

function calculateBufferPreparation() {
  const targetPh = parseFloat(document.getElementById('target-ph').value);
  const pka = parseFloat(document.getElementById('prep-pka').value);

  if (isNaN(targetPh) || isNaN(pka) || targetPh < 0 || targetPh > 14) {
    showToast('Bitte geben Sie gültige Werte ein.', 'error');
    return;
  }

  const ratio = Math.pow(10, targetPh - pka);
  const resultDiv = document.getElementById('buffer-prep-result');
  const textDiv = document.getElementById('buffer-prep-text');

  let html = '';
  if (ratio >= 0.01 && ratio <= 100) {
    html += `Benötigtes Verhältnis [A⁻]/[HA] = <strong>${ratio.toFixed(3)}</strong><br>`;
    html += `Das heißt: Auf <strong>1 mol HA</strong> kommen <strong>${ratio.toFixed(3)} mol A⁻</strong>.<br>`;
    if (ratio >= 0.1 && ratio <= 10) {
      html += '<span class="text-success">✅ Dieser pH liegt im effektiven Pufferbereich (pKₐ ± 1).</span>';
    } else {
      html += '<span class="text-warning">⚠️ Dieser pH liegt außerhalb des effektiven Pufferbereichs. Die Pufferkapazität ist gering.</span>';
    }
  } else {
    html += `Benötigtes Verhältnis [A⁻]/[HA] = <strong>${ratio.toExponential(2)}</strong><br>`;
    html += '<span class="text-danger">⚠️ Dieses extreme Verhältnis ist praktisch nicht realisierbar. Wählen Sie einen anderen Puffer mit passendem pKₐ.</span>';
  }
  html += '<hr><p class="help-block">Formel: [A⁻]/[HA] = 10<sup>(pH − pKₐ)</sup></p>';

  textDiv.innerHTML = html;
  resultDiv.style.display = 'block';
}

function scientificNotation(value, variable = null) {
  if (variable) {
    return variable;
  }

  if (Math.abs(value) >= 0.01 && Math.abs(value) < 10000) {
    return value.toExponential(4);
  } else if (value === 0) {
    return '0';
  } else {
    return value.toExponential(4);
  }
}

function updateICETable() {
  const reactionType = document.getElementById('reaction-type').value;
  const helpBlock = document.querySelector('#ka-value').nextElementSibling;

  if (reactionType === 'weak-acid') {
    helpBlock.textContent = 'Essigsäure: 1.8e-5, Ameisensäure: 1.8e-4, Blausäure: 6.2e-10';
  } else {
    helpBlock.textContent = 'Ammoniak: 1.8e-5, Methylamin: 4.4e-4, Anilin: 4.3e-10';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const resultPanel = document.getElementById('ice-result');
  if (resultPanel) {
    resultPanel.style.display = 'none';
  }
});