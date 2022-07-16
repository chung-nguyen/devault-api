import { BN, privateToAddress, publicToAddress, privateToPublic, bufferToHex } from "ethereumjs-util";

/**
 * ethWallet
 */
export default async function ethWallet(randomBytes) {
  const randomBuffer = await randomBytes(1024);

  const max = new BN("088f924eeceeda7fe92e1f5b0fffffffffffffff", 16);
  var i = 0;
  while (i < 1024 - 32) {
    const privateKey = randomBuffer.slice(i, i + 32);
    if (new BN(privateToAddress(privateKey)).lte(max)) {
      const publicKey = privateToPublic(privateKey);
      const address = publicToAddress(publicKey);

      return {
        privateKey: bufferToHex(privateKey),
        publicKey: bufferToHex(publicKey),
        address: bufferToHex(address)
      };
    }

    i++;
  }

  return null;
}
