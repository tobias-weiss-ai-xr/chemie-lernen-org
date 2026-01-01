module.exports = {
  // Line width
  printWidth: 100,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Semicolons
  semi: true,

  // Quotes
  singleQuote: true,

  // Trailing commas
  trailingComma: 'es5',

  // Spacing
  bracketSpacing: true,
  arrowParens: 'always',

  // Line endings
  endOfLine: 'lf',

  // JSX
  jsxSingleQuote: false,

  // HTML
  htmlWhitespaceSensitivity: 'css',

  // Ignore files
  overrides: [
    {
      files: '*.html',
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve',
      },
    },
  ],
};
