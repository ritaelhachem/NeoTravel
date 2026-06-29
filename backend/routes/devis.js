const express = require("express");
const { createDevis, downloadDevisPdf, listDevis, sendDevisEmail } = require("../controllers/devisController");

const router = express.Router();

router.get("/", listDevis);
router.post("/email", sendDevisEmail);
router.post("/pdf", downloadDevisPdf);
router.post("/", createDevis);

module.exports = router;
