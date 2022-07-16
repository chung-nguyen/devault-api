import path from "path";
import AWSHelper from "@bring-mom-money/aws-helper";
import Builders from "@bring-mom-money/builders";

import { handler as DepositWallet } from "./index.depositWallet.mjs";
import { handler as ApplyPendingTransaction } from "./index.applyPendingTransaction.mjs";
import { handler as ApplyRegisterWithdrawal } from "./index.applyRegisterWithdrawal.mjs";
import { handler as UnlockRequestIssuedOTP } from "./index.unlockRequestIssuedOTP.mjs";
import { handler as ProvideUnlockPWD } from "./index.provideUnlockPWD.mjs";

Builders.buildEnvFile({
  path: path.join(path.resolve(), "../../../env/env.json"),
  env: ["alpha"],
  module: "services",
  packages: ["common", "vault"],
  format: "dry",
});

AWSHelper.configureAWS("lambda");
process.env.AWS_PROFILE_NAME = "lambda";

export { DepositWallet, ApplyPendingTransaction, ApplyRegisterWithdrawal, UnlockRequestIssuedOTP, ProvideUnlockPWD };
