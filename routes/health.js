const express = require("express");
const router = express.Router();

/**
 * GET /api/health
 * Basic health check – always the first endpoint to verify the server is alive.
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

module.exports = router;
