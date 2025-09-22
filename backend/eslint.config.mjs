import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";
import babelParser from "@babel/eslint-parser";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parser: babelParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
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
