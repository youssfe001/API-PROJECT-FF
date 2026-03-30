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
    deaths: src.deaths,
    top10Times: src.top10times,
    topNTimes: src.topntimes,
    distanceTravelled: src.distancetravelled,
    survivalTime: src.survivaltime,
    revives: src.revives,
    highestKills: src.highestkills,
    damage: src.damage,
    roadKills: src.roadkills,
    headshots: src.headshots,
    headshotKills: src.headshotkills,
    knockdown: src.knockdown,
    pickups: src.pickups,
  });
}

function mapStatsBlock(src) {
  if (!src) return undefined;
  return compact({
    accountId: toNumberOrString(src.accountid),
    gamesPlayed: src.gamesplayed,
    wins: src.wins,
    kills: src.kills,
    detailedStats: mapDetailed(src.detailedstats),
  });
}

function formatPlayerStats(raw) {
  if (!raw) return null;
  return compact({
    soloStats: mapStatsBlock(raw.solostats),
    duoStats: mapStatsBlock(raw.duostats),
    quadStats: mapStatsBlock(raw.quadstats),
  });
}

function decodeStats(buffer) {
  try {
    const raw = decodeProto(buffer, "PlayerStats.response");
    return {
      decodeError: null,
      response: formatPlayerStats(raw),
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

router.get("/v1/playerstats", async (req, res, next) => {
  try {
    const region = requireRegion(req.query.region);
    const uid = requireUid(req.query.uid);
    const matchmode = (req.query.matchmode || "CAREER").toUpperCase();

    if (!["CAREER", "NORMAL", "RANKED"].includes(matchmode)) {
      throw new ApiError("Invalid 'matchmode'. Must be 'CAREER', 'NORMAL', or 'RANKED'.");
    }

    const reqBuf = encodeProto(
      { accountid: BigInt(uid), matchmode: MATCH_MODES.BR[matchmode] },
      "PlayerStats.request"
    );

    const responseBuffer = await ffRequest({
      region,
      endpoint: "/GetPlayerStats",
      hexBody: reqBuf.toString("hex"),
    });

    const decoded = decodeStats(responseBuffer);

    res.json({
      endpoint: "/GetPlayerStats",
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

router.post("/playerstats", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const bodyHex = normalizeHex(req.body.bodyHex);

    const responseBuffer = await ffRequestEncrypted({
      region,
      endpoint: "/GetPlayerStats",
      encryptedHexBody: bodyHex,
    });

    const decoded = decodeStats(responseBuffer);

    res.json({
      endpoint: "/GetPlayerStats",
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
