const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const {
  createLecture,
  getLecturesByCourse,
} = require("../controllers/lectureController");

router.post(
  "/",
  protect,
  authorizeRoles("faculty", "admin"),
  upload.single("file"),
  createLecture
);
router.get("/course/:courseId", protect, getLecturesByCourse);

module.exports = router;
