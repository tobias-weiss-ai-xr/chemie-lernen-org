import js from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  // Ignore files
  {
    ignores: [
      'node_modules/**',
      '.core/**',
      'graph-backup-repo/**',
      'myhugoapp/public/**',
      'myhugoapp/resources/_gen/**',
      'coverage/**',
      'test-results/**',
      '.playwright-artifacts/**',
      '.playwright-mcp/**',
      '**/curricula-venv/**',
      'myhugoapp/static/js/third-party/**',
      'myhugoapp/static/js/vendor/**',
      '*.min.js',
      'myhugoapp/static/js/**/*.min.js',
      '*.optimized.js',
      'myhugoapp/static/js/**/*.optimized.js',
      'myhugoapp/public/**/*.js',
      'myhugoapp/static/sw.js',
      'myhugoapp/public/sw.js',
      'myhugoapp/static/js/three.module.js',
      'myhugoapp/static/js/three/three.core.js',
      'myhugoapp/static/js/three/TrackballControls.js',
      'myhugoapp/static/js/addons/**',
      'myhugoapp/static/periodic-table/lib/**',
      // Vendored proprietary core (chemie-core) — linted in its own repo;
      // copied into place by scripts/vendor-core.sh and may carry
      // parser/syntax styles this repo's ESLint config does not target.
      'api/services/marketing/**',
      '*.generated.js',
      'android/app/build/**',
      'myhugoapp/static/js/calculators/stoichiometry.js',
      'myhugoapp/static/js/calculators/practice-generators.js',
      'myhugoapp/static/js/calculators/stoichiometry-calculator-page.js',
      '.hugo_build.lock',
      // Auto-generated Playwright artifacts
      'tests/playwright-report/**',
      // Old test suite in myhugoapp (not part of active tests)
      'myhugoapp/tests/**',
      // Vendor theme files
      'myhugoapp/themes/**',
    ],
  },

  // Global defaults
  js.configs.recommended,
  sonarjs.configs.recommended,

  // SonarJS rule tuning — disable/downgrade noisy rules for this project type
  {
    rules: {
      // False positives for web apps that legitimately use Math.random/crypto
      'sonarjs/pseudo-random': 'off',
      // Duplicate of ESLint's no-unused-vars (already configured separately)
      'sonarjs/no-unused-vars': 'off',
      // Low-value for a chemistry calculator site (float comparisons are standard)
      'sonarjs/no-floating-point-equality': 'off',
      // Noise in tests — trivial assertions are intentional for readability
      'sonarjs/no-trivial-assertions': 'off',
      // Style preference — not a bug
      'sonarjs/single-char-in-character-classes': 'off',
      // Project policy: these SonarJS maintainability/style rules are too strict
      // for this large educational codebase (429 historical warnings). Relaxed to
      // 'off' so `npm run lint` stays actionable; error-level rules stay active.
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/super-linear-regex': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      'sonarjs/assertions-in-tests': 'off',
      // Complexity: ESLint max-depth already configured; SonarJS threshold too strict for this codebase
      'sonarjs/cognitive-complexity': 'off',
      // False positives: some APIs legitimately accept variable args
      'sonarjs/no-extra-arguments': 'off',
      // Intentional patterns: duplicated branches in switch/case fall-through
      'sonarjs/no-all-duplicated-branches': 'off',
      // Passwords are env-secrets in deploy workflow, not hardcoded credentials
      'sonarjs/no-hardcoded-passwords': 'off',
      // Test style preference
      'sonarjs/prefer-specific-assertions': 'off',
      // Relaxed to project policy (see note above)
      'sonarjs/constructor-for-side-effects': 'off',
      'sonarjs/no-unused-collection': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/no-identical-expressions': 'off',
      'sonarjs/x-powered-by': 'off',
      'sonarjs/unused-import': 'off',
      'sonarjs/regex-complexity': 'off',
      'sonarjs/publicly-writable-directories': 'off',
      'sonarjs/no-redundant-assignments': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/duplicates-in-character-class': 'off',
      // New in eslint-plugin-sonarjs 4.x — too noisy for existing test suites
      'sonarjs/parameterized-tests': 'off',
      'sonarjs/no-fixed-wait-in-tests': 'off',
    },
  },

  // Complexity budgets (applied to all .js files)
  {
    files: ['myhugoapp/static/js/**/*.js'],
    rules: {
      // Complexity budgets relaxed to project policy (large educational JS base)
      complexity: 'off',
      'max-depth': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'max-params': 'off',
      // IIFE is the project convention for non-ESM scope isolation — not a smell
      'sonarjs/no-nested-functions': 'off',
    },
  },

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
        URLSearchParams: 'readonly',
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
        Image: 'readonly',
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
        caches: 'readonly',
        ServiceWorkerRegistration: 'readonly',
        ServiceWorkerGlobalScope: 'readonly',
        Response: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        PerformanceObserver: 'readonly',
        __debug: 'readonly',
        AnalyticsManager: 'writable',
        I18nManager: 'writable',
        THREE: 'writable',
        __THREE_DEVTOOLS__: 'writable',
        ChemistryCalculator: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        ProgressTracker: 'writable',
        GamificationEngine: 'writable',
        fsrs: 'readonly',
        jQuery: 'readonly',
        indexedDB: 'readonly',
        IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly',
        IDBTransaction: 'readonly',
        showError: 'readonly',
        formatNumber: 'readonly',
        darkenColor: 'readonly',
        escapeHtml: 'readonly',
        showToast: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'error',
      'no-redeclare': ['error', { builtinGlobals: false }],
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-extra-semi': 'error',
      'no-irregular-whitespace': 'error',
      'no-trailing-spaces': 'error',
      'no-unsafe-negation': 'error',
      'valid-typeof': 'error',
      'no-useless-escape': 'off',
      'no-prototype-builtins': 'off',
      'no-fallthrough': ['error', { commentPattern: 'falls?through' }],
      'no-cond-assign': 'off',
      'no-control-regex': 'off',
      'no-misleading-character-class': 'off',
      'no-regex-spaces': 'off',
      'no-constant-condition': 'warn',
      'no-extra-boolean-cast': 'off',
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
      'no-unused-vars': 'off',
      curly: ['error', 'all'],
      eqeqeq: 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-return-await': 'warn',
      'require-await': 'warn',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-var': 'warn',
      'prefer-const': 'warn',
      'object-shorthand': 'off',
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
        cytoscape: 'readonly',
      },
    },
  },

  // Curricula index graph page - browser globals loaded lazily
  {
    files: ['myhugoapp/static/js/curricula-index.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        cytoscape: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },

  // Orbital viewer - Three.js ESM module
  {
    files: ['myhugoapp/static/js/visualization/orbital-viewer/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        THREE: 'readonly',
      },
    },
  },

  // Other files with module/exports - quiz, progress tracker, etc.
  {
    files: [
      'myhugoapp/static/js/lazy-loader.js',
      'myhugoapp/static/js/advanced-lazy-loader*.js',
      'myhugoapp/static/js/enhanced-bundle-loader*.js',
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

  // Quiz data files
  {
    files: ['myhugoapp/static/data/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        chemieQuiz: 'readonly',
      },
    },
  },

  // Chemistry calculator files - with chemistry-utils globals
  {
    files: [
      'myhugoapp/static/js/molare-masse-rechner.js',
      'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js',
      'myhugoapp/static/js/stoichiometry.js',
      'myhugoapp/static/js/redox-potenzial-rechner.js',
      'myhugoapp/static/js/konzentrationsumrechner.js',
      'myhugoapp/static/js/verbrennungsrechner.js',
      'myhugoapp/static/js/gasgesetz-rechner.js',
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
        showError: 'readonly',
        formatNumber: 'readonly',
        darkenColor: 'readonly',
        escapeHtml: 'readonly',
        showToast: 'readonly',
      },
    },
  },

  // Titration simulator - with Chart.js global
  {
    files: ['myhugoapp/static/js/titrations-simulator.js'],
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
        Chart: 'readonly',
        showError: 'readonly',
        formatNumber: 'readonly',
        showToast: 'readonly',
      },
    },
  },

  // ES Module files - override with module type
  {
    files: [
      'myhugoapp/static/js/perioden-system-der-elemente.js',
      'myhugoapp/static/js/molekuel-studio.js',
      'myhugoapp/static/js/molecule-data.js',
      'myhugoapp/static/js/molecule-hero.js',
      'myhugoapp/static/js/molecule-geometry.js',
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
    files: ['tests/**/*.test.js', 'tests/**/*.spec.js', 'tests/**/*.test.mjs', 'tests/setup.mjs'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...jestPlugin.environments.globals.globals,
        // Vitest globals (same names as Jest globals)
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        // jsdom globals
        document: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'off',
      'jest/valid-expect': 'error',
      'jest/no-conditional-expect': 'off',
      'jest/expect-expect': 'off',
      'jest/no-done-callback': 'warn',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },

  // Build scripts - Node.js context (CommonJS)
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Build scripts - Node.js context (ESM)
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        ProgressTracker: 'writable',
        GamificationEngine: 'writable',
        fsrs: 'readonly',
        jQuery: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Landscape visualization - uses browser globals
  {
    files: ['myhugoapp/static/landscape/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        self: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
      },
    },
  },

  // Performance monitor - uses Node.js globals
  {
    files: ['myhugoapp/static/js/performance-monitor.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Chemistry calculator framework - defines ChemistryCalculator class itself
  {
    files: ['myhugoapp/static/js/chemistry-calculator-framework.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        I18nManager: 'readonly',
        LazyLoader: 'readonly',
      },
    },
    rules: {
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },

  // Additional calculator files that use chemistry-utils globals
  {
    files: [
      'myhugoapp/static/js/titrations-simulator.js',
      'myhugoapp/static/js/druck-flaechen-rechner.js',
      'myhugoapp/static/js/chemisches-gleichgewicht.js',
      'myhugoapp/static/js/reaktionskinetik-simulator.js',
      'myhugoapp/static/js/atmosphaerendruck-alltag.js',
      'myhugoapp/static/js/bindungspotential.js',
      'myhugoapp/static/js/hess-gesetz.js',
      'myhugoapp/static/js/gas-law-simulator.js',
      'myhugoapp/static/js/ph-rechner.js',
      'myhugoapp/static/js/molare-masse-rechner.js',
      'myhugoapp/static/js/reaktionsgleichungen-ausgleichen.js',
      'myhugoapp/static/js/interactive-experiments.js',
      'myhugoapp/static/js/molar-mass-visualizer.js',
      'myhugoapp/static/js/loeslichkeitsprodukt-rechner.js',
      'myhugoapp/static/js/gasgesetz-rechner.js',
      'myhugoapp/static/js/druck-flaechen-rechner-framework.js',
      'myhugoapp/static/js/ph-rechner-framework.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        parseFormula: 'readonly',
        getMolarMass: 'readonly',
        formatScientificNotation: 'readonly',
        getElementCount: 'readonly',
        validateFormula: 'readonly',
        LazyLoader: 'readonly',
        showError: 'readonly',
        formatNumber: 'readonly',
        darkenColor: 'readonly',
        escapeHtml: 'readonly',
        showToast: 'readonly',
      },
    },
  },

  // API server - Node.js context (ESM)
  {
    files: ['api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Root audit scripts - Node.js context (ESM)
  {
    files: ['audit-*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Config files
  {
    files: ['eslint.config.js', '.prettierrc.js', 'tests/playwright.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
