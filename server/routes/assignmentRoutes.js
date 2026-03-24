const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const {
  createAssignment,
  getAssignmentsByCourse,
} = require("../controllers/assignmentController");

router.post(
  "/",
  protect,
  authorizeRoles("faculty", "admin"),
  upload.single("file"),
  createAssignment
);
router.get("/course/:courseId", protect, getAssignmentsByCourse);

module.exports = router;
