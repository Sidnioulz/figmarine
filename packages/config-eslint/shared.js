import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import turbo from 'eslint-plugin-turbo';

export function ignoreJson(conf) {
  return {
    ...conf,
    ignores: [...(conf.ignores ?? []), '**/*.json'],
  };
}

export const configs = [
  {
    ignores: ['coverage/*', 'dist/*', 'node_modules/*'],
  },
  {
    files: ['**/*.json'],
    language: 'json/json',
    plugins: {
      json,
    },
  },
  {
    files: ['turbo.json'],
    language: 'json/json',
    plugins: {
      json,
      turbo,
    },
  },
  prettier,
  ...tseslint.configs.recommended.map(ignoreJson),
];