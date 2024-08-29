import globals from "globals";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { env: "node" },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  ...eslintConfigESLint,
  eslintConfigESLintFormatting,
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,

  // override rules
  {
    rules: {
      // Allow console logging
      "no-console": "off",
    },
  },
];
