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

  // Limit linting in seeders/migrations directories
  {
    files: ["migrations/**/*.js", "seeders/**/*.js"],

    languageOptions: {
      globals: { ...globals.node },

      parserOptions: {
        sourceType: "script", // Auto-generated files are CJS modules
      },
    },

    rules: {
      "no-unused-vars": "off", // Ignore parameters added by Sequelize
    },
  },

  // Ignore Admin JS bundle directory
  {
    ignores: [".adminjs/"],
  },
];
