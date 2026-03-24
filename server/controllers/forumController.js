const ForumThread = require("../models/ForumThread");
const ForumReply = require("../models/ForumReply");
const Course = require("../models/Course");

exports.createThread = async (req, res) => {
  try {
    const { title, courseId } = req.body;
    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const thread = await ForumThread.create({
      title,
      course: courseId,
      createdBy: req.user._id,
    });
    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getThreadsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const threads = await ForumThread.find({ course: courseId })
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createReply = async (req, res) => {
  try {
    const { threadId, message } = req.body;
    const thread = await ForumThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const reply = await ForumReply.create({
      thread: threadId,
      user: req.user._id,
      message,
    });
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRepliesByThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const replies = await ForumReply.find({ thread: threadId })
      .populate("user", "name role")
      .sort({ createdAt: 1 });
    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

