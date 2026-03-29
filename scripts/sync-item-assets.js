const fs = require("fs");
const path = require("path");
const https = require("https");

const SOURCES = {
  itemData: "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/itemData.json",
  cdn: "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/cdn.json",
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed for ${url}: ${res.statusCode}`));
        res.resume();
        return;
      }

      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(new Error(`Invalid JSON from ${url}: ${error.message}`));
        }
      });
    }).on("error", reject);
  });
}

function normalizeRare(value) {
  if (!value || value === "NONE") return "NONE";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function arrayEntriesToMap(list) {
  const out = {};
  for (const entry of list) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const [key, value] = Object.entries(entry)[0] || [];
    if (!key || !value) continue;
    out[String(key)] = value;
  }
  return out;
}

async function main() {
  const [itemData, cdnList] = await Promise.all([
    fetchJson(SOURCES.itemData),
    fetchJson(SOURCES.cdn),
  ]);

  const cdnMap = arrayEntriesToMap(cdnList);
  const merged = {};

  for (const entry of itemData) {
    const id = String(entry.itemID);
    merged[id] = {
      n: entry.description === "NONE" ? "" : entry.description || "",
      d: entry.description2 === "NONE" ? "" : entry.description2 || "",
      t: entry.itemType || "NONE",
      r: normalizeRare(entry.Rare),
      c: entry.collectionType || "NONE",
      icon: entry.icon || null,
      iconSource: entry.IconInAB || null,
      iconUrl: cdnMap[id] || null,
      unique: Boolean(entry.isUnique),
    };
  }

  const dataDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "item-assets.json"),
    `${JSON.stringify(merged, null, 2)}\n`,
    "utf8"
  );

  console.log(`Synced ${Object.keys(merged).length} item assets`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
