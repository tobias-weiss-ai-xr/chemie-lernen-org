/**
 * Security Utilities for Calculator
 * Provides input validation, sanitization, and XSS prevention
 */

const SecurityUtils = {
  /**
   * Sanitize HTML input to prevent XSS attacks
   * @param {string} input - Raw user input
   * @returns {string} - Sanitized input
   */
  sanitizeHTML(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous HTML elements
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  },

  /**
   * Validate numeric input
   * @param {*} value - Value to validate
   * @param {object} options - Validation options
   * @returns {object} - Validation result with isValid and error
   */
  validateNumber(value, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      allowZero = true,
      required = true
    } = options;

    // Check if required and empty
    if (required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    // Allow empty if not required
    if (!required && (value === null || value === undefined || value === '')) {
      return { isValid: true };
    }

    // Check if numeric
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, error: 'Please enter a valid number' };
    }

    // Check minimum
    if (num < min) {
      return { isValid: false, error: 'Value must be at least ' + min };
    }

    // Check maximum
    if (num > max) {
      return { isValid: false, error: 'Value must be at most ' + max };
    }

    // Check zero
    if (!allowZero && num === 0) {
      return { isValid: false, error: 'Value cannot be zero' };
    }

    return { isValid: true, value: num };
  },

  /**
   * Validate chemical formula
   * @param {string} formula - Formula to validate
   * @returns {object} - Validation result
   */
  validateChemicalFormula(formula) {
    if (!formula || typeof formula !== 'string') {
      return { isValid: false, error: 'Formula is required' };
    }

    // Basic chemical formula pattern
    const formulaPattern = /^[A-Z][a-z]?\d*(\([A-Z][a-z]?\d*(\+[A-Z][a-z]?\d*)*\)\d*)?$/;

    if (!formulaPattern.test(formula)) {
      return { isValid: false, error: 'Invalid chemical formula format' };
    }

    // Check for dangerous characters
    const dangerousChars = /<script|javascript:|onerror|onload|onclick/i;
    if (dangerousChars.test(formula)) {
      return { isValid: false, error: 'Formula contains invalid characters' };
    }

    return { isValid: true, value: this.sanitizeHTML(formula) };
  },

  /**
   * Validate equation input
   * @param {string} equation - Equation to validate
   * @returns {object} - Validation result
   */
  validateEquation(equation) {
    if (!equation || typeof equation !== 'string') {
      return { isValid: false, error: 'Equation is required' };
    }

    // Check for injection attempts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror/i,
      /onload/i,
      /onclick/i,
      /eval\(/i,
      /document\./i,
      /window\./i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(equation)) {
        return { isValid: false, error: 'Equation contains invalid characters' };
      }
    }

    return { isValid: true, value: this.sanitizeHTML(equation) };
  },

  /**
   * Sanitize and validate percentage input
   * @param {*} value - Percentage value
   * @returns {object} - Validation result
   */
  validatePercentage(value) {
    const result = this.validateNumber(value, {
      min: 0,
      max: 100,
      required: true
    });

    if (result.isValid) {
      return { isValid: true, value: result.value };
    }

    return { isValid: false, error: 'Percentage must be between 0 and 100' };
  },

  /**
   * Escape special characters for regex
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegExp(string) {
    if (typeof string !== 'string') {
      return '';
    }

    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Validate and sanitize text input
   * @param {string} text - Text input
   * @param {object} options - Validation options
   * @returns {object} - Validation result
   */
  validateText(text, options = {}) {
    const {
      maxLength = 1000,
      minLength = 0,
      required = false,
      allowHTML = false
    } = options;

    if (required && !text) {
      return { isValid: false, error: 'This field is required' };
    }

    if (!text && !required) {
      return { isValid: true, value: '' };
    }

    if (typeof text !== 'string') {
      return { isValid: false, error: 'Invalid input type' };
    }

    if (text.length < minLength) {
      return { isValid: false, error: 'Minimum length is ' + minLength + ' characters' };
    }

    if (text.length > maxLength) {
      return { isValid: false, error: 'Maximum length is ' + maxLength + ' characters' };
    }

    // Sanitize if HTML not allowed
    const value = allowHTML ? text : this.sanitizeHTML(text);

    return { isValid: true, value };
  },

  /**
   * Rate limiter for preventing abuse
   * @param {string} key - Identifier for rate limit
   * @param {number} limit - Max requests
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} - Whether request is allowed
   */
  rateLimit(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const storageKey = 'ratelimit_' + key;

    try {
      const data = JSON.parse(sessionStorage.getItem(storageKey) || '{"requests":[],"windowStart":' + now + '}');

      // Reset window if expired
      if (now - data.windowStart > windowMs) {
        data.requests = [];
        data.windowStart = now;
      }

      // Remove old requests
      data.requests = data.requests.filter(function(time) { return now - time < windowMs; });

      // Check limit
      if (data.requests.length >= limit) {
        return false;
      }

      // Add current request
      data.requests.push(now);
      sessionStorage.setItem(storageKey, JSON.stringify(data));

      return true;
    } catch (e) {
      // If sessionStorage fails, allow request
      console.warn('Rate limiting unavailable:', e);
      return true;
    }
  },

  /**
   * Create CSRF token for forms
   * @returns {string} - CSRF token
   */
  generateCSRFToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(function(b) { return b.toString(16).padStart(2, '0'); })
      .join('');

    try {
      sessionStorage.setItem('csrf_token', token);
    } catch (e) {
      console.warn('Unable to store CSRF token:', e);
    }

    return token;
  },

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} - Whether token is valid
   */
  validateCSRFToken(token) {
    try {
      const stored = sessionStorage.getItem('csrf_token');
      return stored === token;
    } catch (e) {
      console.warn('Unable to validate CSRF token:', e);
      return false;
    }
  }
};

// Export for use in calculator modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}
