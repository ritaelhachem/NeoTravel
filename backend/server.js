const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRoutes = require("./routes/chat");
const devisRoutes = require("./routes/devis");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "neotravel-backend",
  });
});

app.use("/api/devis", devisRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`NeoTravel backend listening on http://localhost:${port}`);
  });
}

module.exports = app;
