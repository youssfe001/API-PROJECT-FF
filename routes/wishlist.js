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

function parseWishList(buffer) {
  const items = [];
  let offset = 0;

  while (offset < buffer.length) {
    const tag = decodeVarint(buffer, offset);
    offset = tag.offset;

    const field = Number(tag.value >> 3n);
    const wire = Number(tag.value & 0x7n);

    if (field !== 1 || wire !== 2) {
      break;
    }

    const lenInfo = decodeVarint(buffer, offset);
    offset = lenInfo.offset;
    const len = Number(lenInfo.value);
    const end = offset + len;
    if (end > buffer.length) break;

    const itemBuf = buffer.slice(offset, end);
    offset = end;

    let inner = 0;
    let itemId;
    let value;

    while (inner < itemBuf.length) {
      const t = decodeVarint(itemBuf, inner);
      inner = t.offset;
      const f = Number(t.value >> 3n);
      const w = Number(t.value & 0x7n);
      if (w !== 0) break;
      const v = decodeVarint(itemBuf, inner);
      inner = v.offset;
      if (f === 1) itemId = Number(v.value);
      if (f === 2) value = Number(v.value);
    }

    items.push({
      itemId,
      value,
      rawHex: itemBuf.toString("hex"),
    });
  }

  return { items };
}

router.post("/wishlist", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const bodyHex = normalizeHex(req.body.bodyHex);

    const responseBuffer = await ffRequestEncrypted({
      region,
      endpoint: "/GetWishListItems",
      encryptedHexBody: bodyHex,
    });

    const parsed = parseWishList(responseBuffer);

    res.json({
      endpoint: "/GetWishListItems",
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
