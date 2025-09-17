import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "fs";
import path from "path";

// Load environment variables from .env file
function loadEnvVars() {
  const envPath = path.resolve(__dirname, ".env");
  const envVars = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        envVars[key.trim()] = value;
      }
    });
  }

  return envVars;
}

export default defineConfig(({ command, mode }) => {
  const envVars = loadEnvVars();
  const SOURCE_VERSION =
    process.env.SOURCE_VERSION || process.env.npm_package_gitHead || "dev";

  return {
    root: "src",
    build: {
      outDir: "../public",
      emptyOutDir: true,
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate bpmn-js and diagram-js into their own chunk
            "bpmn-core": ["bpmn-js", "diagram-js"],
            // Separate OpenAI and Azure dependencies
            "ai-services": ["openai", "@azure/identity"],
            // Separate utility libraries
            utilities: ["min-dash", "min-dom", "tiny-svg", "randomcolor"],
          },
        },
      },
      chunkSizeWarningLimit: 600, // Increase limit slightly to reduce warnings for remaining chunks
    },
    define: {
      "process.env.SOURCE_VERSION": JSON.stringify(SOURCE_VERSION),
      "process.env.AZURE_OPENAI_API_KEY": JSON.stringify(
        envVars.AZURE_OPENAI_API_KEY || "",
      ),
      "process.env.AZURE_OPENAI_ENDPOINT": JSON.stringify(
        envVars.AZURE_OPENAI_ENDPOINT || "",
      ),
    },
    assetsInclude: ["**/*.bpmn"],
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: "../node_modules/bpmn-js/dist/assets/*",
            dest: ".",
          },
        ],
      }),
    ],
    server: {
      port: 3000,
      open: true,
    },
  };
});
