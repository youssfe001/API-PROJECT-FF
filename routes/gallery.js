/**
 * routes/gallery.js
 * POST /api/v1/gallery
 * Body JSON: { region, uid, version, items: [...] }
 *
 * FF Endpoint: /SetPlayerGalleryShowInfo
 * Proto:       SetPlayerGalleryShowInfo.request
 *
 * الـ endpoint هذا لا يُعيد response protobuf – اللعبة تُعيد HTTP 200 فارغاً عند النجاح
 */

const express = require("express");
const router  = express.Router();
const { ffRequest }                           = require("../lib/request");
const { encodeProto }                         = require("../lib/proto");
const { requireRegion, requireUid }           = require("../lib/validate");

router.post("/v1/gallery", async (req, res, next) => {
  try {
    const region  = requireRegion(req.body.region);
    const uid     = requireUid(req.body.uid);
    const version = req.body.version || 1;
    const items   = req.body.items   || [];

    const reqBuf = encodeProto({ version, info_item: items }, "SetPlayerGalleryShowInfo.request");

    await ffRequest({
      region,
      endpoint: "/SetPlayerGalleryShowInfo",
      hexBody:  reqBuf.toString("hex"),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
