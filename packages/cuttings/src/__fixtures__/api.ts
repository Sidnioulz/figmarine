import { readFileSync } from 'node:fs';

/**
 * Labels of the real Figma files used as test fixtures. Regenerate their
 * data with `pnpm fixtures:regen` (requires FIGMA_PERSONAL_ACCESS_TOKEN).
 */
export const API_FIXTURE_FILES = {
  'figma-api-debug-file': 'idLa6ZCXDJUeRFI5wLVNWN',
  'error-states': '3qv1uKfLSXm4etqj005Rmi',
  'surface-new-stories': 'pMmZ9LmqB0KbgI8GNY4IW9',
} as const;

export type ApiFixtureLabel = keyof typeof API_FIXTURE_FILES;
export type ApiFixtureEndpoint =
  'GetFile' | 'GetFileComponents' | 'GetFileComponentSets' | 'GetFileStyles';

/**
 * Loads a real Figma REST API response recorded by scripts/fetchFixtures.mjs.
 * Reads from disk on purpose: these files are large, and importing them as
 * modules would slow type checking down considerably.
 */
export function loadApiFixture<T>(label: ApiFixtureLabel, endpoint: ApiFixtureEndpoint): T {
  const url = new URL(`./api/${label}/${endpoint}.json`, import.meta.url);

  return JSON.parse(readFileSync(url, 'utf-8')) as T;
}
