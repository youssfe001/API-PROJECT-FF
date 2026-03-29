/**
 * lib/items.js
 * ──────────────────────────────────────────────────────────────────
 * Free Fire items database — 30k+ items loaded once at startup.
 * Source: iamaanahmad/FreeFireItems (OB50 dataset)
 *
 * Each entry: { n: name, t: type, r: rarity, c: collectionType }
 * ──────────────────────────────────────────────────────────────────
 */

const path = require("path");
const fs   = require("fs");

let _db = null;  // lazy singleton

function _load() {
  if (_db) return _db;
  const filePath = path.join(__dirname, "..", "data", "items.json");
  const raw = fs.readFileSync(filePath, "utf8");
  _db = JSON.parse(raw);
  console.log(`[items] Loaded ${Object.keys(_db).length} items`);
  return _db;
}

/**
 * Lookup a single item by ID.
 * @param {number|string} id
 * @returns {{ name: string, type: string, rare: string, collectionType: string } | null}
 */
function lookupItem(id) {
  const db = _load();
  const entry = db[String(id)];
  if (!entry) return null;
  return {
    name:           entry.n || null,
    type:           entry.t || null,
    rare:           entry.r || null,
    collectionType: entry.c || null,
  };
}

/**
 * Resolve an array of IDs to items.
 * @param {Array<number|string>} ids
 * @returns {Array<{ id: number|string, name: string|null, type: string|null, rare: string|null }>}
 */
function resolveItems(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => {
    const item = lookupItem(id);
    return {
      id,
      name: item?.name || null,
      type: item?.type || null,
      rare: item?.rare || null,
      collectionType: item?.collectionType || null,
    };
  });
}

/**
 * Search items by name substring (case-insensitive).
 * @param {string} query
 * @param {number} limit
 * @returns {Array<{ id: string, name: string, type: string, rare: string }>}
 */
function searchItems(query, limit = 50) {
  const db = _load();
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const results = [];
  for (const [id, entry] of Object.entries(db)) {
    if (entry.n && entry.n.toLowerCase().includes(q)) {
      results.push({
        id,
        name:           entry.n,
        type:           entry.t,
        rare:           entry.r,
        collectionType: entry.c,
      });
      if (results.length >= limit) break;
    }
  }
  return results;
}

module.exports = { lookupItem, resolveItems, searchItems };
