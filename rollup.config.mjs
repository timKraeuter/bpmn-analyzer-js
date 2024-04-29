/* eslint-env node */

import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";

const outputDir = "dist";

const configs = [
  {
    input: `./src/app.js`,
    output: {
      name: "BpmnJS",
      file: `${outputDir}/bpmn-analyzer-js.development.js`,
      format: "umd",
    },
    plugins: pgl([], "development"),
  },
  {
    input: `./src/app.js`,
    output: {
      name: "BpmnJS",
      file: `${outputDir}/bpmn-analyzer-js.production.min.js`,
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
    nodeResolve(),
    commonjs(),
    json(),
    ...plugins,
  ];
}
