const LiveClass = require("../models/LiveClass");
const Course = require("../models/Course");
const { notifyUsers } = require("../utils/notify");

exports.createLiveClass = async (req, res) => {
  try {
    const { title, courseId, meetingLink, date, time } = req.body;
    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "faculty" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const live = await LiveClass.create({
      title,
      course: courseId,
      meetingLink,
      date,
      time,
      createdBy: req.user._id,
    });

    await notifyUsers(course.students || [], `Live class scheduled: ${title}`, "other");

    res.status(201).json(live);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getByCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await LiveClass.find({ course: id }).sort({ date: 1, time: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

