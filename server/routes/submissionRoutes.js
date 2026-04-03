const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const {
  createSubmission,
  getSubmissionsByAssignment,
  getMySubmissionForAssignment,
  deleteMySubmissionForAssignment,
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
router.get(
  "/my/:assignmentId",
  protect,
  authorizeRoles("student"),
  getMySubmissionForAssignment
);
router.delete(
  "/my/:assignmentId",
  protect,
  authorizeRoles("student"),
  deleteMySubmissionForAssignment
);

module.exports = router;
