/**
 * Stoichiometry Calculator Functions
 * Core calculation logic extracted for testing
 */

/**
 * Parse chemical formula and return element composition
 * @param {string} formula - Chemical formula (e.g., "H2O", "CO2")
 * @returns {Object} Element counts (e.g., {H: 2, O: 1})
 */
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

/**
 * Calculate product amount using mole-to-mole conversion
 * @param {number} n1 - Amount of reactant in moles
 * @param {number} v1 - Stoichiometric coefficient of reactant
 * @param {number} v2 - Stoichiometric coefficient of product
 * @returns {number} Amount of product in moles
 */
function calcMolToMol(n1, v1, v2) {
  if (isNaN(n1) || isNaN(v1) || isNaN(v2)) {
    throw new Error('All parameters must be numbers');
  }
  if (v1 === 0) {
    throw new Error('Reactant coefficient cannot be zero');
  }

  return n1 * (v2 / v1);
}

/**
 * Calculate product mass using mass-to-mass conversion (3-step method)
 * @param {number} m1 - Mass of reactant in grams
 * @param {number} M1 - Molar mass of reactant in g/mol
 * @param {number} M2 - Molar mass of product in g/mol
 * @param {number} v1 - Stoichiometric coefficient of reactant
 * @param {number} v2 - Stoichiometric coefficient of product
 * @returns {Object} Result with n1, n2, m2 values
 */
function calcMassToMass(m1, M1, M2, v1, v2) {
  if (isNaN(m1) || isNaN(M1) || isNaN(M2) || isNaN(v1) || isNaN(v2)) {
    throw new Error('All parameters must be numbers');
  }
  if (M1 === 0 || M2 === 0) {
    throw new Error('Molar masses cannot be zero');
  }
  if (v1 === 0) {
    throw new Error('Reactant coefficient cannot be zero');
  }

  // Step 1: Convert reactant mass to moles
  const n1 = m1 / M1;

  // Step 2: Convert reactant moles to product moles
  const n2 = n1 * (v2 / v1);

  // Step 3: Convert product moles to mass
  const m2 = n2 * M2;

  return {
    n1: n1,
    n2: n2,
    m2: m2
  };
}

/**
 * Identify limiting reactant
 * @param {number} m1 - Mass of reactant 1 in grams
 * @param {number} M1 - Molar mass of reactant 1 in g/mol
 * @param {number} v1 - Stoichiometric coefficient of reactant 1
 * @param {number} m2 - Mass of reactant 2 in grams
 * @param {number} M2 - Molar mass of reactant 2 in g/mol
 * @param {number} v2 - Stoichiometric coefficient of reactant 2
 * @returns {Object} Result with limitingReactant (1 or 2), n1, n2, and comparison values
 */
function calcLimitingReactant(m1, M1, v1, m2, M2, v2) {
  if (isNaN(m1) || isNaN(M1) || isNaN(v1) || isNaN(m2) || isNaN(M2) || isNaN(v2)) {
    throw new Error('All parameters must be numbers');
  }
  if (M1 === 0 || M2 === 0) {
    throw new Error('Molar masses cannot be zero');
  }

  // Calculate moles of each reactant
  const n1_moles = m1 / M1;
  const n2_moles = m2 / M2;

  // Calculate mole/coefficient ratios
  const ratio1 = v1 !== 0 ? n1_moles / v1 : n1_moles;
  const ratio2 = v2 !== 0 ? n2_moles / v2 : n2_moles;

  // Identify limiting reactant (smaller ratio = limiting, but return 2 on tie)
  const limitingReactant = ratio1 < ratio2 ? 1 : 2;

  return {
    limitingReactant: limitingReactant,
    n1: n1_moles,
    n2: n2_moles,
    ratio1: ratio1,
    ratio2: ratio2
  };
}

/**
 * Calculate percent yield
 * @param {number} theoretical - Theoretical yield in grams
 * @param {number} actual - Actual (practical) yield in grams
 * @returns {number} Percent yield (0-100+)
 */
function calcPercentYield(theoretical, actual) {
  if (isNaN(theoretical) || isNaN(actual)) {
    throw new Error('All parameters must be numbers');
  }
  if (theoretical === 0) {
    throw new Error('Theoretical yield cannot be zero');
  }

  return (actual / theoretical) * 100;
}

/**
 * Calculate gas properties using ideal gas law (PV = nRT)
 * @param {Object} params - Gas parameters
 * @param {number} params.P - Pressure in atm
 * @param {number} params.V - Volume in liters
 * @param {number} params.n - Amount in moles
 * @param {number} params.T - Temperature in Kelvin
 * @param {string} calculate - Which variable to calculate ('P', 'V', 'n', or 'T')
 * @returns {number} Calculated value
 */
function calcGasLaw(params, calculate) {
  const R = 0.0821; // Ideal gas constant in L·atm/(mol·K)

  if (calculate === 'n') {
    // Calculate moles: n = PV / RT
    if (!params.P || !params.V || !params.T) {
      throw new Error('P, V, and T are required to calculate n');
    }
    return (params.P * params.V) / (R * params.T);
  } else if (calculate === 'V') {
    // Calculate volume: V = nRT / P
    if (!params.n || !params.T || !params.P) {
      throw new Error('n, T, and P are required to calculate V');
    }
    return (params.n * R * params.T) / params.P;
  } else if (calculate === 'P') {
    // Calculate pressure: P = nRT / V
    if (!params.n || !params.T || !params.V) {
      throw new Error('n, T, and V are required to calculate P');
    }
    return (params.n * R * params.T) / params.V;
  } else if (calculate === 'T') {
    // Calculate temperature: T = PV / nR
    if (!params.P || !params.V || !params.n) {
      throw new Error('P, V, and n are required to calculate T');
    }
    return (params.P * params.V) / (params.n * R);
  } else {
    throw new Error('Invalid calculate parameter. Must be P, V, n, or T');
  }
}

/**
 * Convert temperature to Kelvin
 * @param {number} temp - Temperature value
 * @param {string} unit - Temperature unit ('C', 'F', or 'K')
 * @returns {number} Temperature in Kelvin
 */
function convertToKelvin(temp, unit) {
  if (isNaN(temp)) {
    throw new Error('Temperature must be a number');
  }

  switch (unit) {
    case 'K':
      return temp;
    case 'C':
      return temp + 273.15;
    case 'F':
      return (temp - 32) * (5/9) + 273.15;
    default:
      throw new Error('Invalid unit. Must be C, F, or K');
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseFormula,
    calcMolToMol,
    calcMassToMass,
    calcLimitingReactant,
    calcPercentYield,
    calcGasLaw,
    convertToKelvin
  };
}
