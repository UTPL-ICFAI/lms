const Doubt = require("../models/Doubt");
const Course = require("../models/Course");
const { notifyUsers } = require("../utils/notify");

function canFacultyAccessCourse(reqUser, course) {
  if (!reqUser) return false;
  if (reqUser.role === "admin") return true;
  if (reqUser.role !== "faculty") return false;
  return course?.faculty?.toString() === reqUser._id.toString();
}

// POST /api/doubts
exports.createDoubt = async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    const studentId = req.user._id;

    if (!title || !description || !courseId) {
      return res.status(400).json({ message: "title, description, and courseId are required" });
    }

    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Must be enrolled
    if (!course.students.map(String).includes(studentId.toString())) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    const doubt = await Doubt.create({
      studentId,
      courseId,
      title,
      description,
      status: "Pending",
    });

    // Notify course faculty that a doubt was raised
    if (course.faculty) {
      await notifyUsers(
        [course.faculty],
        `New doubt in ${course.title}: ${title}`,
        "doubt"
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`course:${courseId}`).emit("doubt:created", { doubtId: doubt._id, courseId });
      io.to(`user:${studentId.toString()}`).emit("doubt:created", { doubtId: doubt._id, courseId });
      if (course.faculty) io.to(`user:${course.faculty.toString()}`).emit("doubt:created", { doubtId: doubt._id, courseId });
    }

    res.status(201).json(doubt);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/doubts/student/:id
exports.getDoubtsByStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (requester.role === "student" && requester._id.toString() !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const doubts = await Doubt.find({ studentId: id })
      .populate("courseId", "title")
      .populate("respondedBy", "name role")
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/doubts/course/:id  (faculty/admin view)
exports.getDoubtsByCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!canFacultyAccessCourse(req.user, course)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const doubts = await Doubt.find({ courseId })
      .populate("studentId", "name email role")
      .populate("courseId", "title")
      .populate("respondedBy", "name role")
      .sort({ createdAt: -1 });

    res.json(doubts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/doubts/:id/respond
exports.respondToDoubt = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response) return res.status(400).json({ message: "response is required" });

    const doubt = await Doubt.findById(id);
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    const course = await Course.findOne({ _id: doubt.courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!canFacultyAccessCourse(req.user, course)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    doubt.response = response;
    doubt.respondedBy = req.user._id;
    doubt.respondedAt = new Date();
    // keep status as-is; faculty can separately resolve
    await doubt.save();

    await notifyUsers(
      [doubt.studentId],
      `Faculty replied to your doubt: ${doubt.title}`,
      "doubt"
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`course:${doubt.courseId.toString()}`).emit("doubt:responded", {
        doubtId: doubt._id,
        courseId: doubt.courseId,
      });
      io.to(`user:${doubt.studentId.toString()}`).emit("doubt:responded", {
        doubtId: doubt._id,
        courseId: doubt.courseId,
      });
    }

    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/doubts/:id/status
exports.updateDoubtStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Pending", "Resolved"].includes(status)) {
      return res.status(400).json({ message: "status must be Pending or Resolved" });
    }

    const doubt = await Doubt.findById(id);
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    const course = await Course.findOne({ _id: doubt.courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!canFacultyAccessCourse(req.user, course)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    doubt.status = status;
    await doubt.save();

    if (status === "Resolved") {
      await notifyUsers(
        [doubt.studentId],
        `Your doubt was marked resolved: ${doubt.title}`,
        "doubt"
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`course:${doubt.courseId.toString()}`).emit("doubt:status", {
        doubtId: doubt._id,
        courseId: doubt.courseId,
        status,
      });
      io.to(`user:${doubt.studentId.toString()}`).emit("doubt:status", {
        doubtId: doubt._id,
        courseId: doubt.courseId,
        status,
      });
    }

    res.json(doubt);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/doubts/:id (student deletes their own doubt)
exports.deleteDoubt = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    const doubt = await Doubt.findById(id);
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    // Student can delete only their own doubt. Admin can delete any.
    const isOwner = doubt.studentId.toString() === requester._id.toString();
    if (requester.role === "student" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Students can delete only while the doubt is Pending.
    if (requester.role === "student" && doubt.status !== "Pending") {
      return res.status(400).json({ message: "Only pending doubts can be deleted." });
    }

    const courseId = doubt.courseId.toString();
    const studentId = doubt.studentId.toString();

    await Doubt.deleteOne({ _id: id });

    const io = req.app.get("io");
    if (io) {
      io.to(`course:${courseId}`).emit("doubt:deleted", { doubtId: id, courseId });
      io.to(`user:${studentId}`).emit("doubt:deleted", { doubtId: id, courseId });
    }

    res.json({ message: "Doubt deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

