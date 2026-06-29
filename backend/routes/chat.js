const express = require("express");
const { extractMessage, sendMessage } = require("../controllers/chatController");

const router = express.Router();

router.post("/extract", extractMessage);
router.post("/", sendMessage);

module.exports = router;
