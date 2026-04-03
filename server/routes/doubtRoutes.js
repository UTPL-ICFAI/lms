const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  createDoubt,
  getDoubtsByStudent,
  getDoubtsByCourse,
  respondToDoubt,
  updateDoubtStatus,
  deleteDoubt,
} = require("../controllers/doubtController");

router.post("/", protect, authorizeRoles("student"), createDoubt);
router.get(
  "/student/:id",
  protect,
  authorizeRoles("student", "faculty", "admin"),
  getDoubtsByStudent
);
router.get(
  "/course/:id",
  protect,
  authorizeRoles("faculty", "admin"),
  getDoubtsByCourse
);
router.put(
  "/:id/respond",
  protect,
  authorizeRoles("faculty", "admin"),
  respondToDoubt
);
router.put(
  "/:id/status",
  protect,
  authorizeRoles("faculty", "admin"),
  updateDoubtStatus
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("student", "admin"),
  deleteDoubt
);

module.exports = router;

