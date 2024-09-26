import { defineConfig } from 'vitest/config';

import { coverage } from './shared.js';

export default defineConfig({
  test: {
    globals: true,
    coverage,
  },
});
