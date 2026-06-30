const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), override: true });

const chatRoutes = require("./routes/chat");
const devisRoutes = require("./routes/devis");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 5000;
const envClientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  ...envClientUrls,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/+$/, ""));

function isAllowedVercelPreview(origin) {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && hostname.startsWith("neo-travel") && hostname.endsWith(".vercel.app");
  } catch (error) {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/+$/, "");

      if (!origin || allowedOrigins.includes(normalizedOrigin) || isAllowedVercelPreview(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
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
