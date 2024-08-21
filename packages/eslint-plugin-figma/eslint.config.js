// /** @type {import("eslint").Linter.Config} */
import eslintPlugin from "eslint-plugin-eslint-plugin";
import nodePlugin from "eslint-plugin-n";
import tseslint from "typescript-eslint";

import json from "@eslint/json";

export default [
  {
    ignores: ["figmalintrc.js", "dist/*"],
  },
  {
    plugins: { json },
  },
  eslintPlugin.configs["flat/recommended"],
  nodePlugin.configs["flat/recommended-script"],
  ...tseslint.configs.recommended,

  // {
  //   ...tseslint,
  //   files: ["ts", "tsx"].map((ext) => `**/*.${ext}`),
  // },

  // TODO PRETTIER
  // configs["flat/prettier"],

  // TODO TURBO
  // import json from "@eslint/json";
  // {
  //   files: ["**/*.json"],
  //   plugins: { json },
  // },
  // configs["flat/turbo"],
];
