const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const Certificate = require("../models/Certificate");
const Course = require("../models/Course");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeCertificateId() {
  return `CERT-${Date.now()}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

async function hasSubmittedAllAssignments(studentId, courseId) {
  const assignments = await Assignment.find({ course: courseId, isDeleted: false }).select("_id");
  if (assignments.length === 0) return true; // no assignments => consider complete
  const ids = assignments.map((a) => a._id);
  const submissions = await Submission.find({ student: studentId, assignment: { $in: ids } }).select("assignment");
  const submitted = new Set(submissions.map((s) => s.assignment.toString()));
  return ids.every((id) => submitted.has(id.toString()));
}

exports.generateCertificate = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    const isAdmin = req.user.role === "admin";
    const effectiveStudentId = isAdmin && studentId ? studentId : req.user._id;

    // Only admin or the student themselves can generate
    if (!isAdmin && req.user._id.toString() !== effectiveStudentId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [course, student] = await Promise.all([
      Course.findOne({ _id: courseId, isDeleted: false }),
      User.findById(effectiveStudentId),
    ]);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Must be enrolled
    if (!course.students.map(String).includes(effectiveStudentId.toString())) {
      return res.status(403).json({ message: "Student is not enrolled in this course" });
    }

    // Completion rule (minimal): all assignments submitted
    const ok = await hasSubmittedAllAssignments(effectiveStudentId, courseId);
    if (!ok) {
      return res.status(400).json({ message: "Course not completed (assignments pending)" });
    }

    // If already exists, return it
    const existing = await Certificate.findOne({ student: effectiveStudentId, course: courseId });
    if (existing?.pdfUrl) return res.json(existing);

    const certificateId = existing?.certificateId || makeCertificateId();
    const completionDate = new Date();

    const outDir = path.join(__dirname, "..", "uploads", "certificates");
    ensureDir(outDir);
    const filename = `${certificateId}.pdf`;
    const outPath = path.join(outDir, filename);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(fs.createWriteStream(outPath));

    doc.fontSize(26).text("Certificate of Completion", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(14).text("This certifies that", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(22).text(student.name, { align: "center" });
    doc.moveDown(0.8);
    doc.fontSize(14).text("has successfully completed", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).text(course.title, { align: "center" });
    doc.moveDown(1.2);
    doc.fontSize(12).text(`Completion Date: ${completionDate.toDateString()}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Certificate ID: ${certificateId}`, { align: "center" });
    doc.end();

    const pdfUrl = `${req.protocol}://${req.get("host")}/uploads/certificates/${filename}`;

    const cert =
      existing ||
      (await Certificate.create({
        certificateId,
        student: effectiveStudentId,
        course: courseId,
        studentName: student.name,
        courseTitle: course.title,
        completionDate,
        pdfUrl,
      }));

    if (existing) {
      existing.studentName = student.name;
      existing.courseTitle = course.title;
      existing.completionDate = completionDate;
      existing.pdfUrl = pdfUrl;
      await existing.save();
      return res.json(existing);
    }

    res.status(201).json(cert);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCertificatesForStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === "student" && req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const certs = await Certificate.find({ student: id }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

