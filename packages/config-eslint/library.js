import json from "@eslint/json";
import nodePlugin from "eslint-plugin-n";
import prettier from "eslint-plugin-prettier/recommended";
import turbo from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

const jsonConfig = {
  plugins: {
    json,
  },
};

export const configs = [
  jsonConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["turbo.json"],
    language: "json/json",
    plugins: {
      turbo,
    },
  },
  prettier,
  ...tseslint.configs.recommended,
  nodePlugin.configs["flat/recommended-module"],
];
