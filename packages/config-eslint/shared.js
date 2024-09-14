import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import turbo from 'eslint-plugin-turbo';
import vitest from "@vitest/eslint-plugin";

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
  {
    rules: {
      'sort-imports': ['error', {
        ignoreCase: true,
        ignoreDeclarationSort: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: true
      }]
    }
  },
  prettier,
  ...tseslint.configs.recommended.map(ignoreJson),
  {
    files: ['__tests__/*.spec.ts'],
    plugins: {
      vitest
    },
    rules: {
      ...vitest.configs.all.rules,
    },
  },
];
