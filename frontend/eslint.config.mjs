import globals from "globals";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  ...eslintConfigESLint,
  eslintConfigESLintFormatting,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  eslintConfigPrettier,

  // override rules
  {
    rules: {
      // Allow console.warn and console.error
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Allow functions without JSDocs (ie React components)
      "jsdoc/require-jsdoc": "off",
    },
  },
];
