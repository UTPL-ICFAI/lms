const Course = require("../models/Course");

// Create Course (Faculty creates own; Admin creates with assigned faculty)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, faculty: facultyId, price } = req.body;
    const isAdmin = req.user.role === "admin";
    const faculty = isAdmin && facultyId ? facultyId : req.user._id;

    if (isAdmin && !facultyId) {
      return res.status(400).json({ message: "Faculty must be assigned when admin creates a course" });
    }

    // Only admin can set price. Faculty-created courses are always free by default.
    let normalizedPrice = 0;
    if (isAdmin) {
      const parsed = price === undefined ? 0 : Number(price);
      if (Number.isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: "Invalid price. Price must be a non-negative number (INR)." });
      }
      normalizedPrice = parsed;
    }

    const course = await Course.create({
      title,
      description,
      faculty,
      price: normalizedPrice,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active courses (used by admin and for student browse)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: false });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active courses for students (same as above, but open to student role via route)
exports.getActiveCoursesForStudents = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: false }).populate(
      "faculty",
      "name email"
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single course with populated students (for faculty attendance etc.)
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      isDeleted: false,
    })
      .populate("students", "name email")
      .populate("faculty", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Courses (Faculty: Their Courses)
exports.getFacultyCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      faculty: req.user._id,
      isDeleted: false,
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Courses (Student: Enrolled Courses)
exports.getStudentCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      students: req.user._id,
      isDeleted: false,
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Enroll Student into Course (Faculty Only)
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Paid courses must be enrolled via the student payment flow + webhook.
    const priceInr = Number(course.price || 0);
    if (priceInr > 0) {
      return res
        .status(402)
        .json({ message: "Payment required for this course." });
    }

    // Prevent duplicate enrollment
    if (course.students.includes(studentId)) {
      return res.status(400).json({ message: "Student already enrolled" });
    }

    course.students.push(studentId);
    await course.save();

    res.json({ message: "Student enrolled successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Student self-enroll into a course
exports.selfEnrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // If this is a paid course, enforce payment first.
    const priceInr = Number(course.price || 0);
    if (priceInr > 0) {
      return res.status(402).json({ message: "Payment required for this course." });
    }

    if (course.students.includes(studentId)) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    course.students.push(studentId);
    await course.save();

    res.json({ message: "Enrolled successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//soft delete[for all]
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();

    res.json({ message: "Course deleted (soft)" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//restoring deleted things[5 sec rule]
exports.restoreCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: true,
    });

    if (!course || !course.isDeleted) {
      return res.status(400).json({ message: "Cannot restore" });
    }

    course.isDeleted = false;
    course.deletedAt = null;
    await course.save();

    res.json({ message: "Course restored" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//update the course and students under it
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, price } = req.body;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (title) course.title = title;
    if (description) course.description = description;

    // Only admin can update price (paid vs free).
    if (req.user.role === "admin" && price !== undefined) {
      const parsed = Number(price);
      if (Number.isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: "Invalid price. Price must be a non-negative number (INR)." });
      }
      course.price = parsed;
    }

    await course.save();

    res.json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//remove students from course
exports.removeStudentFromCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const course = await Course.findOne({
      _id: courseId,
      isDeleted: false,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.students = course.students.filter(
      (id) => id.toString() !== studentId
    );

    await course.save();

    res.json({ message: "Student removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//list deleted courses[admins only]
exports.getDeletedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: true });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
