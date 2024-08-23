import { createDefaultEsmPreset } from "ts-jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: [
    '<rootDir>/test/__fixtures__',
    '<rootDir>/node_modules',
    '<rootDir>/dist',
  ],
  ...createDefaultEsmPreset({
    tsconfig: '<rootDir>/tsconfig.json',
  }),
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!<rootDir>/*.config.{js,ts,cjs}',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/__generated__/**',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
};