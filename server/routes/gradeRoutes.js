const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { createGrade, getGradesForStudent } = require("../controllers/gradeController");

router.post("/", protect, authorizeRoles("faculty", "admin"), createGrade);
router.get(
  "/student/:studentId",
  protect,
  authorizeRoles("student", "admin"),
  getGradesForStudent
);

module.exports = router;
