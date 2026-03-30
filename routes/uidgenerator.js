const express = require("express");
const router = express.Router();

const { encodeVarint } = require("../lib/protobuf/varint");
const { encryptAes } = require("../lib/crypto");
const { ApiError } = require("../lib/validate");

function parsePositiveInt(value, name, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(`Invalid '${name}'. Must be a positive integer.`);
  }
  return n;
}

function parseMode(value) {
  const mode = String(value || "random").toLowerCase();
  if (!["random", "sequential"].includes(mode)) {
    throw new ApiError("Invalid 'mode'. Must be 'random' or 'sequential'.");
  }
  return mode;
}

function randomUid(length) {
  const first = String(Math.floor(Math.random() * 9) + 1);
  let rest = "";
  for (let i = 1; i < length; i += 1) {
    rest += String(Math.floor(Math.random() * 10));
  }
  return first + rest;
}

function sequentialUid(start, step, index) {
  return String(BigInt(start) + BigInt(step) * BigInt(index));
}

function encodeUidGeneratorProto(uid, teamXdarks = 1) {
  const parts = [];
  // field 1: krishna_ (int64, wire=0)
  parts.push(Buffer.from([0x08]));
  parts.push(encodeVarint(BigInt(uid)));
  // field 2: teamXdarks (int64, wire=0)
  parts.push(Buffer.from([0x10]));
  parts.push(encodeVarint(BigInt(teamXdarks)));
  return Buffer.concat(parts);
}

router.get("/uid-generator", (req, res, next) => {
  try {
    const mode = parseMode(req.query.mode);
    const count = parsePositiveInt(req.query.count, "count", 1);
    const length = parsePositiveInt(req.query.length, "length", 10);
    const teamXdarks = parsePositiveInt(req.query.teamXdarks, "teamXdarks", 1);

    if (count > 200) {
      throw new ApiError("'count' is too large. Maximum is 200.");
    }

    const start = parsePositiveInt(req.query.start, "start", 1000000000);
    const step = parsePositiveInt(req.query.step, "step", 1);

    const items = [];
    for (let i = 0; i < count; i += 1) {
      const uid = mode === "random"
        ? randomUid(length)
        : sequentialUid(start, step, i);

      const protoBuffer = encodeUidGeneratorProto(uid, teamXdarks);
      const protoHex = protoBuffer.toString("hex");
      const encryptedHex = encryptAes(protoHex);

      items.push({
        uid,
        teamXdarks,
        protobufHex: protoHex,
        encryptedHex,
      });
    }

    res.set("Cache-Control", "no-store");
    res.json({
      mode,
      count,
      note: "Generated uid_generator protobuf payloads and AES encrypted hex.",
      endpointHint: "/GetPlayerPersonalShow",
      items,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
