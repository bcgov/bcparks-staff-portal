import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        sourceType: "module",
      },
    },
  },
  ...eslintConfigESLint,
  eslintConfigESLintFormatting,
  eslintConfigPrettier,

  // override rules
  {
    rules: {
      // Allow console logging
      "no-console": "off",

      // Allow functions without JSDocs (ie server routes)
      "jsdoc/require-jsdoc": "off",

      // Disable "new-cap" rule for Express Router, etc.
      "new-cap": "off",
    },
  },
];
