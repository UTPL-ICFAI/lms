const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const {
  createLecture,
  getLecturesByCourse,
  deleteLecture,
} = require("../controllers/lectureController");

router.post(
  "/",
  protect,
  authorizeRoles("faculty", "admin"),
  upload.single("file"),
  createLecture
);
router.get("/course/:courseId", protect, getLecturesByCourse);
router.delete("/:id", protect, authorizeRoles("faculty", "admin"), deleteLecture);

module.exports = router;
