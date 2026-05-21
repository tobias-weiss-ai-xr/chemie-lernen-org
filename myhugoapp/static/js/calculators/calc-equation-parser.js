// ===== EQUATION PARSER =====

// Parse chemical equation and extract coefficients
// eslint-disable-next-line no-unused-vars
function parseEquation() {
  var equation = document.getElementById('equation-parser-input').value.trim();

  if (!equation) {
    alert('Bitte geben Sie eine Reaktionsgleichung ein.');
    return;
  }

  try {
    var result = parseChemicalEquation(equation);
    displayParsedCoefficients(result);
  } catch (error) {
    alert('Fehler beim Parsen: ' + error.message);
    console.error('Parse error:', error);
  }
}

// Main parsing function
function parseChemicalEquation(equation) {
  var arrowMatch = equation.match(/(->|→|=)/);
  if (!arrowMatch) {
    throw new Error('Kein Reaktionspfeil gefunden. Verwenden Sie ->, → oder =');
  }

  var sides = equation.split(arrowMatch[1]).map(function(s) { return s.trim(); });
  var reactants = parseSide(sides[0]);
  var products = parseSide(sides[1]);

  return {
    reactants: reactants,
    products: products,
    totalReactants: reactants.length,
    totalProducts: products.length
  };
}

function parseSide(sideStr) {
  if (!sideStr) {
    throw new Error('Leere Seite der Gleichung');
  }

  var compounds = sideStr.split('+').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });

  if (compounds.length === 0) {
    throw new Error('Keine Verbindungen gefunden');
  }

  return compounds.map(function(compound) { return parseCompound(compound); });
}

function parseCompound(compoundStr) {
  var coeffMatch = compoundStr.match(/^(\d*\.?\d+)?\s*([A-Za-z0-9\(\)]+)$/);

  if (!coeffMatch) {
    return {
      coefficient: 1,
      formula: compoundStr.trim(),
      hasExplicitCoefficient: false
    };
  }

  var coefficient = coeffMatch[1] ? parseFloat(coeffMatch[1]) : 1;
  var formula = coeffMatch[2];

  return {
    coefficient: coefficient,
    formula: formula,
    hasExplicitCoefficient: !!coeffMatch[1]
  };
}

function displayParsedCoefficients(result) {
  var container = document.getElementById('parsed-coefficients');
  var buttonsContainer = document.getElementById('apply-buttons');
  var resultPanel = document.getElementById('parser-result');

  var html = '<div class="row">';

  html += '<div class="col-md-6">';
  html += '<h5>Edukte:</h5>';
  html += '<ul class="list-group">';
  result.reactants.forEach(function(reactant) {
    html +=
      '<li class="list-group-item">' +
        '<strong>' + reactant.formula + '</strong>' +
        '<span class="badge" style="margin-left: 10px;">ν₁ = ' + reactant.coefficient + '</span>' +
      '</li>';
  });
  html += '</ul></div>';

  html += '<div class="col-md-6">';
  html += '<h5>Produkte:</h5>';
  html += '<ul class="list-group">';
  result.products.forEach(function(product) {
    html +=
      '<li class="list-group-item">' +
        '<strong>' + product.formula + '</strong>' +
        '<span class="badge" style="margin-left: 10px;">ν₂ = ' + product.coefficient + '</span>' +
      '</li>';
  });
  html += '</ul></div>';

  html += '</div>';
  container.innerHTML = html;

  var buttonsHtml = '<p style="margin-bottom: 10px;"><strong>Koeffizienten übernehmen:</strong></p>';
  buttonsHtml += '<div class="btn-group">';

  if (result.reactants.length === 1 && result.products.length === 1) {
    var rCoeff = result.reactants[0].coefficient;
    var pCoeff = result.products[0].coefficient;
    buttonsHtml += '<button class="btn btn-success" onclick="applyCoefficientsToMolMol(' + rCoeff + ', ' + pCoeff + ')">' +
      '<i class="fa fa-check"></i> Mol-Mol-Rechner' +
    '</button>';
  }

  if (result.reactants.length === 1 && result.products.length === 1) {
    var rCoeff2 = result.reactants[0].coefficient;
    var pCoeff2 = result.products[0].coefficient;
    buttonsHtml += '<button class="btn btn-success" onclick="applyCoefficientsToMassMass(' + rCoeff2 + ', ' + pCoeff2 + ')">' +
      '<i class="fa fa-check"></i> Masse-Masse-Rechner' +
    '</button>';
  }

  buttonsHtml += '</div>';
  buttonsContainer.innerHTML = buttonsHtml;

  resultPanel.style.display = 'block';
}

// eslint-disable-next-line no-unused-vars
function applyCoefficientsToMolMol(v1, v2) {
  document.getElementById('mol-coeff-r').value = v1;
  document.getElementById('mol-coeff-p').value = v2;

  document.querySelector('a[href="#mol-mol"]').click();

  document.querySelector('.calculator-panel').scrollIntoView({ behavior: 'smooth' });

  alert('Koeffizienten übernommen: Edukt ν₁=' + v1 + ', Produkt ν₂=' + v2);
}

// eslint-disable-next-line no-unused-vars
function applyCoefficientsToMassMass(v1, v2) {
  document.getElementById('mass-coeff-r').value = v1;
  document.getElementById('mass-coeff-p').value = v2;

  document.querySelector('a[href="#masse-masse"]').click();

  document.querySelectorAll('.calculator-panel')[1].scrollIntoView({ behavior: 'smooth' });

  alert('Koeffizienten übernommen: Edukt ν₁=' + v1 + ', Produkt ν₂=' + v2);
}
