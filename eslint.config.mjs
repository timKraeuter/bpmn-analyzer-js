import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      globals: {
        // Browser globals
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        FileReader: "readonly",
        getComputedStyle: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URLSearchParams: "readonly",
        window: "readonly",
        // Node.js globals (config files)
        process: "readonly",
        global: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["public", "node_modules", "**/generated", "docs"],
  },
];
