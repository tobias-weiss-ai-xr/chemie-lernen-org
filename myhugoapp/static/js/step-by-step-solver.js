/**
 * Step-by-Step Solver for Chemistry Calculators
 * Shows calculation work in a structured, readable format
 */

/**
 * StepByStepSolver - Manages and displays calculation steps
 */
class StepByStepSolver {
  /**
   * Create a new StepByStepSolver instance
   */
  constructor() {
    /** @private {Array} Array of calculated steps */
    this.steps = [];
    /** @private {number} Next step ID to assign */
    this.nextId = 1;
  }

  /**
   * Add a calculation step with description and calculation details.
   * @param {string} description - Step description
   * @param {Object} [calculation] - {formula, inputs, result, unit}
   * @returns {StepByStepSolver} For method chaining
   * @throws {Error} If description is empty
   */
  addStep(description, calculation = {}) {
    if (!description || typeof description !== 'string' || description.trim() === '') {
      throw new Error('Step description is required and must be a non-empty string');
    }

    const step = {
      id: this.nextId++,
      description: description.trim(),
      formula: calculation.formula || '',
      inputs: calculation.inputs || {},
      result: calculation.result !== undefined ? calculation.result : null,
      unit: calculation.unit || '',
      timestamp: Date.now(),
    };

    this.steps.push(step);

    // Emit custom event for step addition
    this._emit('step:add', { step, steps: this.steps });

    return this;
  }

  /** Get all steps. @returns {Array} */
  getSteps() {
    return [...this.steps];
  }

  /** Get step count. @returns {number} */
  getStepCount() {
    return this.steps.length;
  }

  /** Clear all steps and emit step:clear event. @returns {StepByStepSolver} */
  clear() {
    const previousSteps = [...this.steps];
    this.steps = [];
    this.nextId = 1;

    // Emit custom event for clearing
    this._emit('step:clear', { previousSteps });

    return this;
  }

  /** Render all steps as HTML string. @returns {string} */
  renderHTML() {
    if (this.steps.length === 0) {
      return '<div class="step-by-step-solver"><div class="solver-content"><p class="no-steps-msg">No steps calculated yet.</p></div></div>';
    }
    let html =
      '<div class="step-by-step-solver">\n  <div class="solver-header">\n    <h3>Step-by-Step Solution</h3>\n    <div class="step-count">' +
      this.steps.length +
      ' steps</div>\n    <button type="button" class="toggle-solver" aria-expanded="true">Show/Hide Details</button>\n  </div>\n  <div class="solver-content">\n';
    for (const step of this.steps) {
      html += this._renderSingleStep(step);
    }
    return html + '  </div>\n</div>\n';
  }

  /** Render single step as HTML. @param {Object} step - Step object. @returns {string} */
  _renderSingleStep(step) {
    let html =
      '    <div class="step" data-step-id="' +
      step.id +
      '">\n' +
      '      <div class="step-header">\n' +
      '        <span class="step-number">' +
      step.id +
      '</span>\n' +
      '        <span class="step-description">' +
      this._escapeHtml(step.description) +
      '</span>\n' +
      '      </div>\n' +
      '      <div class="step-calculation">\n';
    if (step.formula) {
      html +=
        '        <div class="calculation-info">\n' +
        '          <span class="formula">Formula: <code>' +
        this._escapeHtml(step.formula) +
        '</code></span>\n' +
        '        </div>\n';
    }
    if (Object.keys(step.inputs).length > 0) {
      html +=
        '        <div class="calculation-inputs">\n' +
        '          <span class="inputs-label">Inputs:</span>\n';
      const inputsHtml = Object.entries(step.inputs)
        .map(
          ([k, v]) =>
            '<span class="input-item"><strong>' +
            this._escapeHtml(k) +
            '</strong> = ' +
            this._escapeHtml(String(v)) +
            '</span>'
        )
        .join('  \n');
      html += '          ' + inputsHtml + '\n' + '        </div>\n';
    }
    if (step.result !== null && step.result !== undefined) {
      html +=
        '        <div class="calculation-result">\n' +
        '          <span class="result-label">Result:</span>\n' +
        '          <span class="result-value">' +
        this._escapeHtml(String(step.result)) +
        '</span>';
      if (step.unit) {
        html += '          <span class="result-unit">' + this._escapeHtml(step.unit) + '</span>\n';
      }
      html += '        </div>\n';
    }
    return html + '      </div>\n</div>\n';
  }

  /** Escape HTML special chars. @param {string} text - Text to escape. @returns {string} Escaped text. */
  _escapeHtml(text) {
    const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }

  /** Emit custom event with detail. @param {string} eventName - Event name. @param {Object} detail - Event data. */
  _emit(eventName, detail) {
    if (typeof window !== 'undefined' && window.CustomEvent) {
      const event = new CustomEvent(eventName, {
        detail: detail,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    }
  }

  /** Attach event listener. @param {string} eventName - Event name. @param {Function} handler - Handler. @returns {StepByStepSolver} */
  on(eventName, handler) {
    if (typeof window !== 'undefined') {
      window.addEventListener(eventName, handler);
    }
    return this;
  }

  /** Remove event listener. @param {string} eventName - Event name. @param {Function} handler - Handler. @returns {StepByStepSolver} */
  off(eventName, handler) {
    if (typeof window !== 'undefined') {
      window.removeEventListener(eventName, handler);
    }
    return this;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StepByStepSolver };
}

if (typeof window !== 'undefined') {
  window.StepByStepSolver = StepByStepSolver;
}
