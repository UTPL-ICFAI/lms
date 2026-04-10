const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const { chat } = require("../controllers/aiController");
const { ingestMaterial, chatRag } = require("../controllers/ragController");
const { webSearch } = require("../controllers/webSearchController");

router.post("/chat", protect, chat);
router.post(
  "/ingest",
  protect,
  authorizeRoles("student", "faculty", "admin"),
  upload.single("file"),
  ingestMaterial
);
router.post("/chat-rag", protect, authorizeRoles("student", "faculty", "admin"), chatRag);
router.post("/web-search", protect, authorizeRoles("student", "faculty", "admin"), webSearch);

module.exports = router;

