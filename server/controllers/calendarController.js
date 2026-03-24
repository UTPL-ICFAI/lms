const CalendarEvent = require("../models/CalendarEvent");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const LiveClass = require("../models/LiveClass");

exports.createEvent = async (req, res) => {
  try {
    const { courseId, title, date, time, type } = req.body;
    const course = await Course.findOne({ _id: courseId, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "faculty" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const ev = await CalendarEvent.create({
      course: courseId,
      title,
      date,
      time: time || "",
      type: type || "other",
      createdBy: req.user._id,
    });
    res.status(201).json(ev);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getForUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === "student" && req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Determine courses relevant to user
    let courses = [];
    if (req.user.role === "admin") {
      courses = await Course.find({ isDeleted: false }).select("_id title");
    } else if (req.user.role === "faculty") {
      courses = await Course.find({ faculty: id, isDeleted: false }).select("_id title");
    } else {
      courses = await Course.find({ students: id, isDeleted: false }).select("_id title");
    }
    const courseIds = courses.map((c) => c._id);

    const [manualEvents, assignments, lives] = await Promise.all([
      CalendarEvent.find({ course: { $in: courseIds } }).sort({ date: 1, time: 1 }),
      Assignment.find({ course: { $in: courseIds }, isDeleted: false }).select("title dueDate course"),
      LiveClass.find({ course: { $in: courseIds } }).select("title date time course meetingLink"),
    ]);

    const derived = [];
    for (const a of assignments) {
      const d = a.dueDate ? new Date(a.dueDate) : null;
      if (!d) continue;
      derived.push({
        _id: `assignment_${a._id}`,
        course: a.course,
        title: `Due: ${a.title}`,
        date: d.toISOString().slice(0, 10),
        time: "",
        type: "assignment",
        derived: true,
      });
    }
    for (const l of lives) {
      derived.push({
        _id: `live_${l._id}`,
        course: l.course,
        title: `Live: ${l.title}`,
        date: l.date,
        time: l.time,
        type: "live",
        meetingLink: l.meetingLink,
        derived: true,
      });
    }

    res.json({
      courses,
      events: [...manualEvents, ...derived].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

