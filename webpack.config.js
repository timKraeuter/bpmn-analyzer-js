const webpack = require("webpack");
const fs = require("fs");
const path = require("path");

const CopyPlugin = require("copy-webpack-plugin");

const SOURCE_VERSION =
  process.env.SOURCE_VERSION || process.env.npm_package_gitHead || "dev";

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

module.exports = (env) => {
  let outputPath = __dirname + "/public";
  let path = "src";
  let mode = "development";
  let devtool = "source-map";
  if (env.rust) {
    outputPath = __dirname + "/../rust_bpmn_analyzer/webserver/public";
    mode = "production";
    devtool = false;
  }
  if (env.ghPages) {
    outputPath = __dirname + "/docs/";
    mode = "production";
    devtool = false;
  }
  const envVars = loadEnvVars();
  return {
    entry: {
      bundle: [`./${path}/app.js`],
    },
    output: {
      path: outputPath,
      filename: "app.js",
    },
    module: {
      rules: [
        {
          test: /\.bpmn$/,
          use: "raw-loader",
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: "**/*.{html,css,woff,ttf,eot,svg,woff2,ico}",
            context: `${path}/`,
          },
        ],
      }),
      new CopyPlugin({
        patterns: [
          { from: "src/index.html", to: "." },
          {
            from: "node_modules/bpmn-js/dist/assets",
            to: ".",
          },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env.SOURCE_VERSION": JSON.stringify(SOURCE_VERSION || null),
        "process.env.AZURE_OPENAI_API_KEY": JSON.stringify(
          envVars.AZURE_OPENAI_API_KEY,
        ),
        "process.env.AZURE_OPENAI_ENDPOINT": JSON.stringify(
          envVars.AZURE_OPENAI_ENDPOINT,
        ),
      }),
    ],
    mode,
    devtool,
  };
};
