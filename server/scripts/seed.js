const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Course = require("../models/Course");
const Notice = require("../models/Notice");
const Assignment = require("../models/Assignment");

dotenv.config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function upsertUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return User.create({ name, email, password: hashedPassword, role });
}

async function main() {
  const mongoUri = requireEnv("MONGO_URI");
  await mongoose.connect(mongoUri);

  const admin = await upsertUser({
    name: "Admin",
    email: "admin@lms.com",
    password: "admin123",
    role: "admin",
  });

  const faculty = await upsertUser({
    name: "Faculty",
    email: "faculty@lms.com",
    password: "faculty123",
    role: "faculty",
  });

  const student = await upsertUser({
    name: "Student",
    email: "student@lms.com",
    password: "student123",
    role: "student",
  });

  // Create a couple of demo courses if they don't exist
  const ds =
    (await Course.findOne({ title: "Data Structures", isDeleted: false })) ||
    (await Course.create({
      title: "Data Structures",
      description: "Introduction to arrays, linked lists, stacks, queues, trees.",
      faculty: faculty._id,
      students: [student._id],
      price: 0,
    }));

  const dbms =
    (await Course.findOne({ title: "DBMS", isDeleted: false })) ||
    (await Course.create({
      title: "DBMS",
      description: "Relational model, SQL, normalization, indexing.",
      faculty: faculty._id,
      students: [student._id],
      price: 499,
    }));

  // Notices (role targeted)
  const noticeCount = await Notice.countDocuments({ isDeleted: false });
  if (noticeCount === 0) {
    await Notice.create([
      {
        title: "Welcome to LMS",
        description: "Your portal is live. Check courses, notices, and assignments.",
        targetRole: "both",
        course: null,
        createdBy: admin._id,
      },
      {
        title: "DBMS paid course",
        description: "DBMS course is marked as paid for demo. Students can pay & enroll.",
        targetRole: "student",
        course: dbms._id,
        createdBy: admin._id,
      },
    ]);
  }

  // Assignments (demo)
  const assignmentCount = await Assignment.countDocuments({ isDeleted: false });
  if (assignmentCount === 0) {
    const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Assignment.create([
      {
        title: "DS - Arrays Basics",
        description: "Solve 5 array problems and upload answers.",
        course: ds._id,
        dueDate: due,
        allowLateSubmission: true,
        allowResubmission: true,
        createdBy: faculty._id,
        attachmentUrl: "",
      },
      {
        title: "DBMS - Normalization",
        description: "Explain 1NF/2NF/3NF with examples.",
        course: dbms._id,
        dueDate: due,
        allowLateSubmission: false,
        allowResubmission: true,
        createdBy: faculty._id,
        attachmentUrl: "",
      },
    ]);
  }

  console.log("✅ Seed complete");
  console.log("Admin:", "admin@lms.com / admin123");
  console.log("Faculty:", "faculty@lms.com / faculty123");
  console.log("Student:", "student@lms.com / student123");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

