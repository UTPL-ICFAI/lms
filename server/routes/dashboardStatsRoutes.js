const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
} = require("../controllers/dashboardController");

router.get("/admin", protect, authorizeRoles("admin"), getAdminDashboard);
router.get("/faculty", protect, authorizeRoles("faculty"), getFacultyDashboard);

router.get("/student", protect, authorizeRoles("student"), getStudentDashboard);

module.exports = router;
