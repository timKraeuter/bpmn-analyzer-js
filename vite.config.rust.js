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
      outDir: "../../rust_bpmn_analyzer/webserver/public",
      emptyOutDir: true,
      sourcemap: mode === "development",
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
