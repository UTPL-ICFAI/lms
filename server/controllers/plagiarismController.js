const fs = require("fs");
const path = require("path");
const stringSimilarity = require("string-similarity");

const PlagiarismCheck = require("../models/PlagiarismCheck");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");

function tryReadLocalUpload(fileUrl) {
  try {
    const idx = fileUrl.indexOf("/uploads/");
    if (idx === -1) return null;
    const rel = fileUrl.slice(idx + "/uploads/".length);
    const abs = path.join(__dirname, "..", "uploads", rel);
    if (!fs.existsSync(abs)) return null;
    // Only read small-ish text files safely
    const stat = fs.statSync(abs);
    if (stat.size > 2 * 1024 * 1024) return null;
    const ext = path.extname(abs).toLowerCase();
    if (![".txt", ".md", ".js", ".json", ".csv"].includes(ext)) return null;
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

exports.checkSubmission = async (req, res) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) return res.status(400).json({ message: "submissionId is required" });

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const course = await Course.findById(assignment.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Access control: student can check their own submission; faculty can check submissions for their course; admin ok
    const isOwner = submission.student.toString() === req.user._id.toString();
    const isFacultyOwner = req.user.role === "faculty" && course.faculty.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isFacultyOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // If already checked, return cached result
    const existing = await PlagiarismCheck.findOne({ submission: submissionId });
    if (existing) return res.json(existing);

    const baseText = tryReadLocalUpload(submission.fileUrl) || "";
    const others = await Submission.find({
      assignment: submission.assignment,
      _id: { $ne: submissionId },
    }).select("fileUrl");

    let maxScore = 0;
    let comparedWithCount = 0;

    for (const other of others) {
      const otherText = tryReadLocalUpload(other.fileUrl);
      if (!otherText || !baseText) continue;
      comparedWithCount += 1;
      const score = stringSimilarity.compareTwoStrings(baseText, otherText) * 100;
      if (score > maxScore) maxScore = score;
    }

    // If we couldn't read any content, return 0 with comparedWithCount 0
    const result = await PlagiarismCheck.create({
      submission: submissionId,
      similarityScore: Math.round(maxScore),
      checkedAt: new Date(),
      comparedWithCount,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

