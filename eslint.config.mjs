import js from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';

export default [
  // Ignore files
  {
    ignores: [
      'node_modules/**',
      'myhugoapp/public/**',
      'myhugoapp/resources/_gen/**',
      'coverage/**',
      'test-results/**',
      '.playwright-artifacts/**',
      'myhugoapp/static/js/third-party/**',
      'myhugoapp/static/js/vendor/**',
      '*.min.js',
      'myhugoapp/static/js/three.module.js',
      'myhugoapp/static/js/three/three.core.js',
      'myhugoapp/static/js/three/TrackballControls.js',
      'myhugoapp/static/js/addons/**',
      '*.generated.js',
      '.hugo_build.lock',
    ],
  },

  // Global defaults
  js.configs.recommended,

  // All static JS files - base configuration (script type)
  {
    files: ['myhugoapp/static/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        WebSocket: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        TouchEvent: 'readonly',
        FormData: 'readonly',
        fetch: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        performance: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        ImageData: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        WebGLRenderingContext: 'readonly',
        location: 'readonly',
        self: 'readonly',
        OffscreenCanvas: 'readonly',
        ImageBitmap: 'readonly',
        VideoFrame: 'readonly',
        XRWebGLBinding: 'readonly',
        XRWebGLLayer: 'readonly',
        AnalyticsManager: 'writable',
        I18nManager: 'writable',
        THREE: 'writable',
        __THREE_DEVTOOLS__: 'writable',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-extra-semi': 'error',
      'no-irregular-whitespace': 'error',
      'no-trailing-spaces': 'error',
      'no-unsafe-negation': 'error',
      'valid-typeof': 'error',
      'no-useless-escape': 'off',
    },
  },

  // Calculator files - additional rules
  {
    files: ['myhugoapp/static/js/calculators/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'curly': ['error', 'all'],
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-return-await': 'warn',
      'require-await': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'object-shorthand': ['warn', 'always'],
      'prefer-arrow-callback': 'warn',
    },
  },

  // I18n files - module/exports globals
  {
    files: ['myhugoapp/static/js/i18n/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
      },
    },
  },

  // Analytics files - module/exports globals
  {
    files: ['myhugoapp/static/js/analytics/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
      },
    },
  },

  // Visualization files - module/exports globals
  {
    files: ['myhugoapp/static/js/visualization/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        THREE: 'readonly',
      },
    },
  },

  // Other files with module/exports - quiz, progress tracker, etc.
  {
    files: [
      'myhugoapp/static/js/lazy-loader.js',
      'myhugoapp/static/js/progress-tracker.js',
      'myhugoapp/static/js/quiz-system.js',
      'myhugoapp/static/js/quiz-user-system.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
      },
    },
  },

  // Chemistry calculator files - with chemistry-utils globals
  {
    files: [
      'myhugoapp/static/js/molare-masse-rechner.js',
      'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js',
      'myhugoapp/static/js/stoichiometry.js',
      'myhugoapp/static/js/loeslichkeitsprodukt-rechner.js',
      'myhugoapp/static/js/redox-potenzial-rechner.js',
      'myhugoapp/static/js/konzentrationsumrechner.js',
      'myhugoapp/static/js/verbrennungsrechner.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        parseFormula: 'readonly',
        parseScientificNotation: 'readonly',
        getMolarMass: 'readonly',
        formatScientificNotation: 'readonly',
        getElementCount: 'readonly',
        validateFormula: 'readonly',
      },
    },
  },

  // ES Module files - override with module type
  {
    files: [
      'myhugoapp/static/js/perioden-system-der-elemente.js',
      'myhugoapp/static/js/molekuel-studio.js',
      'myhugoapp/static/js/three/**/*.js',
      'myhugoapp/static/js/**/*.module.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        performance: 'readonly',
      },
    },
  },

  // Test files
  {
    files: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...jestPlugin.environments.globals.globals,
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-undef': 'off',
    },
  },

  // Config files
  {
    files: ['eslint.config.js', '.prettierrc.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
];
