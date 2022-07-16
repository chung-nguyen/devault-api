import AWS from "aws-sdk";
import Web3 from "web3";
import BN from "bn.js";
import constant from "../constant.mjs";
import { readAccounts } from "../utils/accountTable.mjs";

import TokenABI from "./abi/TokenABI.json";

function getDecimalSeparator(locale) {
  const numberWithDecimalSeparator = 1.1;
  return Intl.NumberFormat(locale)
    .formatToParts(numberWithDecimalSeparator)
    .find((part) => part.type === "decimal").value;
}

function BNToNumber(x, decimals) {
  try {
    const base = new BN(10).pow(new BN(decimals));
    const dm = new BN(x.toString(10)).divmod(base);
    const s = dm.div.toString(10) + getDecimalSeparator() + dm.mod.toString(10).padStart(decimals, "0");
    return parseFloat(s);
  } catch (ex) {
    console.error(ex);
  }

  return 0;
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

  const RPC_URL = constant.RPC_URL;
  const TOKEN_CONTRACT_ADDRESS = constant.TOKEN_CONTRACT_ADDRESS;

  const web3 = new Web3(RPC_URL);
  const contract = new web3.eth.Contract(TokenABI.abi, TOKEN_CONTRACT_ADDRESS);
  const method = contract.methods.balanceOf(account.address.S);
  const balance = await method.call();
  
  return {
    balance: BNToNumber(balance, 18)
  };
}
