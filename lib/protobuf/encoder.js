/**
 * lib/protobuf/encoder.js
 * Schema-driven proto3 encoder → Buffer
 *
 * Schema field types:
 *   uint32, uint64, int32, int64, bool, enum  → wire type 0 (varint)
 *   string, bytes                              → wire type 2 (length-delimited)
 *   float                                      → wire type 5 (32-bit)
 *   double                                     → wire type 1 (64-bit)
 *   message                                    → wire type 2 (length-delimited, recursive)
 *   repeated <any>                             → multiple fields
 */

const { encodeVarint } = require("./varint");

const WIRE_VARINT = 0;
const WIRE_64BIT  = 1;
const WIRE_LEN    = 2;
const WIRE_32BIT  = 5;

function makeTag(fieldNum, wireType) {
  return encodeVarint((fieldNum << 3) | wireType);
}

function encodeField(fieldDef, value, schemas) {
  if (value === null || value === undefined) return Buffer.alloc(0);

  const { field, type, messageType } = fieldDef;

  // repeated
  if (fieldDef.repeated) {
    if (!Array.isArray(value)) value = [value];
    return Buffer.concat(
      value.map(v => encodeField({ ...fieldDef, repeated: false }, v, schemas))
    );
  }

  const varintTypes = new Set(["uint32", "uint64", "int32", "int64", "bool", "enum", "sint32", "sint64"]);

  if (varintTypes.has(type)) {
    let v = type === "bool" ? (value ? 1n : 0n) : BigInt(value);
    if (type === "sint32" || type === "sint64") {
      v = v >= 0n ? v * 2n : v * -2n - 1n; // zigzag
    }
    return Buffer.concat([makeTag(field, WIRE_VARINT), encodeVarint(v)]);
  }

  if (type === "string") {
    const strBuf = Buffer.from(String(value), "utf8");
    return Buffer.concat([makeTag(field, WIRE_LEN), encodeVarint(strBuf.length), strBuf]);
  }

  if (type === "bytes") {
    const b = Buffer.isBuffer(value) ? value : Buffer.from(value, "hex");
    return Buffer.concat([makeTag(field, WIRE_LEN), encodeVarint(b.length), b]);
  }

  if (type === "float") {
    const tag = makeTag(field, WIRE_32BIT);
    const buf = Buffer.alloc(4);
    buf.writeFloatLE(value, 0);
    return Buffer.concat([tag, buf]);
  }

  if (type === "double") {
    const tag = makeTag(field, WIRE_64BIT);
    const buf = Buffer.alloc(8);
    buf.writeDoubleLE(value, 0);
    return Buffer.concat([tag, buf]);
  }

  if (type === "message") {
    const schema = schemas[messageType];
    if (!schema) throw new Error(`Unknown message type: ${messageType}`);
    const nested = encodeMessage(value, schema, schemas);
    return Buffer.concat([makeTag(field, WIRE_LEN), encodeVarint(nested.length), nested]);
  }

  return Buffer.alloc(0);
}

/**
 * Encode a JS object into a Protobuf Buffer
 * @param {object} data     - { fieldName: value, ... }
 * @param {object} schema   - { fieldName: { field, type, repeated?, messageType? }, ... }
 * @param {object} schemas  - all schemas (for nested messages)
 * @returns {Buffer}
 */
function encodeMessage(data, schema, schemas = {}) {
  const parts = [];
  for (const [name, def] of Object.entries(schema)) {
    const value = data[name];
    if (value === undefined || value === null) continue;
    if (def.repeated && Array.isArray(value) && value.length === 0) continue;
    parts.push(encodeField(def, value, schemas));
  }
  return Buffer.concat(parts);
}

module.exports = { encodeMessage };
