const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
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
    score: { type: Number, required: true },
    feedback: { type: String, default: "" },
    evaluatedFileUrl: { type: String, default: "" },
    evaluatedFileName: { type: String, default: "" },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

gradeSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Grade", gradeSchema);
