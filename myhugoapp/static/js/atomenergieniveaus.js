/* eslint-disable no-unused-vars */
/**
 * Atomenergieniveaus und Linienspektren
 * Bohr atom model simulation with energy levels and spectral lines
 */

// Constants
const RYDBERG_CONSTANT = 1.097e7;
const PLANCK_CONSTANT = 6.626e-34;
const SPEED_OF_LIGHT = 3e8;
const ELECTRON_VOLT = 1.602e-19;

// Generate energy levels for hydrogen atom
function generateEnergyLevels(maxN = 6) {
  const levels = [];
  for (let n = 1; n <= maxN; n++) {
    const energy = -13.6 / (n * n);
    levels.push({ n, energy });
  }
  return levels;
}

// ===== ENERGY LEVEL VISUALIZATION =====

function drawEnergyLevels() {
  const canvas = document.getElementById('energy-level-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const maxN = parseInt(document.getElementById('max-n').value);
  const levels = generateEnergyLevels(maxN);

  const padding = 80;
  const graphHeight = height - 2 * padding;
  const graphWidth = width - 2 * padding;

  const minEnergy = levels[levels.length - 1].energy;
  const maxEnergy = levels[0].energy;
  const energyRange = maxEnergy - minEnergy;

  // Draw nucleus
  ctx.beginPath();
  ctx.arc(width / 2, height - padding / 2, 15, 0, 2 * Math.PI);
  ctx.fillStyle = '#FF6B6B';
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('p+', width / 2, height - padding / 2 + 5);

  const levelSpacing = graphHeight / (maxN + 1);

  levels.forEach((level, index) => {
    const y = padding + index * levelSpacing;
    const energyPercent = (level.energy - minEnergy) / energyRange;

    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    ctx.fillStyle = '#0984e3';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`n = ${level.n}`, padding, y - 8);

    ctx.fillStyle = '#00b894';
    ctx.fillText(`${level.energy.toFixed(2)} eV`, padding + 100, y - 8);

    if (index === 0) {
      ctx.fillStyle = '#d63031';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('(Grundzustand)', width - padding - 10, y - 8);
      ctx.textAlign = 'right';
    }
  });

  ctx.strokeStyle = '#636e72';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(width - padding, padding);
  ctx.textAlign = 'center';
  ctx.fillText('E = 0 eV', width / 2, padding - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  displayEnergyValues(levels);
}

function displayEnergyValues(levels) {
  const display = document.getElementById('energy-values');
  display.innerHTML = levels.map(level => `
    <div class="energy-value">
      <span class="n-level">n = ${level.n}</span>
      <span class="energy">${level.energy.toFixed(2)} eV</span>
    </div>
  `).join('');
}

// ===== TRANSITION SIMULATION =====

function simulateTransition() {
  const initialN = parseInt(document.getElementById('initial-n').value);
  const finalN = parseInt(document.getElementById('final-n').value);

  if (initialN === finalN) {
    showToast('Anfangs- und Endniveau müssen unterschiedlich sein!', 'error');
    return;
  }

  const initialEnergy = -13.6 / (initialN * initialN);
  const finalEnergy = -13.6 / (finalN * finalN);

  const deltaE = finalEnergy - initialEnergy;
  const absDeltaE = Math.abs(deltaE);
  const wavelengthNm = calculateWavelength(initialN, finalN);
  const frequency = calculateFrequency(wavelengthNm);

  const isEmission = initialN > finalN;

  displayTransitionResult(initialN, finalN, deltaE, wavelengthNm, frequency, isEmission);
  drawTransitionArrow(initialN, finalN, isEmission);
}

function calculateWavelength(initialN, finalN) {
  const reciprocalWavelength = RYDBERG_CONSTANT * (1 / (finalN * finalN) - 1 / (initialN * initialN));
  const wavelengthM = 1 / reciprocalWavelength;
  return (wavelengthM * 1e9).toFixed(1);
}

function calculateFrequency(wavelengthNm) {
  const wavelengthM = parseFloat(wavelengthNm) * 1e-9;
  const frequency = SPEED_OF_LIGHT / wavelengthM;
  return (frequency / 1e12).toFixed(2) + ' THz';
}

function displayTransitionResult(initialN, finalN, deltaE, wavelength, frequency, isEmission) {
  document.getElementById('transition-result').style.display = 'block';

  document.getElementById('transition-arrow').textContent = `n = ${initialN} ${isEmission ? '→' : '←'} n = ${finalN}`;
  document.getElementById('energy-change').textContent = `${deltaE.toFixed(3)} eV`;
  document.getElementById('wavelength').textContent = `${wavelength} nm`;
  document.getElementById('frequency').textContent = frequency;
  document.getElementById('transition-type').textContent = isEmission ? 'Emission' : 'Absorption';
  document.getElementById('series-assignment').textContent = getSeriesAssignment(finalN);

  const colorBlock = document.getElementById('color-block');
  const colorName = document.getElementById('color-name');

  const spectralColor = getSpectralColor(parseFloat(wavelength));
  colorBlock.style.backgroundColor = spectralColor;
  colorBlock.style.border = '1px solid #ccc';

  if (parseFloat(wavelength) < 380) {
    colorName.textContent = 'Ultraviolett (nicht sichtbar)';
    colorBlock.style.backgroundColor = '#9b59b6';
  } else if (parseFloat(wavelength) > 780) {
    colorName.textContent = 'Infrarot (nicht sichtbar)';
    colorBlock.style.backgroundColor = '#e74c3c';
  } else {
    colorName.textContent = getSpectralColorName(parseFloat(wavelength));
  }
}

function getSeriesAssignment(finalN) {
  const series = {
    1: 'Lyman-Serie (UV)',
    2: 'Balmer-Serie (sichtbar)',
    3: 'Paschen-Serie (IR)',
    4: 'Bracket-Serie (IR)',
    5: 'Pfund-Serie (IR)',
    6: 'Humphreys-Serie (IR)',
  };
  return series[finalN] || 'Übergang nicht klassifiziert';
}

function getSpectralColor(wavelength) {
  let r, g, b;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    r = 0;
    g = 0;
    b = 0;
  }

  const intensity = wavelength >= 380 && wavelength <= 780 ? 1 : 0.3;

  return `rgb(${Math.round(r * 255 * intensity)}, ${Math.round(g * 255 * intensity)}, ${Math.round(b * 255 * intensity)})`;
}

function getSpectralColorName(wavelength) {
  if (wavelength >= 380 && wavelength < 450) return 'Violett';
  if (wavelength >= 450 && wavelength < 495) return 'Blau';
  if (wavelength >= 495 && wavelength < 570) return 'Grün';
  if (wavelength >= 570 && wavelength < 590) return 'Gelb';
  if (wavelength >= 590 && wavelength < 620) return 'Orange';
  if (wavelength >= 620 && wavelength <= 780) return 'Rot';
  return 'Unbekannt';
}

function drawTransitionArrow(initialN, finalN, isEmission) {
  const canvas = document.getElementById('energy-level-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const maxN = parseInt(document.getElementById('max-n').value);
  const levels = generateEnergyLevels(maxN);

  const padding = 80;
  const levelSpacing = (canvas.height - 2 * padding) / (maxN + 1);

  const startX = canvas.width / 2 + 150;
  const startY = padding + (initialN - 1) * levelSpacing;
  const endY = padding + (finalN - 1) * levelSpacing;

  ctx.strokeStyle = isEmission ? '#e74c3c' : '#2ecc71';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX, endY);
  ctx.stroke();

  const arrowHeadSize = 10;
  const arrowDirection = isEmission ? 1 : -1;
  const arrowY = endY + (isEmission ? -arrowHeadSize : arrowHeadSize);

  ctx.beginPath();
  ctx.moveTo(startX, arrowY);
  ctx.lineTo(startX - arrowHeadSize / 2, arrowY - arrowHeadSize * arrowDirection);
  ctx.lineTo(startX + arrowHeadSize / 2, arrowY - arrowHeadSize * arrowDirection);
  ctx.closePath();
  ctx.fillStyle = isEmission ? '#e74c3c' : '#2ecc71';
  ctx.fill();

  ctx.fillStyle = '#2d3436';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(isEmission ? 'Emission' : 'Absorption', startX + 10, (startY + endY) / 2);
}

// ===== SPECTRAL LINES =====

function drawSpectrum() {
  const canvas = document.getElementById('spectrum-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const series = document.getElementById('spectrum-series').value;
  const seriesInfo = getSeriesInfo(series);
  const lines = generateSpectralLines(series);

  drawVisibleSpectrum(ctx, width, height);
  drawSpectralLines(ctx, lines, width, height, seriesInfo);
  displaySpectrumInfo(seriesInfo);
  displayWavelengthTable(lines, seriesInfo);
}

function getSeriesInfo(series) {
  const info = {
    lyman: { name: 'Lyman-Serie', range: 'Ultraviolett (UV)', color: '#9b59b6', description: 'Übergänge enden bei n = 1. Entdeckt von Theodore Lyman (1914).' },
    balmer: { name: 'Balmer-Serie', range: 'Sichtbar', color: '#3498db', description: 'Übergänge enden bei n = 2. Dicke sichtbare Spektrallinien. Entdeckt von Johann Balmer (1885).' },
    paschen: { name: 'Paschen-Serie', range: 'Infrarot (IR)', color: '#e74c3c', description: 'Übergänge enden bei n = 3. Entdeckt von Friedrich Paschen (1908).' },
    bracket: { name: 'Bracket-Serie', range: 'Infrarot (IR)', color: '#c0392b', description: 'Übergänge enden bei n = 4. Entdeckt von Frederick Brackett (1922).' },
    pfund: { name: 'Pfund-Serie', range: 'Infrarot (IR)', color: '#922b21', description: 'Übergänge enden bei n = 5. Entdeckt von August Pfund (1924).' },
  };
  return info[series];
}

function generateSpectralLines(series) {
  const finalN = {
    lyman: 1,
    balmer: 2,
    paschen: 3,
    bracket: 4,
    pfund: 5,
  };

  const lines = [];
  for (let n = finalN[series] + 1; n <= 7; n++) {
    const wavelength = calculateWavelength(n, finalN[series]);
    const energyAbs = Math.abs(-13.6 / (n * n) + 13.6 / (finalN[series] * finalN[series]));
    lines.push({ n, wavelength, energy: energyAbs });
  }
  return lines;
}

function drawVisibleSpectrum(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#8b00ff');
  gradient.addColorStop(0.0588, '#0000ff');
  gradient.addColorStop(0.1176, '#00ffff');
  gradient.addColorStop(0.1765, '#00ff00');
  gradient.addColorStop(0.3529, '#ffff00');
  gradient.addColorStop(0.4706, '#ffa500');
  gradient.addColorStop(0.5882, '#ff0000');
  gradient.addColorStop(1, '#4b0000');

  ctx.fillStyle = gradient;
  ctx.fillRect(50, height - 80, width - 100, 40);

  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, height - 80, width - 100, 40);

  ctx.fillStyle = '#2d3436';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Sichtbares Spektrum (nm)', width / 2, height - 20);

  ctx.font = '10px Arial';
  ctx.fillText('380', 50, height - 65);
  ctx.fillText('700', width - 50, height - 65);
}

function drawSpectralLines(ctx, lines, width, height, seriesInfo) {
  const minWavelength = 380;
  const maxWavelength = 750;
  const spectrumStart = 50;
  const spectrumEnd = width - 50;
  const spectrumWidth = spectrumEnd - spectrumStart;

  lines.forEach(line => {
    const wl = parseFloat(line.wavelength);
    if (wl < minWavelength || wl > maxWavelength) return;

    const x = spectrumStart + ((wl - minWavelength) / (maxWavelength - minWavelength)) * spectrumWidth;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, height - 80);
    ctx.lineTo(x, height - 40);
    ctx.stroke();

    ctx.fillStyle = '#2d3436';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${line.wavelength}`, x, height - 90);
  });

  lines.forEach(line => {
    const wl = parseFloat(line.wavelength);
    if (wl >= minWavelength && wl <= maxWavelength) return;

    const x = spectrumStart + ((wl - minWavelength) / (maxWavelength - minWavelength)) * spectrumWidth;

    ctx.strokeStyle = seriesInfo.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, height - 80);
    ctx.lineTo(x, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = seriesInfo.color;
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${line.wavelength}`, x, height - 90);
  });
}

function displaySpectrumInfo(seriesInfo) {
  document.getElementById('spectrum-details').innerHTML = `
    <p><strong>Name:</strong> ${seriesInfo.name}</p>
    <p><strong>Spektralbereich:</strong> ${seriesInfo.range}</p>
    <p><strong>${seriesInfo.description}</strong></p>
  `;
}

function displayWavelengthTable(lines, seriesInfo) {
  document.getElementById('wavelength-table').innerHTML = `
    <table class="table table-condensed">
      <thead>
        <tr>
          <th>Übergang</th>
          <th>Wellenlänge (nm)</th>
          <th>Energie (eV)</th>
        </tr>
      </thead>
      <tbody>
        ${lines.map(line => `
          <tr>
            <td>n = ${line.n} → ${line.n - 1}</td>
            <td>${line.wavelength}</td>
            <td>${line.energy.toFixed(3)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

document.addEventListener('DOMContentLoaded', function() {
  drawEnergyLevels();
  drawSpectrum();
});