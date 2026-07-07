// /** @type {import("eslint").Linter.Config} */
import { library } from '@figmarine/config-eslint';

export default [
  ...library,
  {
    files: ['src/cli.ts'],
    rules: {
      // The built dist/cli.js is the package bin; the shebang must live in
      // the source for esbuild to carry it over, which this rule cannot see.
      'n/hashbang': 'off',
    },
  },
];
