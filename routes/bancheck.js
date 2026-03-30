const express = require("express");
const router = express.Router();

const { requireUid } = require("../lib/validate");

const SHOP2GAME_URL = "https://shop2game.com/api/auth/player_id_login";
const GARENA_BAN_URL = "https://ff.garena.com/api/antihack/check_banned";

const SHOP2GAME_HEADERS = {
  "accept": "application/json",
  "content-type": "application/json",
  "origin": "https://shop2game.com",
  "referer": "https://shop2game.com/app/100067/idlogin",
  "accept-language": "en-US,en;q=0.9",
  "user-agent": "Mozilla/5.0 (Linux; Android 11; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
};

const GARENA_HEADERS = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
  "referer": "https://ff.garena.com/en/support/",
  "user-agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "x-requested-with": "B6FksShzIgjfrYImLpTsadjS86sddhFH",
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    ...options,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = null;
  }

  return { response, data, text };
}

function normalizePeriod(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shop2gameFailure(response, data, text) {
  const protectionSignals = [
    data && data.url ? String(data.url) : "",
    text || "",
    response.headers.get("x-datadome") || "",
  ].join(" ");

  if (/captcha|datadome|geo\.captcha-delivery/i.test(protectionSignals)) {
    return {
      ok: false,
      status: "captcha_required",
      httpStatus: response.status,
      retryable: true,
      message: "Shop2Game blocked the lookup behind captcha protection.",
    };
  }

  if (response.status === 403) {
    return {
      ok: false,
      status: "captcha_required",
      httpStatus: response.status,
      retryable: true,
      message: "Shop2Game rejected the lookup with anti-bot protection.",
    };
  }

  return {
    ok: false,
    status: "http_error",
    httpStatus: response.status,
    retryable: response.status >= 500,
    message: "Shop2Game lookup failed with status " + response.status + ".",
  };
}

async function lookupPlayer(uid) {
  try {
    const payload = { app_id: 100067, login_id: uid, app_server_id: 0 };
    const { response, data, text } = await fetchJson(SHOP2GAME_URL, {
      method: "POST",
      headers: SHOP2GAME_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return shop2gameFailure(response, data, text);
    }

    if (data && data.url && /captcha|datadome/i.test(String(data.url))) {
      return shop2gameFailure(response, data, text);
    }

    if (!data || !data.nickname) {
      return {
        ok: false,
        status: "not_found",
        httpStatus: response.status,
        retryable: false,
        message: "Player ID was not found in Shop2Game lookup.",
      };
    }

    return {
      ok: true,
      status: "success",
      httpStatus: response.status,
      retryable: false,
      nickname: data.nickname || null,
      region: data.region || null,
    };
  } catch (error) {
    return {
      ok: false,
      status: "network_error",
      httpStatus: null,
      retryable: true,
      message: error.message,
    };
  }
}

async function lookupBanStatus(uid) {
  try {
    const url = GARENA_BAN_URL + "?lang=en&uid=" + encodeURIComponent(uid);
    const { response, data } = await fetchJson(url, { headers: GARENA_HEADERS });

    if (!response.ok) {
      return {
        ok: false,
        status: "http_error",
        httpStatus: response.status,
        retryable: response.status >= 500,
        message: "Garena anti-hack returned status " + response.status + ".",
      };
    }

    if (!data || data.status !== "success" || !data.data) {
      return {
        ok: false,
        status: data && data.status ? data.status : "invalid_payload",
        httpStatus: response.status,
        retryable: true,
        message: data && data.msg ? "Garena anti-hack rejected the request: " + data.msg : "Failed to retrieve ban status.",
      };
    }

    const isBanned = Boolean(data.data.is_banned);
    const periodMonths = normalizePeriod(data.data.period);

    return {
      ok: true,
      status: "success",
      httpStatus: response.status,
      retryable: false,
      isBanned,
      periodMonths,
      banStatus: isBanned
        ? (periodMonths > 0 ? "Banned for " + periodMonths + " months" : "Banned indefinitely")
        : "Not banned",
    };
  } catch (error) {
    return {
      ok: false,
      status: "network_error",
      httpStatus: null,
      retryable: true,
      message: error.message,
    };
  }
}

function formatResponse(uid, playerLookup, banLookup) {
  return {
    endpoint: "/v1/bancheck",
    uid,
    nickname: playerLookup.ok ? playerLookup.nickname : null,
    region: playerLookup.ok ? playerLookup.region : null,
    banStatus: banLookup.ok ? banLookup.banStatus : null,
    isBanned: banLookup.ok ? banLookup.isBanned : null,
    banPeriod: banLookup.ok && banLookup.isBanned && banLookup.periodMonths > 0
      ? banLookup.periodMonths + " months"
      : null,
    playerLookup: {
      ok: playerLookup.ok,
      status: playerLookup.status,
      httpStatus: playerLookup.httpStatus,
      retryable: Boolean(playerLookup.retryable),
      message: playerLookup.ok ? null : playerLookup.message,
    },
    banLookup: {
      ok: banLookup.ok,
      status: banLookup.status,
      httpStatus: banLookup.httpStatus,
      retryable: Boolean(banLookup.retryable),
      message: banLookup.ok ? null : banLookup.message,
    },
  };
}

async function handleBanCheck(req, res, next) {
  try {
    const uid = requireUid(req.query.uid);
    const playerLookup = await lookupPlayer(uid);
    const banLookup = await lookupBanStatus(uid);
    const payload = formatResponse(uid, playerLookup, banLookup);

    if (!banLookup.ok) {
      return res.status(502).json({
        error: "upstream_error",
        message: banLookup.message,
        ...payload,
      });
    }

    res.set("Cache-Control", "public, s-maxage=60, max-age=60");
    return res.json(payload);
  } catch (error) {
    next(error);
  }
}

router.get("/v1/bancheck", handleBanCheck);
router.get("/bancheck", handleBanCheck);

module.exports = router;
