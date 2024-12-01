import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: ["public", "node_modules", "coverage", "**/generated"],
  },

  // build
  prettierConfig,
];
