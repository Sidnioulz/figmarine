// /** @type {import("eslint").Linter.Config} */
import { ignoreJson, script } from '@figmarine/config-eslint';
import eslintPlugin from 'eslint-plugin-eslint-plugin';

export default [...script, ignoreJson(eslintPlugin.configs['flat/recommended'])];
