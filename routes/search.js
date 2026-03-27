/**
 * routes/search.js
 * GET /api/v1/search?region=IND&keyword=Hello
 *
 * FF Endpoint: /FuzzySearchAccountByName
 * Proto:       SearchAccountByName.request / SearchAccountByName.response
 */

const express = require("express");
const router  = express.Router();
const { ffRequest }                             = require("../lib/request");
const { encodeProto, decodeProto }              = require("../lib/proto");
const { requireRegion, requireParam }           = require("../lib/validate");
const { FF_ENDPOINTS }                          = require("../config/constants");

router.get("/v1/search", async (req, res, next) => {
  try {
    const region  = requireRegion(req.query.region);
    const keyword = requireParam(req.query.keyword, "keyword");

    const reqBuf = encodeProto({ keyword }, "SearchAccountByName.request");
    const resBuf = await ffRequest({
      region,
      endpoint: FF_ENDPOINTS.FUZZY_SEARCH_ACCOUNT,
      hexBody:  reqBuf.toString("hex"),
    });
    const data = decodeProto(resBuf, "SearchAccountByName.response");
    res.json(data);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
