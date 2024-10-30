/** @type {const} */
export const coverage = {
  include: [
    '**/*.{mjs,mjsx,js,jsx,ts,tsx}',
    '!*.config.{js,ts,cjs}',
    '!**/coverage/**',
    '!**/scripts/**',
    '!**/__fixtures__/**',
    '!**/__mocks__/**',
    '!**/__tests__/**',
    '!**/__generated__/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/src/debug.ts',
  ],
  provider: 'istanbul',
  reporter: ['text', 'json', 'html', 'cobertura'],
};
