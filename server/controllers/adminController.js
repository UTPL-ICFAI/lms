const User = require("../models/User");
const Course = require("../models/Course");

// Admin creates user (student/faculty)
const bcrypt = require("bcryptjs");

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!["faculty", "student", "admin", "parent"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Assign student to course
exports.assignStudentToCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
      await course.save();
    }

    res.json({ message: "Student assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
