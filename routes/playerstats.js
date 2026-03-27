/**
 * routes/playerstats.js
 * GET /api/v1/playerstats?region=IND&uid=1633864660&gamemode=br&matchmode=RANKED
 *
 * BR → /GetPlayerStats      (PlayerStats)
 * CS → /GetPlayerTCStats    (PlayerCSStats)
 */

const express = require("express");
const router  = express.Router();
const { ffRequest }                           = require("../lib/request");
const { encodeProto, decodeProto }            = require("../lib/proto");
const { requireRegion, requireUid, ApiError } = require("../lib/validate");
const { FF_ENDPOINTS, MATCH_MODES }           = require("../config/constants");

router.get("/v1/playerstats", async (req, res, next) => {
  try {
    const region    = requireRegion(req.query.region);
    const uid       = requireUid(req.query.uid);
    const gamemode  = (req.query.gamemode  || "br").toLowerCase();
    const matchmode = (req.query.matchmode || "CAREER").toUpperCase();

    if (!["br", "cs"].includes(gamemode))
      throw new ApiError("Invalid 'gamemode'. Must be 'br' or 'cs'.");
    if (!["CAREER", "NORMAL", "RANKED"].includes(matchmode))
      throw new ApiError("Invalid 'matchmode'. Must be 'CAREER', 'NORMAL', or 'RANKED'.");

    const isBR      = gamemode === "br";
    const modeCode  = MATCH_MODES[isBR ? "BR" : "CS"][matchmode];
    const endpoint  = isBR ? FF_ENDPOINTS.GET_PLAYER_STATS : FF_ENDPOINTS.GET_PLAYER_TC_STATS;
    const reqMsg    = isBR ? "PlayerStats.request"   : "PlayerCSStats.request";
    const resMsg    = isBR ? "PlayerStats.response"  : "PlayerCSStats.response";

    const payloadData = isBR
      ? { accountid: BigInt(uid), matchmode: modeCode }
      : { accountid: BigInt(uid), gamemode: 15, matchmode: modeCode };

    const reqBuf = encodeProto(payloadData, reqMsg);
    const resBuf = await ffRequest({ region, endpoint, hexBody: reqBuf.toString("hex") });
    const data   = decodeProto(resBuf, resMsg);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
