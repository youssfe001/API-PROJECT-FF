const express = require("express");
const path = require("path");
const { errorHandler } = require("./lib/validate");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/demo", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "demo.html"));
});

app.use("/api", require("./routes/health"));
app.use("/api", require("./routes/account"));
app.use("/api", require("./routes/playerstats"));
app.use("/api", require("./routes/playertcstats"));
app.use("/api", require("./routes/galleryshow"));
app.use("/api", require("./routes/wishlist"));
app.use("/api", require("./routes/uidgenerator"));

app.use((req, res) => {
  res.status(404).json({ error: "endpoint_not_found", path: req.path });
});
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Free Fire API running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/api/health`);
  console.log(`http://localhost:${PORT}/api/demo`);
});

module.exports = app;
