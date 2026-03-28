/**
 * lib/auth.js
 * مبني 1:1 على Account.py + app.py + until.py
 *
 * الاكتشافات من app.py:
 *   - Garena يُعيد: access_token (وليس token) + open_id
 *   - MajorLogin يُعيد: token + serverUrl
 *   - serverUrl يُستخدم مباشرة كـ server URL (وليس الـ hardcoded URLs)
 */

const https = require("https");
const zlib  = require("zlib");
const { RELEASE_VERSION } = require("../config/constants");

const TOKEN_TTL_MS = 5 * 60 * 1000;
const _cache = new Map(); // region → { jwt, serverUrl, expiresAt }

function _cacheGet(region) {
  const e = _cache.get(region);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { _cache.delete(region); return null; }
  return e;
}
function _cacheSet(region, jwt, serverUrl) {
  _cache.set(region, { jwt, serverUrl, expiresAt: Date.now() + TOKEN_TTL_MS });
}

const LOGIN_HOSTS = {
  ME:  "loginbp.ggblueshark.com",
  IND: "loginbp.ggblueshark.com",
  SG:  "loginbp.ggblueshark.com",
  TW:  "loginbp.ggblueshark.com",
  TH:  "loginbp.ggblueshark.com",
  ID:  "loginbp.ggblueshark.com",
  VN:  "loginbp.ggblueshark.com",
  PK:  "loginbp.ggblueshark.com",
  BD:  "loginbp.ggblueshark.com",
  CIS: "loginbp.ggblueshark.com",
  RU:  "loginbp.ggblueshark.com",
  BR:  "loginbp-sa.ggblueshark.com",
  US:  "loginbp-na.ggblueshark.com",
};

function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = typeof body === "string" ? Buffer.from(body) : body;
    const req = https.request(
      { hostname, path, method: "POST",
        headers: { "Content-Length": bodyBuf.length, ...headers } },
      (res) => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const enc = res.headers["content-encoding"];
          const parse = (buf) => {
            try { resolve({ status: res.statusCode, body: JSON.parse(buf), raw: buf }); }
            catch { resolve({ status: res.statusCode, body: buf.toString(), raw: buf }); }
          };
          if (enc === "gzip") {
            zlib.gunzip(raw, (err, result) => err ? reject(err) : parse(result));
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
 * Step 1 — get_garena_token()
 * من app.py: يُعيد { access_token, open_id }
 */
async function getGarenaToken(uid, password) {
  const body = [
    `uid=${uid}`,
    `password=${password}`,
    `response_type=token`,
    `client_type=2`,
    `client_secret=2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3`,
    `client_id=100067`,
  ].join("&");

  const resp = await httpPost(
    "ffmconnect.live.gop.garenanow.com",
    "/oauth/guest/token/grant",
    {
      "User-Agent":      "GarenaMSDK/4.0.19P9(A063 ;Android 13;en;IN;)",
      "Connection":      "Keep-Alive",
      "Accept-Encoding": "gzip",
      "Content-Type":    "application/x-www-form-urlencoded",
    },
    body
  );

  // من app.py: auth_response["access_token"] + auth_response["open_id"]
  if (resp.status !== 200 || !resp.body.access_token) {
    throw new Error(`getGarenaToken failed [${resp.status}]: ${JSON.stringify(resp.body)}`);
  }

  console.log(`[auth] Garena OK open_id=${resp.body.open_id}`);
  return { access_token: resp.body.access_token, open_id: resp.body.open_id || "" };
}

/**
 * Step 2 — get_major_login()
 * من app.py: يُعيد { token, serverUrl }
 * serverUrl هو الـ URL الحقيقي للسيرفر (وليس hardcoded)
 */
async function getMajorLogin(access_token, open_id, region) {
  const { encodeProto, decodeProto } = require("./proto");
  const { encryptAes }               = require("./crypto");

  const hostname = LOGIN_HOSTS[region] || "loginbp.ggblueshark.com";

  const reqBuf    = encodeProto(
    { logintoken: access_token, openid: open_id, platform: "4" },
    "MajorLogin.request"
  );
  const encryptedHex = encryptAes(reqBuf.toString("hex"));
  const encrypted    = Buffer.from(encryptedHex, "hex");

  console.log(`[auth] MajorLogin → host=${hostname} reqProtoHex=${reqBuf.toString("hex")} encLen=${encrypted.length}`);

  const resp = await httpPost(
    hostname,
    "/MajorLogin",
    {
      "User-Agent":      "Dalvik/2.1.0 (Linux; U; Android 13; A063 Build/TKQ1.221220.001)",
      "Connection":      "Keep-Alive",
      "Accept-Encoding": "gzip",
      "Content-Type":    "application/x-www-form-urlencoded",
      "Expect":          "100-continue",
      "Authorization":   "Bearer",
      "X-Unity-Version": "2018.4.11f1",
      "X-GA":            "v1 1",
      "ReleaseVersion":  RELEASE_VERSION,
    },
    encrypted
  );

  console.log(`[auth] MajorLogin ← status=${resp.status} bodyLen=${resp.raw.length} bodyHex=${resp.raw.toString("hex").slice(0, 80)}`);

  // تحقق من status أولاً قبل محاولة فك التشفير
  if (resp.status !== 200) {
    const previewUtf8 = resp.raw.toString("utf8").slice(0, 200).replace(/\s+/g, " ");
    const previewHex  = resp.raw.toString("hex").slice(0, 80);
    throw new Error(`MajorLogin HTTP ${resp.status} | utf8: ${previewUtf8} | hex: ${previewHex}`);
  }

  // MajorLogin response is raw protobuf — no AES (matches Python reference)
  const decoded = decodeProto(resp.raw, "MajorLogin.response");

  if (!decoded.token) {
    throw new Error(`getMajorLogin no token [status=${resp.status}]`);
  }

  // من app.py: login_response["serverUrl"] + login_response["token"]
  console.log(`[auth] MajorLogin OK serverUrl=${decoded.serverUrl}`);
  return { token: decoded.token, serverUrl: decoded.serverUrl };
}

/**
 * getJwtToken(region) → { jwt, serverUrl }
 */
async function getJwtToken(region) {
  const cached = _cacheGet(region);
  if (cached) {
    console.log(`[auth] cache hit region=${region}`);
    return { jwt: cached.jwt, serverUrl: cached.serverUrl };
  }

  let accounts;
  try { accounts = require("../config/accounts.json"); }
  catch { throw new Error("config/accounts.json not found"); }

  const acct = accounts[region];
  if (!acct) throw new Error(`No account configured for region=${region}`);

  console.log(`[auth] login region=${region} uid=${acct.uid}`);
  const { access_token, open_id } = await getGarenaToken(acct.uid, acct.password);
  const { token, serverUrl }      = await getMajorLogin(access_token, open_id, region);

  _cacheSet(region, token, serverUrl);
  console.log(`[auth] cached region=${region} serverUrl=${serverUrl}`);
  return { jwt: token, serverUrl };
}

function invalidateCache(region) { _cache.delete(region); }

module.exports = { getJwtToken, invalidateCache };
