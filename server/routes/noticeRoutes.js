const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createNotice,
  getNotices,
  updateNotice,
  deleteNotice,
  restoreNotice,
} = require("../controllers/noticeController");

// Faculty or Admin creates notice
router.post("/", protect, authorizeRoles("faculty", "admin"), createNotice);

// All logged-in users can view notices (use ?role=student or ?role=faculty for filtered list)
router.get("/", protect, getNotices);

router.put("/:noticeId", protect, authorizeRoles("faculty", "admin"), updateNotice);

router.delete("/:noticeId", protect, authorizeRoles("faculty", "admin"), deleteNotice);

router.put(
  "/restore/:noticeId",
  protect,
  authorizeRoles("faculty", "admin"),
  restoreNotice
);

module.exports = router;
