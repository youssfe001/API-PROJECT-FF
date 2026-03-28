const express = require("express");
const { errorHandler } = require("./lib/validate");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api", require("./routes/health"));
app.use("/api", require("./routes/account"));
app.use("/api", require("./routes/playerstats"));
app.use("/api", require("./routes/playertcstats"));
app.use("/api", require("./routes/galleryshow"));
app.use("/api", require("./routes/wishlist"));

app.use((req, res) => {
  res.status(404).json({ error: "endpoint_not_found", path: req.path });
});
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Free Fire API running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/api/health`);
});

module.exports = app;
