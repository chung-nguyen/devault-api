const path = require("path");
const fs = require("fs");

const { buildEnvFile } = require("@metain/builders");

const ENTRIES = {
  "api/index": "./src/api.mjs"
};

module.exports = (env) => {
  const baseDirectory = "../distribution/lambda";

  return {
    entry: ENTRIES,
    output: {
      path: path.resolve(__dirname, `${baseDirectory}`),
      filename: "[name].js",
      libraryTarget: "commonjs2",
      clean: false,
    },
    devtool: false,
    target: "node",
    externals: [
      {
        "electron": "electron",
        "aws-sdk": "aws-sdk",
        "@google-cloud/storage": "commonjs @google-cloud/storage",
      },
    ],
    resolve: {
      extensions: [".js", ".jsx", ".json"],
    },
    plugins: [
      {
        // Run after build
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("BuildEnv", () => {
            for (const name in ENTRIES) {
              const entryDir = name.substring(0, name.indexOf("/"));
              buildEnvFile({
                path: path.join(__dirname, "../env.json"),
                env: ["alpha", "beta", "prod"],
                module: "services",
                packages: ["common", "vault"],
                target: path.join(__dirname, `${baseDirectory}/${entryDir}/env`),
                format: "lambdaENV",
              });
            }
          });
        },
      },
    ],
  };
};
