/* global saveToHistory */

function loadSTP() {
  document.getElementById('gas-pressure').value = 1;
  document.getElementById('gas-pressure-unit').value = 'atm';
  document.getElementById('gas-volume').value = 22.414;
  document.getElementById('gas-volume-unit').value = 'L';
  document.getElementById('gas-amount').value = 1;
  document.getElementById('gas-amount-unit').value = 'mol';
  document.getElementById('gas-temperature').value = 0;
  document.getElementById('gas-temperature-unit').value = 'C';
  document.getElementById('gas-constant-select').value = '0.08206';
  document.getElementById('gas-calculate-variable').value = 'V';

  convertTemperatureToKelvin();
}

function loadSATP() {
  document.getElementById('gas-pressure').value = 1;
  document.getElementById('gas-pressure-unit').value = 'bar';
  document.getElementById('gas-volume').value = 24.789;
  document.getElementById('gas-volume-unit').value = 'L';
  document.getElementById('gas-amount').value = 1;
  document.getElementById('gas-amount-unit').value = 'mol';
  document.getElementById('gas-temperature').value = 25;
  document.getElementById('gas-temperature-unit').value = 'C';
  document.getElementById('gas-constant-select').value = '0.08314';
  document.getElementById('gas-calculate-variable').value = 'V';

  convertTemperatureToKelvin();
}

function loadGasExample() {
  document.getElementById('gas-pressure').value = 2.5;
  document.getElementById('gas-pressure-unit').value = 'atm';
  document.getElementById('gas-volume').value = 10;
  document.getElementById('gas-volume-unit').value = 'L';
  document.getElementById('gas-temperature').value = 25;
  document.getElementById('gas-temperature-unit').value = 'C';
  document.getElementById('gas-constant-select').value = '0.08206';
  document.getElementById('gas-calculate-variable').value = 'n';

  convertTemperatureToKelvin();
}

function convertTemperatureToKelvin() {
  const temp = parseFloat(document.getElementById('gas-temperature').value);
  const unit = document.getElementById('gas-temperature-unit').value;
  const display = document.getElementById('kelvin-value');

  if (isNaN(temp)) {
    display.textContent = '-';
    return;
  }

  let kelvin;
  switch (unit) {
    case 'K':
      kelvin = temp;
      break;
    case 'C':
      kelvin = temp + 273.15;
      break;
    case 'F':
      kelvin = ((temp - 32) * 5) / 9 + 273.15;
      break;
  }

  display.textContent = kelvin.toFixed(2);
}

function updateGasInputs() {
  const variable = document.getElementById('gas-calculate-variable').value;
  const pressureInput = document.getElementById('gas-pressure');
  const volumeInput = document.getElementById('gas-volume');
  const amountInput = document.getElementById('gas-amount');
  const temperatureInput = document.getElementById('gas-temperature');

  pressureInput.disabled = false;
  volumeInput.disabled = false;
  amountInput.disabled = false;
  temperatureInput.disabled = false;

  switch (variable) {
    case 'P':
      pressureInput.disabled = true;
      pressureInput.placeholder = 'Wird berechnet...';
      volumeInput.placeholder = 'z.B. 22.4';
      amountInput.placeholder = 'z.B. 1';
      temperatureInput.placeholder = 'z.B. 273.15';
      break;
    case 'V':
      volumeInput.disabled = true;
      volumeInput.placeholder = 'Wird berechnet...';
      pressureInput.placeholder = 'z.B. 1';
      amountInput.placeholder = 'z.B. 1';
      temperatureInput.placeholder = 'z.B. 273.15';
      break;
    case 'n':
      amountInput.disabled = true;
      amountInput.placeholder = 'Wird berechnet...';
      pressureInput.placeholder = 'z.B. 1';
      volumeInput.placeholder = 'z.B. 22.4';
      temperatureInput.placeholder = 'z.B. 273.15';
      break;
    case 'T':
      temperatureInput.disabled = true;
      temperatureInput.placeholder = 'Wird berechnet...';
      pressureInput.placeholder = 'z.B. 1';
      volumeInput.placeholder = 'z.B. 22.4';
      amountInput.placeholder = 'z.B. 1';
      break;
  }

  if (variable === 'P') {
    pressureInput.value = '';
  }
  if (variable === 'V') {
    volumeInput.value = '';
  }
  if (variable === 'n') {
    amountInput.value = '';
  }
  if (variable === 'T') {
    temperatureInput.value = '';
  }
}

function convertPressureToAtm(pressure, unit) {
  switch (unit) {
    case 'atm':
      return pressure;
    case 'bar':
      return pressure * 0.986923;
    case 'Pa':
      return pressure / 101325;
    case 'kPa':
      return pressure / 101.325;
    case 'Torr':
      return pressure / 760;
    case 'mmHg':
      return pressure / 760;
    default:
      return pressure;
  }
}

function convertVolumeToLiters(volume, unit) {
  switch (unit) {
    case 'L':
      return volume;
    case 'mL':
      return volume / 1000;
    case 'm3':
      return volume * 1000;
    case 'cm3':
      return volume / 1000;
    default:
      return volume;
  }
}

function convertAmountToMoles(amount, unit) {
  switch (unit) {
    case 'mol':
      return amount;
    case 'mmol':
      return amount / 1000;
    default:
      return amount;
  }
}

function convertToKelvin(temp, unit) {
  switch (unit) {
    case 'K':
      return temp;
    case 'C':
      return temp + 273.15;
    case 'F':
      return ((temp - 32) * 5) / 9 + 273.15;
    default:
      return temp;
  }
}

/**
 * The R-select implies a unit system (pressure/volume units must match R).
 * Returns { pressure, volume, rLabel } for the selected R value.
 */
function getGasTargetUnits(R) {
  switch (R) {
    case 8.314:
      return { pressure: 'Pa', volume: 'm3', rLabel: '8.314 J/(mol·K)' };
    case 0.08314:
      return { pressure: 'bar', volume: 'L', rLabel: '0.08314 L·bar/(mol·K)' };
    case 62.364:
      return { pressure: 'Torr', volume: 'L', rLabel: '62.364 L·Torr/(mol·K)' };
    case 0.000082057:
      return { pressure: 'atm', volume: 'm3', rLabel: '8.2057×10⁻⁵ m³·atm/(mol·K)' };
    default:
      return { pressure: 'atm', volume: 'L', rLabel: '0.08206 L·atm/(mol·K)' };
  }
}

function atmToUnit(atm, unit) {
  switch (unit) {
    case 'Pa':
      return atm * 101325;
    case 'kPa':
      return atm * 101.325;
    case 'bar':
      return atm * 1.01325;
    case 'Torr':
    case 'mmHg':
      return atm * 760;
    default:
      return atm; // atm
  }
}

function convertPressureTo(pressure, fromUnit, toUnit) {
  const atm = convertPressureToAtm(pressure, fromUnit);
  return atmToUnit(atm, toUnit);
}

function convertVolumeTo(volume, fromUnit, toUnit) {
  const liters = convertVolumeToLiters(volume, fromUnit);
  return toUnit === 'm3' ? liters / 1000 : liters;
}

function calculateGasLaw() {
  const calculateVariable = document.getElementById('gas-calculate-variable').value;
  const R = parseFloat(document.getElementById('gas-constant-select').value);

  const pressureValue = parseFloat(document.getElementById('gas-pressure').value);
  const pressureUnit = document.getElementById('gas-pressure-unit').value;
  const volumeValue = parseFloat(document.getElementById('gas-volume').value);
  const volumeUnit = document.getElementById('gas-volume-unit').value;
  const amountValue = parseFloat(document.getElementById('gas-amount').value);
  const amountUnit = document.getElementById('gas-amount-unit').value;
  const temperatureValue = parseFloat(document.getElementById('gas-temperature').value);
  const temperatureUnit = document.getElementById('gas-temperature-unit').value;

  let P_c, V_c, n_mol, T_K;
  const targetUnits = getGasTargetUnits(R);

  try {
    P_c =
      calculateVariable !== 'P'
        ? convertPressureTo(pressureValue, pressureUnit, targetUnits.pressure)
        : null;
    V_c =
      calculateVariable !== 'V'
        ? convertVolumeTo(volumeValue, volumeUnit, targetUnits.volume)
        : null;
    n_mol = calculateVariable !== 'n' ? convertAmountToMoles(amountValue, amountUnit) : null;
    T_K = calculateVariable !== 'T' ? convertToKelvin(temperatureValue, temperatureUnit) : null;

    if (calculateVariable !== 'P' && (isNaN(P_c) || P_c <= 0)) {
      throw new Error('Ung\u00fcltiger Druckwert');
    }
    if (calculateVariable !== 'V' && (isNaN(V_c) || V_c <= 0)) {
      throw new Error('Ung\u00fcltiges Volumenwert');
    }
    if (calculateVariable !== 'n' && (isNaN(n_mol) || n_mol <= 0)) {
      throw new Error('Ung\u00fcltige Stoffmenge');
    }
    if (calculateVariable !== 'T' && (isNaN(T_K) || T_K <= 0)) {
      throw new Error('Ung\u00fcltige Temperatur (muss > 0 K sein)');
    }

    let result;
    let resultUnit;

    switch (calculateVariable) {
      case 'n':
        result = (P_c * V_c) / (R * T_K);
        resultUnit = 'mol';
        break;
      case 'P':
        result = (n_mol * R * T_K) / V_c;
        resultUnit = targetUnits.pressure;
        break;
      case 'V':
        result = (n_mol * R * T_K) / P_c;
        resultUnit = targetUnits.volume;
        break;
      case 'T':
        result = (P_c * V_c) / (n_mol * R);
        resultUnit = 'K';
        break;
    }

    displayGasResult(calculateVariable, result, resultUnit, P_c, V_c, n_mol, T_K, R, targetUnits);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function displayGasResult(variable, result, unit, P, V, n, T, R, targetUnits) {
  targetUnits = targetUnits || getGasTargetUnits(R);
  const resultDiv = document.getElementById('gas-result');
  const contentDiv = document.getElementById('gas-result-content');

  const variableNames = {
    P: 'Druck',
    V: 'Volumen',
    n: 'Stoffmenge',
    T: 'Temperatur',
  };

  let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';

  html +=
    '<div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; text-align: center;">';
  html += '<h4 style="color: #1976D2; margin-top: 0;">Ideales Gasgesetz</h4>';
  html += '<p style="font-size: 24px; font-weight: bold; color: #0D47A1;">PV = nRT</p>';

  let formulaText = '';
  switch (variable) {
    case 'n':
      formulaText =
        'n = PV \u00f7 RT = ' +
        P.toFixed(4) +
        ' \u00d7 ' +
        V.toFixed(4) +
        ' \u00f7 (' +
        R +
        ' \u00d7 ' +
        T.toFixed(2) +
        ')';
      break;
    case 'P':
      formulaText =
        'P = nRT \u00f7 V = ' +
        n.toFixed(4) +
        ' \u00d7 ' +
        R +
        ' \u00d7 ' +
        T.toFixed(2) +
        ' \u00f7 ' +
        V.toFixed(4);
      break;
    case 'V':
      formulaText =
        'V = nRT \u00f7 P = ' +
        n.toFixed(4) +
        ' \u00d7 ' +
        R +
        ' \u00d7 ' +
        T.toFixed(2) +
        ' \u00f7 ' +
        P.toFixed(4);
      break;
    case 'T':
      formulaText =
        'T = PV \u00f7 nR = ' +
        P.toFixed(4) +
        ' \u00d7 ' +
        V.toFixed(4) +
        ' \u00f7 (' +
        n.toFixed(4) +
        ' \u00d7 ' +
        R +
        ')';
      break;
  }
  html += '<p style="font-size: 16px; color: #1976D2;">' + formulaText + '</p>';
  html += '</div>';

  html += '<div style="margin-bottom: 20px;">';
  html += '<h4>Bekannte Werte:</h4>';
  html += '<table class="table table-bordered" style="background: white;">';
  if (variable !== 'P') {
    html +=
      '<tr><td><strong>Druck (P)</strong></td><td>' +
      P.toFixed(4) +
      ' ' +
      targetUnits.pressure +
      '</td></tr>';
  }
  if (variable !== 'V') {
    html +=
      '<tr><td><strong>Volumen (V)</strong></td><td>' +
      V.toFixed(4) +
      ' ' +
      targetUnits.volume +
      '</td></tr>';
  }
  if (variable !== 'n') {
    html += '<tr><td><strong>Stoffmenge (n)</strong></td><td>' + n.toFixed(4) + ' mol</td></tr>';
  }
  if (variable !== 'T') {
    html +=
      '<tr><td><strong>Temperatur (T)</strong></td><td>' +
      T.toFixed(2) +
      ' K (' +
      convertFromKelvin(T).toFixed(1) +
      '\u00b0C)</td></tr>';
  }
  html += '<tr><td><strong>Gaskonstante (R)</strong></td><td>' + targetUnits.rLabel + '</td></tr>';
  html += '</table>';
  html += '</div>';

  html +=
    '<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center;">';
  html += '<h3 style="margin-top: 0;">' + variableNames[variable] + '</h3>';
  html +=
    '<p style="font-size: 32px; font-weight: bold;">' + result.toFixed(4) + ' ' + unit + '</p>';

  if (variable === 'T') {
    html += '<p style="font-size: 18px;">(' + convertFromKelvin(result).toFixed(1) + '\u00b0C)</p>';
  }

  html += '<div style="margin-top: 20px; text-align: left;">';
  if (variable === 'n') {
    const molarVolume = V / result;
    html +=
      '<p><strong>Molares Volumen:</strong> ' +
      molarVolume.toFixed(4) +
      ' ' +
      targetUnits.volume +
      '/mol</p>';
    const massExample = result * 2.016;
    html += '<p><strong>Beispiel (H\u2082):</strong> ' + massExample.toFixed(4) + ' g</p>';
  }
  if (variable === 'V' && n > 0) {
    const molarVolumeV = result / n;
    html +=
      '<p><strong>Molares Volumen:</strong> ' +
      molarVolumeV.toFixed(4) +
      ' ' +
      targetUnits.volume +
      '/mol</p>';
  }
  html += '</div>';
  html += '</div>';

  html += '</div>';

  contentDiv.innerHTML = html;
  resultDiv.style.display = 'block';

  const historyData = variableNames[variable] + ': ' + result.toFixed(4) + ' ' + unit;
  saveToHistory('Gasgesetz (PV=nRT)', historyData);
}

function convertFromKelvin(kelvin) {
  return kelvin - 273.15;
}

function exportGasToPDF() {
  const jsPDF = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('St\u00f6chiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Ideales Gasgesetz (PV=nRT)', 105, 35, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  let y = 60;

  const calculateVariable = document.getElementById('gas-calculate-variable').value;
  const R = document.getElementById('gas-constant-select').value;
  const pressure = document.getElementById('gas-pressure').value;
  const pressureUnit = document.getElementById('gas-pressure-unit').value;
  const volume = document.getElementById('gas-volume').value;
  const volumeUnit = document.getElementById('gas-volume-unit').value;
  const amount = document.getElementById('gas-amount').value;
  const amountUnit = document.getElementById('gas-amount-unit').value;
  const temperature = document.getElementById('gas-temperature').value;
  const temperatureUnit = document.getElementById('gas-temperature-unit').value;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Berechnung: ' + calculateVariable, 20, y);
  y += 15;

  doc.setFontSize(12);
  doc.text('Eingabewerte:', 20, y);
  y += 10;

  if (calculateVariable !== 'P') {
    doc.text('Druck: ' + pressure + ' ' + pressureUnit, 25, y);
    y += 8;
  }
  if (calculateVariable !== 'V') {
    doc.text('Volumen: ' + volume + ' ' + volumeUnit, 25, y);
    y += 8;
  }
  if (calculateVariable !== 'n') {
    doc.text('Stoffmenge: ' + amount + ' ' + amountUnit, 25, y);
    y += 8;
  }
  if (calculateVariable !== 'T') {
    doc.text('Temperatur: ' + temperature + ' ' + temperatureUnit, 25, y);
    y += 8;
  }
  doc.text('Gaskonstante: R = ' + R, 25, y);
  y += 15;

  doc.setFontSize(14);
  doc.setTextColor(0, 123, 255);
  doc.text('Formel: PV = nRT', 20, y);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Datum: ' + new Date().toLocaleDateString('de-DE'), 20, 285);
  doc.text('chemie-lernen.org', 105, 285, { align: 'center' });

  doc.save('gasgesetz-' + calculateVariable + '-' + Date.now() + '.pdf');
}

document.addEventListener('DOMContentLoaded', () => {
  updateGasInputs();
  const tempInput = document.getElementById('gas-temperature');
  const tempUnit = document.getElementById('gas-temperature-unit');

  if (tempInput && tempUnit) {
    tempInput.addEventListener('input', convertTemperatureToKelvin);
    tempUnit.addEventListener('change', convertTemperatureToKelvin);
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertPressureToAtm,
    convertVolumeToLiters,
    convertAmountToMoles,
    convertToKelvin,
    convertFromKelvin,
  };
}

// Export pure functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertPressureToAtm,
    convertVolumeToLiters,
    convertAmountToMoles,
    convertToKelvin,
    convertFromKelvin,
  };
}
