const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const { createGrade, getGradesForStudent } = require("../controllers/gradeController");

router.post("/", protect, authorizeRoles("faculty", "admin"), upload.single("file"), createGrade);
router.get(
  "/student/:studentId",
  protect,
  authorizeRoles("student", "admin"),
  getGradesForStudent
);

module.exports = router;
