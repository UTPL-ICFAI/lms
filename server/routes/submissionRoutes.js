const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const {
  createSubmission,
  getSubmissionsByAssignment,
} = require("../controllers/submissionController");

router.post(
  "/",
  protect,
  authorizeRoles("student"),
  upload.single("file"),
  createSubmission
);
router.get(
  "/assignment/:assignmentId",
  protect,
  authorizeRoles("faculty", "admin"),
  getSubmissionsByAssignment
);

module.exports = router;
