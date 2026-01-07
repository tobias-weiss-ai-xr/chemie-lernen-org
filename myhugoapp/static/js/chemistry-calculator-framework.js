/**
 * Reusable Calculator Framework for Chemistry Tools
 * Standardizes common patterns, input validation, and result display
 * Reduces code duplication across 15 calculators
 */

// Shared calculator framework
class ChemistryCalculator {
  constructor(config) {
    // Configuration
    this.config = {
      title: config.title || 'Chemie Rechner',
      inputFields: config.inputFields || [],
      resultFields: config.resultFields || [],
      calculations: config.calculations || {},
      validation: config.validation || {},
      units: config.units || {}
    };
    
    // DOM cache
    this.elements = {};
    this.results = {};
    
    // Initialize calculator
    this.init();
  }

  /**
   * Initialize DOM elements and set up event listeners
   */
  init() {
    // Cache DOM elements
    this.config.inputFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) {
        this.elements[field.id] = element;
        
        // Add input validation
        element.addEventListener('input', (e) => this.validateInput(field.id, e.target.value));
        
        // Add Enter key support
        element.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.calculate();
          }
        });
      }
    });

    // Cache result elements
    this.config.resultFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) {
        this.results[field.id] = element;
      }
    });

    // Add calculate button listener
    const calculateBtn = document.querySelector('.calculate-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => this.calculate());
    }
  }

  /**
   * Validate input field based on configuration rules
   * @param {string} fieldId - The field identifier
   * @param {string} value - The input value
   * @returns {boolean} True if valid
   */
  validateInput(fieldId, value) {
    const fieldConfig = this.config.inputFields.find(f => f.id === fieldId);
    if (!fieldConfig) return true;

    // Check validation rules
    const validation = this.config.validation[fieldId];
    if (!validation) return true;

    // Type validation
    if (validation.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        this.showValidationError(fieldId, 'Bitte geben Sie eine gültige Zahl ein.');
        return false;
      }
      
      if (validation.min !== undefined && numValue < validation.min) {
        this.showValidationError(fieldId, `Wert muss größer als ${validation.min} sein.`);
        return false;
      }
      
      if (validation.max !== undefined && numValue > validation.max) {
        this.showValidationError(fieldId, `Wert muss kleiner als ${validation.max} sein.`);
        return false;
      }
    }

    // Custom validation function
    if (typeof validation.validate === 'function') {
      const isValid = validation.validate(value);
      if (!isValid) {
        this.showValidationError(fieldId, validation.errorMessage || 'Ungültige Eingabe.');
        return false;
      }
    }

    // Pattern validation (regex)
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      this.showValidationError(fieldId, validation.errorMessage || 'Ungültiges Format.');
      return false;
    }

    // Clear previous error
    this.clearValidationError(fieldId);
    return true;
  }

  /**
   * Show validation error message
   * @param {string} fieldId - The field identifier
   * @param {string} message - Error message to display
   */
  showValidationError(fieldId, message) {
    const field = this.elements[fieldId];
    if (field) {
      field.classList.add('error');
      
      // Find or create error message container
      let errorContainer = field.parentNode.querySelector('.error-message');
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        field.parentNode.appendChild(errorContainer);
      }
      
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorContainer.style.display = 'none';
        field.classList.remove('error');
      }, 5000);
    }
  }

  /**
   * Clear validation error for field
   * @param {string} fieldId - The field identifier
   */
  clearValidationError(fieldId) {
    const field = this.elements[fieldId];
    if (field) {
      field.classList.remove('error');
      
      const errorContainer = field.parentNode.querySelector('.error-message');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }
  }

  /**
   * Validate all fields before calculation
   * @returns {boolean} True if all fields are valid
   */
  validateAllFields() {
    for (const fieldConfig of this.config.inputFields) {
      const element = this.elements[fieldConfig.id];
      const value = element ? element.value : '';
      
      if (!this.validateInput(fieldConfig.id, value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Perform calculation based on configuration
   */
  calculate() {
    if (!this.validateAllFields()) {
      return;
    }

    // Gather input values
    const inputs = {};
    for (const fieldConfig of this.config.inputFields) {
      const element = this.elements[fieldConfig.id];
      if (element) {
        inputs[fieldConfig.id] = this.parseValue(element.value, fieldConfig.type);
      }
    }

    try {
      // Execute calculation function
      const results = this.config.calculations.calculate(inputs);
      
      // Display results
      this.displayResults(results);
      
      // Clear any validation errors
      for (const fieldId of Object.keys(this.elements)) {
        this.clearValidationError(fieldId);
      }
      
    } catch (error) {
      // Show error message
      const errorContainer = document.querySelector('.calculator-error') || this.createErrorContainer();
      errorContainer.textContent = `Berechnungsfehler: ${error.message}`;
      errorContainer.style.display = 'block';
      
      console.error('Calculation error:', error);
    }
  }

  /**
   * Parse input value based on field type
   * @param {string} value - Raw input value
   * @param {string} type - Field type (number, select, etc.)
   * @returns {any} Parsed value
   */
  parseValue(value, type) {
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
      
      case 'select':
      return value;
      
      case 'checkbox':
        return value === 'on' || value === 'true';
      
      case 'text':
      default:
        return value.toString().trim();
    }
  }

  /**
   * Display calculation results
   * @param {Object} results - Calculation results
   */
  displayResults(results) {
    for (const [fieldId, value] of Object.entries(results)) {
      const resultElement = this.results[fieldId];
      if (resultElement) {
        resultElement.textContent = value;
        resultElement.style.display = 'block';
        
        // Add animation for result appearance
        resultElement.classList.add('result-updated');
        setTimeout(() => {
          resultElement.classList.remove('result-updated');
        }, 300);
      }
    }
  }

  /**
   * Create error container for displaying calculation errors
   * @returns {HTMLElement} Error container element
   */
  createErrorContainer() {
    const container = document.createElement('div');
    container.className = 'calculator-error';
    container.style.display = 'none';
    container.style.padding = '10px';
    container.style.marginBottom = '10px';
    container.style.border = '1px solid #dc3545';
    container.style.borderRadius = '4px';
    container.style.backgroundColor = '#f8d7da';
    container.style.color = '#721c24';
    return container;
  }
}

// Export for global use
window.ChemistryCalculator = ChemistryCalculator;