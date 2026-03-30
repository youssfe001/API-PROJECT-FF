const express = require("express");
const router = express.Router();

const { ffRequest, ffRequestEncrypted } = require("../lib/request");
const { encodeProto, decodeProto } = require("../lib/proto");
const { requireRegion, requireParam, requireUid, ApiError } = require("../lib/validate");
const { lookupItem, resolveItems } = require("../lib/items");

function normalizeHex(value) {
  const hex = requireParam(value, "bodyHex").replace(/\s+/g, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new ApiError("Invalid 'bodyHex'. Must be valid even-length hex.");
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

function mapExternalIconInfo(src) {
  if (!src) return undefined;
  return compact({
    externalIcon: src.externalicon,
    status: src.status,
    showType: src.showtype,
  });
}

function mapBasicInfo(src) {
  if (!src) return undefined;
  return compact({
    accountId: toNumberOrString(src.accountid),
    accountType: src.accounttype,
    nickname: src.nickname,
    region: src.region,
    level: src.level,
    exp: src.exp,
    bannerId: src.bannerid,
    headPic: src.headpic,
    rank: src.rank,
    rankingPoints: src.rankingpoints,
    badgeCnt: src.badgecnt,
    badgeId: src.badgeid,
    seasonId: src.seasonid,
    liked: src.liked,
    showRank: src.showrank,
    lastLoginAt: toNumberOrString(src.lastloginat),
    csRank: src.csrank,
    csRankingPoints: src.csrankingpoints,
    pinId: src.pinid,
    maxRank: src.maxrank,
    csMaxRank: src.csmaxrank,
    gameBagShow: src.gamebagshow,
    createAt: toNumberOrString(src.createat),
    title: src.title,
    releaseVersion: src.releaseversion,
    showBrRank: src.showbrrank,
    showCsRank: src.showcsrank,
    externalIconInfo: mapExternalIconInfo(src.externaliconinfo),
  });
}

function mapProfileInfo(src) {
  if (!src) return undefined;
  return compact({
    avatarId: src.avatarid,
    skinColor: src.skincolor,
    clothes: src.clothes,
    equipedSkills: src.equipedskills,
    pvePrimaryWeapon: src.pveprimaryweapon,
    endTime: src.endtime,
    isMarkedStar: src.ismarkedstar,
  });
}

function mapClanBasicInfo(src) {
  if (!src) return undefined;
  return compact({
    clanId: toNumberOrString(src.clanid),
    clanName: src.clanname,
    captainId: toNumberOrString(src.captainid),
    clanLevel: src.clanlevel,
    capacity: src.capacity,
    memberNum: src.membernum,
    honorPoint: src.honorpoint,
  });
}

function mapPetInfo(src) {
  if (!src) return undefined;
  return compact({
    id: src.id,
    name: src.name,
    level: src.level,
    exp: src.exp,
    isSelected: src.isselected,
    skinId: src.skinid,
    actions: src.actions,
    selectedSkillId: src.selectedskillid,
  });
}

function mapSocialInfo(src) {
  if (!src) return undefined;
  return compact({
    accountId: toNumberOrString(src.accountid),
    gender: src.gender,
    language: src.language,
    timeOnline: src.timeonline,
    timeActive: src.timeactive,
    battleTag: src.battletag,
    socialTag: src.socialtag,
    modePrefer: src.modeprefer,
    signature: src.signature,
    rankShow: src.rankshow,
  });
}

function mapCreditScoreInfo(src) {
  if (!src) return undefined;
  return compact({
    creditScore: src.creditscore,
    isInit: src.isinit,
    rewardState: src.rewardstate,
    periodicSummaryLikeCnt: src.periodicsummarylikecnt,
    periodicSummaryIllegalCnt: src.periodicsummaryillegalcnt,
    weeklyMatchCnt: src.weeklymatchcnt,
    periodicSummaryStartTime: toNumberOrString(src.periodicsummarystarttime),
    periodicSummaryEndTime: toNumberOrString(src.periodicsummaryendtime),
    periodicSummaryLevel: src.periodicsummarylevel,
  });
}

function mapHistoryEpInfo(list) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  return list.map((item) => compact({
    epEventId: item.epeventid,
    ownedPass: item.ownedpass,
    epBadge: item.epbadge,
    badgeCnt: item.badgecnt,
    bpIcon: item.bpicon,
    maxLevel: item.maxlevel,
    eventName: item.eventname,
  }));
}

function resolveIdField(id) {
  if (!id) return undefined;
  const item = lookupItem(id);
  return item ? { id, ...item } : { id, name: null };
}

function formatResponse(raw) {
  if (!raw) return null;
  const basic   = mapBasicInfo(raw.basicinfo);
  const profile = mapProfileInfo(raw.profileinfo);

  // Resolve item IDs to names
  const itemsResolved = {};
  if (basic) {
    if (basic.bannerId)    itemsResolved.banner       = resolveIdField(basic.bannerId);
    if (basic.headPic)     itemsResolved.headPic      = resolveIdField(basic.headPic);
    if (basic.badgeId)     itemsResolved.badge        = resolveIdField(basic.badgeId);
    if (basic.title)       itemsResolved.title        = resolveIdField(basic.title);
    if (basic.pinId)       itemsResolved.pin          = resolveIdField(basic.pinId);
    if (basic.gameBagShow) itemsResolved.gameBag      = resolveIdField(basic.gameBagShow);
    if (basic.weaponskinshows?.length) {
      itemsResolved.weaponSkins = resolveItems(basic.weaponskinshows);
    }
  }
  if (profile) {
    if (profile.avatarId)  itemsResolved.avatar       = resolveIdField(profile.avatarId);
    if (profile.clothes?.length) {
      itemsResolved.clothes = resolveItems(profile.clothes);
    }
    if (profile.equipedSkills?.length) {
      itemsResolved.skills = resolveItems(profile.equipedSkills);
    }
  }

  return compact({
    basicInfo: basic,
    profileInfo: profile,
    clanBasicInfo: mapClanBasicInfo(raw.clanbasicinfo),
    captainBasicInfo: mapBasicInfo(raw.captainbasicinfo),
    petInfo: mapPetInfo(raw.petinfo),
    socialInfo: mapSocialInfo(raw.socialinfo),
    diamondCostRes: raw.diamondcostres ? compact({ diamondCost: raw.diamondcostres.diamondcost }) : undefined,
    creditScoreInfo: mapCreditScoreInfo(raw.creditscoreinfo),
    historyEpInfo: mapHistoryEpInfo(raw.historyepinfo),
    itemsResolved: Object.keys(itemsResolved).length > 0 ? itemsResolved : undefined,
  });
}

function decodePersonalShow(buffer) {
  try {
    const raw = decodeProto(buffer, "PlayerPersonalShow.response");
    return {
      decodeError: null,
      response: formatResponse(raw),
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

router.get("/v1/account", async (req, res, next) => {
  try {
    const region = requireRegion(req.query.region);
    const uid = requireUid(req.query.uid);

    const reqBuf = encodeProto(
      { accountId: BigInt(uid), callSignSrc: 7, needGalleryInfo: false },
      "PlayerPersonalShow.request"
    );

    const responseBuffer = await ffRequest({
      region,
      endpoint: "/GetPlayerPersonalShow",
      hexBody: reqBuf.toString("hex"),
    });

    const decoded = decodePersonalShow(responseBuffer);

    res.set("Cache-Control", "public, s-maxage=30, max-age=30");
    res.json({
      endpoint: "/GetPlayerPersonalShow",
      region,
      uid,
      ...decoded,
      rawResponseHex: responseBuffer.toString("hex"),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/account", async (req, res, next) => {
  try {
    const region = requireRegion(req.body.region);
    const bodyHex = normalizeHex(req.body.bodyHex);

    const responseBuffer = await ffRequestEncrypted({
      region,
      endpoint: "/GetPlayerPersonalShow",
      encryptedHexBody: bodyHex,
    });

    const decoded = decodePersonalShow(responseBuffer);

    res.json({
      endpoint: "/GetPlayerPersonalShow",
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
