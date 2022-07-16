import { bufferToHex } from "ethereumjs-util";
import Elliptic from 'elliptic';
import { payments, networks } from "bitcoinjs-lib";

function getPubKeyFromPriKey(priKeyBytes) {
  const ec = new Elliptic.ec('secp256k1');
  const key = ec.keyFromPrivate(priKeyBytes, 'bytes');
  const pubkey = key.getPublic();
  return Buffer.from(pubkey.encodeCompressed("array"));
}

async function genPriKey(randomBytes) {
  const randoms = await randomBytes(256);

  const ec = new Elliptic.ec('secp256k1');
  const key = ec.genKeyPair({
    entropy: randoms.slice(128).toString('hex'),
    entropyEnc: 'hex',
    pers: randoms.slice(128, 256).toString('hex'),
    persEnc: 'hex'
  });
  
  const priKey = key.getPrivate();
  
  let priKeyHex = priKey.toString('hex');

  return Buffer.from(priKeyHex, "hex");
}

/**
 * btcWallet
 * @param {string} type [p2pkh, p2sh, bench32, testnet]
 * @param {*} randomBytes
 */
export default async function btcWallet(type, randomBytes) {
  const priKeyBytes = await genPriKey(randomBytes);
  const pubKeyBytes = getPubKeyFromPriKey(priKeyBytes);

  let keyPair;
  let address;

  switch (type) {
    case "bench32":
      address = payments.p2wpkh({ pubkey: pubKeyBytes }).address;
      break;

    case "p2sh":
      address = payments.p2sh({
        redeem: payments.p2wpkh({ pubkey: pubKeyBytes })
      }).address;
      break;

    case "testnet":
      const TESTNET = networks.testnet;      
      address = payments.p2wpkh({ pubkey: pubKeyBytes, network: TESTNET }).address;
      break;

    default:
      address = payments.p2pkh({ pubkey: pubKeyBytes }).address;
      break;
  }

  return {
    address,
    requireFullNodeImport: true,
    privateKey: bufferToHex(priKeyBytes),
    publicKey: bufferToHex(pubKeyBytes)
  };
}
