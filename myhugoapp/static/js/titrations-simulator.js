/**
 * Titration Simulator
 * Simulates acid-base titrations with curve plotting
 */

let titrationChart = null;

// Calculate pH during titration
function calculatePH(
  analyteType,
  analyteConc,
  analyteVol,
  titrantType,
  titrantConc,
  titrantVol,
  pka = 0,
  pkb = 0
) {
  const kw = 1e-14; // Water ion product at 25°C

  // Convert volumes to L
  const Va = analyteVol / 1000; // analyte volume in L
  const Vb = titrantVol / 1000; // titrant volume in L
  const Vtot = Va + Vb;

  // Moles
  const molesAcid = analyteConc * Va;
  const molesBase = titrantConc * Vb;

  let ph = 7.0;

  if (analyteType === 'strong-acid' && titrantType === 'strong-base') {
    // Strong acid + Strong base
    const excessH = molesAcid - molesBase;
    if (excessH > 0) {
      // Acid in excess
      ph = -Math.log10(excessH / Vtot);
    } else if (excessH < 0) {
      // Base in excess
      const excessOH = -excessH;
      const pOH = -Math.log10(excessOH / Vtot);
      ph = 14 - pOH;
    } else {
      // Equivalence point
      ph = 7.0;
    }
  } else if (analyteType === 'weak-acid' && titrantType === 'strong-base') {
    // Weak acid + Strong base
    const ka = Math.pow(10, -pka);

    if (molesBase === 0) {
      // Before titration starts - weak acid alone
      const ha = analyteConc;
      const h = Math.sqrt(ka * ha);
      ph = -Math.log10(h);
    } else if (molesBase < molesAcid) {
      // Buffer region
      const haRemaining = molesAcid - molesBase;
      const aFormed = molesBase;
      ph = pka + Math.log10(aFormed / haRemaining);
    } else if (molesBase === molesAcid) {
      // Equivalence point - conjugate base
      const aConc = molesAcid / Vtot;
      const kb = kw / ka;
      const oh = Math.sqrt(kb * aConc);
      const pOH = -Math.log10(oh);
      ph = 14 - pOH;
    } else {
      // Excess strong base
      const excessOH = molesBase - molesAcid;
      const pOH = -Math.log10(excessOH / Vtot);
      ph = 14 - pOH;
    }
  } else if (analyteType === 'strong-acid' && titrantType === 'weak-base') {
    // Strong acid + Weak base
    const kb = Math.pow(10, -pkb);
    const ka = kw / kb;

    if (molesBase < molesAcid) {
      // Before equivalence - excess acid
      const excessH = molesAcid - molesBase;
      ph = -Math.log10(excessH / Vtot);
    } else if (molesBase === molesAcid) {
      // Equivalence point - conjugate acid
      const bhConc = molesBase / Vtot;
      const h = Math.sqrt(ka * bhConc);
      ph = -Math.log10(h);
    } else {
      // Excess weak base
      const excessB = molesBase - molesAcid;
      const bConc = excessB / Vtot;
      const oh = Math.sqrt(kb * bConc);
      const pOH = -Math.log10(oh);
      ph = 14 - pOH;
    }
  } else if (analyteType === 'weak-acid' && titrantType === 'weak-base') {
    // Weak acid + Weak base
    const ka = Math.pow(10, -pka);
    const kb = Math.pow(10, -pkb);

    if (molesBase === 0) {
      // Before titration
      const ha = analyteConc;
      const h = Math.sqrt(ka * ha);
      ph = -Math.log10(h);
    } else if (molesBase < molesAcid) {
      // Buffer region
      const haRemaining = molesAcid - molesBase;
      const aFormed = molesBase;
      ph = pka + Math.log10(aFormed / haRemaining);
    } else if (molesBase === molesAcid) {
      // Equivalence point
      ph = 7 + (pka - pkb) / 2;
    } else {
      // Excess weak base
      const excessB = molesBase - molesAcid;
      const bConc = excessB / Vtot;
      const oh = Math.sqrt(kb * bConc);
      const pOH = -Math.log10(oh);
      ph = 14 - pOH;
    }
  }

  return Math.max(0, Math.min(14, ph));
}

// Display results
function displayResults(
  analyteType,
  titrantType,
  analyteConc,
  analyteVol,
  titrantConc,
  equivVolume,
  equivPH,
  dataPoints,
  pka,
  pkb
) {
  // Summary
  const typeNames = {
    'strong-acid': 'Starke Säure',
    'weak-acid': 'Schwache Säure',
    'strong-base': 'Starke Base',
    'weak-base': 'Schwache Base',
  };

  const resultsHtml = `
    <div class="data-row">
      <span class="data-label">Analysenlösung:</span>
      <span class="data-value">${typeNames[analyteType]} (${analyteConc} M, ${analyteVol} mL)</span>
    </div>
    <div class="data-row">
      <span class="data-label">Titrationslösung:</span>
      <span class="data-value">${typeNames[titrantType]} (${titrantConc} M)</span>
    </div>
    <div class="data-row">
      <span class="data-label">Äquivalenzvolumen:</span>
      <span class="data-value value-important">${equivVolume.toFixed(2)} mL</span>
    </div>
    ${
      pka > 0
        ? `
    <div class="data-row">
      <span class="data-label">pKa / pKb:</span>
      <span class="data-value">${pka.toFixed(2)} / ${pkb.toFixed(2)}</span>
    </div>
    `
        : ''
    }
    <div class="data-row">
      <span class="data-label">Empfohlener Indikator:</span>
      <span class="data-value">${getRecommendedIndicator(equivPH)}</span>
    </div>
  `;
  document.getElementById('titration-results').innerHTML = resultsHtml;

  // Equivalence point details
  const equivHtml = `
    <div class="data-row">
      <span class="data-label">Volumen am Äq.-Punkt:</span>
      <span class="data-value value-important">${equivVolume.toFixed(2)} mL</span>
    </div>
    <div class="data-row">
      <span class="data-label">pH am Äq.-Punkt:</span>
      <span class="data-value value-important">${equivPH.toFixed(2)}</span>
    </div>
    <div class="data-row">
      <span class="data-label">pH-Sprung:</span>
      <span class="data-value">${calculatePHJump(dataPoints, equivVolume).toFixed(2)} pH-Einheiten</span>
    </div>
    <hr>
    <div class="data-row">
      <span class="data-label">Pufferbereich:</span>
      <span class="data-value">${pka > 0 ? `${(pka - 1).toFixed(1)} - ${(pka + 1).toFixed(1)}` : 'Nicht anwendbar'}</span>
    </div>
  `;
  document.getElementById('equivalence-point').innerHTML = equivHtml;

  // Draw chart
  drawTitrationChart(dataPoints, equivVolume, equivPH);

  // Data points table
  displayDataPoints(dataPoints);

  showResults();
}

// Calculate pH jump at equivalence point
function calculatePHJump(dataPoints, equivVolume) {
  const equivIndex = dataPoints.findIndex((p) => Math.abs(p.volume - equivVolume) < 0.5);

  if (equivIndex < 2 || equivIndex >= dataPoints.length - 2) {
    return 0;
  }

  const phBefore = dataPoints[equivIndex - 2].ph;
  const phAfter = dataPoints[equivIndex + 2].ph;

  return phAfter - phBefore;
}

// Get recommended indicator
function getRecommendedIndicator(ph) {
  if (ph < 5) {
    return 'Methylorange (3.1-4.4) oder Methylrot (4.4-6.2)';
  } else if (ph < 7) {
    return 'Methylrot (4.4-6.2) oder Bromthymolblau (6.0-7.6)';
  } else if (ph < 9) {
    return 'Bromthymolblau (6.0-7.6) oder Phenolphthalein (8.2-10.0)';
  } else {
    return 'Phenolphthalein (8.2-10.0) oder Thymolphthalein (9.3-10.5)';
  }
}

// Draw titration curve
function drawTitrationChart(dataPoints, equivVolume, equivPH) {
  const ctx = document.getElementById('titration-chart');
  if (!ctx) return;

  // Destroy existing chart
  if (titrationChart) {
    titrationChart.destroy();
  }

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  ctx.innerHTML = '';
  ctx.appendChild(canvas);

  const chartCtx = canvas.getContext('2d');

  titrationChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: dataPoints.map((p) => p.volume.toFixed(1)),
      datasets: [
        {
          label: 'pH-Wert',
          data: dataPoints.map((p) => p.ph),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderWidth: 2,
          pointRadius: dataPoints.map((p) => (Math.abs(p.volume - equivVolume) < 0.5 ? 6 : 2)),
          pointBackgroundColor: dataPoints.map((p) =>
            Math.abs(p.volume - equivVolume) < 0.5 ? 'red' : 'rgb(75, 192, 192)'
          ),
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Äquivalenzpunkt',
          data: dataPoints.map((p) => (Math.abs(p.volume - equivVolume) < 0.5 ? p.ph : null)),
          borderColor: 'red',
          backgroundColor: 'red',
          pointRadius: 8,
          pointStyle: 'triangle',
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: `Titrationkurve (Äquivalenzpunkt: ${equivVolume.toFixed(2)} mL, pH: ${equivPH.toFixed(2)})`,
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `pH: ${context.parsed.y.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Titrationsvolumen (mL)',
          },
          ticks: {
            maxTicksLimit: 15,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'pH-Wert',
          },
          min: 0,
          max: 14,
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    },
  });
}

// Display data points table
function displayDataPoints(dataPoints) {
  const maxRows = Math.min(dataPoints.length, 20);
  const stepSize = Math.ceil(dataPoints.length / maxRows);

  let html =
    '<div class="table-responsive"><table class="table table-striped table-hover table-sm">';
  html += '<thead><tr><th>Volumen (mL)</th><th>pH-Wert</th></tr></thead><tbody>';

  for (let i = 0; i < dataPoints.length; i += stepSize) {
    const point = dataPoints[i];
    html += `<tr><td>${point.volume.toFixed(2)}</td><td>${point.ph.toFixed(3)}</td></tr>`;
  }

  html += '</tbody></table></div>';
  document.getElementById('data-points').innerHTML = html;
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

// Main titration function
function runTitration() {
  try {
    // Get input values
    const analyteType = document.getElementById('analyte-type').value;
    const analyteConc = parseFloat(document.getElementById('analyte-concentration').value);
    const analyteVol = parseFloat(document.getElementById('analyte-volume').value);
    const titrantType = document.getElementById('titrant-type').value;
    const titrantConc = parseFloat(document.getElementById('titrant-concentration').value);
    const titrantStep = parseFloat(document.getElementById('titration-step').value);

    // Get pKa/pKb values if needed
    let pka = 0;
    let pkb = 0;

    if (analyteType === 'weak-acid') {
      pka = parseFloat(document.getElementById('analyte-pka').value);
    }

    if (titrantType === 'weak-base') {
      pkb = parseFloat(document.getElementById('titrant-pkb').value);
    }

    // Validate inputs
    if (isNaN(analyteConc) || isNaN(analyteVol) || isNaN(titrantConc) || isNaN(titrantStep)) {
      showError('Bitte geben Sie gültige numerische Werte ein.');
      return;
    }

    if (analyteConc <= 0 || analyteVol <= 0 || titrantConc <= 0 || titrantStep <= 0) {
      showError('Alle Werte müssen größer als 0 sein.');
      return;
    }

    // Calculate equivalence point volume
    const molesAnalyte = analyteConc * (analyteVol / 1000);
    const equivVolume = (molesAnalyte / titrantConc) * 1000; // mL

    // Generate data points
    const maxVolume = equivVolume * 2; // Go to 2x equivalence point
    const dataPoints = [];

    for (let v = 0; v <= maxVolume; v += titrantStep) {
      const ph = calculatePH(
        analyteType,
        analyteConc,
        analyteVol,
        titrantType,
        titrantConc,
        v,
        pka,
        pkb
      );
      dataPoints.push({ volume: v, ph: ph });
    }

    // Ensure equivalence point is included
    const equivPH = calculatePH(
      analyteType,
      analyteConc,
      analyteVol,
      titrantType,
      titrantConc,
      equivVolume,
      pka,
      pkb
    );
    if (!dataPoints.some((p) => Math.abs(p.volume - equivVolume) < titrantStep / 2)) {
      dataPoints.push({ volume: equivVolume, ph: equivPH });
    }

    // Sort by volume
    dataPoints.sort((a, b) => a.volume - b.volume);

    // Display results
    displayResults(
      analyteType,
      titrantType,
      analyteConc,
      analyteVol,
      titrantConc,
      equivVolume,
      equivPH,
      dataPoints,
      pka,
      pkb
    );
  } catch (error) {
    showError(error.message);
  }
}

// Setup event handlers
document.addEventListener('DOMContentLoaded', function () {
  // Show/hide pKa field based on analyte type
  document.getElementById('analyte-type').addEventListener('change', function () {
    const pkaRow = document.getElementById('analyte-pka-row');
    if (this.value === 'weak-acid') {
      pkaRow.style.display = 'block';
    } else {
      pkaRow.style.display = 'none';
    }
  });

  // Show/hide pKb field based on titrant type
  document.getElementById('titrant-type').addEventListener('change', function () {
    const pkbRow = document.getElementById('titrant-pkb-row');
    if (this.value === 'weak-base') {
      pkbRow.style.display = 'block';
    } else {
      pkbRow.style.display = 'none';
    }
  });

  // Example buttons
  document.querySelectorAll('.example-btn').forEach((button) => {
    button.addEventListener('click', function () {
      document.getElementById('analyte-type').value = this.dataset.analyte;
      document.getElementById('titrant-type').value = this.dataset.titrant;

      if (this.dataset.analyte === 'weak-acid') {
        document.getElementById('analyte-pka-row').style.display = 'block';
        document.getElementById('analyte-pka').value = this.dataset.pka || 4.76;
      } else {
        document.getElementById('analyte-pka-row').style.display = 'none';
      }

      if (this.dataset.titrant === 'weak-base') {
        document.getElementById('titrant-pkb-row').style.display = 'block';
        document.getElementById('titrant-pkb').value = this.dataset.pkb || 4.75;
      } else {
        document.getElementById('titrant-pkb-row').style.display = 'none';
      }

      document.getElementById('analyte-concentration').value = this.dataset.acidConc || 0.1;
      document.getElementById('titrant-concentration').value = this.dataset.baseConc || 0.1;
    });
  });

  // Enable Enter key for inputs
  const inputs = document.querySelectorAll('.form-control');
  inputs.forEach((input) => {
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        runTitration();
      }
    });
  });
});
