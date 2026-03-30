/**
 * lib/request.js
 * FF request helpers:
 * - ffRequest: encrypt plaintext hex body before send
 * - ffRequestEncrypted: send encrypted hex body as-is (captured from game)
 */

const https = require("https");
const zlib = require("zlib");
const { getJwtToken, invalidateCache } = require("./auth");
const { encryptAes } = require("./crypto");
const { USER_AGENT, X_UNITY_VERSION, X_GA, RELEASE_VERSION } = require("../config/constants");
const { ApiError } = require("./validate");

const UPSTREAM_TIMEOUT_MS = parseInt(process.env.UPSTREAM_TIMEOUT_MS || "15000", 10);

function buildHeaders(jwt, bodyLength) {
  return {
    "User-Agent":      USER_AGENT,
    "Connection":      "Keep-Alive",
    "Accept-Encoding": "gzip",
    "Content-Type":    "application/x-www-form-urlencoded",
    "Expect":          "100-continue",
    "Authorization":   `Bearer ${jwt}`,
    "X-GA":            X_GA,
    "ReleaseVersion":  RELEASE_VERSION,
    "X-Unity-Version": X_UNITY_VERSION,
    "Content-Length":   bodyLength,
  };
}

function maybeDecompress(buffer, encoding) {
  return new Promise((resolve, reject) => {
    if (encoding === "gzip") {
      zlib.gunzip(buffer, (err, out) => (err ? reject(err) : resolve(out)));
      return;
    }
    resolve(buffer);
  });
}

function normalizeHex(hexLike, fieldName) {
  const value = String(hexLike || "").replace(/\s+/g, "").toLowerCase();
  if (!value) {
    throw new ApiError(`Missing '${fieldName}'`);
  }
  if (!/^[0-9a-f]+$/.test(value) || value.length % 2 !== 0) {
    throw new ApiError(`Invalid '${fieldName}'. Must be valid even-length hex.`);
  }
  return value;
}

async function sendFfRequest({ region, endpoint, bodyBuffer }) {
  const { jwt, serverUrl } = await getJwtToken(region);
  if (!serverUrl) throw new Error(`No serverUrl for region=${region}`);

  const headers = buildHeaders(jwt, bodyBuffer.length);
  const url = new URL(endpoint, serverUrl);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: "POST",
        headers,
      },
      async (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", async () => {
          try {
            const rawBuf = Buffer.concat(chunks);

            if (res.statusCode === 401) {
              invalidateCache(region);
              return resolve(await sendFfRequest({ region, endpoint, bodyBuffer }));
            }

            if (res.statusCode !== 200) {
              return reject(new Error(`FF API ${res.statusCode} on ${endpoint}`));
            }

            const decompressed = await maybeDecompress(rawBuf, res.headers["content-encoding"]);
            resolve(decompressed);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function ffRequest({ region, endpoint, hexBody }) {
  const plaintextHex = normalizeHex(hexBody, "hexBody");
  const encryptedBody = Buffer.from(encryptAes(plaintextHex), "hex");
  return sendFfRequest({ region, endpoint, bodyBuffer: encryptedBody });
}

async function ffRequestEncrypted({ region, endpoint, encryptedHexBody }) {
  const encryptedHex = normalizeHex(encryptedHexBody, "encryptedHexBody");
  const bodyBuffer = Buffer.from(encryptedHex, "hex");
  return sendFfRequest({ region, endpoint, bodyBuffer });
}

module.exports = { ffRequest, ffRequestEncrypted };
