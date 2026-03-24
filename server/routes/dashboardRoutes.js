const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get("/student", protect, authorizeRoles("student"), (req, res) => {
  res.json({
    message: "Welcome Student Dashboard",
    user: req.user,
  });
});

router.get("/faculty", protect, authorizeRoles("faculty"), (req, res) => {
  res.json({
    message: "Welcome Faculty Dashboard",
    user: req.user,
  });
});

module.exports = router;
