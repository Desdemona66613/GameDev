import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/**
 * We compose the Next.js rules from `@next/eslint-plugin-next` directly rather
 * than via `eslint-config-next`. That wrapper eagerly requires Next's bundled
 * Babel parser (`next/dist/compiled/babel/eslint-parser`), which it does not
 * declare as a dependency; under snpm's symlinked store that require fails.
 * We are TypeScript-only, so the Babel parser is not needed anyway.
 */
const eslintConfig = defineConfig([
  // Next.js rules.
  nextPlugin.configs["core-web-vitals"],

  // React + hooks.
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  { settings: { react: { version: "detect" } } },

  // Type-aware linting: strictest typescript-eslint presets.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // Explicit return types on exported functions — for .ts modules; React
  // components (.tsx) rely on inference, which is idiomatic.
  {
    files: ["**/*.ts"],
    rules: { "@typescript-eslint/explicit-module-boundary-types": "error" },
  },

  // Config files aren't part of the TS project — skip type-aware rules there.
  {
    files: ["**/*.mjs", "**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Build output. ESLint flat config does NOT read .gitignore, so generated
  // directories must be listed here explicitly or they get linted.
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/database.types.ts",
  ]),
]);

export default eslintConfig;
