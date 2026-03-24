const Grade = require("../models/Grade");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const { notifyUsers } = require("../utils/notify");

exports.createGrade = async (req, res) => {
  try {
    const { assignmentId, studentId, score, feedback } = req.body;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const course = await Course.findOne({ _id: assignment.course, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "faculty" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const grade = await Grade.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      {
        score,
        feedback: feedback || "",
        gradedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    await notifyUsers(
      [studentId],
      `Grade released for assignment: ${assignment.title}`,
      "grade"
    );

    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getGradesForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const grades = await Grade.find({ student: studentId })
      .populate({
        path: "assignment",
        select: "title course dueDate",
        populate: { path: "course", select: "title" },
      })
      .sort({ createdAt: -1 });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

