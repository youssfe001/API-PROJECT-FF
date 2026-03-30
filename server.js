const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");

const { errorHandler } = require("./lib/validate");
const { globalLimiter, strictLimiter } = require("./lib/rateLimit");
const { apiKeyAuth } = require("./lib/apiKeyAuth");

const app = express();

/* ── 1. Compression ───────────────────────────────────── */
app.use(compression());

/* ── 2. Security Headers (helmet) ─────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://open.spotify.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.bunny.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.bunny.net"],
        imgSrc: ["'self'", "data:", "blob:", "https://raw.githubusercontent.com", "https://*.scdn.co", "https://i.scdn.co", "https://cdn-sc-g.sharechat.com", "https://*.sharechat.com", "https://*.garena.com", "https://kg.freefireglobal.com"],
        frameSrc: ["https://open.spotify.com"],
        connectSrc: ["'self'"],
        mediaSrc: ["https://open.spotify.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

/* ── 3. CORS ──────────────────────────────────────────── */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
    credentials: false,
  })
);

/* ── 4. Body Parsers ──────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── 5. Enhanced Request Logger ───────────────────────── */
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
    originalEnd.apply(this, args);
  };
  next();
});

/* ── 6. Static Files ──────────────────────────────────── */
app.use(express.static(path.join(__dirname, "public")));
app.use("/data", express.static(path.join(__dirname, "data")));

/* ── 7. Landing Page ──────────────────────────────────── */
app.get("/", (req, res) => {
  res.json({
    name: "Free Fire API",
    version: "1.0.0",
    status: "operational",
    description: "Reverse-engineered Free Fire game data API proxy",
    dashboard: "/api/demo",
    endpoints: {
      health: "GET /api/health",
      account: "GET /api/v1/account?region=IND&uid=123456789",
      playerStats: "GET /api/v1/playerstats?region=IND&uid=123456789&matchmode=CAREER",
      playerTcStats: "GET /api/v1/playertcstats?region=IND&uid=123456789&matchmode=CAREER",
      search: "GET /api/v1/search?region=IND&keyword=player",
      banCheck: "GET /api/v1/bancheck?uid=123456789",
      wishlist: "GET /api/v1/wishlist?region=IND&uid=123456789",
      items: "GET /api/items?id=101000005",
      itemSearch: "GET /api/items/search?q=olivia&limit=10",
      itemIcon: "GET /api/items/icon/101000005.png?size=128&upscale=4&engine=ai-fast",
      uidGenerator: "GET /api/uid-generator?mode=random&count=5&length=10",
      guestGenerator: "GET /api/guest-generator?region=IND",
      likeSpam: "POST /api/like-spam",
    },
    timestamp: new Date().toISOString(),
  });
});

/* ── 8. Dashboard ─────────────────────────────────────── */
app.get("/api/demo", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "demo.html"));
});

/* ── OAuth Sessions (in-memory, short-lived) ─────── */
const oauthSessions = new Map();
function mkSession(data) {
  const id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
  oauthSessions.set(id, data);
  setTimeout(() => oauthSessions.delete(id), 5 * 60 * 1000); // 5 min TTL
  return id;
}
const BASE_URL = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

/* ── GitHub OAuth ─────────────────────────────────── */
app.get("/api/auth/github", (req, res) => {
  const cid = process.env.GITHUB_CLIENT_ID;
  if (!cid) return res.redirect("/api/demo?oauth_error=not_configured");
  const cb = encodeURIComponent(BASE_URL() + "/api/auth/github/callback");
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${cid}&redirect_uri=${cb}&scope=read:user`);
});

app.get("/api/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/api/demo?oauth_error=no_code");
  try {
    const tr = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
    });
    const td = await tr.json();
    if (!td.access_token) throw new Error("no_token");
    const ur = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${td.access_token}`, Accept: "application/vnd.github+json" } });
    const ud = await ur.json();
    const sid = mkSession({ user: ud.login || ud.name || "github_user", provider: "github", avatar: ud.avatar_url });
    res.redirect(`/api/demo?oauth_session=${sid}&provider=github`);
  } catch { res.redirect("/api/demo?oauth_error=github_failed"); }
});

/* ── Discord OAuth ────────────────────────────────── */
app.get("/api/auth/discord", (req, res) => {
  const cid = process.env.DISCORD_CLIENT_ID;
  if (!cid) return res.redirect("/api/demo?oauth_error=not_configured");
  const cb = encodeURIComponent(BASE_URL() + "/api/auth/discord/callback");
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${cid}&redirect_uri=${cb}&response_type=code&scope=identify`);
});

app.get("/api/auth/discord/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/api/demo?oauth_error=no_code");
  try {
    const body = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code, redirect_uri: BASE_URL() + "/api/auth/discord/callback" });
    const tr = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const td = await tr.json();
    if (!td.access_token) throw new Error("no_token");
    const ur = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${td.access_token}` } });
    const ud = await ur.json();
    const sid = mkSession({ user: ud.username || "discord_user", provider: "discord", avatar: ud.avatar ? `https://cdn.discordapp.com/avatars/${ud.id}/${ud.avatar}.png` : null });
    res.redirect(`/api/demo?oauth_session=${sid}&provider=discord`);
  } catch { res.redirect("/api/demo?oauth_error=discord_failed"); }
});

/* ── Google OAuth ─────────────────────────────────── */
app.get("/api/auth/google", (req, res) => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  if (!cid) return res.redirect("/api/demo?oauth_error=not_configured");
  const cb = encodeURIComponent(BASE_URL() + "/api/auth/google/callback");
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${cid}&redirect_uri=${cb}&response_type=code&scope=openid%20email%20profile&access_type=offline`);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/api/demo?oauth_error=no_code");
  try {
    const body = new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: BASE_URL() + "/api/auth/google/callback", grant_type: "authorization_code" });
    const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const td = await tr.json();
    if (!td.access_token) throw new Error("no_token");
    const ur = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${td.access_token}` } });
    const ud = await ur.json();
    const sid = mkSession({ user: ud.name || ud.email || "google_user", provider: "google", avatar: ud.picture });
    res.redirect(`/api/demo?oauth_session=${sid}&provider=google`);
  } catch { res.redirect("/api/demo?oauth_error=google_failed"); }
});

/* ── OAuth Session Retrieval ──────────────────────── */
app.get("/api/auth/session/:id", (req, res) => {
  const s = oauthSessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "session_not_found" });
  oauthSessions.delete(req.params.id);
  res.json(s);
});

/* ── 9. Rate Limiting ─────────────────────────────────── */
app.use("/api", globalLimiter);
app.use("/api/like-spam", strictLimiter);

/* ── 10. API Key Authentication ───────────────────────── */
app.use("/api", (req, res, next) => {
  const exempt = ["/health", "/demo"];
  if (exempt.includes(req.path)) return next();
  apiKeyAuth(req, res, next);
});

/* ── 11. Route Registration ───────────────────────────── */
app.use("/api", require("./routes/health"));
app.use("/api", require("./routes/account"));
app.use("/api", require("./routes/playerstats"));
app.use("/api", require("./routes/playertcstats"));
app.use("/api", require("./routes/search"));
app.use("/api", require("./routes/bancheck"));
app.use("/api", require("./routes/galleryshow"));
app.use("/api", require("./routes/wishlist"));

app.use("/api", require("./routes/uidgenerator"));
app.use("/api", require("./routes/items"));
app.use("/api", require("./routes/guestgenerator"));
app.use("/api", require("./routes/likespam"));

/* ── 12. 404 Catch-all ────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: "endpoint_not_found", path: req.path });
});

/* ── 13. Error Handler ────────────────────────────────── */
app.use(errorHandler);

/* ── Start ────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Free Fire API running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`http://localhost:${PORT}/api/demo`);
});

module.exports = app;
