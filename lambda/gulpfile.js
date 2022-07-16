const path = require("path");
const gulp = require("gulp");
const argv = require("yargs").argv;
const AWS = require("aws-sdk");
const AdmZip = require("adm-zip");

let lambda;
let ssmClient;
let opts = {
  name: "",
  region: "ap-northeast-1",
};

async function getVAR(name) {
  const param = await ssmClient
    .getParameter({
      Name: name,
      WithDecryption: true,
    })
    .promise();

  return param.Parameter.Value;
}

function updateConfiguration(variables) {
  return new Promise((resolve, reject) => {
    var params = {
      FunctionName: `arn:aws:lambda:${opts.region}:${argv.accountID}:function:${argv.project}-${argv.env}-${opts.name}`,
      Environment: variables,
    };
    lambda.updateFunctionConfiguration(params, function (err, data) {
      if (err) {
        console.log(`DEBUG ---------------updateFunctionConfiguration err: ${err}`);
        reject();
      } else {
        resolve();
      }
    });
  });
}

function updateFunctionCode(zip) {
  return new Promise((resolve, reject) => {
    var params = {
      FunctionName: `arn:aws:lambda:${opts.region}:${argv.accountID}:function:${argv.project}-${argv.env}-${opts.name}`,
      ZipFile: Buffer.from(zip),
    };
    lambda.updateFunctionCode(params, function (err, data) {
      if (err) {
        console.log(`DEBUG ---------------updateFunctionCode err: ${err}`);
        reject();
      } else {
        resolve();
      }
    });
  });
}

function waitFor(event) {
  return new Promise((resolve, reject) => {
    var params = {
      FunctionName: `arn:aws:lambda:${opts.region}:${argv.accountID}:function:${argv.project}-${argv.env}-${opts.name}`,
    };
    lambda.waitFor(event, params, function (err, data) {
      if (err) {
        console.log(`DEBUG ---------------waitFor err: ${err}`);
        resolve();
      } else {
        resolve();
      }
    });
  });
}

async function reformatVAR(distributionDir) {
  let variables = require(`${distributionDir}\\env-${argv.env}.json`).Environment;

  for (let key in variables.Variables) {
    if (variables.Variables[key] == "") {
      const newValue = await getVAR(`/${argv.project}-${argv.env}/variables/${key}`);
      if (newValue) {
        variables.Variables[key] = newValue;
      }
    }
  }
  return variables;
}

async function deployFunction(name) {
  opts.name = name;
  const distributionDir = path.join(__dirname, `../distribution/lambda/${opts.name}`);

  lambda = new AWS.Lambda({ region: opts.region });
  ssmClient = new AWS.SSM({ region: opts.region });

  const variables = await reformatVAR(distributionDir);
  const zip = new AdmZip();
  zip.addLocalFolder(`${distributionDir}`, `/`);
  var zipData = zip.toBuffer();
  await waitFor("functionUpdated");
  await updateFunctionCode(zipData);
  await waitFor("functionUpdated");
  await updateConfiguration(variables);
}

gulp.task("api", function () {
  return deployFunction("api");
});

gulp.task(
  "deploy",
  gulp.series(
    "api"
  )
);
