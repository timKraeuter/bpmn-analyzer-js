const webpack = require("webpack");

const CopyPlugin = require("copy-webpack-plugin");

const SOURCE_VERSION =
    process.env.SOURCE_VERSION || process.env.npm_package_gitHead || "dev";

module.exports = (env) => {
  let outputPath = __dirname + "/public";
  let path = "src";
  if (env.ghpages) {
    // GitHub pages expects static files here.
    outputPath = __dirname + "/docs";
  }
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
          {
            from: "node_modules/@bpmn-io/properties-panel/dist/assets",
            to: ".",
          },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env.SOURCE_VERSION": JSON.stringify(SOURCE_VERSION || null),
      }),
    ],
    mode: "development",
    devtool: "source-map",
  };
};
