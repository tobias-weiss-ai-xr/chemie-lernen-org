/**
 * Chemistry Utilities
 * Shared utility functions for chemical formula parsing and calculations
 */

/**
 * Parse chemical formula and return element composition
 * @param {string} formula - Chemical formula (e.g., "H2O", "Ca(OH)2")
 * @param {Object} options - Optional parameters
 * @param {Object} options.validElements - Set of valid element symbols to validate against
 * @returns {Object} Element counts (e.g., {H: 2, O: 1})
 * @throws {Error} If formula contains invalid elements (when validElements is provided)
 */
export function parseFormula(formula, options = {}) {
  const { validElements = null } = options;
  const composition = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;

  // Handle parentheses recursively
  formula = formula.replace(/\(([^()]+)\)(\d*)/g, (match, group, multiplier) => {
    const mult = multiplier ? parseInt(multiplier) : 1;
    const processedGroup = group.replace(/([A-Z][a-z]?)(\d*)/g, (m, element, count) => {
      const c = count ? parseInt(count) : 1;
      return element + (c * mult);
    });
    return processedGroup;
  });

  // Process the formula (now without parentheses)
  let match;
  while ((match = regex.exec(formula)) !== null) {
    const element = match[1];
    const count = match[2] ? parseInt(match[2]) : 1;

    // Validate element if validElements is provided
    if (validElements && !Object.prototype.hasOwnProperty.call(validElements, element)) {
      throw new Error(`Unbekanntes Element: ${element}`);
    }

    // Add to composition
    if (Object.prototype.hasOwnProperty.call(composition, element)) {
      composition[element] += count;
    } else {
      composition[element] = count;
    }
  }

  return composition;
}

/**
 * Format chemical formula with subscript numbers for HTML display
 * @param {string} formula - Chemical formula (e.g., "H2O")
 * @returns {string} HTML formatted formula (e.g., "H<sub>2</sub>O")
 */
export function formatFormula(formula) {
  return formula.replace(/(\d+)/g, '<sub>$1</sub>');
}

/**
 * Calculate molar mass from element composition
 * @param {Object} composition - Element counts from parseFormula
 * @param {Object} atomicMasses - Object mapping element symbols to atomic masses
 * @returns {number} Total molar mass in g/mol
 */
export function calculateMolarMass(composition, atomicMasses) {
  let totalMass = 0;

  for (const element in composition) {
    const count = composition[element];
    const mass = atomicMasses[element];
    totalMass += count * mass;
  }

  return totalMass;
}

/**
 * Get element composition details formatted for display
 * @param {Object} composition - Element counts from parseFormula
 * @param {Object} atomicMasses - Object mapping element symbols to atomic masses
 * @param {number} totalMass - Total molar mass for percentage calculation
 * @returns {Array} Array of element detail objects
 */
export function getCompositionDetails(composition, atomicMasses, totalMass) {
  const details = [];

  for (const element in composition) {
    const count = composition[element];
    const mass = atomicMasses[element];
    const contribution = count * mass;
    const percentage = (contribution / totalMass * 100).toFixed(1);

    details.push({
      element,
      count,
      mass,
      contribution,
      percentage
    });
  }

  // Sort by element symbol
  return details.sort((a, b) => a.element.localeCompare(b.element));
}

/**
 * Validate chemical formula format
 * @param {string} formula - Chemical formula to validate
 * @returns {boolean} True if formula format is valid
 */
export function isValidFormula(formula) {
  if (!formula || typeof formula !== 'string') {
    return false;
  }

  // Check if formula matches the pattern (elements and numbers, parentheses)
  const validPattern = /^([A-Z][a-z]?\d*|\(|\)|\+|\s)+$/;
  return validPattern.test(formula);
}

/**
 * Extract elements from a list of chemical formulas
 * @param {Array} formulas - Array of chemical formulas
 * @returns {Set} Set of unique element symbols
 */
export function extractElements(formulas) {
  const elements = new Set();

  formulas.forEach(formula => {
    try {
      const composition = parseFormula(formula);
      Object.keys(composition).forEach(element => elements.add(element));
    } catch (error) {
      // Skip invalid formulas
      console.warn(`Failed to parse formula: ${formula}`, error);
    }
  });

  return elements;
}

// Export for CommonJS environments (Node.js tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseFormula,
    formatFormula,
    calculateMolarMass,
    getCompositionDetails,
    isValidFormula,
    extractElements
  };
}

// Export to global scope for traditional script usage
if (typeof window !== 'undefined') {
  window.ChemistryUtils = {
    parseFormula,
    formatFormula,
    calculateMolarMass,
    getCompositionDetails,
    isValidFormula,
    extractElements
  };
}
