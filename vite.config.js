import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_VERSION =
  process.env.SOURCE_VERSION || process.env.npm_package_gitHead || "dev";

export default defineConfig(({ mode }) => {
  let outDir = "public";

  if (mode === "rust") {
    outDir = "../rust_bpmn_analyzer/webserver/public";
  }
  if (mode === "ghPages") {
    outDir = "docs";
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
        input: resolve(__dirname, "index.html"),
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
    define: {
      "process.env.SOURCE_VERSION": JSON.stringify(SOURCE_VERSION),
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/bpmn-js/dist/assets/bpmn-font",
            dest: ".",
          },
          {
            src: "src/favicon.ico",
            dest: ".",
          },
          {
            src: "src/css/font-awesome-5",
            dest: ".",
          },
        ],
      }),
    ],
    assetsInclude: ["**/*.bpmn"],
  };
});
