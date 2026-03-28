const express = require("express");
const router  = express.Router();

const { ffRequest }          = require("../lib/request");
const { encodeProto, decodeProto } = require("../lib/proto");
const { requireRegion, ApiError }  = require("../lib/validate");

const RANK_TYPES = { BR: 1, CS: 2 };
const BR_RANKS   = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grandmaster"];

function rankName(n) { return BR_RANKS[n] || (n ? `Rank ${n}` : "—"); }

function formatEntry(e, pos) {
  if (!e) return null;
  return {
    position:      e.rankpos  || pos + 1,
    accountId:     e.accountid ? String(e.accountid) : "—",
    nickname:      e.nickname  || "—",
    rank:          rankName(e.rank),
    rankId:        e.rank      || 0,
    rankingPoints: e.rankingpoints || 0,
    level:         e.level     || 0,
    region:        e.region    || "",
  };
}

function decodeLeaderboard(buffer) {
  try {
    const raw = decodeProto(buffer, "GetRankingList.response");
    const entries = (raw.entries || []).map((e, i) => formatEntry(e, i));
    return { decodeError: null, response: { entries, total: raw.total || entries.length }, rawDecoded: raw };
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
