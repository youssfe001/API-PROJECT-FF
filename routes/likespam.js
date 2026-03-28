const express = require("express");
const router = express.Router();

const { ffRequestEncrypted } = require("../lib/request");
const { requireRegion, requireParam, ApiError } = require("../lib/validate");

function normalizeHex(value, name = "encryptedHexBody") {
  const hex = requireParam(value, name).replace(/\s+/g, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new ApiError(`Invalid '${name}'. Must be valid even-length hex.`);
  }
  return hex;
}

function parseIntInRange(value, name, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ApiError(`Invalid '${name}'. Must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function wait(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.post("/like-spam", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const encryptedHexBody = normalizeHex(req.body.encryptedHexBody);
    const endpoint = requireParam(req.body.endpoint || "/LikeProfile", "endpoint");
    const count = parseIntInRange(req.body.count, "count", 10, 1, 500);
    const delayMs = parseIntInRange(req.body.delayMs, "delayMs", 0, 0, 5000);

    const results = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < count; i += 1) {
      try {
        await ffRequestEncrypted({ region, endpoint, encryptedHexBody });
        success += 1;
        results.push({ index: i + 1, ok: true });
      } catch (err) {
        failed += 1;
        results.push({ index: i + 1, ok: false, error: err.message });
      }
      if (i < count - 1) {
        await wait(delayMs);
      }
    }

    res.json({
      endpoint,
      region,
      count,
      delayMs,
      summary: { success, failed },
      results,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
