/**
 * Practice Mode Generators
 * Random problem generation logic extracted for testing
 */

// Element database for mass calculations
const elements = [
  { symbol: 'H₂', M: 2.016 },
  { symbol: 'O₂', M: 32.00 },
  { symbol: 'N₂', M: 28.02 },
  { symbol: 'Cl₂', M: 70.90 },
  { symbol: 'CO₂', M: 44.01 },
  { symbol: 'H₂O', M: 18.02 },
  { symbol: 'NH₃', M: 17.03 },
  { symbol: 'CH₄', M: 16.04 },
  { symbol: 'NaCl', M: 58.44 },
  { symbol: 'CaCO₃', M: 100.09 }
];

/**
 * Generate random Mol-Mol problem
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random number generation (for testing)
 * @returns {Object} Problem data with n1, v1, v2, answer, tolerance
 */
function generateMolMolProblem(difficulty, seed = null) {
  // Use seeded random if seed provided, otherwise use Math.random
  const getRandom = seed ? () => seededRandom(seed++) : Math.random;

  let v1, v2, n1;

  if (difficulty === 'easy') {
    v1 = Math.floor(getRandom() * 3) + 1; // 1-3
    v2 = Math.floor(getRandom() * 3) + 1;
    n1 = Math.floor(getRandom() * 10) + 1; // 1-10 mol
  } else if (difficulty === 'medium') {
    v1 = Math.floor(getRandom() * 5) + 1; // 1-5
    v2 = Math.floor(getRandom() * 5) + 1;
    n1 = (Math.floor(getRandom() * 50) + 1) / 2; // 0.5-25 mol
  } else { // hard
    v1 = Math.floor(getRandom() * 6) + 2; // 2-7
    v2 = Math.floor(getRandom() * 6) + 2;
    n1 = (Math.floor(getRandom() * 200) + 10) / 10; // 1-20 mol
  }

  const answer = n1 * (v2 / v1);

  return {
    type: 'mol-mol',
    n1,
    v1,
    v2,
    answer,
    tolerance: 0.01 // 1% tolerance
  };
}

/**
 * Generate random Mass-Mass problem
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random number generation (for testing)
 * @returns {Object} Problem data with m1, M1, M2, v1, v2, answer, tolerance
 */
function generateMassMassProblem(difficulty, seed = null) {
  const getRandom = seed ? () => seededRandom(seed++) : Math.random;

  // Select random elements
  const elem1 = elements[Math.floor(getRandom() * elements.length)];
  const elem2 = elements[Math.floor(getRandom() * elements.length)];

  let v1, v2, m1;

  if (difficulty === 'easy') {
    v1 = 1;
    v2 = 1;
    m1 = (Math.floor(getRandom() * 10) + 1) * 10; // 10-100 g
  } else if (difficulty === 'medium') {
    v1 = Math.floor(getRandom() * 3) + 1; // 1-3
    v2 = Math.floor(getRandom() * 3) + 1;
    m1 = (Math.floor(getRandom() * 100) + 10) / 2; // 5-55 g
  } else { // hard
    v1 = Math.floor(getRandom() * 5) + 2; // 2-6
    v2 = Math.floor(getRandom() * 5) + 2;
    m1 = (Math.floor(getRandom() * 200) + 20) / 10; // 2-22 g
  }

  const M1 = elem1.M;
  const M2 = elem2.M;

  // Calculate answer
  const n1 = m1 / M1;
  const n2 = n1 * (v2 / v1);
  const answer = n2 * M2;

  return {
    type: 'mass-mass',
    m1,
    M1,
    M2,
    v1,
    v2,
    elem1: elem1.symbol,
    elem2: elem2.symbol,
    answer,
    tolerance: 0.02 // 2% tolerance
  };
}

/**
 * Generate random Limiting Reactant problem
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random number generation (for testing)
 * @returns {Object} Problem data with masses, molar masses, coefficients, and answer
 */
function generateLimitingProblem(difficulty, seed = null) {
  const getRandom = seed ? () => seededRandom(seed++) : Math.random;

  const elem1 = elements[Math.floor(getRandom() * elements.length)];
  const elem2 = elements[Math.floor(getRandom() * elements.length)];

  let v1, v2, m1, m2;

  if (difficulty === 'easy') {
    v1 = 1;
    v2 = 1;
    m1 = (Math.floor(getRandom() * 10) + 1) * 10; // 10-100 g
    m2 = (Math.floor(getRandom() * 10) + 1) * 10; // 10-100 g
  } else if (difficulty === 'medium') {
    v1 = Math.floor(getRandom() * 3) + 1; // 1-3
    v2 = Math.floor(getRandom() * 3) + 1;
    m1 = (Math.floor(getRandom() * 100) + 10) / 2; // 5-55 g
    m2 = (Math.floor(getRandom() * 100) + 10) / 2;
  } else { // hard
    v1 = Math.floor(getRandom() * 5) + 2; // 2-6
    v2 = Math.floor(getRandom() * 5) + 2;
    m1 = (Math.floor(getRandom() * 150) + 20) / 10; // 2-17 g
    m2 = (Math.floor(getRandom() * 150) + 20) / 10;
  }

  const M1 = elem1.M;
  const M2 = elem2.M;

  // Calculate which is limiting
  const n1 = m1 / M1;
  const n2_moles = m2 / M2;
  const ratio1 = n1 / v1;
  const ratio2 = n2_moles / v2;
  const answer = ratio1 < ratio2 ? 1 : 2;

  return {
    type: 'limiting',
    m1,
    M1,
    v1,
    m2,
    M2,
    v2,
    elem1: elem1.symbol,
    elem2: elem2.symbol,
    answer,
    tolerance: 0.02 // 2% tolerance
  };
}

/**
 * Generate random Yield problem
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} seed - Seed for random number generation (for testing)
 * @returns {Object} Problem data with theoretical, actual yields, and answer
 */
function generateYieldProblem(difficulty, seed = null) {
  const getRandom = seed ? () => seededRandom(seed++) : Math.random;

  let theoretical, targetYield;

  if (difficulty === 'easy') {
    theoretical = (Math.floor(getRandom() * 10) + 1) * 10; // 10-100 g
    targetYield = [50, 60, 70, 80, 90, 100][Math.floor(getRandom() * 6)];
  } else if (difficulty === 'medium') {
    theoretical = (Math.floor(getRandom() * 100) + 10) / 2; // 5-55 g
    targetYield = (Math.floor(getRandom() * 50) + 40); // 40-90%
  } else { // hard
    theoretical = (Math.floor(getRandom() * 150) + 20) / 10; // 2-17 g
    targetYield = (Math.floor(getRandom() * 60) + 30); // 30-90%
  }

  const actual = (theoretical * targetYield) / 100;
  const answer = targetYield;

  return {
    type: 'yield',
    theoretical,
    actual,
    answer,
    tolerance: 0.5 // 0.5% tolerance for percentage
  };
}

/**
 * Check if answer is within tolerance
 * @param {number} userAnswer - User's answer
 * @param {number} correctAnswer - Correct answer
 * @param {number} tolerance - Tolerance as decimal (e.g., 0.01 for 1%)
 * @returns {boolean} True if within tolerance
 */
function checkAnswerTolerance(userAnswer, correctAnswer, tolerance) {
  const difference = Math.abs((userAnswer - correctAnswer) / correctAnswer);
  return difference <= tolerance;
}

/**
 * Seeded random number generator for testing
 * @param {number} seed - Seed value
 * @returns {number} Random value between 0 and 1
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    elements,
    generateMolMolProblem,
    generateMassMassProblem,
    generateLimitingProblem,
    generateYieldProblem,
    checkAnswerTolerance,
    seededRandom
  };
}
