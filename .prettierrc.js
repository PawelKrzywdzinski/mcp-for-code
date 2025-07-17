module.exports = {
  // Print width
  printWidth: 80,
  
  // Tab width
  tabWidth: 2,
  
  // Use tabs instead of spaces
  useTabs: false,
  
  // Add semicolons at the end of statements
  semi: true,
  
  // Use single quotes instead of double quotes
  singleQuote: true,
  
  // Change when properties in objects are quoted
  quoteProps: 'as-needed',
  
  // Use single quotes in JSX
  jsxSingleQuote: true,
  
  // Add trailing commas
  trailingComma: 'es5',
  
  // Add spaces around brackets in object literals
  bracketSpacing: true,
  
  // Put the `>` of a multi-line JSX element at the end of the last line
  bracketSameLine: false,
  
  // Include parentheses around a sole arrow function parameter
  arrowParens: 'avoid',
  
  // Format only a segment of a file
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // Specify the file name to use to infer which parser to use
  filepath: undefined,
  
  // Require a pragma to format markdown files
  requirePragma: false,
  
  // Insert a pragma at the top of formatted files
  insertPragma: false,
  
  // Specify the global whitespace sensitivity for HTML files
  htmlWhitespaceSensitivity: 'css',
  
  // Specify the line ending
  endOfLine: 'lf',
  
  // Control whether Prettier formats quoted code embedded in the file
  embeddedLanguageFormatting: 'auto',
  
  // Enforce single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,
  
  // Override settings for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 120,
        proseWrap: 'preserve',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};