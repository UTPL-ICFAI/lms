const VideoLecture = require("../models/VideoLecture");
const Course = require("../models/Course");
const { notifyUsers } = require("../utils/notify");

exports.createLecture = async (req, res) => {
  try {
    const { title, description, courseId, videoUrl } = req.body;

    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const finalUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : videoUrl;

    if (!finalUrl) {
      return res.status(400).json({ message: "videoUrl or file upload is required" });
    }

    const lecture = await VideoLecture.create({
      title,
      description: description || "",
      course: courseId,
      videoUrl: finalUrl,
      uploadedBy: req.user._id,
    });

    await notifyUsers(
      course.students || [],
      `New lecture added in ${course.title}: ${title}`,
      "lecture"
    );

    res.status(201).json(lecture);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getLecturesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lectures = await VideoLecture.find({
      course: courseId,
      isDeleted: false,
    })
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const lecture = await VideoLecture.findOne({ _id: id, isDeleted: false });
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });

    const isOwner = lecture.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    lecture.isDeleted = true;
    lecture.deletedAt = new Date();
    await lecture.save();

    res.json({ message: "Lecture deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

