/**
 * routes/guestgenerator.js
 * ──────────────────────────────────────────────────────────────────
 * GET /guest-generator?region=XX → return saved guest credentials
 *
 * Note: Guest accounts are harvested from the game via Frida hooks,
 * not created via API. This endpoint returns pre-saved credentials
 * from guests.json or accounts.json.
 * ──────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();

const { requireRegion } = require("../lib/validate");
const { getCredentialForRegion } = require("../lib/credentials");

router.get("/guest-generator", (req, res, next) => {
  try {
    const region = requireRegion(req.query.region);
    const selected = getCredentialForRegion(region);

    res.json({
      region,
      source: selected.source,
      guest: {
        uid: selected.credential.uid,
        password: selected.credential.password,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
