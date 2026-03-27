/**
 * routes/account.js
 * GET /api/v1/account?region=IND&uid=1633864660
 *
 * FF Endpoint: /GetPlayerPersonalShow
 * Proto:       PlayerPersonalShow.request / PlayerPersonalShow.response
 */

const express = require("express");
const router  = express.Router();
const { ffRequest }                           = require("../lib/request");
const { encodeProto, decodeProto }            = require("../lib/proto");
const { requireRegion, requireUid }           = require("../lib/validate");
const { FF_ENDPOINTS }                        = require("../config/constants");

router.get("/v1/account", async (req, res, next) => {
  try {
    const region = requireRegion(req.query.region);
    const uid    = requireUid(req.query.uid);

    // Encode request protobuf
    // From InGame.py: { accountId, callSignSrc=7, needGalleryInfo=False }
    const reqBuf = encodeProto({
      accountId:       BigInt(uid),
      callSignSrc:     7,            // PersonalShowView
      needGalleryInfo: false,
    }, "PlayerPersonalShow.request");

    // Send to FF server
    const resBuf = await ffRequest({
      region,
      endpoint: FF_ENDPOINTS.GET_PLAYER_PERSONAL_SHOW,
      hexBody:  reqBuf.toString("hex"),
    });

    // Decode response protobuf
    const data = decodeProto(resBuf, "PlayerPersonalShow.response");
    res.json(data);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
