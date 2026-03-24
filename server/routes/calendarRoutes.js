const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const { createEvent, getForUser } = require("../controllers/calendarController");

router.post("/", protect, authorizeRoles("faculty", "admin"), createEvent);
router.get("/user/:id", protect, authorizeRoles("student", "faculty", "admin"), getForUser);

module.exports = router;
