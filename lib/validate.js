/**
 * lib/validate.js
 * التحقق من صحة المدخلات – مستوحى من منطق app.py في المشروع الأصلي
 */

const { SUPPORTED_REGIONS } = require("../config/constants");

/**
 * يرمي خطأ منسقاً مثل ردود المشروع الأصلي
 */
class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status  = status;
    this.isApiError = true;
  }
}

function requireParam(value, name) {
  if (!value || String(value).trim() === "") {
    throw new ApiError(`Empty '${name}' parameter. Please provide a valid '${name}'.`);
  }
  return String(value).trim();
}

function requireRegion(region) {
  const r = requireParam(region, "region").toUpperCase();
  if (!SUPPORTED_REGIONS.includes(r)) {
    throw new ApiError(
      `Unsupported 'region' parameter. Supported regions are: ${SUPPORTED_REGIONS.join(", ")}.`
    );
  }
  return r;
}

function requireUid(uid) {
  const u = requireParam(uid, "uid");
  if (!/^\d+$/.test(u)) {
    throw new ApiError("Invalid 'uid' parameter. Must be numeric.");
  }
  return u;
}

/**
 * Middleware يُحوّل ApiError إلى JSON response
 */
function errorHandler(err, req, res, next) {
  if (err.isApiError) {
    return res.status(err.status).json({
      error:   "Invalid request",
      message: err.message,
    });
  }
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "internal_error", message: err.message });
}

module.exports = { ApiError, requireParam, requireRegion, requireUid, errorHandler };
