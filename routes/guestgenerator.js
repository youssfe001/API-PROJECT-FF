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
