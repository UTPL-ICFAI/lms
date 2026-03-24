const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { createLiveClass, getByCourse } = require("../controllers/liveClassController");

router.post("/", protect, authorizeRoles("faculty", "admin"), createLiveClass);
router.get("/course/:id", protect, getByCourse);

module.exports = router;
