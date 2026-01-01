// Chemical Equation Balancer JavaScript

// Parse chemical formula and return element composition
function parseFormula(formula) {
  const composition = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;

  // Handle parentheses recursively
  formula = formula.replace(/\(([^()]+)\)(\d*)/g, function(match, group, multiplier) {
    const mult = multiplier ? parseInt(multiplier) : 1;
    let processedGroup = group.replace(/([A-Z][a-z]?)(\d*)/g, function(m, element, count) {
      const c = count ? parseInt(count) : 1;
      return element + (c * mult);
    });
    return processedGroup;
  });

  let match;
  while ((match = regex.exec(formula)) !== null) {
    const element = match[1];
    const count = match[2] ? parseInt(match[2]) : 1;

    if (composition.hasOwnProperty(element)) {
      composition[element] += count;
    } else {
      composition[element] = count;
    }
  }

  return composition;
}

// Parse equation into reactants and products
function parseEquation(equation) {
  // Split by = or ->
  const parts = equation.split(/[=→]/);
  if (parts.length !== 2) {
    throw new Error('Ungültiges Format. Verwenden Sie "=" zwischen Edukten und Produkten.');
  }

  const reactants = parts[0].split('+').map(s => s.trim()).filter(s => s);
  const products = parts[1].split('+').map(s => s.trim()).filter(s => s);

  if (reactants.length === 0 || products.length === 0) {
    throw new Error('Die Gleichung muss Edukte und Produkte enthalten.');
  }

  return { reactants, products };
}

// Get all unique elements in the equation
function getAllElements(reactants, products) {
  const elements = new Set();

  [...reactants, ...products].forEach(formula => {
    const composition = parseFormula(formula);
    Object.keys(composition).forEach(element => elements.add(element));
  });

  return Array.from(elements).sort();
}

// Balance the equation using matrix method
function balanceEquation() {
  const input = document.getElementById('equation-input').value.trim();

  if (!input) {
    showError('Bitte geben Sie eine chemische Gleichung ein.');
    return;
  }

  try {
    // Parse equation
    const { reactants, products } = parseEquation(input);

    // Get all elements
    const elements = getAllElements(reactants, products);

    // Create coefficient matrix
    const numCompounds = reactants.length + products.length;
    const matrix = [];

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const row = [];

      // Reactants (positive coefficients)
      for (const formula of reactants) {
        const composition = parseFormula(formula);
        row.push(composition[element] || 0);
      }

      // Products (negative coefficients)
      for (const formula of products) {
        const composition = parseFormula(formula);
        row.push(-(composition[element] || 0));
      }

      matrix.push(row);
    }

    // Solve using Gaussian elimination
    const coefficients = solveMatrix(matrix);

    if (!coefficients) {
      throw new Error('Konnte die Gleichung nicht ausgleichen. Möglicherweise ist sie nicht ausgleichbar.');
    }

    // Display results
    displayResults(reactants, products, coefficients, elements);

  } catch (error) {
    showError(error.message);
  }
}

// Solve matrix using Gaussian elimination (simplified)
function solveMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // For simple cases, try brute force with small integers
  // This is a simplified approach that works for most educational equations
  return solveByBruteForce(matrix);
}

// Brute force solver for small integer coefficients
function solveByBruteForce(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // Try coefficient values from 1 to 12
  const maxCoeff = 12;

  // Generate all possible combinations
  function* generateCombinations(n, max) {
    if (n === 0) {
      yield [];
      return;
    }
    for (let i = 1; i <= max; i++) {
      for (const rest of generateCombinations(n - 1, max)) {
        yield [i, ...rest];
      }
    }
  }

  // Try each combination
  for (const coeffs of generateCombinations(cols, maxCoeff)) {
    // Check if this combination satisfies all equations
    let valid = true;

    for (let r = 0; r < rows; r++) {
      let sum = 0;
      for (let c = 0; c < cols; c++) {
        sum += matrix[r][c] * coeffs[c];
      }
      if (sum !== 0) {
        valid = false;
        break;
      }
    }

    if (valid) {
      // Check if coefficients can be simplified
      const gcd = coeffs.reduce((a, b) => gcdFunction(a, b), coeffs[0]);
      if (gcd > 1) {
        return coeffs.map(c => c / gcd);
      }
      return coeffs;
    }
  }

  return null;
}

// GCD function
function gcdFunction(a, b) {
  return b === 0 ? a : gcdFunction(b, a % b);
}

// Display results
function displayResults(reactants, products, coefficients, elements) {
  // Hide error section
  document.getElementById('error-section').style.display = 'none';

  // Show results section
  document.getElementById('results-section').style.display = 'block';

  // Display balanced equation
  const equationDiv = document.getElementById('balanced-equation');

  let equationHTML = '<div class="equation">';
  let coeffIndex = 0;

  // Reactants
  for (let i = 0; i < reactants.length; i++) {
    const coeff = coefficients[coeffIndex];
    const formula = formatFormula(reactants[i]);
    equationHTML += `<span class="term">${coeff > 1 ? coeff + '' : ''}${formula}</span>`;
    if (i < reactants.length - 1) {
      equationHTML += '<span class="operator"> + </span>';
    }
    coeffIndex++;
  }

  equationHTML += '<span class="arrow"> → </span>';

  // Products
  for (let i = 0; i < products.length; i++) {
    const coeff = coefficients[coeffIndex];
    const formula = formatFormula(products[i]);
    equationHTML += `<span class="term">${coeff > 1 ? coeff + '' : ''}${formula}</span>`;
    if (i < products.length - 1) {
      equationHTML += '<span class="operator"> + </span>';
    }
    coeffIndex++;
  }

  equationHTML += '</div>';
  equationDiv.innerHTML = equationHTML;

  // Display coefficients
  const coeffsList = document.getElementById('coefficients-list');
  coeffsList.innerHTML = '';
  coeffIndex = 0;

  const allCompounds = [...reactants, ...products];
  allCompounds.forEach((formula, index) => {
    const coeff = coefficients[index];
    const div = document.createElement('div');
    div.className = 'coefficient-item';
    div.innerHTML = `
      <span class="compound-formula">${formatFormula(formula)}</span>
      <span class="coefficient-value">${coeff}</span>
    `;
    coeffsList.appendChild(div);
  });

  // Display verification table
  const verificationTable = document.getElementById('verification-table');
  verificationTable.innerHTML = '<table class="table table-striped"><thead><tr><th>Element</th><th>Edukte</th><th>Produkte</th></tr></thead><tbody></tbody></table>';
  const tbody = verificationTable.querySelector('tbody');

  elements.forEach(element => {
    let reactantCount = 0;
    let productCount = 0;

    for (let i = 0; i < reactants.length; i++) {
      const composition = parseFormula(reactants[i]);
      reactantCount += (composition[element] || 0) * coefficients[i];
    }

    for (let i = 0; i < products.length; i++) {
      const composition = parseFormula(products[i]);
      productCount += (composition[element] || 0) * coefficients[reactants.length + i];
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${element}</strong></td>
      <td class="reactant-count">${reactantCount}</td>
      <td class="product-count">${productCount}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Format formula with subscript numbers
function formatFormula(formula) {
  return formula.replace(/(\d+)/g, '<sub>$1</sub>');
}

// Show error message
function showError(message) {
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('error-section').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

// Transfer balanced equation to Stoichiometry Calculator
function transferToStoichiometry() {
  try {
    // Get the balanced equation data
    const equationDisplay = document.getElementById('balanced-equation');
    const coeffsList = document.querySelectorAll('.coefficient-item');

    if (!equationDisplay || coeffsList.length === 0) {
      alert('Keine ausgeglichene Gleichung gefunden. Bitte gleichen Sie zuerst eine Gleichung aus.');
      return;
    }

    // Extract coefficients from the display
    const transferData = {
      reactants: [],
      products: [],
      coefficients: []
    };

    coeffsList.forEach((item, index) => {
      const formula = item.querySelector('.compound-formula').textContent;
      const coefficient = parseFloat(item.querySelector('.coefficient-value').textContent);

      transferData.coefficients.push(coefficient);

      // Split into reactants and products
      const reactantCount = Math.floor(coeffsList.length / 2);
      if (index < reactantCount) {
        transferData.reactants.push({ formula, coefficient });
      } else {
        transferData.products.push({ formula, coefficient });
      }
    });

    // Store in sessionStorage
    sessionStorage.setItem('balancedEquation', JSON.stringify(transferData));

    // Navigate to stoichiometry calculator
    window.location.href = '/stoechiometrie-rechner/';

  } catch (error) {
    alert('Fehler beim Übertragen der Daten: ' + error.message);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Example button clicks
  document.querySelectorAll('.example-btn').forEach(button => {
    button.addEventListener('click', function() {
      const equation = this.dataset.equation;
      document.getElementById('equation-input').value = equation;
      balanceEquation();
    });
  });

  // Enter key support
  document.getElementById('equation-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      balanceEquation();
    }
  });
});
