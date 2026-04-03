const mongoose = require("mongoose");

const submissionVersionSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, default: "" },
    textContent: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: { type: String, default: "" },
    textContent: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    lastSubmittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "resubmitted", "graded", "late_submission"],
      default: "submitted",
    },
    isLate: { type: Boolean, default: false },
    versions: [submissionVersionSchema],
    versionCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
