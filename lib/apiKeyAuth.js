/**
 * lib/apiKeyAuth.js
 * Optional API key authentication middleware.
 * If API_KEYS env var is not set, all requests pass through (open access).
 */

function apiKeyAuth(req, res, next) {
  const keys = process.env.API_KEYS;
  // No API_KEYS configured → open access (backward compatible)
  if (!keys) return next();

  const validKeys = keys.split(",").map((k) => k.trim()).filter(Boolean);
  if (validKeys.length === 0) return next();

  const provided = req.headers["x-api-key"];
  if (!provided || !validKeys.includes(provided)) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Missing or invalid API key. Provide a valid 'x-api-key' header.",
    });
  }
  next();
}

module.exports = { apiKeyAuth };
