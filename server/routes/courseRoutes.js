const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getAllCourses,
  getActiveCoursesForStudents,
  getCourseById,
  createCourse,
  getFacultyCourses,
  getStudentCourses,
  enrollStudent,
  selfEnrollInCourse,
  deleteCourse,
  restoreCourse,
  updateCourse,
  removeStudentFromCourse,
  getDeletedCourses,
} = require("../controllers/courseController");

// Admin: all courses
router.get("/", protect, authorizeRoles("admin"), getAllCourses);

// Student browse: all active courses
router.get(
  "/active",
  protect,
  authorizeRoles("student", "faculty", "admin"),
  getActiveCoursesForStudents
);

// Faculty and Admin create courses (must be before /:courseId)
router.post("/", protect, authorizeRoles("faculty", "admin"), createCourse);
router.get("/faculty", protect, authorizeRoles("faculty"), getFacultyCourses);

// Student routes
router.get("/student", protect, authorizeRoles("student"), getStudentCourses);

// Single course with populated students (faculty/admin)
router.get("/:courseId", protect, authorizeRoles("faculty", "admin"), getCourseById);

// Faculty enrolls specific student
router.post(
  "/:courseId/enroll",
  protect,
  authorizeRoles("faculty"),
  enrollStudent
);

// Student self-enroll
router.post(
  "/:courseId/enroll-self",
  protect,
  authorizeRoles("student"),
  selfEnrollInCourse
);

//delete
router.delete(
  "/:courseId",
  protect,
  authorizeRoles("faculty", "admin"),
  deleteCourse
);

// undo to restore data
router.put(
  "/restore/:courseId",
  protect,
  authorizeRoles("faculty", "admin"),
  restoreCourse
);

//update
router.put(
  "/:courseId",
  protect,
  authorizeRoles("faculty", "admin"),
  updateCourse
);

//removing students from course
router.delete(
  "/:courseId/student/:studentId",
  protect,
  authorizeRoles("faculty", "admin"),
  removeStudentFromCourse
);

//list deleted courses[admins only]
router.get("/deleted/all", protect, authorizeRoles("admin"), getDeletedCourses);

module.exports = router;
