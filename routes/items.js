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
const { lookupItem, resolveItems, searchItems } = require("../lib/items");
const { ApiError } = require("../lib/validate");

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
