const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Grade = require("../models/Grade");

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".txt",
  ".zip",
  ".ppt",
  ".pptx",
];

function getExt(name = "") {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function getSubmissionStatus({ isLate, isResubmission, graded }) {
  if (graded) return "graded";
  if (isLate) return "late_submission";
  return isResubmission ? "resubmitted" : "submitted";
}

exports.createSubmission = async (req, res) => {
  try {
    const { assignmentId, fileUrl, textContent } = req.body;
    const studentId = req.user._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const course = await Course.findOne({ _id: assignment.course, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Student must be enrolled
    if (!course.students.map(String).includes(studentId.toString())) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    const now = new Date();
    const deadline = assignment?.dueDate ? new Date(assignment.dueDate) : null;
    const pastDeadline = deadline ? now > deadline : false;
    if (pastDeadline && !assignment.allowLateSubmission) {
      return res.status(400).json({ message: "Deadline passed. Late submission is not allowed." });
    }

    const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });
    const grade = await Grade.findOne({ assignment: assignmentId, student: studentId });
    const isGraded = Boolean(grade);

    if (isGraded) {
      return res.status(400).json({ message: "Submission is graded and locked." });
    }

    if (existing && assignment.allowResubmission === false) {
      return res.status(400).json({ message: "Resubmission is not allowed for this assignment." });
    }

    if (req.file) {
      const ext = getExt(req.file.originalname || "");
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ message: "Unsupported file type." });
      }
      if ((req.file.size || 0) > MAX_FILE_SIZE) {
        return res.status(400).json({ message: "File too large. Max 50MB." });
      }
    }

    const finalUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : fileUrl;

    if (!finalUrl && !textContent) {
      return res.status(400).json({ message: "fileUrl, file upload, or text content is required" });
    }

    const incomingName = req.file?.originalname || "";
    const incomingSize = req.file?.size || 0;
    const incomingText = textContent || "";

    if (existing) {
      const sameFile = (existing.fileUrl || "") === (finalUrl || "");
      const sameText = (existing.textContent || "") === incomingText;
      if (sameFile && sameText) {
        return res.status(400).json({ message: "No changes detected. Please update content before resubmitting." });
      }
    }

    const versionEntry = {
      fileUrl: finalUrl || "",
      textContent: incomingText,
      fileName: incomingName,
      fileSize: incomingSize,
      submittedAt: now,
    };

    let submission;
    if (!existing) {
      submission = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        fileUrl: versionEntry.fileUrl,
        textContent: versionEntry.textContent,
        fileName: versionEntry.fileName,
        fileSize: versionEntry.fileSize,
        submittedAt: now,
        lastSubmittedAt: now,
        isLate: pastDeadline,
        status: getSubmissionStatus({
          isLate: pastDeadline,
          isResubmission: false,
          graded: false,
        }),
        versions: [versionEntry],
        versionCount: 1,
      });
    } else {
      existing.fileUrl = versionEntry.fileUrl;
      existing.textContent = versionEntry.textContent;
      existing.fileName = versionEntry.fileName;
      existing.fileSize = versionEntry.fileSize;
      existing.lastSubmittedAt = now;
      existing.isLate = pastDeadline;
      existing.status = getSubmissionStatus({
        isLate: pastDeadline,
        isResubmission: true,
        graded: false,
      });
      existing.versions.push(versionEntry);
      existing.versionCount = existing.versions.length;
      submission = await existing.save();
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const course = await Course.findOne({ _id: assignment.course, isDeleted: false });
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Faculty can only view submissions for their courses; admin can view all
    if (req.user.role === "faculty" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student", "name email role")
      .sort({ createdAt: -1 });

    const studentIds = submissions.map((s) => s.student?._id).filter(Boolean);
    const grades = await Grade.find({
      assignment: assignmentId,
      student: { $in: studentIds },
    });
    const gradeMap = new Map(grades.map((g) => [g.student.toString(), g]));

    const merged = submissions.map((s) => {
      const grade = gradeMap.get(s.student?._id?.toString());
      return {
        ...s.toObject(),
        status: grade ? "graded" : s.status,
        grade: grade
          ? {
              score: grade.score,
              feedback: grade.feedback,
              gradedAt: grade.updatedAt,
              evaluatedFileUrl: grade.evaluatedFileUrl || "",
              evaluatedFileName: grade.evaluatedFileName || "",
            }
          : null,
      };
    });

    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMySubmissionForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });
    const grade = await Grade.findOne({ assignment: assignmentId, student: studentId });

    const now = new Date();
    const deadline = assignment?.dueDate ? new Date(assignment.dueDate) : null;
    const pastDeadline = deadline ? now > deadline : false;

    const canEdit =
      Boolean(submission) &&
      !grade &&
      (!pastDeadline || assignment.allowLateSubmission) &&
      assignment.allowResubmission !== false;
    const canDelete = Boolean(submission) && !grade && !pastDeadline;

    res.json({
      assignmentId,
      submission: submission
        ? { ...submission.toObject(), status: grade ? "graded" : submission.status }
        : null,
      grade: grade
        ? {
            score: grade.score,
            feedback: grade.feedback,
            gradedAt: grade.updatedAt,
            evaluatedFileUrl: grade.evaluatedFileUrl || "",
            evaluatedFileName: grade.evaluatedFileName || "",
          }
        : null,
      rules: {
        dueDate: assignment.dueDate,
        allowLateSubmission: assignment.allowLateSubmission,
        allowResubmission: assignment.allowResubmission,
        canEdit,
        canDelete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteMySubmissionForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    const assignment = await Assignment.findOne({ _id: assignmentId, isDeleted: false });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const grade = await Grade.findOne({ assignment: assignmentId, student: studentId });
    if (grade) return res.status(400).json({ message: "Cannot delete after grading." });

    const now = new Date();
    const deadline = assignment?.dueDate ? new Date(assignment.dueDate) : null;
    const pastDeadline = deadline ? now > deadline : false;
    if (pastDeadline) {
      return res.status(400).json({ message: "Cannot delete after deadline." });
    }

    await Submission.deleteOne({ _id: submission._id });
    res.json({ message: "Submission deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

