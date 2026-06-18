/* global saveToHistory */

let stepCounter = 0;

function addReactionStep() {
  stepCounter++;
  const container = document.getElementById('reaction-steps-container');

  const stepDiv = document.createElement('div');
  stepDiv.className = 'reaction-step';
  stepDiv.id = 'step-' + stepCounter;
  stepDiv.style.cssText = 'margin-bottom: 20px;';

  stepDiv.innerHTML =
    '<div class="well" style="background: #fff3e0; border: 2px solid #FF9800;">' +
      '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">' +
        '<h4 style="color: #E65100; margin: 0;">' +
          '<i class="fa fa-step-forward"></i> Schritt ' + stepCounter +
        '</h4>' +
        '<button class="btn btn-sm btn-danger" onclick="removeStep(' + stepCounter + ')">' +
          '<i class="fa fa-times"></i> Entfernen' +
        '</button>' +
      '</div>' +

      '<div class="row">' +
        '<div class="col-md-3">' +
          '<div class="form-group">' +
            '<label>Koeffizient Edukt:</label>' +
            '<input type="number" class="form-control step-coeff-r" id="step-' + stepCounter + '-coeff-r" value="1" step="any" min="0">' +
          '</div>' +
        '</div>' +
        '<div class="col-md-3">' +
          '<div class="form-group">' +
            '<label>Koeffizient Produkt:</label>' +
            '<input type="number" class="form-control step-coeff-p" id="step-' + stepCounter + '-coeff-p" value="1" step="any" min="0">' +
          '</div>' +
        '</div>' +
        '<div class="col-md-3">' +
          '<div class="form-group">' +
            '<label>Molare Masse Produkt (g/mol):</label>' +
            '<input type="number" class="form-control step-molar-mass" id="step-' + stepCounter + '-molar-mass" step="any" placeholder="Optional">' +
          '</div>' +
        '</div>' +
        '<div class="col-md-3">' +
          '<div class="form-group">' +
            '<label>Produkt-Verbindung:</label>' +
            '<input type="text" class="form-control step-product" id="step-' + stepCounter + '-product" placeholder="z.B. FeO">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="form-group">' +
        '<label>Reaktionsgleichung (optional, zur Anzeige):</label>' +
        '<input type="text" class="form-control step-equation" id="step-' + stepCounter + '-equation" placeholder="z.B. 2Fe + O2 \u2192 2FeO">' +
      '</div>' +
    '</div>';

  container.appendChild(stepDiv);

  updateStepNumbers();
}


function removeStep(stepId) {
  const stepElement = document.getElementById('step-' + stepId);
  if (stepElement) {
    stepElement.remove();
    updateStepNumbers();
  }
}

function updateStepNumbers() {
  const steps = document.querySelectorAll('.reaction-step');
  steps.forEach((step, index) => {
    const titleElement = step.querySelector('h4');
    if (titleElement) {
      titleElement.innerHTML = '<i class="fa fa-step-forward"></i> Schritt ' + (index + 1);
    }
  });
}

function clearAllSteps() {
  if (confirm('M\u00f6chten Sie wirklich alle Reaktionsschritte l\u00f6schen?')) {
    document.getElementById('reaction-steps-container').innerHTML = '';
    stepCounter = 0;
    document.getElementById('multistep-result').style.display = 'none';
  }
}


function loadMultiStepExample() {
  clearAllSteps();

  document.getElementById('initial-amount').value = 2;
  document.getElementById('initial-molar-mass').value = 55.845;
  document.getElementById('initial-compound').value = 'Fe';

  addReactionStep();
  document.getElementById('step-1-coeff-r').value = 2;
  document.getElementById('step-1-coeff-p').value = 2;
  document.getElementById('step-1-molar-mass').value = 71.844;
  document.getElementById('step-1-product').value = 'FeO';
  document.getElementById('step-1-equation').value = '2Fe + O2 \u2192 2FeO';

  addReactionStep();
  document.getElementById('step-2-coeff-r').value = 2;
  document.getElementById('step-2-coeff-p').value = 1;
  document.getElementById('step-2-molar-mass').value = 159.688;
  document.getElementById('step-2-product').value = 'Fe2O3';
  document.getElementById('step-2-equation').value = '4FeO + O2 \u2192 2Fe2O3';

  updateInitialMass();
}

function updateInitialMass() {
  const amount = parseFloat(document.getElementById('initial-amount').value);
  const molarMass = parseFloat(document.getElementById('initial-molar-mass').value);
  const display = document.getElementById('initial-mass-display');
  const valueSpan = document.getElementById('initial-mass-value');

  if (!isNaN(amount) && !isNaN(molarMass) && molarMass > 0) {
    const mass = amount * molarMass;
    valueSpan.textContent = mass.toFixed(4);
    display.style.display = 'block';
  } else {
    display.style.display = 'none';
  }
}


function calculateMultiStepPure(initialAmount, steps) {
  if (isNaN(initialAmount) || initialAmount <= 0) {
    throw new Error('Bitte geben Sie eine gültige Stoffmenge für den Ausgangsstoff ein.');
  }

  if (steps.length === 0) {
    throw new Error('Bitte fügen Sie mindestens einen Reaktionsschritt hinzu.');
  }

  var currentAmount = initialAmount;
  var results = [];

  steps.forEach(function (step, index) {
    var coeffR = step.coeffR;
    var coeffP = step.coeffP;
    var molarMass = step.molarMass;
    var product = step.product || 'Produkt ' + (index + 1);
    var equation = step.equation || '';

    if (isNaN(coeffR) || isNaN(coeffP) || coeffR <= 0 || coeffP <= 0) {
      throw new Error('Fehler in Schritt ' + (index + 1) + ': Ungültige Koeffizienten');
    }

    var productAmount = currentAmount * (coeffP / coeffR);

    var productMass = null;
    if (!isNaN(molarMass) && molarMass > 0) {
      productMass = productAmount * molarMass;
    }

    results.push({
      stepNumber: index + 1,
      reactantAmount: currentAmount,
      coeffR: coeffR,
      coeffP: coeffP,
      productAmount: productAmount,
      molarMass: molarMass,
      productMass: productMass,
      product: product,
      equation: equation,
    });

    currentAmount = productAmount;
  });

  var finalResult = results[results.length - 1];
  var overallYield = (finalResult.productAmount / initialAmount) * 100;

  return { results: results, overallYield: overallYield };
}

function calculateMultiStep() {
  const initialAmount = parseFloat(document.getElementById('initial-amount').value);
  const initialMolarMass = parseFloat(document.getElementById('initial-molar-mass').value);
  const initialCompound = document.getElementById('initial-compound').value || 'Ausgangsstoff';

  if (isNaN(initialAmount) || initialAmount <= 0) {
    showToast('Bitte geben Sie eine g\u00fcltige Stoffmenge f\u00fcr den Ausgangsstoff ein.', 'error');
    return;
  }

  const steps = [];
  const stepElements = document.querySelectorAll('.reaction-step');

  if (stepElements.length === 0) {
    showToast('Bitte f\u00fcgen Sie mindestens einen Reaktionsschritt hinzu.', 'error');
    return;
  }

  let currentAmount = initialAmount;
  const results = [];
  let hasError = false;

  stepElements.forEach((stepEl, index) => {
    const coeffR = parseFloat(stepEl.querySelector('.step-coeff-r').value);
    const coeffP = parseFloat(stepEl.querySelector('.step-coeff-p').value);
    const molarMass = parseFloat(stepEl.querySelector('.step-molar-mass').value);
    const product = stepEl.querySelector('.step-product').value || 'Produkt ' + (index + 1);
    const equation = stepEl.querySelector('.step-equation').value || '';

    if (isNaN(coeffR) || isNaN(coeffP) || coeffR <= 0 || coeffP <= 0) {
      showToast('Fehler in Schritt ' + (index + 1) + ': Ung\u00fcltige Koeffizienten', 'error');
      hasError = true;
      return;
    }

    const productAmount = currentAmount * (coeffP / coeffR);

    let productMass = null;
    if (!isNaN(molarMass) && molarMass > 0) {
      productMass = productAmount * molarMass;
    }

    results.push({
      stepNumber: index + 1,
      reactantAmount: currentAmount,
      coeffR: coeffR,
      coeffP: coeffP,
      productAmount: productAmount,
      molarMass: molarMass,
      productMass: productMass,
      product: product,
      equation: equation
    });

    currentAmount = productAmount;
  });

  if (hasError) {
    return;
  }

  displayMultiStepResults(initialAmount, initialMolarMass, initialCompound, results);
}

function displayMultiStepResults(initialAmount, initialMolarMass, initialCompound, results) {
  const resultDiv = document.getElementById('multistep-result');
  const contentDiv = document.getElementById('multistep-results-content');

  let html = '<div style="background: white; padding: 20px; border-radius: 8px;">';

  html += '<div style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px;">';
  html += '<h4 style="color: #2E7D32; margin-top: 0;"><i class="fa fa-play-circle"></i> Ausgangsstoff</h4>';
  html += '<p><strong>Verbindung:</strong> ' + initialCompound + '</p>';
  html += '<p><strong>Stoffmenge:</strong> ' + initialAmount.toFixed(4) + ' mol</p>';
  if (!isNaN(initialMolarMass) && initialMolarMass > 0) {
    const initialMass = initialAmount * initialMolarMass;
    html += '<p><strong>Molare Masse:</strong> ' + initialMolarMass + ' g/mol</p>';
    html += '<p><strong>Masse:</strong> ' + initialMass.toFixed(4) + ' g</p>';
  }
  html += '</div>';

  results.forEach((result, index) => {
    const bgColor = index % 2 === 0 ? '#fff3e0' : '#fce4ec';
    const borderColor = index % 2 === 0 ? '#FF9800' : '#E91E63';

    html +=
      '<div style="margin-bottom: 15px; padding: 15px; background: ' + bgColor + '; border-left: 4px solid ' + borderColor + '; border-radius: 4px;">' +
        '<h4 style="color: ' + (index % 2 === 0 ? '#E65100' : '#C2185B') + '; margin-top: 0;">' +
          '<i class="fa fa-step-forward"></i> Schritt ' + result.stepNumber +
        '</h4>';

    if (result.equation) {
      html += '<p><strong>Gleichung:</strong> ' + result.equation + '</p>';
    }

    html += '<p><strong>Edukt:</strong> ' + result.reactantAmount.toFixed(4) + ' mol</p>';
    html += '<p><strong>Koeffizienten:</strong> \u03bd\u2081 = ' + result.coeffR + ', \u03bd\u2082 = ' + result.coeffP + '</p>';
    html += '<p><strong>Berechnung:</strong> ' + result.product + ' = ' + result.reactantAmount.toFixed(4) + ' \u00d7 (' + result.coeffP + '/' + result.coeffR + ')</p>';
    html += '<p><strong>Produktstoffmenge:</strong> <strong style="color: ' + (index % 2 === 0 ? '#E65100' : '#C2185B') + '">' + result.productAmount.toFixed(4) + ' mol</strong></p>';

    if (result.productMass !== null) {
      html += '<p><strong>Produktmasse:</strong> <strong style="color: ' + (index % 2 === 0 ? '#E65100' : '#C2185B') + '">' + result.productMass.toFixed(4) + ' g</strong> (' + result.molarMass + ' g/mol)</p>';
    }

    html += '</div>';
  });

  const finalResult = results[results.length - 1];
  const overallYield = (finalResult.productAmount / initialAmount) * 100;

  html +=
    '<div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">' +
      '<h3 style="margin-top: 0;"><i class="fa fa-flag-checkered"></i> Gesamtergebnis</h3>' +
      '<p style="font-size: 16px;"><strong>Ausgangsstoff:</strong> ' + initialCompound + ' (' + initialAmount.toFixed(4) + ' mol)</p>' +
      '<p style="font-size: 16px;"><strong>Endprodukt:</strong> ' + finalResult.product + ' (' + finalResult.productAmount.toFixed(4) + ' mol)</p>' +
      '<p style="font-size: 18px; margin-top: 15px;"><strong>Gesamtausbeute:</strong> ' + overallYield.toFixed(2) + '%</p>';

  if (finalResult.productMass !== null && !isNaN(initialMolarMass) && initialMolarMass > 0) {
    const initialMassVal = initialAmount * initialMolarMass;
    const massYield = (finalResult.productMass / initialMassVal) * 100;
    html += '<p style="font-size: 16px;"><strong>Massenausbeute:</strong> ' + massYield.toFixed(2) + '%</p>';
  }

  html += '</div></div>';

  html +=
    '<div style="margin-top: 15px; text-align: center;">' +
      '<button class="btn btn-success" onclick="exportMultiStepToPDF()" style="color: white;">' +
        '<i class="fa fa-file-pdf-o"></i> Als PDF exportieren' +
      '</button>' +
    '</div>';

  contentDiv.innerHTML = html;
  resultDiv.style.display = 'block';

  const lastResult = results[results.length - 1];
  const historyData = initialCompound + ' \u2192 ' + lastResult.product + ': ' + lastResult.productAmount.toFixed(4) + ' mol (' + results.length + ' Schritte)';
  saveToHistory('Mehrstufige Reaktion', historyData);
}

function exportMultiStepToPDF() {
  const jsPDF = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('St\u00f6chiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Mehrstufige Reaktion', 105, 35, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  let y = 60;

  const initialAmount = document.getElementById('initial-amount').value;
  const initialMolarMass = document.getElementById('initial-molar-mass').value;
  const initialCompound = document.getElementById('initial-compound').value || 'Ausgangsstoff';

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Ausgangsstoff:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text('Verbindung: ' + initialCompound, 25, y); y += 8;
  doc.text('Stoffmenge: ' + initialAmount + ' mol', 25, y); y += 8;
  if (initialMolarMass) {
    const massVal = (parseFloat(initialAmount) * parseFloat(initialMolarMass)).toFixed(4);
    doc.text('Molare Masse: ' + initialMolarMass + ' g/mol', 25, y); y += 8;
    doc.text('Masse: ' + massVal + ' g', 25, y); y += 8;
  }
  y += 10;

  const stepElements = document.querySelectorAll('.reaction-step');
  let currentAmount = parseFloat(initialAmount);

  stepElements.forEach((stepEl, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(' Schritt ' + (index + 1), 20, y);
    y += 8;

    const coeffR = stepEl.querySelector('.step-coeff-r').value;
    const coeffP = stepEl.querySelector('.step-coeff-p').value;
    const product = stepEl.querySelector('.step-product').value || 'Produkt ' + (index + 1);
    const equation = stepEl.querySelector('.step-equation').value;
    const molarMass = stepEl.querySelector('.step-molar-mass').value;

    const productAmount = (currentAmount * (parseFloat(coeffP) / parseFloat(coeffR))).toFixed(4);

    doc.setTextColor(0, 0, 0);
    if (equation) {
      doc.text('Gleichung: ' + equation, 25, y); y += 8;
    }
    doc.text('Edukt: ' + currentAmount.toFixed(4) + ' mol', 25, y); y += 8;
    doc.text('Koeffizienten: \u03bd\u2081 = ' + coeffR + ', \u03bd\u2082 = ' + coeffP, 25, y); y += 8;
    doc.text('Produkt: ' + product, 25, y); y += 8;
    doc.setTextColor(0, 123, 255);
    doc.text('Stoffmenge: ' + productAmount + ' mol', 25, y); y += 8;

    if (molarMass) {
      const prodMass = (parseFloat(productAmount) * parseFloat(molarMass)).toFixed(4);
      doc.text('Masse: ' + prodMass + ' g (' + molarMass + ' g/mol)', 25, y); y += 8;
    }

    currentAmount = parseFloat(productAmount);
    y += 5;
  });

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  const overallYieldPct = ((currentAmount / parseFloat(initialAmount)) * 100).toFixed(2);

  doc.setFontSize(14);
  doc.setTextColor(102, 126, 234);
  doc.text('Gesamtausbeute: ' + overallYieldPct + '%', 20, y);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Datum: ' + new Date().toLocaleDateString('de-DE'), 20, 285);
  doc.text('chemie-lernen.org', 105, 285, { align: 'center' });

  doc.save('mehrstufige-reaktion-' + Date.now() + '.pdf');
}

document.addEventListener('DOMContentLoaded', () => {
  const initialAmount = document.getElementById('initial-amount');
  const initialMolarMass = document.getElementById('initial-molar-mass');

  if (initialAmount && initialMolarMass) {
    initialAmount.addEventListener('input', updateInitialMass);
    initialMolarMass.addEventListener('input', updateInitialMass);
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateMultiStepPure: calculateMultiStepPure,
  };
}
