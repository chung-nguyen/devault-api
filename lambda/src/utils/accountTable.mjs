export function readAccounts (ddb, username) {
  return new Promise(function (resolve, reject) {
    const TableName = "devault-alpha-accounts";

    ddb.getItem({
      TableName,
      Key: {
        'username': { S: username }
      }
    }, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result.Item);
      }
    });
  });
}

export function writeAccounts (ddb, data) {
  return new Promise(function (resolve, reject) {
    const TableName = "devault-alpha-accounts";

    ddb.putItem({
      TableName,
      Item: data
    }, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}
