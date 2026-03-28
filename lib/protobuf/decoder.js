/**
 * lib/protobuf/decoder.js
 * Schema-driven proto3 decoder -> JS object
 */

const { decodeVarint, decodeFixed32, decodeFixed64 } = require("./varint");

const WIRE_VARINT = 0;
const WIRE_64BIT = 1;
const WIRE_LEN = 2;
const WIRE_32BIT = 5;

function expectedWireType(type) {
  if (["uint32", "uint64", "int32", "int64", "sint32", "sint64", "bool", "enum"].includes(type)) {
    return WIRE_VARINT;
  }
  if (["string", "bytes", "message"].includes(type)) {
    return WIRE_LEN;
  }
  if (type === "float") {
    return WIRE_32BIT;
  }
  if (type === "double") {
    return WIRE_64BIT;
  }
  throw new Error(`Unsupported field type: ${type}`);
}

function toUnsignedNumberOrString(v) {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  return v > max ? v.toString() : Number(v);
}

function toSignedFromVarint(v, bits) {
  const max = 1n << BigInt(bits);
  const signBit = 1n << BigInt(bits - 1);
  const unsigned = v & (max - 1n);
  const signed = (unsigned & signBit) ? unsigned - max : unsigned;
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  const minSafe = BigInt(Number.MIN_SAFE_INTEGER);
  if (signed > maxSafe || signed < minSafe) return signed.toString();
  return Number(signed);
}

function readKnownField(buf, offset, fieldDef, schemas) {
  const { type, messageType } = fieldDef;

  if (type === "uint32" || type === "enum") {
    const out = decodeVarint(buf, offset);
    return { value: Number(out.value), offset: out.offset };
  }

  if (type === "uint64") {
    const out = decodeVarint(buf, offset);
    return { value: toUnsignedNumberOrString(out.value), offset: out.offset };
  }

  if (type === "int32") {
    const out = decodeVarint(buf, offset);
    return { value: toSignedFromVarint(out.value, 32), offset: out.offset };
  }

  if (type === "int64") {
    const out = decodeVarint(buf, offset);
    return { value: toSignedFromVarint(out.value, 64), offset: out.offset };
  }

  if (type === "sint32" || type === "sint64") {
    const out = decodeVarint(buf, offset);
    const zigzag = out.value;
    const decoded = (zigzag & 1n) ? -((zigzag + 1n) >> 1n) : (zigzag >> 1n);
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
    const minSafe = BigInt(Number.MIN_SAFE_INTEGER);
    const value = decoded > maxSafe || decoded < minSafe ? decoded.toString() : Number(decoded);
    return { value, offset: out.offset };
  }

  if (type === "bool") {
    const out = decodeVarint(buf, offset);
    return { value: out.value !== 0n, offset: out.offset };
  }

  if (type === "float") {
    return decodeFixed32(buf, offset);
  }

  if (type === "double") {
    return decodeFixed64(buf, offset);
  }

  if (type === "string" || type === "bytes" || type === "message") {
    const lenInfo = decodeVarint(buf, offset);
    const len = Number(lenInfo.value);
    const start = lenInfo.offset;
    const end = start + len;
    if (end > buf.length) throw new RangeError("Buffer overread in length-delimited field");

    if (type === "string") {
      return { value: buf.slice(start, end).toString("utf8"), offset: end };
    }

    if (type === "bytes") {
      return { value: buf.slice(start, end).toString("hex"), offset: end };
    }

    const nestedSchema = schemas[messageType];
    if (!nestedSchema) throw new Error(`Unknown message type: ${messageType}`);
    const nested = decodeMessage(buf.slice(start, end), nestedSchema, schemas);
    return { value: nested, offset: end };
  }

  throw new Error(`Unsupported field type: ${type}`);
}

/**
 * Wire types 3 & 4 = deprecated proto2 "groups".
 * skipGroup() reads tags until it finds the matching end-group (wire=4)
 * with the same field number, recursing into any nested groups.
 */
function skipGroup(buf, offset, fieldNum) {
  while (offset < buf.length) {
    const tag = decodeVarint(buf, offset);
    offset = tag.offset;
    const fNum   = Number(tag.value >> 3n);
    const wType  = Number(tag.value & 0x7n);
    if (wType === 4) return offset; // end-group tag consumed
    if (wType === 3) {
      offset = skipGroup(buf, offset, fNum); // nested group
    } else {
      offset = skipUnknown(buf, offset, wType);
    }
  }
  return offset; // truncated buffer — return safely
}

function skipUnknown(buf, offset, wireType) {
  if (wireType === WIRE_VARINT) {
    return decodeVarint(buf, offset).offset;
  }
  if (wireType === WIRE_64BIT) {
    return offset + 8;
  }
  if (wireType === WIRE_LEN) {
    const lenInfo = decodeVarint(buf, offset);
    return lenInfo.offset + Number(lenInfo.value);
  }
  if (wireType === WIRE_32BIT) {
    return offset + 4;
  }
  if (wireType === 3) { // start-group (deprecated proto2)
    return skipGroup(buf, offset, 0);
  }
  if (wireType === 4) { // end-group marker — no payload after the tag
    return offset;
  }
  throw new Error(`Unsupported wire type: ${wireType}`);
}

function decodeMessage(buf, schema, schemas = {}) {
  const byFieldNum = new Map();
  for (const [name, def] of Object.entries(schema)) {
    byFieldNum.set(def.field, { name, def });
  }

  const out = {};
  let offset = 0;

  while (offset < buf.length) {
    const tag = decodeVarint(buf, offset);
    offset = tag.offset;

    const fieldNum = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 0x7n);

    // wire=4 → end-group marker: signals end of enclosing group message
    if (wireType === 4) break;

    // wire=3 → start-group (deprecated proto2): skip entire nested group
    if (wireType === 3) {
      offset = skipGroup(buf, offset, fieldNum);
      continue;
    }

    const schemaHit = byFieldNum.get(fieldNum);
    if (!schemaHit) {
      offset = skipUnknown(buf, offset, wireType);
      continue;
    }

    const { name, def } = schemaHit;
    const expected = expectedWireType(def.type);
    if (wireType !== expected) {
      offset = skipUnknown(buf, offset, wireType);
      continue;
    }

    const parsed = readKnownField(buf, offset, def, schemas);
    offset = parsed.offset;

    if (def.repeated) {
      if (!Array.isArray(out[name])) out[name] = [];
      out[name].push(parsed.value);
    } else {
      out[name] = parsed.value;
    }
  }

  return out;
}

module.exports = { decodeMessage };
