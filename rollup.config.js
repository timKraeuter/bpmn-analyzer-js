/* eslint-env node */

import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { string } from "rollup-plugin-string";
import copy from "rollup-plugin-copy";

const outputDir = "public";

const configs = [
  {
    input: `./src/analyzer.js`,
    output: {
      name: "bpmn-analyzer-js",
      file: `${outputDir}/analyzer.js`, // new config for production and -c configName in npm
      format: "umd",
    },
    plugins: pgl(
      [
        terser({
          output: {
            comments: /license|@preserve/,
          },
        }),
      ],
      "production",
    ),
  },
];

export default configs;

// helpers //////////////////////

function pgl(plugins = [], env = "production") {
  return [
    replace({
      preventAssignment: true,
      "process.env.NODE_ENV": JSON.stringify(env),
    }),
    string({
      include: "resources/*.bpmn",
    }),
    copy({
      targets: [
        { src: "src/index.html", dest: `${outputDir}/` },
        { src: "src/favicon.ico", dest: `${outputDir}/` },
        { src: "src/assets/**", dest: `${outputDir}/assets` },
        {
          src: "node_modules/bpmn-js/dist/assets/*",
          dest: `${outputDir}/assets/bpmn-js`,
        },
      ],
    }),
    nodeResolve(),
    commonjs(),
    ...plugins,
  ];
}
