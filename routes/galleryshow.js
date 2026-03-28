const express = require("express");
const router = express.Router();

const { ffRequestEncrypted } = require("../lib/request");
const { requireRegion, requireParam } = require("../lib/validate");
const { decodeVarint } = require("../lib/protobuf/varint");

function normalizeHex(value, name = "bodyHex") {
  const hex = requireParam(value, name).replace(/\s+/g, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error(`Invalid '${name}'. Must be valid even-length hex.`);
  }
  return hex;
}

function safeAscii(buf) {
  const text = buf.toString("utf8");
  if (!text) return null;
  const printable = /^[\x20-\x7E\n\r\t]+$/.test(text);
  return printable ? text : null;
}

function parseMessage(buf) {
  const fields = [];
  let offset = 0;

  while (offset < buf.length) {
    const t = decodeVarint(buf, offset);
    offset = t.offset;

    const field = Number(t.value >> 3n);
    const wire = Number(t.value & 0x7n);

    if (wire === 0) {
      const v = decodeVarint(buf, offset);
      offset = v.offset;
      fields.push({ field, wire, value: Number(v.value) });
      continue;
    }

    if (wire === 2) {
      const lenInfo = decodeVarint(buf, offset);
      offset = lenInfo.offset;
      const len = Number(lenInfo.value);
      const end = offset + len;
      if (end > buf.length) break;
      const part = buf.slice(offset, end);
      offset = end;
      fields.push({
        field,
        wire,
        hex: part.toString("hex"),
        ascii: safeAscii(part),
        nested: parseMessage(part),
      });
      continue;
    }

    // Unsupported wire type for this helper; stop safely.
    break;
  }

  return fields;
}

function findSignature(fields) {
  for (const f of fields) {
    if (f.ascii && /[.!?]/.test(f.ascii)) return f.ascii;
    if (Array.isArray(f.nested)) {
      const nested = findSignature(f.nested);
      if (nested) return nested;
    }
  }
  return null;
}

function simplifyGalleryShow(rawBuf) {
  const fields = parseMessage(rawBuf);
  const version = fields.find((f) => f.field === 1 && f.wire === 0)?.value;
  const infoField = fields.find((f) => f.field === 2 && f.wire === 2);

  let infoType;
  if (infoField?.nested) {
    infoType = infoField.nested.find((f) => f.field === 1 && f.wire === 0)?.value;
  }

  return {
    version,
    infoType,
    signature: findSignature(fields),
    fields,
  };
}

router.post("/galleryshow", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const bodyHex = normalizeHex(req.body.bodyHex);

    const responseBuffer = await ffRequestEncrypted({
      region,
      endpoint: "/GetPlayerGalleryShowInfo",
      encryptedHexBody: bodyHex,
    });

    const parsed = simplifyGalleryShow(responseBuffer);

    res.json({
      endpoint: "/GetPlayerGalleryShowInfo",
      region,
      request: { bodyHex },
      response: parsed,
      rawResponseHex: responseBuffer.toString("hex"),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
