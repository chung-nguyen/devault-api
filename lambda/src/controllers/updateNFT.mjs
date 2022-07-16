import AWS from "aws-sdk";
import Web3 from "web3";
import constant from "../constant.mjs";
import { readAccounts } from "../utils/accountTable.mjs";

import NFTABI from "./abi/NFTABI.json";

function writeS3File (bucket, key, data) {
  return new Promise(function (resolve, reject) {

    var s3 = new AWS.S3();
    var params = {
      Bucket: bucket,
      Key: key,
      Body: data
    }
    s3.putObject(params, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data);
      }
    });
  });
}

export default async function (params) {
  const { id, data } = params;

  if (!id || !data) {
    throw new Error("Invalid parameters");
  }
  
  const result = await writeS3File("devault-metadata", `2048/${id}`, data);

  return {
    result
  }
}
