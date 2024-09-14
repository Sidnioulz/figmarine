import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: [
        '**/*.{mjs,mjsx,js,jsx,ts,tsx}',
        '!*.config.{js,ts,cjs}',
        '!**/coverage/**',
        '!**/scripts/**',
        '!**/__tests__/**',
        '!**/__generated__/**',
        '!**/node_modules/**',
        '!**/dist/**',
      ]
    }
  },
})