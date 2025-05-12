import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";
import js from "@eslint/js";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  // Global ignores (replaces .eslintignore)
  globalIgnores([
    "**/node_modules",
    "**/.next",
    "**/.env",
    "**/dist",
    "**/.data",
    "**/build",
    "apps/api/public/**/*",
    "**/next-env.d.ts",
  ]),

  {
    // Base JS/TS settings
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    // Add all your plugins here
    plugins: {
      "@typescript-eslint": tsPlugin,
    },

    rules: {
      // Base rules
      ...js.configs.recommended.rules,

      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "no-type-imports",
        fixStyle: "inline-type-imports",
      }],
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",

      // Optional: disable if too noisy
      "capitalized-comments": "off",
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  // Prettier compatibility (disable conflicting rules)
  {
    rules: {
      ...prettier.rules,
    },
  },
]);
