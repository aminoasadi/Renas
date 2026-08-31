// Shared flat-config base for every workspace package. Each package's own
// eslint.config.mjs imports this and layers on package-specific rules (React
// for the Next.js apps, none for plain Node/TS packages).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export const ignores = [
  "dist/**",
  ".next/**",
  "node_modules/**",
  "coverage/**",
  "**/*.d.ts",
  "prisma/migrations/**",
];

export const base = [
  { ignores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
