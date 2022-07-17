import AWS from "aws-sdk";
import Web3 from "web3";
import constant from "../constant.mjs";
import { readAccounts } from "../utils/accountTable.mjs";

import NFTABI from "./abi/NFTABI.json";

async function sendTransaction (web3, rawTransaction) {
  return new Promise((resolve, reject) => {
    web3.eth
      .sendSignedTransaction(rawTransaction)
      .on("transactionHash", function (hash) {
        resolve(hash);
      })
      .on("error", function (error) {
        reject(error);
      });
  });
}

export default async function (params) {
  const { username } = params;

  if (!username) {
    throw new Error("Invalid parameters");
  }

  const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  const account = await readAccounts(ddb, username);
  if (!account) {
    throw new Error("Username was not associated with a wallet");
  }

  const id = Date.now();

  const RPC_URL = constant.RPC_URL;
  const NFT_CONTRACT_ADDRESS = constant.NFT_CONTRACT_ADDRESS;
  const OWNER_ADDRESS = constant.OWNER_ADDRESS;
  const OWNER_PRIVATE_KEY = constant.OWNER_PRIVATE_KEY;

  const web3 = new Web3(RPC_URL);
  const contract = new web3.eth.Contract(NFTABI.abi, NFT_CONTRACT_ADDRESS);

  const method = contract.methods.create(id, account.address.S);
  const gas = await method.estimateGas({ from: OWNER_ADDRESS });
  const data = method.encodeABI();

  const txData = await web3.eth.accounts.signTransaction(
    {
      data,
      gas,
      to: NFT_CONTRACT_ADDRESS,
      value: 0      
    },
    OWNER_PRIVATE_KEY
  );

  const txHash = await sendTransaction(web3, txData.rawTransaction);
  return {
    id,
    txHash
  };
}
