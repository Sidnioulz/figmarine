import nodePlugin from 'eslint-plugin-n';
import { configs as shared, ignoreJson } from './shared.js';

export const configs = [
  ...shared,
  ignoreJson(nodePlugin.configs['flat/recommended-module']),
  {
    rules: {
      'n/no-missing-import': 'off',
    },
  },
];
