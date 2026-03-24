const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const {
  createMaterial,
  getMaterialsByCourse,
  deleteMaterial,
} = require("../controllers/materialController");

router.post(
  "/upload",
  protect,
  authorizeRoles("faculty", "admin"),
  upload.single("file"),
  createMaterial
);
router.get("/course/:courseId", protect, getMaterialsByCourse);
router.delete("/:id", protect, authorizeRoles("faculty", "admin"), deleteMaterial);

module.exports = router;
