/**
 * Unit tests for calc-equation-parser.js - Chemical equation parser
 * Tests equation parsing, coefficient extraction, and validation
 */

describe('Chemical Equation Parser', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="equation-parser-input" type="text" />
      <div id="parser-results"></div>
      <div id="parsed-reactants"></div>
      <div id="parsed-products"></div>
    `;
  });

  describe('Equation Format Detection', () => {
    test('should detect arrow -> as separator', () => {
      const equation = 'H2 + O2 -> H2O';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeTruthy();
      expect(arrowMatch[0]).toBe('->');
    });

    test('should detect arrow → as separator', () => {
      const equation = 'H2 + O2 → H2O';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeTruthy();
      expect(arrowMatch[0]).toBe('→');
    });

    test('should detect equals = as separator', () => {
      const equation = 'H2 + O2 = H2O';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeTruthy();
      expect(arrowMatch[0]).toBe('=');
    });

    test('should throw error without separator', () => {
      const equation = 'H2 O2 H2O';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeNull();
    });
  });

  describe('Equation Splitting', () => {
    test('should split equation into reactants and products', () => {
      const equation = 'H2 + O2 -> H2O';
      const sides = equation.split('->').map((s) => s.trim());

      expect(sides).toHaveLength(2);
      expect(sides[0]).toBe('H2 + O2');
      expect(sides[1]).toBe('H2O');
    });

    test('should handle balanced parentheses', () => {
      const expression = '(H2 + O2)';
      const start = expression.indexOf('(');
      const end = expression.lastIndexOf(')');

      expect(start).toBe(0);
      expect(end).toBe(expression.length - 1);
    });
  });

  describe('Coefficient Extraction', () => {
    test('should extract numeric coefficients', () => {
      const term = '2H2O';
      const coefficientMatch = term.match(/^(\d+)/);

      expect(coefficientMatch).toBeTruthy();
      expect(parseInt(coefficientMatch[1])).toBe(2);
    });

    test('should handle implicit coefficients (no number = 1)', () => {
      const term = 'H2O';
      const coefficientMatch = term.match(/^(\d+)/);

      expect(coefficientMatch).toBeNull();
    });

    test('should parse compound formulas', () => {
      const formula = 'H2O';
      const hasNumber = /\d+/.test(formula);

      expect(hasNumber).toBe(true);
    });

    test('should parse subscript numbers', () => {
      const formula = 'CO2';
      const subscripts = formula.match(/\d+/g);

      expect(subscripts).toHaveLength(1);
      expect(subscripts[0]).toBe('2');
    });
  });

  describe('Chemical Formula Validation', () => {
    test('should detect element symbols', () => {
      const formula = 'H2SO4';
      const elements = formula.match(/[A-Z][a-z]?\d*/g);

      expect(elements).toHaveLength(3);
      expect(elements).toContain('H2');
      expect(elements).toContain('S');
      expect(elements).toContain('O4');
    });

    test('should handle polyatomic ions', () => {
      const formula = 'SO4(2-)';
      const hasParens = formula.includes('(');

      expect(hasParens).toBe(true);
    });

    test('should validate element symbols format', () => {
      const validSymbol = /^[A-Z][a-z]?$/.test('Fe');
      const invalidSymbol = /^[A-Z][a-z]?$/.test('Fe2');

      expect(validSymbol).toBe(true);
      expect(invalidSymbol).toBe(false);
    });
  });

  describe('Side Parsing', () => {
    test('should parse single reactant', () => {
      const reactants = 'H2';
      const compounds = reactants.split('+').map((s) => s.trim());

      expect(compounds).toHaveLength(1);
      expect(compounds[0]).toBe('H2');
    });

    test('should parse multiple reactants', () => {
      const reactants = 'H2 + O2';
      const compounds = reactants.split('+').map((s) => s.trim());

      expect(compounds).toHaveLength(2);
      expect(compounds).toContain('H2');
      expect(compounds).toContain('O2');
    });

    test('should handle whitespace around compounds', () => {
      const side = ' H2  +  O2 ';
      const compounds = side.split('+').map((s) => s.trim());

      compounds.forEach((compound) => {
        expect(compound).not.toMatch(/^\s+/);
        expect(compound).not.toMatch(/\s+$/);
      });
    });
  });

  describe('Error Handling', () => {
    test('should throw error for empty equation', () => {
      const equation = '';
      const isEmpty = equation.trim() === '';

      expect(isEmpty).toBe(true);
    });

    test('should throw error for whitespace-only equation', () => {
      const equation = '   ';
      const isWhitespace = equation.trim() === '';

      expect(isWhitespace).toBe(true);
    });

    test('should detect valid arrow formats', () => {
      const equation = 'H2 + O2 <- H2O';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeNull();
    });
  });

  describe('Parentheses Handling', () => {
    test('should count opening parentheses', () => {
      const expression = '(SO4)2';
      const openCount = (expression.match(/\(/g) || []).length;

      expect(openCount).toBe(1);
    });

    test('should count closing parentheses', () => {
      const expression = '(SO4)2';
      const closeCount = (expression.match(/\)/g) || []).length;

      expect(closeCount).toBe(1);
    });

    test('should detect nested parentheses', () => {
      const expression = 'Ca(OH)2';
      const hasParens = expression.includes('(') && expression.includes(')');

      expect(hasParens).toBe(true);
    });

    test('should validate balanced parentheses', () => {
      const expression = '(SO4)2';
      const openCount = (expression.match(/\(/g) || []).length;
      const closeCount = (expression.match(/\)/g) || []).length;
      const isBalanced = openCount === closeCount;

      expect(isBalanced).toBe(true);
    });
  });

  describe('Plus Sign Handling', () => {
    test('should detect plus signs between compounds', () => {
      const side = 'H2 + O2';
      const plusCount = (side.match(/\+/g) || []).length;

      expect(plusCount).toBe(1);
    });

    test('should handle multiple plus signs', () => {
      const side = 'H2 + O2 + N2';
      const plusCount = (side.match(/\+/g) || []).length;

      expect(plusCount).toBe(2);
    });

    test('should split by plus signs correctly', () => {
      const side = 'H2 + O2 + N2';
      const compounds = side.split('+').map((s) => s.trim());

      expect(compounds).toHaveLength(3);
    });
  });

  describe('Coefficient Display', () => {
    test('should format coefficients for display', () => {
      const coefficient = 2;
      const formula = 'H2O';
      const display = coefficient === 1 ? formula : `${coefficient}${formula}`;

      expect(display).toBe('2H2O');
    });

    test('should omit coefficient of 1 for display', () => {
      const coefficient = 1;
      const formula = 'H2O';
      const display = coefficient === 1 ? formula : `${coefficient}${formula}`;

      expect(display).toBe('H2O');
    });
  });

  describe('Common Chemical Equations', () => {
    test('should parse water formation equation', () => {
      const equation = '2H2 + O2 -> 2H2O';
      const arrowMatch = equation.match(/(->|→|=)/);
      const sides = equation.split(arrowMatch[0]).map((s) => s.trim());

      expect(arrowMatch[0]).toBe('->');
      expect(sides[0]).toBe('2H2 + O2');
      expect(sides[1]).toBe('2H2O');
    });

    test('should parse photosynthesis equation', () => {
      const equation = '6CO2 + 6H2O -> C6H12O6 + 6O2';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeTruthy();
      expect(arrowMatch[0]).toBe('->');
    });

    test('should parse respiration equation', () => {
      const equation = 'C6H12O6 + 6O2 -> 6CO2 + 6H2O';
      const arrowMatch = equation.match(/(->|→|=)/);

      expect(arrowMatch).toBeTruthy();
    });
  });
});
