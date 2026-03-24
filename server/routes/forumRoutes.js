const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createThread,
  getThreadsByCourse,
  createReply,
  getRepliesByThread,
} = require("../controllers/forumController");

router.post("/thread", protect, authorizeRoles("student", "faculty", "admin"), createThread);
router.get("/course/:courseId", protect, getThreadsByCourse);
router.post("/reply", protect, authorizeRoles("student", "faculty", "admin"), createReply);
router.get("/thread/:threadId/replies", protect, getRepliesByThread);

module.exports = router;
