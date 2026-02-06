// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "warn",
        {
          type: "attribute",
          prefix: "noc",
          style: "camelCase",
        },
      ],
      // Relaxed rules for existing codebase
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/adjacent-overload-signatures": "warn",
      "@typescript-eslint/no-namespace": "off",
      "@angular-eslint/prefer-inject": "off",
      "@angular-eslint/no-empty-lifecycle-method": "off",
      "@angular-eslint/no-input-rename": "warn",
      "@angular-eslint/component-selector": [
        "warn",
        {
          type: "element",
          prefix: ["noc", "app"],
          style: "kebab-case",
        },
      ],
      "no-var": "error",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-prototype-builtins": "warn",
      "prefer-const": "warn",
      "prefer-rest-params": "warn",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/alt-text": "warn",
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
      "@angular-eslint/template/prefer-control-flow": "off",
      "@angular-eslint/template/elements-content": "warn",
    },
  }
]);
