const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  generateCertificate,
  getCertificatesForStudent,
} = require("../controllers/certificateController");

router.post(
  "/generate",
  protect,
  authorizeRoles("student", "admin"),
  generateCertificate
);

router.get(
  "/student/:id",
  protect,
  authorizeRoles("student", "admin"),
  getCertificatesForStudent
);

module.exports = router;
