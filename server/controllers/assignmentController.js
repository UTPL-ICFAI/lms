const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const { notifyUsers } = require("../utils/notify");

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, dueDate, attachmentUrl } = req.body;

    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Faculty should only create for their own courses (admin may create too)
    if (req.user.role === "faculty" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const finalAttachmentUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : (attachmentUrl || "");

    const assignment = await Assignment.create({
      title,
      description: description || "",
      course: courseId,
      dueDate: new Date(dueDate),
      createdBy: req.user._id,
      attachmentUrl: finalAttachmentUrl,
    });

    await notifyUsers(
      course.students || [],
      `New assignment in ${course.title}: ${title}`,
      "assignment"
    );

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({
      course: courseId,
      isDeleted: false,
    })
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

