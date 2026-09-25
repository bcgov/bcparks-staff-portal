import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintConfigESLintBase from "eslint-config-eslint/base";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";
import eslintConfigPrettier from "eslint-config-prettier";

// Portal apps under src/apps/ must not import from each other
const APPS = ["advisories", "dates", "access-status", "activities-facilities"];

const appBoundaryRules = APPS.map((app) => ({
  files: [`src/apps/${app}/**/*.{js,jsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: APPS.filter((other) => other !== app).flatMap((other) => [
              `@/apps/${other}`,
              `@/apps/${other}/**`,
            ]),
            message:
              "Apps must not import from other apps. Move shared code to src/components, src/hooks, src/contexts, or src/utils.",
          },
        ],
      },
    ],
  },
}));

export default [
  { ignores: ["dist", "coverage"] },
  ...eslintConfigESLintBase,
  eslintConfigESLintFormatting,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Allow console.warn and console.error
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Allow functions without JSDocs (ie React components)
      "jsdoc/require-jsdoc": "off",
    },
  },
  ...appBoundaryRules,
  {
    // Shared portal code must not depend on individual apps.
    // The router and i18n config are the composition points that mount the apps.
    files: ["src/**/*.{js,jsx}"],
    ignores: ["src/apps/**", "src/router/**", "src/config/i18n.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/apps", "@/apps/**"],
              message:
                "Shared portal code must not import from src/apps. Move the code into a shared folder instead.",
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
  {
    // ignore camel case rule for config files
    // modules expect key names we can't change
    rules: { camelcase: "off" },
    files: ["src/config/*.js"],
  },
];
