// /** @type {import("eslint").Linter.Config} */
import { library } from '@figmarine/config-eslint';

export default [
  {
    // Large recorded API responses; not worth linting.
    ignores: ['src/__fixtures__/api/**/*.json'],
  },
  ...library,
];
