import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import turbo from 'eslint-plugin-turbo';
import vitest from '@vitest/eslint-plugin';

export function ignoreJson(conf) {
  return {
    ...conf,
    ignores: [...(conf.ignores ?? []), '**/*.json'],
  };
}
export function addTsUnusedRule(conf) {
  return {
    ...conf,
    rules: {
      ...(conf.rules ?? {}),
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  };
}

export const configs = [
  {
    ignores: ['coverage/*', 'dist/*', 'node_modules/*', 'tsup.config.bundled*.mjs'],
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
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: false,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
  },
  prettier,
  ...tseslint.configs.recommended.map(ignoreJson).map(addTsUnusedRule),
  {
    settings: {
      node: {
        version: '22.0',
      },
    },
  },
  {
    files: ['__mocks__/**/*.cjs', '__tests__/*.spec.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.all.rules,
    },
  },
  {
    files: ['__mocks__/**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
