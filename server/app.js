const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
// Stripe webhooks require the raw request body to verify signatures.
app.use(
  "/api/payments/stripe-webhook",
  express.raw({ type: "application/json" })
);
// Parse JSON for all other endpoints.
// (We must exclude the Stripe webhook route to keep req.body as raw Buffer.)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/stripe-webhook") return next();
  return express.json()(req, res, next);
});

// Static uploads (local file uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/", (req, res) => {
  res.send("LMS API Running...");
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

const courseRoutes = require("./routes/courseRoutes");
app.use("/api/courses", courseRoutes);

const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

const noticeRoutes = require("./routes/noticeRoutes");
app.use("/api/notices", noticeRoutes);

const dashboardStatsRoutes = require("./routes/dashboardStatsRoutes");
app.use("/api/dashboard-stats", dashboardStatsRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Advanced LMS modules (additive)
const materialRoutes = require("./routes/materialRoutes");
app.use("/api/materials", materialRoutes);

const lectureRoutes = require("./routes/lectureRoutes");
app.use("/api/lectures", lectureRoutes);

const assignmentRoutes = require("./routes/assignmentRoutes");
app.use("/api/assignments", assignmentRoutes);

const submissionRoutes = require("./routes/submissionRoutes");
app.use("/api/submissions", submissionRoutes);

const gradeRoutes = require("./routes/gradeRoutes");
app.use("/api/grades", gradeRoutes);

const forumRoutes = require("./routes/forumRoutes");
app.use("/api/forum", forumRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const certificateRoutes = require("./routes/certificateRoutes");
app.use("/api/certificates", certificateRoutes);

const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

const plagiarismRoutes = require("./routes/plagiarismRoutes");
app.use("/api/plagiarism", plagiarismRoutes);

const liveClassRoutes = require("./routes/liveClassRoutes");
app.use("/api/live-classes", liveClassRoutes);

const calendarRoutes = require("./routes/calendarRoutes");
app.use("/api/calendar", calendarRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

module.exports = app;
