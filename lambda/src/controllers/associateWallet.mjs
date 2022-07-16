import AWS from "aws-sdk";
import { readAccounts, writeAccounts } from "../utils/accountTable.mjs";
import kmsRandomBytes from "../utils/kmsRandomBytes.mjs";
import walletGenerator from "../utils/walletGenerator.mjs";

export default async function (params) {
  const { username } = params;

  if (!username) {
    throw new Error("No username provided");
  }

  const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

  const account = await readAccounts(ddb, username);

  if (account) {
    return {
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      address: account.address
    }
  }

  const { privateKey, publicKey, address, requireFullNodeImport } = await walletGenerator(
    "eth",
    "testnet",
    kmsRandomBytes
  );

  const result = await writeAccounts(ddb, {
    "username": { S: username },
    "privateKey": { S: privateKey },
    "publicKey": { S: publicKey },
    "address": { S: address }
  });

  return {
    result,
    privateKey,
    publicKey,
    address
  };
}
