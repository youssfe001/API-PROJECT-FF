const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function normalizeCredential(entry) {
  if (!entry || typeof entry !== "object") return null;
  const uid = entry.uid !== undefined ? String(entry.uid).trim() : "";
  const password = entry.password !== undefined ? String(entry.password).trim() : "";
  if (!uid || !password) return null;
  return { uid, password };
}

function getCredentialForRegion(region) {
  const guestsPath = path.join(__dirname, "..", "config", "guests.json");
  const accountsPath = path.join(__dirname, "..", "config", "accounts.json");

  const guests = readJson(guestsPath);
  if (guests) {
    if (Array.isArray(guests)) {
      const picked = normalizeCredential(pickRandom(guests));
      if (picked) return { source: "guests.json[array]", credential: picked };
    } else if (typeof guests === "object") {
      const regionPool = guests[region];
      if (Array.isArray(regionPool)) {
        const picked = normalizeCredential(pickRandom(regionPool));
        if (picked) return { source: `guests.json[${region}]`, credential: picked };
      } else {
        const direct = normalizeCredential(regionPool);
        if (direct) return { source: `guests.json[${region}]`, credential: direct };
      }
    }
  }

  const accounts = readJson(accountsPath);
  if (accounts && typeof accounts === "object") {
    const acct = normalizeCredential(accounts[region]);
    if (acct) return { source: `accounts.json[${region}]`, credential: acct };
  }

  throw new Error(
    `No guest credential found for region=${region}. Provide config/guests.json (recommended) or config/accounts.json.`
  );
}

module.exports = { getCredentialForRegion };
