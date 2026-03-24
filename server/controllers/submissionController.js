const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");

exports.createSubmission = async (req, res) => {
  try {
    const { assignmentId, fileUrl } = req.body;
    const studentId = req.user._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const course = await Course.findOne({ _id: assignment.course, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Student must be enrolled
    if (!course.students.map(String).includes(studentId.toString())) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    const finalUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : fileUrl;

    if (!finalUrl) {
      return res.status(400).json({ message: "fileUrl or file upload is required" });
    }

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      { fileUrl: finalUrl },
      { upsert: true, new: true }
    );

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const course = await Course.findOne({ _id: assignment.course, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Faculty can only view submissions for their courses; admin can view all
    if (req.user.role === "faculty" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student", "name email role")
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

