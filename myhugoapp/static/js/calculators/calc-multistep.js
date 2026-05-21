/* global saveToHistory */

var stepCounter = 0;

function addReactionStep() {
  stepCounter++;
  var container = document.getElementById('reaction-steps-container');

  var stepDiv = document.createElement('div');
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

// eslint-disable-next-line no-unused-vars
function removeStep(stepId) {
  var stepElement = document.getElementById('step-' + stepId);
  if (stepElement) {
    stepElement.remove();
    updateStepNumbers();
  }
}

function updateStepNumbers() {
  var steps = document.querySelectorAll('.reaction-step');
  steps.forEach(function(step, index) {
    var titleElement = step.querySelector('h4');
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

// eslint-disable-next-line no-unused-vars
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
  var amount = parseFloat(document.getElementById('initial-amount').value);
  var molarMass = parseFloat(document.getElementById('initial-molar-mass').value);
  var display = document.getElementById('initial-mass-display');
  var valueSpan = document.getElementById('initial-mass-value');

  if (!isNaN(amount) && !isNaN(molarMass) && molarMass > 0) {
    var mass = amount * molarMass;
    valueSpan.textContent = mass.toFixed(4);
    display.style.display = 'block';
  } else {
    display.style.display = 'none';
  }
}

// eslint-disable-next-line no-unused-vars
function calculateMultiStep() {
  var initialAmount = parseFloat(document.getElementById('initial-amount').value);
  var initialMolarMass = parseFloat(document.getElementById('initial-molar-mass').value);
  var initialCompound = document.getElementById('initial-compound').value || 'Ausgangsstoff';

  if (isNaN(initialAmount) || initialAmount <= 0) {
    alert('Bitte geben Sie eine g\u00fcltige Stoffmenge f\u00fcr den Ausgangsstoff ein.');
    return;
  }

  var steps = [];
  var stepElements = document.querySelectorAll('.reaction-step');

  if (stepElements.length === 0) {
    alert('Bitte f\u00fcgen Sie mindestens einen Reaktionsschritt hinzu.');
    return;
  }

  var currentAmount = initialAmount;
  var results = [];
  var hasError = false;

  stepElements.forEach(function(stepEl, index) {
    var coeffR = parseFloat(stepEl.querySelector('.step-coeff-r').value);
    var coeffP = parseFloat(stepEl.querySelector('.step-coeff-p').value);
    var molarMass = parseFloat(stepEl.querySelector('.step-molar-mass').value);
    var product = stepEl.querySelector('.step-product').value || 'Produkt ' + (index + 1);
    var equation = stepEl.querySelector('.step-equation').value || '';

    if (isNaN(coeffR) || isNaN(coeffP) || coeffR <= 0 || coeffP <= 0) {
      alert('Fehler in Schritt ' + (index + 1) + ': Ung\u00fcltige Koeffizienten');
      hasError = true;
      return;
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
  var resultDiv = document.getElementById('multistep-result');
  var contentDiv = document.getElementById('multistep-results-content');

  var html = '<div style="background: white; padding: 20px; border-radius: 8px;">';

  html += '<div style="margin-bottom: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px;">';
  html += '<h4 style="color: #2E7D32; margin-top: 0;"><i class="fa fa-play-circle"></i> Ausgangsstoff</h4>';
  html += '<p><strong>Verbindung:</strong> ' + initialCompound + '</p>';
  html += '<p><strong>Stoffmenge:</strong> ' + initialAmount.toFixed(4) + ' mol</p>';
  if (!isNaN(initialMolarMass) && initialMolarMass > 0) {
    var initialMass = initialAmount * initialMolarMass;
    html += '<p><strong>Molare Masse:</strong> ' + initialMolarMass + ' g/mol</p>';
    html += '<p><strong>Masse:</strong> ' + initialMass.toFixed(4) + ' g</p>';
  }
  html += '</div>';

  results.forEach(function(result, index) {
    var bgColor = index % 2 === 0 ? '#fff3e0' : '#fce4ec';
    var borderColor = index % 2 === 0 ? '#FF9800' : '#E91E63';

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

  var finalResult = results[results.length - 1];
  var overallYield = (finalResult.productAmount / initialAmount) * 100;

  html +=
    '<div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">' +
      '<h3 style="margin-top: 0;"><i class="fa fa-flag-checkered"></i> Gesamtergebnis</h3>' +
      '<p style="font-size: 16px;"><strong>Ausgangsstoff:</strong> ' + initialCompound + ' (' + initialAmount.toFixed(4) + ' mol)</p>' +
      '<p style="font-size: 16px;"><strong>Endprodukt:</strong> ' + finalResult.product + ' (' + finalResult.productAmount.toFixed(4) + ' mol)</p>' +
      '<p style="font-size: 18px; margin-top: 15px;"><strong>Gesamtausbeute:</strong> ' + overallYield.toFixed(2) + '%</p>';

  if (finalResult.productMass !== null && !isNaN(initialMolarMass) && initialMolarMass > 0) {
    var initialMassVal = initialAmount * initialMolarMass;
    var massYield = (finalResult.productMass / initialMassVal) * 100;
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

  var lastResult = results[results.length - 1];
  var historyData = initialCompound + ' \u2192 ' + lastResult.product + ': ' + lastResult.productAmount.toFixed(4) + ' mol (' + results.length + ' Schritte)';
  saveToHistory('Mehrstufige Reaktion', historyData);
}

function exportMultiStepToPDF() {
  var jsPDF = window.jspdf;
  var doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('St\u00f6chiometrie-Rechner', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Mehrstufige Reaktion', 105, 35, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, 190, 45);

  var y = 60;

  var initialAmount = document.getElementById('initial-amount').value;
  var initialMolarMass = document.getElementById('initial-molar-mass').value;
  var initialCompound = document.getElementById('initial-compound').value || 'Ausgangsstoff';

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Ausgangsstoff:', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text('Verbindung: ' + initialCompound, 25, y); y += 8;
  doc.text('Stoffmenge: ' + initialAmount + ' mol', 25, y); y += 8;
  if (initialMolarMass) {
    var massVal = (parseFloat(initialAmount) * parseFloat(initialMolarMass)).toFixed(4);
    doc.text('Molare Masse: ' + initialMolarMass + ' g/mol', 25, y); y += 8;
    doc.text('Masse: ' + massVal + ' g', 25, y); y += 8;
  }
  y += 10;

  var stepElements = document.querySelectorAll('.reaction-step');
  var currentAmount = parseFloat(initialAmount);

  stepElements.forEach(function(stepEl, index) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(' Schritt ' + (index + 1), 20, y);
    y += 8;

    var coeffR = stepEl.querySelector('.step-coeff-r').value;
    var coeffP = stepEl.querySelector('.step-coeff-p').value;
    var product = stepEl.querySelector('.step-product').value || 'Produkt ' + (index + 1);
    var equation = stepEl.querySelector('.step-equation').value;
    var molarMass = stepEl.querySelector('.step-molar-mass').value;

    var productAmount = (currentAmount * (parseFloat(coeffP) / parseFloat(coeffR))).toFixed(4);

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
      var prodMass = (parseFloat(productAmount) * parseFloat(molarMass)).toFixed(4);
      doc.text('Masse: ' + prodMass + ' g (' + molarMass + ' g/mol)', 25, y); y += 8;
    }

    currentAmount = parseFloat(productAmount);
    y += 5;
  });

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  var overallYieldPct = ((currentAmount / parseFloat(initialAmount)) * 100).toFixed(2);

  doc.setFontSize(14);
  doc.setTextColor(102, 126, 234);
  doc.text('Gesamtausbeute: ' + overallYieldPct + '%', 20, y);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Datum: ' + new Date().toLocaleDateString('de-DE'), 20, 285);
  doc.text('chemie-lernen.org', 105, 285, { align: 'center' });

  doc.save('mehrstufige-reaktion-' + Date.now() + '.pdf');
}

document.addEventListener('DOMContentLoaded', function() {
  var initialAmount = document.getElementById('initial-amount');
  var initialMolarMass = document.getElementById('initial-molar-mass');

  if (initialAmount && initialMolarMass) {
    initialAmount.addEventListener('input', updateInitialMass);
    initialMolarMass.addEventListener('input', updateInitialMass);
  }
});
