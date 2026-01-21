# Code Linting and Formatting

This document describes the code linting and formatting setup for the hugo-chemie-lernen-org project.

## Tools Used

### ESLint

- **Version**: 9.39.2
- **Purpose**: JavaScript code quality and consistency
- **Config**: `eslint.config.mjs` (ESLint Flat Config)

### Prettier

- **Version**: 3.7.4
- **Purpose**: Code formatting and style consistency
- **Config**: `.prettierrc.js`

### Husky

- **Version**: 9.1.7
- **Purpose**: Git hooks management
- **Config**: `.husky/`

### lint-staged

- **Version**: 16.2.7
- **Purpose**: Run linters on staged files only
- **Config**: `package.json` → `lint-staged`

## NPM Scripts

### Linting

```bash
# Lint all JavaScript files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Lint only calculator files
npm run lint:calculators

# Lint only test files
npm run lint:tests
```

### Formatting

```bash
# Format all files (JS, JSON, MD, HTML, CSS)
npm run format

# Check formatting without making changes
npm run format:check
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Validation

```bash
# Run full validation (lint + format check + tests)
npm run validate
```

## ESLint Configuration

The project uses ESLint's new [Flat Config](https://eslint.org/docs/latest/use/configure/) format.

### Configuration Structure

```javascript
// eslint.config.mjs
export default [
  // 1. File ignores
  { ignores: [...] },

  // 2. Base recommended rules
  js.configs.recommended,

  // 3. Calculator files (strict rules)
  {
    files: ['myhugoapp/static/js/calculators/**/*.js'],
    // ... strict linting rules
  },

  // 4. All static JS files (browser globals)
  {
    files: ['myhugoapp/static/js/**/*.js'],
    // ... browser environment rules
  },

  // 5. Test files (Jest globals)
  {
    files: ['tests/**/*.test.js'],
    // ... Jest-specific rules
  },
];
```

### Key Rules

#### Calculator Files (`myhugoapp/static/js/calculators/**/*.js`)

- Stricter rules for core calculation logic
- ES6+ best practices enforced
- `no-var`: Use `const`/`let` instead of `var`
- `prefer-const`: Use `const` for variables that aren't reassigned
- `prefer-arrow-callback`: Use arrow functions for callbacks
- `object-shorthand`: Use property shorthand (`{x}` instead of `{x: x}`)
- `curly`: Always use curly braces for control structures
- `eqeqeq`: Always use strict equality (`===` instead of `==`)

#### Static JS Files (`myhugoapp/static/js/**/*.js`)

- Browser environment globals enabled
- More relaxed rules for legacy code
- Focus on catching errors rather than style

#### Test Files (`tests/**/*.test.js`)

- Jest globals available (`describe`, `test`, `expect`, etc.)
- Jest-specific rules enabled
- Test-focused best practices

## Prettier Configuration

```javascript
{
  printWidth: 100,        // Line width limit
  tabWidth: 2,            // Spaces per indentation level
  useTabs: false,         // Use spaces instead of tabs
  semi: true,             // Add semicolons
  singleQuote: true,      // Use single quotes
  trailingComma: 'es5',   // Add trailing commas where valid
  bracketSpacing: true,   // Print spaces between brackets
  arrowParens: 'always',  // Always include parens for arrow functions
  endOfLine: 'lf'         // Line ending style
}
```

## Git Hooks

### Pre-commit Hook

```bash
.husky/pre-commit
```

Runs `lint-staged` on all staged files:

- JavaScript files: ESLint with auto-fix + Prettier
- Other files (JSON, MD, HTML, CSS): Prettier only

### Pre-push Hook

```bash
.husky/pre-push
```

Runs full test suite before pushing to remote.

## Workflow

### Development Workflow

1. **Make changes** to your files
2. **Stage files** with `git add`
3. **Commit** - pre-commit hook will:
   - Auto-fix linting issues
   - Format code with Prettier
   - Run tests on push
4. **Push** - pre-push hook will run full test suite

### Manual Linting

Before committing, you can manually check:

```bash
# Check for linting issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format all files
npm run format

# Run full validation
npm run validate
```

## Ignoring Files

### ESLint Ignores

Edit `eslint.config.mjs` → `ignores` array to add glob patterns for files to ignore:

```javascript
{
  ignores: [
    'node_modules/**',
    'myhugoapp/public/**',
    '*.min.js',
    // Add your patterns here
  ];
}
```

### Prettier Ignores

Edit `.prettierignore` file to add patterns:

```
# Dependencies
node_modules/

# Build outputs
myhugoapp/public/
*.min.js

# Add your patterns here
```

## Troubleshooting

### Lint-staged Fails

If `lint-staged` fails with a git error:

1. **Reset git state**: `git reset`
2. **Fix permissions** on problematic files
3. **Stage files again**: `git add <files>`
4. **Try committing again**

### ESLint Errors in IDE

If your IDE shows ESLint errors:

1. **Ensure ESLint plugin is installed** for your IDE
2. **Reload/restart** your IDE's language server
3. **Check ESLint version**: `npm list eslint`
4. **Verify config**: `eslint.config.mjs` should be in project root

### Prettier Conflicts

If ESLint and Prettier conflict:

1. **Check order**: `eslint.config.mjs` should load `eslint-config-prettier` last
2. **Run format first**: `npm run format`
3. **Then run lint**: `npm run lint:fix`

## CI/CD Integration

These tools can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Run linter
  run: npm run lint

- name: Check formatting
  run: npm run format:check

- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Benefits

1. **Code Quality**: Catch bugs and issues early
2. **Consistency**: Uniform code style across the project
3. **Maintainability**: Easier to read and modify code
4. **Automation**: Auto-fix issues before commits
5. **Team Collaboration**: Shared coding standards

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Flat Config Guide](https://eslint.org/docs/latest/use/configure/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

---

**Last Updated**: 2026-01-01
**Phase 4, Feature 2**: ESLint and Code Linting Setup
