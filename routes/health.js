const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    status: "ok",
    uptimeSec: Math.floor(process.uptime()),
    now: new Date().toISOString(),
  });
});

module.exports = router;
