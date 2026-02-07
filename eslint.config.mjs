import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  // Ignore generated/build outputs
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/out/**",
    "**/coverage/**",
    "**/.turbo/**",
  ]),

  // 1) Base JS rules for all
  js.configs.recommended,

  // 2) Base TS rules for all TS files (no React)
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.ts", "**/*.tsx"],
  })),

  // 3) Next/React rules ONLY for apps/web
  ...nextVitals.map((c) => ({
    ...c,
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
  })),
  ...nextTs.map((c) => ({
    ...c,
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
  })),
]);
