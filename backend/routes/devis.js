const express = require("express");
const { createDevis, listDevis } = require("../controllers/devisController");

const router = express.Router();

router.get("/", listDevis);
router.post("/", createDevis);

module.exports = router;
