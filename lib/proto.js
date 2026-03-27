/**
 * lib/proto.js
 * واجهة Protobuf العامة للمشروع
 * تستخدم encoder/decoder/schemas خالصة بدون أي مكتبة خارجية
 */

const { encodeMessage } = require("./protobuf/encoder");
const { decodeMessage } = require("./protobuf/decoder");
const schemas           = require("./protobuf/schemas");

/**
 * يُشفِّر كائن JS إلى Buffer بناءً على اسم الـ message
 *
 * @param {object} data       - البيانات
 * @param {string} messageName - e.g. "PlayerPersonalShow.request"
 * @returns {Buffer}
 */
function encodeProto(data, messageName) {
  const schema = schemas[messageName];
  if (!schema) throw new Error(`Unknown proto message: "${messageName}"`);
  return encodeMessage(data, schema, schemas);
}

/**
 * يُفكّك Buffer إلى كائن JS بناءً على اسم الـ message
 *
 * @param {Buffer} buffer
 * @param {string} messageName - e.g. "PlayerPersonalShow.response"
 * @returns {object}
 */
function decodeProto(buffer, messageName) {
  const schema = schemas[messageName];
  if (!schema) throw new Error(`Unknown proto message: "${messageName}"`);
  return decodeMessage(buffer, schema, schemas);
}

module.exports = { encodeProto, decodeProto };
