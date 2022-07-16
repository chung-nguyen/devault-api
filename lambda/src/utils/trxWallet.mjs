import { createHash } from "crypto";
import Elliptic from 'elliptic';
import { keccak256 } from "ethereumjs-util";
import { bufferToHex } from "ethereumjs-util";

import { encode58 } from "./base58.mjs";

const ADDRESS_PREFIX = "41";

function isHexable(value) {
  return !!(value.toHexString);
}

function isHexString(value, length) {
  if (typeof(value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
      return false
  }
  if (length && value.length !== 2 + 2 * length) { return false; }
  return true;
}

function addSlice(array) {
  if (array.slice) { return array; }

  array.slice = function() {
      const args = Array.prototype.slice.call(arguments);
      return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
  }

  return array;
}

function isInteger(value) {
  return (typeof(value) === "number" && value == value && (value % 1) === 0);
}

export function isBytes(value) {
  if (value == null) { return false; }

  if (value.constructor === Uint8Array) { return true; }
  if (typeof(value) === "string") { return false; }
  if (!isInteger(value.length) || value.length < 0) { return false; }

  for (let i = 0; i < value.length; i++) {
      const v = value[i];
      if (!isInteger(v) || v < 0 || v >= 256) { return false; }
  }
  return true;
}

function byte2hexStr(byte) {
  if (typeof byte !== "number") throw new Error("Input must be a number");

  if (byte < 0 || byte > 255) throw new Error("Input must be a byte");

  const hexByteMap = "0123456789ABCDEF";

  let str = "";
  str += hexByteMap.charAt(byte >> 4);
  str += hexByteMap.charAt(byte & 0x0f);

  return str;
}

function byteArray2hexStr(byteArray) {
  let str = "";

  for (let i = 0; i < byteArray.length; i++) str += byte2hexStr(byteArray[i]);

  return str;
}

function hexChar2byte(c) {
  let d;

  if (c >= "A" && c <= "F") d = c.charCodeAt(0) - "A".charCodeAt(0) + 10;
  else if (c >= "a" && c <= "f") d = c.charCodeAt(0) - "a".charCodeAt(0) + 10;
  else if (c >= "0" && c <= "9") d = c.charCodeAt(0) - "0".charCodeAt(0);

  if (typeof d === "number") return d;
  else throw new Error("The passed hex char is not a valid hex char");
}

function isHexChar(c) {
  if ((c >= "A" && c <= "F") || (c >= "a" && c <= "f") || (c >= "0" && c <= "9")) {
    return 1;
  }

  return 0;
}

function hexStr2byteArray(str, strict = false) {
  if (typeof str !== "string") throw new Error("The passed string is not a string");

  let len = str.length;

  if (strict) {
    if (len % 2) {
      str = `0${str}`;
      len++;
    }
  }
  const byteArray = Array();
  let d = 0;
  let j = 0;
  let k = 0;

  for (let i = 0; i < len; i++) {
    const c = str.charAt(i);

    if (isHexChar(c)) {
      d <<= 4;
      d += hexChar2byte(c);
      j++;

      if (0 === j % 2) {
        byteArray[k++] = d;
        d = 0;
      }
    } else throw new Error("The passed hex char is not a valid hex string");
  }

  return byteArray;
}

function arrayify(value, options) {
  if (!options) { options = { }; }

  if (typeof(value) === "number") {
      logger.checkSafeUint53(value, "invalid arrayify value");

      const result = [];
      while (value) {
          result.unshift(value & 0xff);
          value = parseInt(String(value / 256));
      }
      if (result.length === 0) { result.push(0); }

      return addSlice(new Uint8Array(result));
  }

  if (options.allowMissingPrefix && typeof(value) === "string" && value.substring(0, 2) !== "0x") {
       value = "0x" + value;
  }

  if (isHexable(value)) { value = value.toHexString(); }

  if (isHexString(value)) {
      let hex = value.substring(2);
      if (hex.length % 2) {
          if (options.hexPad === "left") {
              hex = "0x0" + hex.substring(2);
          } else if (options.hexPad === "right") {
              hex += "0";
          } else {
              logger.throwArgumentError("hex data is odd-length", "value", value);
          }
      }

      const result = [];
      for (let i = 0; i < hex.length; i += 2) {
          result.push(parseInt(hex.substring(i, i + 2), 16));
      }

      return addSlice(new Uint8Array(result));
  }

  if (isBytes(value)) {
      return addSlice(new Uint8Array(value));
  }

  return logger.throwArgumentError("invalid arrayify value", "value", value);
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

  while (priKeyHex.length < 64) {
      priKeyHex = `0${priKeyHex}`;
  }

  return hexStr2byteArray(priKeyHex);
}

function getPubKeyFromPriKey(priKeyBytes) {
  const ec = new Elliptic.ec('secp256k1');
  const key = ec.keyFromPrivate(priKeyBytes, 'bytes');
  const pubkey = key.getPublic();
  const x = pubkey.x;
  const y = pubkey.y;

  let xHex = x.toString('hex');

  while (xHex.length < 64) {
      xHex = `0${xHex}`;
  }

  let yHex = y.toString('hex');

  while (yHex.length < 64) {
      yHex = `0${yHex}`;
  }

  const pubkeyHex = `04${xHex}${yHex}`;
  const pubkeyBytes = hexStr2byteArray(pubkeyHex);

  return pubkeyBytes;
}

function computeAddress(pubBytes) {
  if (pubBytes.length === 65)
      pubBytes = pubBytes.slice(1);

  const hashed = bufferToHex(keccak256(Buffer.from(arrayify(pubBytes)))).substring(2);
  const addressHex = ADDRESS_PREFIX + hashed.substring(24);

  return hexStr2byteArray(addressHex);
}

function getAddressFromPriKey(priKeyBytes) {
  let pubBytes = getPubKeyFromPriKey(priKeyBytes);
  return computeAddress(pubBytes);
}

function sha256(data) {
  return "0x" + createHash("sha256").update(Buffer.from(arrayify(data))).digest("hex")
}

function SHA256(msgBytes) {
  const msgHex = byteArray2hexStr(msgBytes);
  const hashHex = sha256('0x' + msgHex).replace(/^0x/, '')
  return hexStr2byteArray(hashHex);
}

function getBase58CheckAddress(addressBytes) {
  const hash0 = SHA256(addressBytes);
  const hash1 = SHA256(hash0);

  let checkSum = hash1.slice(0, 4);
  checkSum = addressBytes.concat(checkSum);

  return encode58(checkSum);
}

/**
 * trxWallet
 * @param {*} randomBytes 
 * @returns 
 */
export default async function trxWallet(randomBytes) {
  const priKeyBytes = await genPriKey(randomBytes);
  
  const pubKeyBytes = getPubKeyFromPriKey(priKeyBytes);
  const addressBytes = getAddressFromPriKey(priKeyBytes);

  const privateKey = byteArray2hexStr(priKeyBytes);
  const publicKey = byteArray2hexStr(pubKeyBytes);

  return {
    privateKey,
    publicKey,
    address: getBase58CheckAddress(addressBytes)
  };
}
