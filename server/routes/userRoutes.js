const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getUsers,
  updateUser,
  deleteUser,
  restoreUser,
  changePassword,
} = require("../controllers/userController");

// Admin: list all users
router.get("/", protect, authorizeRoles("admin"), getUsers);

router.put("/:userId", protect, authorizeRoles("admin"), updateUser);

router.delete("/:userId", protect, authorizeRoles("admin"), deleteUser);

router.put("/restore/:userId", protect, authorizeRoles("admin"), restoreUser);

router.put(
  "/password/:userId",
  protect,
  authorizeRoles("admin"),
  changePassword
);

module.exports = router;
