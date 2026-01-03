/**
 * Language Switcher Component
 * Provides UI for switching between languages
 */

const LanguageSwitcher = {
  /**
   * Create language switcher dropdown
   */
  create(options = {}) {
    const {
      containerId = 'language-switcher',
      showFlags = true,
      showNativeNames = true,
      onSelect = null
    } = options;

    // Get supported languages
    const languages = I18nManager.getSupportedLanguages();

    // Create container
    const container = document.createElement('div');
    container.id = containerId;
    container.className = 'language-switcher';

    // Create select element
    const select = document.createElement('select');
    select.className = 'language-select';
    select.setAttribute('aria-label', I18nManager.t('settings.language') || 'Language');

    // Add options
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;

      // Option text with flag and native name
      let text = '';
      if (showFlags) {
        text += `${this.getFlag(lang.code)} `;
      }
      text += lang.name;
      if (showNativeNames && lang.code !== I18nManager.getLocale()) {
        text += ` (${lang.name})`;
      }

      option.textContent = text;
      option.selected = lang.code === I18nManager.getLocale();

      select.appendChild(option);
    });

    // Handle language change
    select.addEventListener('change', (e) => {
      const newLocale = e.target.value;
      const success = I18nManager.setLocale(newLocale);

      if (success) {
        // Update page content
        I18nManager.translatePage();

        // Update HTML lang attribute
        document.documentElement.lang = newLocale;

        // Update dir attribute for RTL languages
        document.documentElement.dir = I18nManager.getDirection();

        // Call custom callback
        if (onSelect) {
          onSelect(newLocale);
        }
      }
    });

    container.appendChild(select);

    // Add styles
    this.addStyles();

    return container;
  },

  /**
   * Get emoji flag for language code
   */
  getFlag(locale) {
    const flags = {
      de: '🇩🇪',
      en: '🇬🇧',
      es: '🇪🇸',
      fr: '🇫🇷',
      it: '🇮🇹'
    };
    return flags[locale] || '🌐';
  },

  /**
   * Add CSS styles for language switcher
   */
  addStyles() {
    // Check if styles already added
    if (document.getElementById('language-switcher-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'language-switcher-styles';
    style.textContent = `
      .language-switcher {
        position: relative;
        display: inline-block;
      }

      .language-select {
        padding: 8px 32px 8px 12px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #fff;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 16px;
        padding-right: 32px;
      }

      .language-select:hover {
        border-color: #888;
      }

      .language-select:focus {
        outline: none;
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
      }

      /* Dark theme support */
      @media (prefers-color-scheme: dark) {
        .language-select {
          background-color: #2c2c2c;
          color: #fff;
          border-color: #555;
        }

        .language-select:hover {
          border-color: #777;
        }
      }

      /* Responsive design */
      @media (max-width: 600px) {
        .language-select {
          font-size: 16px; /* Prevent zoom on iOS */
        }
      }

      /* RTL support */
      [dir="rtl"] .language-select {
        background-position: left 8px center;
        padding-right: 12px;
        padding-left: 32px;
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Initialize language switcher in a container
   */
  init(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container '${containerId}' not found`);
      return null;
    }

    const switcher = this.create({
      ...options,
      containerId
    });

    container.appendChild(switcher);

    // Set initial HTML lang attribute
    document.documentElement.lang = I18nManager.getLocale();
    document.documentElement.dir = I18nManager.getDirection();

    return switcher;
  },

  /**
   * Create compact button version
   */
  createButton(options = {}) {
    const {
      showFlag = true,
      showCode = false,
      onClick = null
    } = options;

    const button = document.createElement('button');
    button.className = 'language-button';
    button.type = 'button';
    button.setAttribute('aria-label', I18nManager.t('settings.language') || 'Language');

    let content = '';
    if (showFlag) {
      content += `<span class="flag">${this.getFlag(I18nManager.getLocale())}</span>`;
    }
    if (showCode) {
      content += `<span class="code">${I18nManager.getLocale().toUpperCase()}</span>`;
    }
    button.innerHTML = content;

    // Create dropdown menu
    const menu = this.createDropdown();
    button.appendChild(menu);

    // Toggle menu
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });

    // Handle language selection
    menu.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const locale = e.currentTarget.dataset.locale;
        I18nManager.setLocale(locale);
        I18nManager.translatePage();
        document.documentElement.lang = locale;
        document.documentElement.dir = I18nManager.getDirection();
        menu.classList.remove('show');

        // Update button content
        if (showFlag) {
          button.querySelector('.flag').textContent = this.getFlag(locale);
        }
        if (showCode) {
          button.querySelector('.code').textContent = locale.toUpperCase();
        }

        if (onClick) {
          onClick(locale);
        }
      });
    });

    this.addButtonStyles();

    return button;
  },

  /**
   * Create dropdown menu for button
   */
  createDropdown() {
    const menu = document.createElement('div');
    menu.className = 'language-dropdown';

    const languages = I18nManager.getSupportedLanguages();
    languages.forEach(lang => {
      const option = document.createElement('div');
      option.className = 'language-option';
      option.dataset.locale = lang.code;
      option.textContent = `${this.getFlag(lang.code)} ${lang.name}`;
      menu.appendChild(option);
    });

    return menu;
  },

  /**
   * Add styles for button version
   */
  addButtonStyles() {
    if (document.getElementById('language-button-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'language-button-styles';
    style.textContent = `
      .language-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #fff;
        cursor: pointer;
        color: #333;
      }

      .language-button:hover {
        background-color: #f5f5f5;
      }

      .language-button .flag {
        font-size: 18px;
      }

      .language-button .code {
        font-weight: 500;
      }

      .language-dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 150px;
      }

      .language-dropdown.show {
        display: block;
      }

      .language-option {
        padding: 10px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .language-option:hover {
        background-color: #f5f5f5;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        .language-button {
          background-color: #2c2c2c;
          color: #fff;
          border-color: #555;
        }

        .language-button:hover {
          background-color: #3c3c3c;
        }

        .language-dropdown {
          background-color: #2c2c2c;
          border-color: #555;
        }

        .language-option:hover {
          background-color: #3c3c3c;
        }
      }

      /* RTL support */
      [dir="rtl"] .language-dropdown {
        left: auto;
        right: 0;
      }
    `;

    document.head.appendChild(style);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageSwitcher;
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.LanguageSwitcher = LanguageSwitcher;
}
