import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  let outDir = "public";

  if (mode === "rust") {
    outDir = "../rust_bpmn_analyzer/webserver/public";
  }
  if (mode === "ghPages") {
    outDir = "dist";
  }

  const isProduction = mode === "rust" || mode === "ghPages";

  // Use subdirectory base path for GitHub Pages
  const base = mode === "ghPages" ? "/bpmn-analyzer-js/" : "/";

  return {
    base,
    root: ".",
    publicDir: false,
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: !isProduction,
      rolldownOptions: {
        input: resolve(import.meta.dirname, "index.html"),
        output: {
          entryFileNames: "app.js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name][extname]",
          codeSplitting: {
            groups: [
              {
                name: "diagram-vendor",
                test: /node_modules[\\/]diagram-js/,
                priority: 20,
              },
              {
                name: "bpmn-vendor",
                test: /node_modules[\\/](bpmn-js|bpmn-moddle|moddle)/,
                priority: 15,
              },
              {
                name: "vendor",
                test: /node_modules/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    assetsInclude: ["**/*.bpmn"],
  };
});
