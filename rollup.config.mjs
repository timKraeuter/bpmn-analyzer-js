/* eslint-env node */

import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { string } from "rollup-plugin-string";
import copy from 'rollup-plugin-copy'

const outputDir = "public";
// TODO: Add copying bpmn-js css

const configs = [
  {
    input: `./src/app.js`,
    output: {
      name: "bpmn-analyzer-js",
      file: `${outputDir}/app.js`,  // new config for production and -c configName in npm
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
      include: "resources/*.bpmn"
    }),
    copy({
      targets: [
        { src: 'src/index.html', dest: `${outputDir}/` },
        { src: 'src/favicon.ico', dest: `${outputDir}/` },
        { src: 'src/css/**', dest: `${outputDir}/css` },
      ]
    }),
    nodeResolve(),
    commonjs(),
    ...plugins,
  ];
}
