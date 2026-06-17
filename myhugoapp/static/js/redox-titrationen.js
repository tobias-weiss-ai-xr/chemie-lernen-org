/* global Chart */
/* eslint-disable no-unused-vars */

let permanganatChart = null;
let cerChart = null;

function simulatePermanganatTitration() {
  const analyteConc = parseFloat(document.getElementById('permanganat-analyte-conc').value);
  const analyteVolume = parseFloat(document.getElementById('permanganat-analyte-volume').value);
  const titrantConc = parseFloat(document.getElementById('permanganat-titrant-conc').value);
  const stepSize = parseFloat(document.getElementById('permanganat-stepsize').value);
  const targetAnalyte = document.getElementById('permanganat-target-analyte').value;

  if (isNaN(analyteConc) || isNaN(analyteVolume) || isNaN(titrantConc) || isNaN(stepSize)) {
    showToast('Bitte geben Sie gültige Werte ein.', 'error');
    return;
  }

  const n_KMnO4 = 5;
  let n_analyte;

  switch(targetAnalyte) {
    case 'oxalate':
      n_analyte = 2;
      break;
    case 'peroxide':
      n_analyte = 2;
      break;
    case 'iron(II)':
      n_analyte = 1;
      break;
    case 'nitrite':
      n_analyte = 2;
      break;
    default:
      n_analyte = 2;
  }

  const equivVolume = (n_analyte * analyteConc * analyteVolume) / (n_KMnO4 * titrantConc);

  const dataPoints = [];
  const totalVolume = analyteVolume * 3;
  let currentVolume = 0;

  while (currentVolume <= totalVolume) {
    const volumeTitrant = currentVolume > 0 ? currentVolume : 0;

    let potential;
    if (volumeTitrant < equivVolume / 3) {
      potential = 1.2 - (volumeTitrant / (equivVolume / 3)) * 0.6;
    } else {
      potential = 0.6 - ((volumeTitrant - equivVolume / 3) / (equivVolume * 0.67)) * 0.5 + 0.3;

      if (volumeTitrant > equivVolume * 1.1) {
        const excessBeyond = volumeTitrant - equivVolume * 1.1;
        potential += excessBeyond * 0.05;
      }
    }

    dataPoints.push({
      x: volumeTitrant,
      y: potential
    });

    currentVolume += stepSize;
  }

  const derivativeAtEquivalence = 1250;
  const colorDesc = 'violett → farblos (bei Äquivalenz)';

  document.getElementById('permanganat-result').style.display = 'block';
  document.getElementById('permanganat-equiv-vol').textContent = equivVolume.toFixed(1) + ' mL';
  document.getElementById('permanganat-color').textContent = colorDesc;
  document.getElementById('permanganat-derivative').textContent = 'dE/dV ≈ ' + derivativeAtEquivalence;
  document.getElementById('permanganat-details').innerHTML = `
    <p><strong>Reaktionsverlauf:</strong></p>
    <ul>
      <li>Vor Äquivalenz: <span class="text-info">KMnO₄⁻ violett (Reduktionsmittel im Überschuss)</span></li>
      <li>Bei Äquivalenz: <span class="text-success">farblos (Mn²⁺ gebildet)</span></li>
      <li>Nach Äquivalenz: <span class="text-warning">leichte Rosa-Färbung durch KMnO₄-Überschuss</span></li>
    </ul>
  `;

  plotPermanganatChart(dataPoints, equivVolume);
}

function plotPermanganatChart(dataPoints, equivVolume) {
  const ctx = document.getElementById('permanganat-plot').getContext('2d');

  if (permanganatChart) {
    permanganatChart.destroy();
  }

  permanganatChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map(p => p.x.toFixed(1)),
      datasets: [{
        label: 'Potential (V)',
        data: dataPoints.map(p => p.y.toFixed(3)),
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Zugegebenes Volumen (mL)'
          },
          grid: {
            color: '#95a5a6'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Potential E (V)'
          },
          grid: {
            color: '#95a5a6'
          },
          suggestedMax: 1.5,
          suggestedMin: 0
        }
      },
      plugins: {
        legend: {
          display: true
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const point = dataPoints[elements[0].index];
          document.getElementById('permanganat-equiv-vol').textContent =
            `x=${point.x.toFixed(1)} mL, y=${point.y.toFixed(3)} V`;
        }
      }
    }
  });
}

function updatePermanganatSetup() {
}

function simulateCerS4Titration() {
  const analyteConc = parseFloat(document.getElementById('cers4-analyte-conc').value);
  const analyteVolume = parseFloat(document.getElementById('cers4-analyte-volume').value);
  const strength = document.getElementById('cers4-strength').value;
  let titrantConc, stepSize;

  if (strength === '0.01') {
    titrantConc = 0.01;
  } else if (strength === '0.001') {
    titrantConc = 0.001;
  } else {
    titrantConc = 0.001;
  }

  stepSize = parseFloat(document.getElementById('cers4-stepsize').value);

  const E0 = 1.44;

  const equivVolume = (analyteConc * analyteVolume) / titrantConc;

  const dataPoints = [];
  const totalVolume = analyteVolume * 2;
  let currentVolume = 0;

  while (currentVolume <= totalVolume) {
    const volumeTitrant = currentVolume > 0 ? currentVolume : 0;
    const totalVol = analyteVolume + volumeTitrant;

    let E;
    const fraction = volumeTitrant / equivVolume;

    if (fraction < 0.99) {
      const ratio = (equivVolume - volumeTitrant) / volumeTitrant;
      E = E0 + 0.0592 * Math.log10(ratio);
    } else if (fraction > 1.01) {
      const ratio = (volumeTitrant - equivVolume) / equivVolume;
      E = E0 - 0.0592 * Math.log10(ratio);
    } else {
      E = E0;
    }

    dataPoints.push({
      x: volumeTitrant,
      y: Math.max(0.4, E)
    });

    currentVolume += stepSize;
  }

  document.getElementById('cer-result').style.display = 'block';
  document.getElementById('cers4-equiv-vol').textContent = equivVolume.toFixed(2) + ' mL';
  document.getElementById('cers4-potential').textContent = E0.toFixed(3) + ' V';

  document.getElementById('cers4-first-derivative').innerHTML = `
    <p>dE/dV erreicht Maximum bei Äquivalenz (Scharfer Sprung)</p>
  `;
  document.getElementById('cers4-second-derivative').innerHTML = `
    <p>d²E/dV² = 0 an Äquivalenzpunkt (Inflektionspunkt)</p>
  `;
  document.getElementById('cers4-peak-assignment').innerHTML = `
    <p><strong>Ce⁴⁺/Ce³⁺:</strong> Potentiometrischer Standardstandard (scharfer Sprung)</p>
  `;

  plotCerChart(dataPoints, equivVolume);
}

function plotCerChart(dataPoints, equivVolume) {
  const ctx = document.getElementById('cer-plot').getContext('2d');

  if (cerChart) {
    cerChart.destroy();
  }

  cerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map(p => p.x.toFixed(2)),
      datasets: [{
        label: 'Potential E (V)',
        data: dataPoints.map(p => p.y.toFixed(4)),
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        borderWidth: 2,
        tension: 0.0,
        pointRadius: 1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Zugegebenes Volumen (mL)'
          },
          grid: {
            color: '#95a5a6'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Potential E (V)'
          },
          grid: {
            color: '#95a5a6'
          },
          suggestedMax: 2.0,
          suggestedMin: 0.4
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

function simulateIodThiosulfat() {
  const sampleVol = parseFloat(document.getElementById('iod-thio-sample-vol').value);
  const kio3Conc = parseFloat(document.getElementById('iod-thio-kio3-cn').value);
  const thioConc = parseFloat(document.getElementById('iod-thio-concentration').value);

  if (isNaN(sampleVol) || isNaN(kio3Conc) || isNaN(thioConc)) {
    showToast('Bitte geben Sie gültige Werte ein.', 'error');
    return;
  }

  document.getElementById('iod-thio-result').style.display = 'block';
  document.getElementById('iod-thio-details').innerHTML = `
    <p><strong>Iod-Freisetzung:</strong> 5I⁻ + IO₃⁻ + 6H⁺ → 3I₂ + 3H₂O</p>
    <p><strong>n(KIO₃):</strong> ${(kio3Conc * sampleVol / 1000).toFixed(6)} mol</p>
    <p><strong>n(I₂) (freigesetzt):</strong> ${(3 * kio3Conc * sampleVol / 1000).toFixed(6)} mol</p>
    <p><strong>Verbrauch S₂O₃²⁻ bis Äquivalenz:</strong> ${(6 * kio3Conc * sampleVol / thioConc).toFixed(2)} mL</p>
    <p><strong>Stöchiometrie:</strong> 1 KIO₃ : 3 I₂ : 6 S₂O₃²⁻</p>
    <p><strong>Farbwechsel:</strong> Iod-Stärke (tiefblau) → farblos am Äquivalenzpunkt</p>
  `;
}

function updateCerS4Setup() {
}

let potentialChart = null;

function updatePotentiometrySetup() {
  const pair = document.getElementById('potentiometry-redox-pair').value;
}

function simulatePotentiometricTitration() {
  const analyteConc = parseFloat(document.getElementById('potentiometry-analyte-conc').value);
  const analyteVolume = parseFloat(document.getElementById('potentiometry-analyte-volume').value);
  const titrantConc = parseFloat(document.getElementById('potentiometry-titrant-conc').value);
  const stepSize = parseFloat(document.getElementById('potentiometry-stepsize').value);
  const redoxPair = document.getElementById('potentiometry-redox-pair').value;

  const potentials = {
    'ce': { E0: 1.44, n: 1 },
    'fe2+': { E0: 0.77, n: 1 },
    'cr2+/cr3+': { E0: 0.41, n: 1 },
    'ag/ag+': { E0: 0.80, n: 1 },
    'i2/i-': { E0: 0.54, n: 2 }
  };

  const { E0, n } = potentials[redoxPair];
  const equivVolume = (analyteConc * analyteVolume) / titrantConc;

  const dataPoints = [];
  const totalVolume = analyteVolume * 3;
  let currentVolume = 0;

  while (currentVolume <= totalVolume) {
    const volumeTitrant = currentVolume > 0 ? currentVolume : 0;
    const totalVol = analyteVolume + volumeTitrant;

    if (volumeTitrant === 0) {
      dataPoints.push({ x: 0, y: E0 });
    } else if (totalVol < equivVolume) {
      const ratio = (equivVolume - volumeTitrant) / volumeTitrant;
      const E = E0 + 0.0592 * Math.log10(ratio / n);
      dataPoints.push({ x: volumeTitrant, y: Math.max(0, E) });
    } else if (Math.abs(totalVol - equivVolume) < 0.1) {
      dataPoints.push({ x: volumeTitrant, y: E0 });
    } else {
      const ratio = (volumeTitrant - equivVolume) / equivVolume;
      const E = E0 - 0.0592 * Math.log10(ratio / n);
      dataPoints.push({ x: volumeTitrant, y: Math.max(0, E) });
    }

    currentVolume += stepSize;
  }

  plotPotentialChart(dataPoints, equivVolume, E0, n);
}

function plotPotentialChart(dataPoints, equivVolume, E0, n) {
  const ctx = document.getElementById('potentiometry-plot').getContext('2d');

  if (potentialChart) {
    potentialChart.destroy();
  }

  potentialChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map(p => p.x.toFixed(1)),
      datasets: [{
        label: 'Potential E (V)',
        data: dataPoints.map(p => p.y.toFixed(4)),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Zugegebenes Volumen (mL)'
          },
          grid: {
            color: '#95a5a6'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Potential E (V)'
          },
          grid: {
            color: '#95a5a6'
          },
          suggestedMax: 1.8,
          suggestedMin: 0
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });

  const sharpness = E0 > 1.0 ? 'scharf' : 'mittel';

  document.getElementById('potentiometry-result').style.display = 'block';
  document.getElementById('potentiometry-analysis').innerHTML = `
    <p><strong>Standardpotential:</strong> E° = ${E0.toFixed(3)} V</p>
    <p><strong>Elektronenübertragung:</strong> n = ${n}</p>
    <p><strong>Äquivalenzvolumen:</strong> V<sub>Äq</sub> = ${equivVolume.toFixed(2)} mL</p>
    <p><strong>Schärfe des Sprunges:</strong> ${sharpness}</p>
  `;
}

function animatePermanganatSwap() {
  const tube = document.getElementById('permanganat-tube-color');
  const from = { r: 137, g: 43, b: 66 };
  const to = { r: 255, g: 255, b: 255 };

  let step = 0;
  const steps = 30;

  const interval = setInterval(() => {
    step++;
    const r = Math.floor(from.r + (to.r - from.r) * (step / steps));
    const g = Math.floor(from.g + (to.g - from.g) * (step / steps));
    const b = Math.floor(from.b + (to.b - from.b) * (step / steps));

    tube.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

    if (step >= steps) {
      clearInterval(interval);
    }
  }, 50);
}

function formatNumber(value, decimals = 3) {
  return value.toFixed(decimals);
}