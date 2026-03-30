const express = require("express");
const router = express.Router();

const { ffRequest, ffRequestEncrypted } = require("../lib/request");
const { encodeProto, decodeProto } = require("../lib/proto");
const { requireRegion, requireUid, requireParam, ApiError } = require("../lib/validate");
const { MATCH_MODES } = require("../config/constants");

function normalizeHex(value, name = "bodyHex") {
  const hex = requireParam(value, name).replace(/\s+/g, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new ApiError(`Invalid '${name}'. Must be valid even-length hex.`);
  }
  return hex;
}

function toNumberOrString(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number") {
    return Number.isSafeInteger(v) ? v : String(v);
  }
  return String(v);
}

function compact(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function mapDetailed(src) {
  if (!src) return undefined;
  return compact({
    mvpCount: src.mvpcount,
    doubleKills: src.doublekills,
    tripleKills: src.triplekills,
    fourKills: src.fourkills,
    damage: src.damage,
    headshotKills: src.headshotkills,
    knockdowns: src.knockdowns,
    revivals: src.revivals,
    assists: src.assists,
    deaths: src.deaths,
    streakWins: src.streakwins,
    throwingKills: src.throwingkills,
    oneGameMostDamage: src.onegamemostdamage,
    oneGameMostKills: src.onegamemostkills,
    ratingPoints: src.ratingpoints,
    ratingEnabledGames: src.ratingenabledgames,
    headshotCount: src.headshotcount,
    hitCount: src.hitcount,
  });
}

function formatPlayerTcStats(raw) {
  if (!raw || !raw.csstats) return null;
  return compact({
    csStats: compact({
      accountId: toNumberOrString(raw.csstats.accountid),
      gamesPlayed: raw.csstats.gamesplayed,
      wins: raw.csstats.wins,
      kills: raw.csstats.kills,
      detailedStats: mapDetailed(raw.csstats.detailedstats),
    }),
  });
}

function decodeTcStats(buffer) {
  try {
    const raw = decodeProto(buffer, "PlayerCSStats.response");
    return {
      decodeError: null,
      response: formatPlayerTcStats(raw),
      rawDecoded: raw,
    };
  } catch (err) {
    return {
      decodeError: err.message,
      response: null,
      rawDecoded: null,
    };
  }
}

router.get("/v1/playertcstats", async (req, res, next) => {
  try {
    const region = requireRegion(req.query.region);
    const uid = requireUid(req.query.uid);
    const matchmode = (req.query.matchmode || "CAREER").toUpperCase();

    if (!["CAREER", "NORMAL", "RANKED"].includes(matchmode)) {
      throw new ApiError("Invalid 'matchmode'. Must be 'CAREER', 'NORMAL', or 'RANKED'.");
    }

    const reqBuf = encodeProto(
      {
        accountid: BigInt(uid),
        gamemode: 15,
        matchmode: MATCH_MODES.CS[matchmode],
      },
      "PlayerCSStats.request"
    );

    const responseBuffer = await ffRequest({
      region,
      endpoint: "/GetPlayerTCStats",
      hexBody: reqBuf.toString("hex"),
    });

    const decoded = decodeTcStats(responseBuffer);

    res.json({
      endpoint: "/GetPlayerTCStats",
      region,
      uid,
      matchmode,
      ...decoded,
      rawResponseHex: responseBuffer.toString("hex"),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/playertcstats", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const bodyHex = normalizeHex(req.body.bodyHex);

    const responseBuffer = await ffRequestEncrypted({
      region,
      endpoint: "/GetPlayerTCStats",
      encryptedHexBody: bodyHex,
    });

    const decoded = decodeTcStats(responseBuffer);

    res.json({
      endpoint: "/GetPlayerTCStats",
      region,
      request: { bodyHex },
      ...decoded,
      rawResponseHex: responseBuffer.toString("hex"),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
