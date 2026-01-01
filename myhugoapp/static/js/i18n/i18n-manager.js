/**
 * Internationalization (i18n) Manager
 * Handles multi-language support for the chemistry education platform
 */

const I18nManager = {
  // Current language
  currentLocale: 'de',

  // Default language
  defaultLocale: 'de',

  // Supported languages
  supportedLocales: ['de', 'en', 'es', 'fr', 'it'],

  // Language names in native script
  languageNames: {
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    it: 'Italiano'
  },

  // Translation cache
  translations: {},

  // Plural rules for different languages
  pluralRules: {
    de: (n) => n === 1 ? 0 : 1, // German: 1 singular, other plural
    en: (n) => n === 1 ? 0 : 1, // English: 1 singular, other plural
    es: (n) => n === 1 ? 0 : 1, // Spanish: 1 singular, other plural
    fr: (n) => n === 1 ? 0 : 1, // French: 1 singular, other plural
    it: (n) => n === 1 ? 0 : 1  // Italian: 1 singular, other plural
  },

  /**
   * Initialize i18n manager
   * Detects language from browser, localStorage, or URL
   */
  init() {
    // Try to get saved language preference
    const savedLocale = localStorage.getItem('preferredLocale');
    if (savedLocale && this.isLocaleSupported(savedLocale)) {
      this.currentLocale = savedLocale;
      return;
    }

    // Detect from browser
    const browserLocale = this.detectBrowserLocale();
    if (browserLocale) {
      this.currentLocale = browserLocale;
      this.saveLocalePreference(browserLocale);
      return;
    }

    // Fall back to default
    this.currentLocale = this.defaultLocale;
  },

  /**
   * Detect language from browser settings
   */
  detectBrowserLocale() {
    if (typeof navigator === 'undefined') return null;

    // Get browser language
    const browserLang = navigator.language || navigator.userLanguage;

    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0];

    // Check if full locale is supported
    if (this.isLocaleSupported(browserLang)) {
      return browserLang;
    }

    // Check if language code is supported
    if (this.isLocaleSupported(langCode)) {
      return langCode;
    }

    return null;
  },

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale) {
    return this.supportedLocales.includes(locale);
  },

  /**
   * Set current language
   */
  setLocale(locale) {
    if (!this.isLocaleSupported(locale)) {
      console.warn(`Locale '${locale}' is not supported. Supported locales: ${this.supportedLocales.join(', ')}`);
      return false;
    }

    this.currentLocale = locale;
    this.saveLocalePreference(locale);

    // Dispatch event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('localeChange', { detail: { locale } }));
    }

    return true;
  },

  /**
   * Get current locale
   */
  getLocale() {
    return this.currentLocale;
  },

  /**
   * Save locale preference to localStorage
   */
  saveLocalePreference(locale) {
    try {
      localStorage.setItem('preferredLocale', locale);
    } catch (error) {
      console.error('Error saving locale preference:', error);
    }
  },

  /**
   * Load translations for a locale
   */
  async loadTranslations(locale) {
    if (this.translations[locale]) {
      return this.translations[locale];
    }

    try {
      const response = await fetch(`/static/i18n/locales/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}`);
      }
      this.translations[locale] = await response.json();
      return this.translations[locale];
    } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
      return {};
    }
  },

  /**
   * Translate a key
   * Supports nested keys with dot notation (e.g., 'calculator.title')
   */
  t(key, options = {}) {
    const translations = this.translations[this.currentLocale] || {};

    // Support nested keys
    const value = key.split('.').reduce((obj, k) => obj && obj[k], translations);

    if (value === undefined) {
      console.warn(`Translation key '${key}' not found for locale '${this.currentLocale}'`);
      return key;
    }

    // Handle pluralization
    if (options.count !== undefined && typeof value === 'object') {
      const pluralIndex = this.getPluralIndex(options.count);
      const pluralValue = value[pluralIndex];
      if (pluralValue) {
        return this.interpolate(pluralValue, options);
      }
    }

    // Handle simple string
    if (typeof value === 'string') {
      return this.interpolate(value, options);
    }

    return key;
  },

  /**
   * Get plural index for a count
   */
  getPluralIndex(count) {
    const pluralRule = this.pluralRules[this.currentLocale] || this.pluralRules.en;
    return pluralRule(count);
  },

  /**
   * Interpolate variables into translation string
   * Supports {{variable}} syntax
   */
  interpolate(template, options) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return options[key] !== undefined ? options[key] : match;
    });
  },

  /**
   * Format date according to locale
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    try {
      return new Date(date).toLocaleDateString(this.currentLocale, { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date(date).toLocaleDateString();
    }
  },

  /**
   * Format number according to locale
   */
  formatNumber(number, options = {}) {
    const defaultOptions = {
      maximumFractionDigits: 2
    };

    try {
      return new Intl.NumberFormat(this.currentLocale, { ...defaultOptions, ...options }).format(number);
    } catch (error) {
      console.error('Error formatting number:', error);
      return number.toString();
    }
  },

  /**
   * Format percentage according to locale
   */
  formatPercent(number, options = {}) {
    const defaultOptions = {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    };

    try {
      return new Intl.NumberFormat(this.currentLocale, { ...defaultOptions, ...options }).format(number / 100);
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return `${number}%`;
    }
  },

  /**
   * Get all supported locales with their native names
   */
  getSupportedLanguages() {
    return this.supportedLocales.map(locale => ({
      code: locale,
      name: this.languageNames[locale]
    }));
  },

  /**
   * Get language direction (LTR or RTL)
   */
  getDirection() {
    // Most languages are LTR, Arabic/Hebrew are RTL
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.includes(this.currentLocale) ? 'rtl' : 'ltr';
  },

  /**
   * Translate HTML element and its children with data-i18n attributes
   */
  translateElement(element) {
    if (!element) return;

    // Translate element with data-i18n attribute
    const key = element.getAttribute('data-i18n');
    if (key) {
      const translation = this.t(key);

      // Check if it's an attribute translation
      const attr = element.getAttribute('data-i18n-attr');
      if (attr) {
        element.setAttribute(attr, translation);
      } else {
        element.textContent = translation;
      }
    }

    // Translate children
    const children = element.querySelectorAll('[data-i18n]');
    children.forEach(child => this.translateElement(child));
  },

  /**
   * Translate all elements with data-i18n attributes in the document
   */
  translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => this.translateElement(element));
  },

  /**
   * Export current translations (for debugging/testing)
   */
  exportTranslations() {
    return this.translations[this.currentLocale] || {};
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  I18nManager.init();

  // Expose to global scope for easy access
  window.I18nManager = I18nManager;
  window.t = (key, options) => I18nManager.t(key, options);
  window.__ = (key, options) => I18nManager.t(key, options);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
