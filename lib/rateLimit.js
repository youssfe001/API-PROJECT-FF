/**
 * lib/rateLimit.js
 * Rate limiting middleware — in-memory store (Vercel serverless compatible)
 */

const rateLimit = require("express-rate-limit");

const keyGenerator = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip;
};

const validate = { keyGeneratorIpFallback: false };

/** 100 req/min per IP — applied to all /api/* routes */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    error: "rate_limit_exceeded",
    message: "Too many requests. Please try again later.",
  },
});

/** 5 req/min per IP — applied to sensitive endpoints like /like-spam */
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STRICT || "5", 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    error: "rate_limit_exceeded",
    message: "This endpoint is rate limited. Please wait.",
  },
});

module.exports = { globalLimiter, strictLimiter };
