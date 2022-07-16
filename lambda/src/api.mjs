import AWS from "aws-sdk";

import changeUserBalance from "./controllers/changeUserBalance.mjs";
import associateWallet from "./controllers/associateWallet.mjs";
import getUserBalance from "./controllers/getUserBalance.mjs";
import getTransactionStatus from "./controllers/getTransactionStatus.mjs";
import mintNFT from "./controllers/mintNFT.mjs";
import updateNFT from "./controllers/updateNFT.mjs";

AWS.config.update({ region: process.env.AWS_REGION_VAR });

if (process.env.ENABLE_AWS_SDK_LOG == 1) {
  AWS.config.logger = console;
}

export const handler = async (event) => {  
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;    
    const query = event.queryStringParameters;
    const params = body || query;

    let result = { ok: 1 };
    switch (params.api) {
      case 'associate-wallet':
        result = await associateWallet(params);
        break;

      case 'add-user-balance':
        result = await changeUserBalance(params);
        break;

      case 'subtract-user-balance':
        params.amount = -params.amount;
        result = await changeUserBalance(params);
        break;

      case 'get-user-balance':
        result = await getUserBalance(params);
        break;

      case 'get-transaction-status':
        result = await getTransactionStatus(params);
        break;

      case 'mint-nft':
        result = await mintNFT(params);
        break;

      case 'update-nft':
        result = await updateNFT(params);
        break;
    }

    return result;
  } catch (ex) {
    return {
      statusCode: 500,
      body: ex.toString()
    };
  }
};
