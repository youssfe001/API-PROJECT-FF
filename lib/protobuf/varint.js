/**
 * lib/protobuf/varint.js
 * Protobuf varint encoding/decoding (proto3, pure Node.js)
 * Supports values up to uint64 via BigInt
 */

/** Encode a number/bigint as a varint Buffer */
function encodeVarint(value) {
  let v = BigInt(value);
  const bytes = [];
  while (v > 0x7fn) {
    bytes.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  bytes.push(Number(v));
  return Buffer.from(bytes);
}

/**
 * Decode a varint from buf starting at offset
 * @returns { value: BigInt, offset: number }
 */
function decodeVarint(buf, offset) {
  let result = 0n;
  let shift  = 0n;
  let byte;
  if (offset >= buf.length) throw new RangeError("Buffer overread in decodeVarint");
  do {
    byte = buf[offset++];
    result |= BigInt(byte & 0x7f) << shift;
    shift += 7n;
    if (shift > 70n) throw new RangeError("Varint too long");
  } while (byte & 0x80);
  return { value: result, offset };
}

/** Read a 32-bit little-endian float */
function decodeFixed32(buf, offset) {
  return { value: buf.readFloatLE(offset), offset: offset + 4 };
}

/** Read a 64-bit little-endian double */
function decodeFixed64(buf, offset) {
  return { value: buf.readDoubleLE(offset), offset: offset + 8 };
}

module.exports = { encodeVarint, decodeVarint, decodeFixed32, decodeFixed64 };
