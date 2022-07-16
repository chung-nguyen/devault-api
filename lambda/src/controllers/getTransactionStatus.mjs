import Web3 from "web3";
import BN from "bn.js";

import constant from "../constant.mjs";

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
  const { hash } = params;

  if (!hash) {
    throw new Error("Invalid parameters");
  }

  const RPC_URL = constant.RPC_URL;

  const web3 = new Web3(RPC_URL);
  const result = await web3.eth.getTransactionReceipt(hash);

  const TRANSFER_EVENT_HASH = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  if (result.logs) {
    const transferEvent = result.logs.find((log) => (log.topics[0] === TRANSFER_EVENT_HASH));
    if (transferEvent) {
      result.mintTo = {
        to: transferEvent.topics[2],
        id: web3.utils.hexToNumberString(transferEvent.topics[3]),
        amount: BNToNumber(web3.utils.hexToNumberString(transferEvent.data), 18),
        rawAmount: web3.utils.hexToNumberString(transferEvent.data)
      };
    }
  }

  return {
    hash,
    result
  };
}
