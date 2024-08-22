// /** @type {import("eslint").Linter.Config} */
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import { ignoreJson, script } from '@figmarine/config-eslint';

export default [...script, ignoreJson(eslintPlugin.configs['flat/recommended'])];
