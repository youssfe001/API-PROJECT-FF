const fs = require("fs");
const path = require("path");
const https = require("https");

const SOURCES = {
  itemData: "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/itemData.json",
  cdn: "https://raw.githubusercontent.com/jinix6/ItemID/main/assets/cdn.json",
  ffIcons: "https://raw.githubusercontent.com/0xMe/ff-resources/main/pngs/300x300/list.json",
};

const MANUAL_FF_ICON_ALIASES = {
  Icon_face_female_2: ["Icon_face_F", "Icon_face_female01_head"],
  Icon_face_female_3: ["Icon_face_F", "Icon_face_female01_head"],
  Icon_face_male_1: ["Icon_face_M", "Icon_face_male04_head"],
  Icon_face_male_2: ["Icon_face_M", "Icon_face_male04_head"],
  Icon_face_male_3: ["Icon_face_M", "Icon_face_male04_head"],
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "user-agent": "freefire-api/1.0",
            accept: "application/json",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error("Request failed for " + url + ": " + res.statusCode));
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
              reject(new Error("Invalid JSON from " + url + ": " + error.message));
            }
          });
        }
      )
      .on("error", reject);
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
    const first = Object.entries(entry)[0] || [];
    const key = first[0];
    const value = first[1];
    if (!key || !value) continue;
    out[String(key)] = value;
  }
  return out;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toPascalStem(value) {
  return String(value || "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("_");
}

function buildIconIndex(list) {
  const exact = new Map();
  const normalized = new Map();

  for (const value of list) {
    const name = String(value).replace(/\.png$/i, "");
    const lower = name.toLowerCase();
    const token = normalizeToken(name);

    if (!exact.has(lower)) exact.set(lower, name);
    if (!normalized.has(token)) normalized.set(token, name);
  }

  return { exact, normalized };
}

function candidateIconNames(iconName) {
  const names = [iconName];

  if (MANUAL_FF_ICON_ALIASES[iconName]) {
    names.push(...MANUAL_FF_ICON_ALIASES[iconName]);
  }

  if (/^FFWS_UI_Card_/i.test(iconName)) {
    names.push(iconName.replace(/_(ID|BR|LATAM|TH|VN|CIS|EU|MENA|SG|PK|TW)$/i, ""));
  }

  const avatarStemMatch =
    iconName.match(/^Icon_avatar_(?:male_|female_)?(?:sc_|cos_)?(?:top_|bottom_|shoe_|accessory_|hair_|headadditive_)?(.+)$/i) ||
    iconName.match(/^Icon_avatar_cos_(?:top_|bottom_|shoe_|accessory_|hair_|headadditive_)?(.+)$/i);

  if (avatarStemMatch) {
    const stemRaw = avatarStemMatch[1];
    const stemPascal = toPascalStem(stemRaw);
    const stemVariants = unique([
      stemRaw,
      stemPascal,
      stemRaw.replace(/_bot_/gi, "_"),
      stemPascal.replace(/_Bot_/g, "_"),
    ]);

    for (const stem of stemVariants) {
      names.push("FF_UI_Character_" + stem);
      names.push("Icon_face_" + stem);
      names.push("Icon_face_" + stem + "_Q");
      names.push("Icon_face_male_head_sc_" + stem);
      names.push("Icon_face_male_head_sc_" + stem + "_B");
      names.push("Icon_face_female_head_sc_" + stem);
      names.push("Icon_face_female_head_sc_" + stem + "_B");
    }
  }

  return unique(names);
}

function resolveFfIcon(iconName, iconIndex) {
  if (!iconName) return null;

  for (const candidate of candidateIconNames(iconName)) {
    const exact = iconIndex.exact.get(candidate.toLowerCase());
    if (exact) {
      return {
        name: exact,
        kind: exact.toLowerCase() === String(iconName).toLowerCase() ? "direct" : "alias",
      };
    }

    const normalized = iconIndex.normalized.get(normalizeToken(candidate));
    if (normalized) {
      return {
        name: normalized,
        kind: normalized.toLowerCase() === String(iconName).toLowerCase() ? "direct" : "alias",
      };
    }
  }

  return null;
}

async function main() {
  const fetched = await Promise.all([
    fetchJson(SOURCES.itemData),
    fetchJson(SOURCES.cdn),
    fetchJson(SOURCES.ffIcons),
  ]);
  const itemData = fetched[0];
  const cdnList = fetched[1];
  const ffIcons = fetched[2];

  const cdnMap = arrayEntriesToMap(cdnList);
  const ffIndex = buildIconIndex(ffIcons);
  const merged = {};

  const stats = {
    total: 0,
    direct: 0,
    alias: 0,
    cdnOnly: 0,
    unresolved: 0,
  };

  for (const entry of itemData) {
    const id = String(entry.itemID);
    const ffResolved = resolveFfIcon(entry.icon, ffIndex);
    const hasCdn = Boolean(cdnMap[id]);

    if (ffResolved && ffResolved.kind === "direct") stats.direct += 1;
    else if (ffResolved && ffResolved.kind === "alias") stats.alias += 1;
    else if (hasCdn) stats.cdnOnly += 1;
    else stats.unresolved += 1;
    stats.total += 1;

    merged[id] = {
      n: entry.description === "NONE" ? "" : entry.description || "",
      d: entry.description2 === "NONE" ? "" : entry.description2 || "",
      t: entry.itemType || "NONE",
      r: normalizeRare(entry.Rare),
      c: entry.collectionType || "NONE",
      icon: entry.icon || null,
      iconSource: entry.IconInAB || null,
      iconUrl: cdnMap[id] || null,
      ff: ffResolved ? ffResolved.name : null,
      ffk: ffResolved ? ffResolved.kind : null,
      unique: Boolean(entry.isUnique),
    };
  }

  const dataDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "item-assets.json"),
    JSON.stringify(merged, null, 2) + "\n",
    "utf8"
  );

  console.log(
    "Synced " +
      stats.total +
      " item assets (" +
      stats.direct +
      " ff direct, " +
      stats.alias +
      " ff alias, " +
      stats.cdnOnly +
      " cdn fallback, " +
      stats.unresolved +
      " unresolved)"
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
