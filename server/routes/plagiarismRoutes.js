const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const { checkSubmission } = require("../controllers/plagiarismController");

router.post("/check", protect, checkSubmission);

module.exports = router;
