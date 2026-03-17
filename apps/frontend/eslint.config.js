import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintConfigESLintBase from "eslint-config-eslint/base";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { ignores: ["dist"] },
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
    settings: { react: { version: "18.3" } },
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
  eslintConfigPrettier,
  {
    // ignore camel case rule for config files
    // modules expect key names we can't change
    rules: { camelcase: "off" },
    files: ["src/config/*.js"],
  },
];
