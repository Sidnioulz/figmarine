export default {
  arrowParens: "always",
  bracketSpacing: true,
  semi: true,
  printWidth: 100,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: "all",
  overrides: [
    {
      files: "./**/*.json",
      options: {
        parser: "json",
      },
    },
    {
      files: "./*.json",
      options: {
        parser: "json",
      },
    },
    {
      files: ".*.rc",
      options: {
        parser: "json",
      },
    },
  ],
};
