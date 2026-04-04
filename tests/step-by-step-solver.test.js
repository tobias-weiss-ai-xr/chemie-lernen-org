/**
 * Unit Tests for StepByStepSolver
 */

const { StepByStepSolver } = require('../myhugoapp/static/js/step-by-step-solver.js');

describe('StepByStepSolver - Construction', () => {
  test('should create instance with empty steps', () => {
    const solver = new StepByStepSolver();
    expect(solver.steps).toEqual([]);
    expect(solver.getStepCount()).toBe(0);
  });

  test('should start with nextId of 1', () => {
    const solver = new StepByStepSolver();
    expect(solver.nextId).toBe(1);
  });
});

describe('StepByStepSolver - addStep', () => {
  test('should add step with description only', () => {
    const solver = new StepByStepSolver();
    const result = solver.addStep('Calculate pH');
    expect(result).toBe(solver); // method chaining
    expect(solver.getStepCount()).toBe(1);
  });

  test('should add step with full calculation object', () => {
    const solver = new StepByStepSolver();
    solver.addStep('pH from H+', {
      formula: 'pH = -log10([H+])',
      inputs: { '[H+]': 1e-7 },
      result: 7.0,
      unit: 'pH',
    });
    const steps = solver.getSteps();
    expect(steps[0].formula).toBe('pH = -log10([H+])');
    expect(steps[0].inputs).toEqual({ '[H+]': 1e-7 });
    expect(steps[0].result).toBe(7.0);
    expect(steps[0].unit).toBe('pH');
  });

  test('should auto-increment step IDs', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step 1');
    solver.addStep('Step 2');
    solver.addStep('Step 3');
    const steps = solver.getSteps();
    expect(steps[0].id).toBe(1);
    expect(steps[1].id).toBe(2);
    expect(steps[2].id).toBe(3);
  });

  test('should throw error for empty description', () => {
    const solver = new StepByStepSolver();
    expect(() => solver.addStep('')).toThrow('Step description is required');
  });

  test('should throw error for whitespace-only description', () => {
    const solver = new StepByStepSolver();
    expect(() => solver.addStep('   ')).toThrow('Step description is required');
  });

  test('should throw error for non-string description', () => {
    const solver = new StepByStepSolver();
    expect(() => solver.addStep(null)).toThrow('Step description is required');
  });

  test('should throw error for undefined description', () => {
    const solver = new StepByStepSolver();
    expect(() => solver.addStep(undefined)).toThrow('Step description is required');
  });

  test('should trim description whitespace', () => {
    const solver = new StepByStepSolver();
    solver.addStep('  Calculate pH  ');
    expect(solver.getSteps()[0].description).toBe('Calculate pH');
  });

  test('should set default values for missing calculation fields', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step');
    const step = solver.getSteps()[0];
    expect(step.formula).toBe('');
    expect(step.inputs).toEqual({});
    expect(step.result).toBeNull();
    expect(step.unit).toBe('');
  });

  test('should support method chaining', () => {
    const solver = new StepByStepSolver();
    const result = solver.addStep('Step 1').addStep('Step 2').addStep('Step 3');
    expect(result).toBe(solver);
    expect(solver.getStepCount()).toBe(3);
  });

  test('each step should have a timestamp', () => {
    const solver = new StepByStepSolver();
    const before = Date.now();
    solver.addStep('Test');
    const after = Date.now();
    const step = solver.getSteps()[0];
    expect(step.timestamp).toBeGreaterThanOrEqual(before);
    expect(step.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('StepByStepSolver - getSteps', () => {
  test('should return a copy of steps array', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step 1');
    const steps = solver.getSteps();
    steps.push({ id: 999 });
    expect(solver.getStepCount()).toBe(1); // original not modified
  });
});

describe('StepByStepSolver - clear', () => {
  test('should clear all steps', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step 1');
    solver.addStep('Step 2');
    const result = solver.clear();
    expect(solver.getStepCount()).toBe(0);
    expect(solver.steps).toEqual([]);
    expect(result).toBe(solver); // method chaining
  });

  test('should reset nextId to 1 after clear', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step 1');
    solver.addStep('Step 2');
    solver.clear();
    expect(solver.nextId).toBe(1);
  });

  test('new steps after clear should start at id 1', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step 1');
    solver.clear();
    solver.addStep('New Step');
    expect(solver.getSteps()[0].id).toBe(1);
  });
});

describe('StepByStepSolver - renderHTML', () => {
  test('should render no-steps message when empty', () => {
    const solver = new StepByStepSolver();
    const html = solver.renderHTML();
    expect(html).toContain('No steps calculated yet');
    expect(html).toContain('step-by-step-solver');
  });

  test('should render step container with steps', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Calculate pH', { formula: 'pH = -log10[H+]', result: 7, unit: 'pH' });
    const html = solver.renderHTML();
    expect(html).toContain('Step-by-Step Solution');
    expect(html).toContain('1 steps');
    expect(html).toContain('Calculate pH');
    expect(html).toContain('pH = -log10[H+]');
    expect(html).toContain('7');
  });

  test('should escape HTML in description', () => {
    const solver = new StepByStepSolver();
    solver.addStep('<script>alert("xss")</script>');
    const html = solver.renderHTML();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('should escape HTML in formula', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step', { formula: '<b>bold</b>' });
    const html = solver.renderHTML();
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
  });

  test('should escape HTML in result', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step', { result: '<img onerror="hack">' });
    const html = solver.renderHTML();
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  test('should render inputs section', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step', { inputs: { '[H+]': 1e-7, Temp: 25 } });
    const html = solver.renderHTML();
    expect(html).toContain('Inputs:');
    expect(html).toContain('[H+]');
    expect(html).toContain('1e-7');
  });

  test('should render result with unit', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step', { result: 7.0, unit: 'pH' });
    const html = solver.renderHTML();
    expect(html).toContain('Result:');
    expect(html).toContain('7');
    expect(html).toContain('pH');
  });

  test('should not render inputs section when empty', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step', { inputs: {} });
    const html = solver.renderHTML();
    expect(html).not.toContain('Inputs:');
  });

  test('should not render result section when null', () => {
    const solver = new StepByStepSolver();
    solver.addStep('Step', { result: null });
    const html = solver.renderHTML();
    expect(html).not.toContain('Result:');
  });
});

describe('StepByStepSolver - _escapeHtml', () => {
  test('should escape ampersand', () => {
    const solver = new StepByStepSolver();
    expect(solver._escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('should escape less-than', () => {
    const solver = new StepByStepSolver();
    expect(solver._escapeHtml('a < b')).toBe('a &lt; b');
  });

  test('should escape greater-than', () => {
    const solver = new StepByStepSolver();
    expect(solver._escapeHtml('a > b')).toBe('a &gt; b');
  });

  test('should escape double quotes', () => {
    const solver = new StepByStepSolver();
    expect(solver._escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test('should escape single quotes', () => {
    const solver = new StepByStepSolver();
    expect(solver._escapeHtml("it's")).toBe('it&#39;s');
  });

  test('should handle plain text without changes', () => {
    const solver = new StepByStepSolver();
    expect(solver._escapeHtml('hello world')).toBe('hello world');
  });
});

describe('StepByStepSolver - Real-World pH Calculation', () => {
  test('should track multi-step pH calculation', () => {
    const solver = new StepByStepSolver();
    const hplus = 1e-3;

    solver.addStep('Schritt 1: pH aus H+-Konzentration', {
      formula: 'pH = -log10([H+])',
      inputs: { '[H+]': hplus },
      result: null,
    });

    const ph = -Math.log10(hplus);
    solver.addStep('pH berechnen', {
      formula: `pH = -log10(${hplus.toExponential(2)})`,
      inputs: { '-log10([H+])': ph },
      result: ph,
      unit: 'pH',
    });

    expect(solver.getStepCount()).toBe(2);
    expect(solver.getSteps()[1].result).toBeCloseTo(3.0, 2);
  });

  test('should track multi-step OH- to pH conversion', () => {
    const solver = new StepByStepSolver();
    const ohminus = 1e-5;

    const poh = -Math.log10(ohminus);
    solver.addStep('pOH berechnen', {
      formula: 'pOH = -log10([OH-])',
      inputs: { '[OH-]': ohminus },
      result: poh,
      unit: 'pOH',
    });

    const ph = 14 - poh;
    solver.addStep('pH aus pOH', {
      formula: 'pH = 14 - pOH',
      inputs: { pOH: poh },
      result: ph,
      unit: 'pH',
    });

    expect(solver.getStepCount()).toBe(2);
    expect(solver.getSteps()[1].result).toBeCloseTo(9.0, 2);
  });
});
