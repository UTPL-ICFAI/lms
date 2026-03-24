const Attendance = require("../models/Attendance");
const Course = require("../models/Course");

// Faculty marks attendance
exports.markAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, timeSlot, records } = req.body;

    const attendanceDate = new Date(date);

    const course = await Course.findById(courseId).populate("students");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    for (let record of records) {
      await Attendance.findOneAndUpdate(
        {
          student: record.studentId,
          course: courseId,
          date: attendanceDate,
          timeSlot,
        },
        {
          status: record.status,
        },
        {
          upsert: true, // update if exists, create if not
          new: true,
        }
      );
    }

    res.json({ message: "Attendance saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Student views attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      student: req.user._id,
    }).populate("course", "title");

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//Course-Specific Attendance View
exports.getCourseAttendanceForStudent = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attendance = await Attendance.find({
      student: req.user._id,
      course: courseId,
    }).sort({ date: -1 });

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "present").length;

    const percentage = total === 0 ? 0 : ((present / total) * 100).toFixed(2);

    res.json({
      totalClasses: total,
      present,
      absent: total - present,
      percentage,
      records: attendance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
