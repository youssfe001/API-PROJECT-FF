/**
 * routes/likespam.js
 * ──────────────────────────────────────────────────────────────────
 * Two modes:
 *   1. Simple  — POST /like-spam  { region, uid, count?, delayMs? }
 *                Builds LikeProfile protobuf automatically
 *   2. Raw     — POST /like-spam/raw  { region, encryptedHexBody, endpoint?, count?, delayMs? }
 *                Sends pre-encrypted hex (advanced / custom endpoint)
 * ──────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();

const { ffRequest, ffRequestEncrypted } = require("../lib/request");
const { requireRegion, requireUid, ApiError } = require("../lib/validate");
const { encodeProto } = require("../lib/proto");
const { FF_ENDPOINTS } = require("../config/constants");

/* ── helpers ─────────────────────────────────────────────────── */

function normalizeHex(value, name = "encryptedHexBody") {
  const hex = String(value || "").replace(/\s+/g, "").toLowerCase();
  if (!hex || !/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new ApiError(`Invalid '${name}'. Must be valid even-length hex.`);
  }
  return hex;
}

function parseIntInRange(value, name, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ApiError(`Invalid '${name}'. Must be integer ${min}–${max}.`);
  }
  return parsed;
}

function wait(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Mode 1: simple (uid + region) ───────────────────────────── */

router.post("/like-spam", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const uid    = requireUid(req.body.uid);
    const count  = parseIntInRange(req.body.count,   "count",   10, 1, 500);
    const delayMs = parseIntInRange(req.body.delayMs, "delayMs", 0,  0, 5000);

    // Build LikeProfile protobuf
    const protoBuf = encodeProto({ accountId: uid }, "LikeProfile.request");
    const hexBody  = protoBuf.toString("hex");

    const results = [];
    let success = 0;
    let failed  = 0;

    for (let i = 0; i < count; i++) {
      try {
        await ffRequest({ region, endpoint: FF_ENDPOINTS.LIKE_PROFILE, hexBody });
        success++;
        results.push({ index: i + 1, ok: true });
      } catch (err) {
        failed++;
        results.push({ index: i + 1, ok: false, error: err.message });
      }
      if (i < count - 1) await wait(delayMs);
    }

    res.json({
      mode: "simple",
      endpoint: FF_ENDPOINTS.LIKE_PROFILE,
      region,
      uid,
      count,
      delayMs,
      summary: { success, failed },
      results,
    });
  } catch (err) {
    next(err);
  }
});

/* ── Mode 2: raw (pre-encrypted hex) ────────────────────────── */

router.post("/like-spam/raw", async (req, res, next) => {
  try {
    const region          = requireRegion(req.body.region);
    const encryptedHexBody = normalizeHex(req.body.encryptedHexBody);
    const endpoint        = req.body.endpoint || FF_ENDPOINTS.LIKE_PROFILE;
    const count           = parseIntInRange(req.body.count,   "count",   10, 1, 500);
    const delayMs         = parseIntInRange(req.body.delayMs, "delayMs", 0,  0, 5000);

    const results = [];
    let success = 0;
    let failed  = 0;

    for (let i = 0; i < count; i++) {
      try {
        await ffRequestEncrypted({ region, endpoint, encryptedHexBody });
        success++;
        results.push({ index: i + 1, ok: true });
      } catch (err) {
        failed++;
        results.push({ index: i + 1, ok: false, error: err.message });
      }
      if (i < count - 1) await wait(delayMs);
    }

    res.json({
      mode: "raw",
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
