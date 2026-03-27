/**
 * lib/crypto.js
 * AES-256-CBC helpers used by all Free Fire API calls.
 *
 * Key  : Yg&tc%DEuh6%Zc^8   (16 bytes → padded to 32 for AES-256)
 * IV   : 6oyZDr22E3ychjM%   (16 bytes)
 *
 * The game sends / receives data as hex-encoded ciphertext.
 */

const crypto = require("crypto");

// Raw strings from the game client
const KEY_STR = "Yg&tc%DEuh6%Zc^8";
const IV_STR  = "6oyZDr22E3ychjM%";

// AES-256 needs a 32-byte key; pad / truncate if necessary
const KEY = Buffer.alloc(32);
Buffer.from(KEY_STR, "utf8").copy(KEY);

const IV = Buffer.from(IV_STR, "utf8"); // 16 bytes

/**
 * Encrypt a hex string (raw bytes) → hex ciphertext.
 * @param {string} hexData - Plaintext bytes as hex string (e.g. protobuf payload)
 * @returns {string} Hex-encoded AES-256-CBC ciphertext
 */
function encryptAes(hexData) {
  const plaintext = Buffer.from(hexData, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, IV);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return encrypted.toString("hex");
}

/**
 * Decrypt a hex ciphertext → hex plaintext.
 * @param {string} hexData - AES-256-CBC ciphertext as hex string
 * @returns {string} Decrypted bytes as hex string
 */
function decryptAes(hexData) {
  const ciphertext = Buffer.from(hexData, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, IV);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("hex");
}

/**
 * Convenience: encrypt a plain UTF-8 string → hex ciphertext.
 */
function encryptString(str) {
  return encryptAes(Buffer.from(str, "utf8").toString("hex"));
}

/**
 * Convenience: decrypt hex ciphertext → UTF-8 string.
 */
function decryptToString(hexData) {
  return Buffer.from(decryptAes(hexData), "hex").toString("utf8");
}

module.exports = { encryptAes, decryptAes, encryptString, decryptToString };
