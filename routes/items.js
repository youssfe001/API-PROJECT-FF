/**
 * routes/items.js
 * ──────────────────────────────────────────────────────────────────
 * GET /items?id=123           → single item lookup
 * GET /items?id=123,456,789   → batch lookup
 * GET /items/search?q=katana  → name search (max 50 results)
 * ──────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const { lookupItem, resolveItems, searchItems } = require("../lib/items");
const { ApiError } = require("../lib/validate");

const FF_RESOURCES_BASE = "https://raw.githubusercontent.com/0xme/ff-resources/main/pngs/300x300";
const UNKNOWN_ICON_NAME = "UI_EPFP_unknown.png";
const DEFAULT_ICON_ENGINE = "ai-fast";
const REMOTE_ICON_CACHE = new Map();
const PROCESSED_ICON_CACHE = new Map();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parsePositiveInt(value, fallback, name, min, max) {
  if (value === undefined || value === null || value === "") return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ApiError(`Invalid '${name}' query parameter. Must be an integer.`);
  }

  if (parsed < min || parsed > max) {
    throw new ApiError(`Invalid '${name}' query parameter. Must be between ${min} and ${max}.`);
  }

  return parsed;
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value)).replace(/%2F/g, "/");
}

function parseIconEngine(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_ICON_ENGINE;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "fast") return DEFAULT_ICON_ENGINE;
  if (normalized === "ai-fast" || normalized === "classic") {
    return normalized;
  }

  throw new ApiError("Invalid 'engine' query parameter. Use 'ai-fast' or 'classic'.");
}

async function fetchRemoteBuffer(url) {
  if (REMOTE_ICON_CACHE.has(url)) {
    return REMOTE_ICON_CACHE.get(url);
  }

  const pending = (async () => {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "freefire-api/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Remote fetch failed (${response.status}) for ${url}`);
    }

    return Buffer.from(await response.arrayBuffer());
  })();

  REMOTE_ICON_CACHE.set(url, pending);

  try {
    const buffer = await pending;
    REMOTE_ICON_CACHE.set(url, buffer);
    return buffer;
  } catch (error) {
    REMOTE_ICON_CACHE.delete(url);
    throw error;
  }
}

function iconCandidates(item) {
  const urls = [];

  if (item?.ffIcon) {
    urls.push(`${FF_RESOURCES_BASE}/${encodePathSegment(item.ffIcon)}.png`);
  }

  if (item?.icon) {
    urls.push(`${FF_RESOURCES_BASE}/${encodePathSegment(item.icon)}.png`);
  }

  if (item?.iconUrl) {
    urls.push(item.iconUrl);
  }

  urls.push(`${FF_RESOURCES_BASE}/${UNKNOWN_ICON_NAME}`);
  return [...new Set(urls.filter(Boolean))];
}

async function resolveIconSource(item) {
  let lastError = null;

  for (const sourceUrl of iconCandidates(item)) {
    try {
      const buffer = await fetchRemoteBuffer(sourceUrl);
      return { buffer, sourceUrl };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to resolve icon source.");
}

function createIconPipeline(sourceBuffer, targetSize, kernel) {
  return sharp(sourceBuffer, { failOn: "none", unlimited: true })
    .ensureAlpha()
    .resize(targetSize, targetSize, {
      fit: "contain",
      kernel,
      fastShrinkOnLoad: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
}

async function buildClassicIconBuffer(sourceBuffer, targetSize) {
  return createIconPipeline(sourceBuffer, targetSize, sharp.kernel.lanczos3)
    .sharpen({ sigma: 1.35, m1: 1, m2: 2 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function buildAiFastIconBuffer(sourceBuffer, targetSize) {
  const aiKernel = sharp.kernel.mks2021 || sharp.kernel.lanczos3;
  const pipeline = createIconPipeline(sourceBuffer, targetSize, aiKernel);

  const [colorBuffer, alphaBuffer] = await Promise.all([
    pipeline.clone()
      .removeAlpha()
      .normalise()
      .modulate({ brightness: 1.03, saturation: 1.12 })
      .linear(1.06, -(255 * 0.02))
      .sharpen({ sigma: 2.1, m1: 1.5, m2: 3.5, x1: 2, y2: 12, y3: 18 })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer(),
    pipeline.clone()
      .extractChannel("alpha")
      .linear(1.08, -6)
      .sharpen({ sigma: 1.45, m1: 1, m2: 2 })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer(),
  ]);

  return sharp(colorBuffer, { failOn: "none", unlimited: true })
    .joinChannel(alphaBuffer)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function buildIconBuffer(sourceBuffer, targetSize, engine) {
  if (engine === "classic") {
    return buildClassicIconBuffer(sourceBuffer, targetSize);
  }

  return buildAiFastIconBuffer(sourceBuffer, targetSize);
}

router.get("/items/icon/:id.png", async (req, res, next) => {
  try {
    const item = lookupItem(req.params.id);
    if (!item) {
      throw new ApiError(`Unknown item id '${req.params.id}'.`, 404);
    }

    const displaySize = parsePositiveInt(req.query.size, 128, "size", 32, 768);
    const upscaleFactor = parsePositiveInt(req.query.upscale, 4, "upscale", 1, 6);
    const engine = parseIconEngine(req.query.engine);
    const targetSize = clamp(displaySize * upscaleFactor, 32, 3072);

    const { buffer: sourceBuffer, sourceUrl } = await resolveIconSource(item);
    const cacheKey = `${sourceUrl}|${targetSize}|${engine}`;

    let output = PROCESSED_ICON_CACHE.get(cacheKey);
    if (!output) {
      output = await buildIconBuffer(sourceBuffer, targetSize, engine);
      PROCESSED_ICON_CACHE.set(cacheKey, output);
    }

    res.set({
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=86400",
      "x-icon-source": sourceUrl,
      "x-icon-display-size": String(displaySize),
      "x-icon-output-size": String(targetSize),
      "x-icon-upscale": String(upscaleFactor),
      "x-icon-engine": engine,
    });

    res.send(output);
  } catch (err) {
    next(err);
  }
});

router.get("/items", (req, res, next) => {
  try {
    const raw = req.query.id;
    if (!raw) throw new ApiError("Missing 'id' query parameter. Use ?id=123 or ?id=123,456");

    const ids = String(raw).split(",").map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) throw new ApiError("No valid IDs provided.");

    if (ids.length === 1) {
      const item = lookupItem(ids[0]);
      res.json({ id: ids[0], found: !!item, item: item || null });
    } else {
      const items = resolveItems(ids);
      res.json({ count: items.length, items });
    }
  } catch (err) {
    next(err);
  }
});

router.get("/items/search", (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) throw new ApiError("Missing 'q' query parameter. Use ?q=katana");

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const results = searchItems(q, limit);

    res.json({ query: q, count: results.length, items: results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
