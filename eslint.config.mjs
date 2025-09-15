import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import stylistic from "@stylistic/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        warnOnUnsupportedTypeScriptVersion: false,
        sourceType: "module"
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "@stylistic": stylistic
    },
    rules: {
      "semi": ["warn", "always"],
      "quotes": ["warn", "single"],
      "no-trailing-spaces": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@stylistic/semi": "warn",
      "@stylistic/quotes": ["warn", "single"],
      "@stylistic/indent": ["warn", 2],
      "@stylistic/no-trailing-spaces": "warn",
      "@stylistic/comma-dangle": ["warn", "always-multiline"],
      "@stylistic/no-multiple-empty-lines": ["warn", { "max": 1 }],
      "@stylistic/jsx-curly-spacing": ["warn", {
        "when": "never",
        "children": true
      }],
      "@stylistic/jsx-curly-brace-presence": ["warn", {
        "props": "never",
        "children": "always"
      }],
      "@stylistic/object-curly-spacing": ["warn", "always"],
      "@stylistic/array-bracket-spacing": ["warn", "never"],
      "@stylistic/jsx-closing-tag-location": "warn",
      "@stylistic/jsx-closing-bracket-location": "warn",
      "@stylistic/jsx-self-closing-comp": ["warn", {
        "component": true,
        "html": true
      }],
      "@stylistic/jsx-tag-spacing": ["warn", {
        "closingSlash": "never",
        "beforeSelfClosing": "always",
        "afterOpening": "never"
      }],
      "@stylistic/jsx-wrap-multilines": ["warn", {
        "declaration": "parens-new-line",
        "assignment": "parens-new-line",
        "return": "parens-new-line",
        "arrow": "parens-new-line",
        "condition": "parens-new-line",
        "logical": "parens-new-line",
        "prop": "parens-new-line"
      }],
      "@stylistic/jsx-props-no-multi-spaces": "warn",
      "@stylistic/template-curly-spacing": ["warn", "always"],
      "@stylistic/jsx-equals-spacing": ["warn", "never"],
      "@stylistic/no-mixed-operators": "warn",
      "@stylistic/no-multi-spaces": "warn",
      "@stylistic/no-whitespace-before-property": "warn",
      "@stylistic/operator-linebreak": ["warn", "before"],
      "@stylistic/padded-blocks": ["warn", "never"],
      "@stylistic/rest-spread-spacing": ["warn", "never"],
      "@stylistic/space-before-blocks": ["warn", "always"],
      "@stylistic/space-infix-ops": "warn",
      "@stylistic/space-unary-ops": "warn",
      "@stylistic/spaced-comment": ["warn", "always"],
      "@stylistic/switch-colon-spacing": ["warn", {"after": true, "before": false}],
      "@stylistic/template-tag-spacing": "warn",
      "@stylistic/type-annotation-spacing": ["warn", { "before": false, "after": true }],
      "@stylistic/type-generic-spacing": "warn",
      "@stylistic/type-named-tuple-spacing": "warn",
      "@stylistic/wrap-iife": ["warn", "outside"],
      "@stylistic/array-element-newline": ["warn", "consistent"],
      "@stylistic/arrow-parens": "warn",
      "@stylistic/comma-style": ["warn", "last"],
      "@stylistic/dot-location": ["warn", "property"],
      "@stylistic/function-call-argument-newline": ["warn", "consistent"]
    }
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;