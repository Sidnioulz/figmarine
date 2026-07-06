import { defineConfig } from 'vitest/config';

import { coverage } from './shared.js';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    setupFiles: ['./src/__tests__/setupIntegration.ts'],
    include: ['**/__tests__/**/*.integration.ts'],
    coverage,
  },
});
