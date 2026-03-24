const User = require("../models/User");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Notice = require("../models/Notice");

// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const [userCount, courseCount, noticeCount] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      Course.countDocuments({ isDeleted: { $ne: true } }),
      Notice.countDocuments({ isDeleted: { $ne: true } }),
    ]);
    const students = await User.countDocuments({ role: "student", isDeleted: { $ne: true } });
    const faculty = await User.countDocuments({ role: "faculty", isDeleted: { $ne: true } });

    res.json({
      users: userCount,
      students,
      faculty,
      courses: courseCount,
      notices: noticeCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Faculty Dashboard
exports.getFacultyDashboard = async (req, res) => {
  try {
    const facultyId = req.user._id;

    const courses = await Course.find({ faculty: facultyId });

    const courseIds = courses.map((course) => course._id);

    // Count unique students
    let studentSet = new Set();
    courses.forEach((course) => {
      course.students.forEach((student) => {
        studentSet.add(student.toString());
      });
    });

    const totalNotices = await Notice.countDocuments({ createdBy: facultyId });

    const totalAttendance = await Attendance.find({
      course: { $in: courseIds },
    });

    const presentCount = totalAttendance.filter(
      (record) => record.status === "present"
    ).length;

    const attendancePercentage =
      totalAttendance.length === 0
        ? 0
        : ((presentCount / totalAttendance.length) * 100).toFixed(2);

    res.json({
      totalCourses: courses.length,
      totalStudents: studentSet.size,
      totalNotices,
      attendancePercentage,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Student Dashboard
exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const courses = await Course.find({ students: studentId });

    const attendanceRecords = await Attendance.find({
      student: studentId,
    });

    const presentCount = attendanceRecords.filter(
      (record) => record.status === "present"
    ).length;

    const attendancePercentage =
      attendanceRecords.length === 0
        ? 0
        : ((presentCount / attendanceRecords.length) * 100).toFixed(2);

    const totalNotices = await Notice.countDocuments();

    const recentNotices = await Notice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt");

    res.json({
      enrolledCourses: courses.length,
      attendancePercentage,
      totalNotices,
      recentNotices,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
