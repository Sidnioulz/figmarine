import { defineConfig } from "tsup";

/** @type {import("tsup").defineConfig} */
export const esmLibrary = defineConfig((options) => ({
  entryPoints: ["src/index.ts"],
  clean: true,
  dts: true,
  format: ["esm"],
  ...options,
}));
