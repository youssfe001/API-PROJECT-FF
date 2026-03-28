const express = require("express");
const router  = express.Router();

const { ffRequest }          = require("../lib/request");
const { encodeProto, decodeProto } = require("../lib/proto");
const { requireRegion, ApiError }  = require("../lib/validate");

const RANK_TYPES = { BR: 1, CS: 2 };

// Derive a rough rank tier from ranking points (approximate thresholds)
const TIER_THRESHOLDS = [
  { min: 5000, name: "Grandmaster", id: 7 },
  { min: 3000, name: "Heroic",      id: 6 },
  { min: 2000, name: "Diamond",     id: 5 },
  { min: 1200, name: "Platinum",    id: 4 },
  { min:  600, name: "Gold",        id: 3 },
  { min:  200, name: "Silver",      id: 2 },
  { min:    1, name: "Bronze",      id: 1 },
];

function tierFromPoints(pts) {
  if (!pts) return { name: "—", id: 0 };
  for (const t of TIER_THRESHOLDS) {
    if (pts >= t.min) return { name: t.name, id: t.id };
  }
  return { name: "Bronze", id: 1 };
}

function formatEntry(e, pos) {
  if (!e) return null;
  const pts  = e.rankingpoints || 0;
  const tier = tierFromPoints(pts);
  return {
    position:      e.rankpos      || pos + 1,
    accountId:     e.accountid    ? String(e.accountid) : "—",
    nickname:      e.nickname     || "",          // may be empty; UI shows "Unknown"
    headpic:       e.headpic      || 0,
    rankingPoints: pts,
    tier:          tier.name,
    tierId:        tier.id,
    level:         e.level        || 0,
  };
}

function decodeLeaderboard(buffer) {
  try {
    const raw     = decodeProto(buffer, "GetRankingList.response");
    const entries = (raw.entries || []).map((e, i) => formatEntry(e, i));
    return {
      decodeError: null,
      response:    { entries, total: entries.length },
      rawDecoded:  raw,
    };
  } catch (err) {
    return { decodeError: err.message, response: null, rawDecoded: null };
  }
}

// GET /api/v1/leaderboard?region=ME&type=BR&page=0
router.get("/v1/leaderboard", async (req, res, next) => {
  try {
    const region   = requireRegion(req.query.region);
    const typeStr  = (req.query.type || "BR").toUpperCase();
    const page     = Math.max(0, parseInt(req.query.page || "0", 10));

    if (!RANK_TYPES[typeStr]) {
      throw new ApiError("Invalid 'type'. Must be 'BR' or 'CS'.");
    }

    const reqBuf = encodeProto(
      { type: RANK_TYPES[typeStr], page },
      "GetRankingList.request"
    );

    const responseBuffer = await ffRequest({
      region,
      endpoint: "/GetBRRankingInfo",
      hexBody:  reqBuf.toString("hex"),
    });

    const decoded = decodeLeaderboard(responseBuffer);

    res.json({
      endpoint:       "/GetBRRankingInfo",
      region,
      type:           typeStr,
      page,
      ...decoded,
      rawResponseHex: responseBuffer.toString("hex"),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
