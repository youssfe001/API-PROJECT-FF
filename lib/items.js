/**
 * lib/items.js
 * ──────────────────────────────────────────────────────────────────
 * Free Fire items database — 30k+ items loaded once at startup.
 * Primary source: local compact dataset in data/items.json.
 * Enriched source: synced metadata and icon URLs in data/item-assets.json.
 * ──────────────────────────────────────────────────────────────────
 */

const path = require("path");
const fs   = require("fs");

let _db = null;
let _assets = null;

function _load() {
  if (_db) return _db;
  const filePath = path.join(__dirname, "..", "data", "items.json");
  const raw = fs.readFileSync(filePath, "utf8");
  _db = JSON.parse(raw);
  console.log(`[items] Loaded ${Object.keys(_db).length} items`);
  return _db;
}

function _loadAssets() {
  if (_assets) return _assets;
  const filePath = path.join(__dirname, "..", "data", "item-assets.json");
  if (!fs.existsSync(filePath)) {
    _assets = {};
    return _assets;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  _assets = JSON.parse(raw);
  console.log(`[items] Loaded ${Object.keys(_assets).length} enriched item assets`);
  return _assets;
}

function mergeItem(id, base, enriched) {
  if (!base && !enriched) return null;

  return {
    id: String(id),
    name: enriched?.n ?? base?.n ?? null,
    description: enriched?.d || null,
    type: enriched?.t ?? base?.t ?? null,
    rare: enriched?.r ?? base?.r ?? null,
    collectionType: enriched?.c ?? base?.c ?? null,
    icon: enriched?.icon || null,
    iconSource: enriched?.iconSource || null,
    iconUrl: enriched?.iconUrl || null,
    proxyIconPath: `/api/items/icon/${encodeURIComponent(String(id))}.png`,
    isUnique: typeof enriched?.unique === "boolean" ? enriched.unique : null,
  };
}

/**
 * Lookup a single item by ID.
 * @param {number|string} id
 * @returns {{ name: string, type: string, rare: string, collectionType: string } | null}
 */
function lookupItem(id) {
  const db = _load();
  const assets = _loadAssets();
  const key = String(id);
  return mergeItem(key, db[key], assets[key]);
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
      description: item?.description || null,
      type: item?.type || null,
      rare: item?.rare || null,
      collectionType: item?.collectionType || null,
      icon: item?.icon || null,
      iconSource: item?.iconSource || null,
      iconUrl: item?.iconUrl || null,
      proxyIconPath: item?.proxyIconPath || null,
      isUnique: item?.isUnique ?? null,
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
  const assets = _loadAssets();
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const results = [];
  for (const [id, entry] of Object.entries(db)) {
    if (entry.n && entry.n.toLowerCase().includes(q)) {
      const item = mergeItem(id, entry, assets[id]);
      results.push({
        id,
        name: item?.name || null,
        description: item?.description || null,
        type: item?.type || null,
        rare: item?.rare || null,
        collectionType: item?.collectionType || null,
        icon: item?.icon || null,
        iconSource: item?.iconSource || null,
        iconUrl: item?.iconUrl || null,
        proxyIconPath: item?.proxyIconPath || null,
        isUnique: item?.isUnique ?? null,
      });
      if (results.length >= limit) break;
    }
  }
  return results;
}

module.exports = { lookupItem, resolveItems, searchItems };
