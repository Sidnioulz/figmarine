import { defineConfig } from 'vitest/config';

import { coverage } from './packages/config-vitest/shared';

export default defineConfig({
  test: {
    coverage,
  },
});
