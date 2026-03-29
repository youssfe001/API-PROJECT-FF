/**
 * routes/guestgenerator.js
 * ──────────────────────────────────────────────────────────────────
 * Two modes:
 *   1. GET  /guest-generator?region=XX        → return saved guest credentials
 *   2. POST /guest-generator/create?region=XX → create NEW guest via Garena API
 *      Optional body: { count: 1-10 }
 * ──────────────────────────────────────────────────────────────────
 */

const express = require("express");
const https = require("https");
const zlib = require("zlib");
const router = express.Router();

const { requireRegion, ApiError } = require("../lib/validate");
const { getCredentialForRegion } = require("../lib/credentials");
const {
  GARENA_GUEST_HOST,
  GARENA_GUEST_PATH,
  GARENA_CLIENT_ID,
  GARENA_CLIENT_SECRET,
} = require("../config/constants");

/* ── helpers ─────────────────────────────────────────────────── */

function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = typeof body === "string" ? Buffer.from(body) : body;
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: { "Content-Length": bodyBuf.length, ...headers },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const enc = res.headers["content-encoding"];
          const parse = (buf) => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(buf) });
            } catch {
              resolve({ status: res.statusCode, body: buf.toString() });
            }
          };
          if (enc === "gzip") {
            zlib.gunzip(raw, (err, result) => (err ? reject(err) : parse(result)));
          } else {
            parse(raw);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

/**
 * Create one guest account via Garena OAuth guest/login
 * Returns: { uid, password (token), open_id, access_token }
 */
async function createGuestAccount() {
  const resp = await httpPost(
    GARENA_GUEST_HOST,
    GARENA_GUEST_PATH,
    {
      "User-Agent": "GarenaMSDK/4.0.19P9(SM-A346B ;Android 13;en;MA;)",
      Accept: "*/*",
      "Accept-Encoding": "deflate, gzip",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    [
      `client_type=2`,
      `client_secret=${GARENA_CLIENT_SECRET}`,
      `client_id=${GARENA_CLIENT_ID}`,
    ].join("&")
  );

  if (resp.status !== 200) {
    throw new ApiError(
      `Garena guest creation failed [${resp.status}]: ${JSON.stringify(resp.body)}`
    );
  }

  const { uid, token, open_id, access_token } = resp.body;

  if (!uid || !token) {
    throw new ApiError(
      `Garena returned unexpected response: ${JSON.stringify(resp.body)}`
    );
  }

  return {
    uid: String(uid),
    password: token,
    open_id: open_id || "",
    access_token: access_token || "",
  };
}

/* ── Mode 1: return saved guests ─────────────────────────────── */

router.get("/guest-generator", (req, res, next) => {
  try {
    const region = requireRegion(req.query.region);
    const selected = getCredentialForRegion(region);

    res.json({
      mode: "saved",
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

/* ── Mode 2: create NEW guest accounts ───────────────────────── */

router.post("/guest-generator/create", async (req, res, next) => {
  try {
    const region = requireRegion(req.query.region || req.body.region);
    const count = Math.min(Math.max(parseInt(req.body.count) || 1, 1), 10);

    console.log(`[guest-gen] Creating ${count} guest(s) for region=${region}`);

    const accounts = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        const guest = await createGuestAccount();
        accounts.push({
          index: i + 1,
          uid: guest.uid,
          password: guest.password,
          open_id: guest.open_id,
        });
        console.log(`[guest-gen] ✓ Guest #${i + 1} uid=${guest.uid}`);
      } catch (err) {
        errors.push({ index: i + 1, error: err.message });
        console.log(`[guest-gen] ✗ Guest #${i + 1}: ${err.message}`);
      }
    }

    res.json({
      mode: "create",
      region,
      requested: count,
      summary: {
        created: accounts.length,
        failed: errors.length,
      },
      accounts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
