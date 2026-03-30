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
