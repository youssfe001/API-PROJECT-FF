/**
 * lib/request.js
 * من app.py: يستخدم serverUrl من MajorLogin response مباشرة
 * من until.py: REQUEST مشفر AES، RESPONSE غير مشفر
 */

const https = require("https");
const zlib  = require("zlib");
const { getJwtToken, invalidateCache } = require("./auth");
const { encryptAes }                   = require("./crypto");
const { USER_AGENT, X_UNITY_VERSION, X_GA, RELEASE_VERSION } = require("../config/constants");

function buildHeaders(jwt, bodyLength) {
  return {
    "User-Agent":      USER_AGENT,
    "Connection":      "Keep-Alive",
    "Accept-Encoding": "gzip",
    "Content-Type":    "application/x-www-form-urlencoded",
    "Expect":          "100-continue",
    "Authorization":   `Bearer ${jwt}`,
    "X-Unity-Version": X_UNITY_VERSION,
    "X-GA":            X_GA,
    "ReleaseVersion":  RELEASE_VERSION,
    "Content-Length":  bodyLength,
  };
}

function maybeDecompress(buffer, encoding) {
  return new Promise((resolve, reject) => {
    if (encoding === "gzip") {
      zlib.gunzip(buffer, (err, r) => err ? reject(err) : resolve(r));
    } else {
      resolve(buffer);
    }
  });
}

async function ffRequest({ region, endpoint, hexBody }) {
  // من app.py: نأخذ serverUrl من MajorLogin مباشرة
  const { jwt, serverUrl } = await getJwtToken(region);
  if (!serverUrl) throw new Error(`No serverUrl for region=${region}`);

  const encryptedBody = Buffer.from(encryptAes(hexBody), "hex");
  const headers       = buildHeaders(jwt, encryptedBody.length);
  const url           = new URL(endpoint, serverUrl);

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: url.hostname, port: url.port || 443,
        path: url.pathname, method: "POST", headers },
      async (res) => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", async () => {
          try {
            const rawBuf = Buffer.concat(chunks);
            if (res.statusCode === 401) {
              invalidateCache(region);
              return resolve(await ffRequest({ region, endpoint, hexBody }));
            }
            if (res.statusCode !== 200)
              return reject(new Error(`FF API ${res.statusCode} on ${endpoint}`));
            // RESPONSE غير مشفر (from until.py)
            const decompressed = await maybeDecompress(rawBuf, res.headers["content-encoding"]);
            resolve(decompressed);
          } catch(e) { reject(e); }
        });
      }
    );
    req.on("error", reject);
    req.write(encryptedBody);
    req.end();
  });
}

module.exports = { ffRequest };
