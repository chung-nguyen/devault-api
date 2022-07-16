const os = require("os");
const fs = require("fs");

/**
 * Build env file from common configurations
 * @param {*} opts
 */

const fileFormat = {
  lambda: "lambdaENV",
  dry: "dry",
};

module.exports = function (opts) {
  const { path, env, module, packages, target, format } = opts;

  const fileData = JSON.parse(fs.readFileSync(path));
  if (!fileData) {
    return;
  }
  let data = {};

  for (let envName of env) {
    const envData = fileData[envName];
    if (envData) {
      const moduleData = envData[module];
      if (moduleData) {
        if (packages) {
          packages.forEach((pack) => Object.assign(data, moduleData[pack]));
        } else {
          Object.assign(data, moduleData);
        }
      }
    }

    let lines;
    if (format === fileFormat.lambda) {
      lines = {
        Environment: {
          Variables: {},
        },
        Handler: "src/index.handler",
      };

      for (let [key, value] of Object.entries(data)) {
        lines.Environment.Variables[key] = value;
      }

      fs.writeFileSync(`${target}-${envName}.json`, JSON.stringify(lines));
    } else if (format === fileFormat.dry) {
      for (let [key, value] of Object.entries(data)) {
        process.env[key] = value;
      }
    } else {
      lines = [];

      for (let [key, value] of Object.entries(data)) {
        lines.push(`${key}=${value}`);
      }

      fs.writeFileSync(`${target}-${envName}`, lines.join(os.EOL));
    }
  }
};
