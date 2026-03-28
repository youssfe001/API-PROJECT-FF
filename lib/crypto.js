/**
 * lib/crypto.js
 * AES-128-CBC helpers used by all Free Fire API calls.
 *
 * Key  : Yg&tc%DEuh6%Zc^8   (16 bytes — AES-128, used as-is)
 * IV   : 6oyZDr22E3ychjM%   (16 bytes)
 *
 * Reference: github.com/0xMe/FreeFire-Api — AESConfiguration.py
 * Uses AES-128-CBC (NOT AES-256). The 16-byte key is used directly.
 */

const crypto = require("crypto");

// 16-byte key and IV — AES-128-CBC
const KEY = Buffer.from("Yg&tc%DEuh6%Zc^8", "utf8"); // 16 bytes
const IV  = Buffer.from("6oyZDr22E3ychjM%", "utf8"); // 16 bytes

/**
 * Encrypt a hex string (raw bytes) → hex ciphertext.
 * @param {string} hexData - Plaintext bytes as hex string (e.g. protobuf payload)
 * @returns {string} Hex-encoded AES-128-CBC ciphertext
 */
function encryptAes(hexData) {
  const plaintext = Buffer.from(hexData, "hex");
  const cipher = crypto.createCipheriv("aes-128-cbc", KEY, IV);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return encrypted.toString("hex");
}

/**
 * Decrypt a hex ciphertext → hex plaintext.
 * @param {string} hexData - AES-128-CBC ciphertext as hex string
 * @returns {string} Decrypted bytes as hex string
 */
function decryptAes(hexData) {
  const ciphertext = Buffer.from(hexData, "hex");
  const decipher = crypto.createDecipheriv("aes-128-cbc", KEY, IV);
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
