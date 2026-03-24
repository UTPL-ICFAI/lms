const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createUser,
  assignStudentToCourse,
} = require("../controllers/adminController");

router.post("/create-user", protect, authorizeRoles("admin"), createUser);

router.post(
  "/assign-course",
  protect,
  authorizeRoles("admin"),
  assignStudentToCourse
);

module.exports = router;
