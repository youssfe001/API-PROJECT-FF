const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptimeSec: Math.floor(process.uptime()),
    now: new Date().toISOString(),
  });
});

module.exports = router;
