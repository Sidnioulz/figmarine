export const coverage = {
  include: ['src/**/*.{mjs,mjsx,js,jsx,ts,tsx}'],
  exclude: [
    '**/__fixtures__/**',
    '**/__generated__/**',
    '**/__mocks__/**',
    '**/__tests__/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    'src/debug.ts',
  ],
  provider: 'istanbul',
};
