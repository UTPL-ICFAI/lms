const Notice = require("../models/Notice");

// Faculty or Admin creates notice
exports.createNotice = async (req, res) => {
  try {
    const { title, description, courseId, targetRole } = req.body;

    const notice = await Notice.create({
      title,
      description,
      course: courseId || null,
      targetRole: targetRole || "both",
      createdBy: req.user._id,
    });

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Student or Faculty views notices (filtered by targetRole when role query present)
exports.getNotices = async (req, res) => {
  try {
    const { page = 1, courseId, keyword, role } = req.query;

    const limit = 30;
    const skip = (page - 1) * limit;

    let filter = { isDeleted: false };

    // Role-based visibility: show notice if targetRole is "both" or matches viewer role
    if (role === "student" || role === "faculty") {
      filter.$or = [
        { targetRole: "both" },
        { targetRole: role },
      ];
    }

    if (courseId) {
      filter.course = courseId;
    }

    if (keyword) {
      filter.title = { $regex: keyword, $options: "i" };
    }

    const notices = await Notice.find(filter)
      .populate("course", "title")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Notice.countDocuments(filter);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      notices,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//update notice[dont know purpose, but does something](need to study in future)
exports.updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { title, description, attachmentUrl } = req.body;

    const notice = await Notice.findOne({
      _id: noticeId,
      isDeleted: false,
    });

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    if (title) notice.title = title;
    if (description) notice.description = description;
    if (attachmentUrl !== undefined) notice.attachmentUrl = attachmentUrl;
    if (req.body.targetRole) notice.targetRole = req.body.targetRole;

    await notice.save();

    res.json({ message: "Notice updated", notice });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//soft delete notice
exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findOne({
      _id: noticeId,
      isDeleted: false,
    });

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    notice.isDeleted = true;
    notice.deletedAt = new Date();
    await notice.save();

    res.json({ message: "Notice deleted (soft)" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//restoring delted notice
exports.restoreNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;

    const notice = await Notice.findOne({
      _id: noticeId,
      isDeleted: true,
    });

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    notice.isDeleted = false;
    notice.deletedAt = null;
    await notice.save();

    res.json({ message: "Notice restored" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
