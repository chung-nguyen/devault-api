import AWS from "aws-sdk";
import Web3 from "web3";
import constant from "../constant.mjs";
import { readAccounts } from "../utils/accountTable.mjs";

import TokenABI from "./abi/TokenABI.json";

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
  const { username, amount } = params;

  if (!username || !amount) {
    throw new Error("Invalid parameters");
  }

  const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  const account = await readAccounts(ddb, username);
  if (!account) {
    throw new Error("Username was not associated with a wallet");    
  }

  const RPC_URL = constant.RPC_URL;
  const TOKEN_CONTRACT_ADDRESS = constant.TOKEN_CONTRACT_ADDRESS;
  const OWNER_ADDRESS = constant.OWNER_ADDRESS;
  const OWNER_PRIVATE_KEY = constant.OWNER_PRIVATE_KEY;

  const web3 = new Web3(RPC_URL);
  const contract = new web3.eth.Contract(TokenABI.abi, TOKEN_CONTRACT_ADDRESS);

  let data, gas;
  if (amount > 0) {
    const method = contract.methods.give(account.address.S, Web3.utils.toWei(amount, "ether"));
    gas = await method.estimateGas({ from: OWNER_ADDRESS });
    data = method.encodeABI();
  } else {
    const method = contract.methods.take(account.address.S, Web3.utils.toWei(Math.abs(amount), "ether"));
    gas = await method.estimateGas({ from: OWNER_ADDRESS });
    data = method.encodeABI();
  }

  const txData = await web3.eth.accounts.signTransaction(
    {
      data,
      gas,
      to: TOKEN_CONTRACT_ADDRESS,
      value: 0      
    },
    OWNER_PRIVATE_KEY
  );

  const txHash = await sendTransaction(web3, txData.rawTransaction);
  return {
    txHash
  };
}
