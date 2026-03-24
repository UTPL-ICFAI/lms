const mongoose = require("mongoose");

const plagiarismCheckSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
      unique: true,
    },
    similarityScore: { type: Number, required: true }, // 0-100
    checkedAt: { type: Date, required: true },
    comparedWithCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlagiarismCheck", plagiarismCheckSchema);
