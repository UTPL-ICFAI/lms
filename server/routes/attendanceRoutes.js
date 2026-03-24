const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  markAttendance,
  getStudentAttendance,
  getCourseAttendanceForStudent,
} = require("../controllers/attendanceController");

// Faculty marks attendance
router.post("/:courseId", protect, authorizeRoles("faculty"), markAttendance);

// Student views attendance
router.get(
  "/student",
  protect,
  authorizeRoles("student"),
  getStudentAttendance
);
router.get(
  "/course/:courseId",
  protect,
  authorizeRoles("student"),
  getCourseAttendanceForStudent
);

module.exports = router;
