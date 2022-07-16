import AWS from "aws-sdk";

/**
 * Rotate a random public key that was put into Parameter Store.
 * @param {string} name
 * @returns
 */
export async function getEncryptKey(name) {
  const ssmClient = new AWS.SSM();

  // List all entries from Parameter Store
  const res = await ssmClient
    .describeParameters({
      ParameterFilters: [
        {
          Key: "Name",
          Option: "BeginsWith",
          Values: [name],
        },
      ],
    })
    .promise();

  // Pick a random entry
  const descriptor = res.Parameters[Math.floor(Math.random() * res.Parameters.length)];

  // Get value of the randomly picked entry
  const param = await ssmClient
    .getParameter({
      Name: descriptor.Name,
      WithDecryption: true,
    })
    .promise();

  return param.Parameter;
}

export async function getPassword(name) {
  const ssmClient = new AWS.SSM();

  // Get value of the randomly picked entry
  const param = await ssmClient
    .getParameter({
      Name: name,
      WithDecryption: true,
    })
    .promise();

  return param.Parameter;
}
