import ethWallet from "./ethWallet.mjs";
import btcWallet from "./btcWallet.mjs";
import trxWallet from "./trxWallet.mjs";

/**
 * Generate a crypto wallet for a network
 * @param {string} network
 * @param {string} mode
 * @param {function} randomBytes
 * @returns {object|null} Wallet information { privateKey, publicKey, address }
 */
export default function (network, mode, randomBytes) {
  switch (network) {
    case "eth":
    case "bsc":
      return ethWallet(randomBytes);

    case "btc":
      if (mode === "mainnet") {
        // return btcWallet("p2pkh", randomBytes);
        return btcWallet("bench32", randomBytes);        
      } else {
        return btcWallet("testnet", randomBytes);
      }
      
    case "btc-segwit":
      return btcWallet("bench32", randomBytes);

    case "btc-testnet":
      return btcWallet("testnet", randomBytes);

    case "trx":
      return trxWallet(randomBytes);
  }

  return null;
}
