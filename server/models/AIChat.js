const mongoose = require("mongoose");

const aiChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    text: { type: String, default: "" },
    citations: {
      type: [
        {
          chunkId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyChunk" },
          subject: String,
          chapter: String,
          topic: String,
          snippet: String,
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiChatSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    title: { type: String, default: "New chat" },
    mode: {
      type: String,
      enum: ["explainer", "clarifier", "quiz", "summarizer"],
      default: "explainer",
      index: true,
    },
    difficulty: { type: String, enum: ["beginner", "intermediate", "exam"], default: "beginner" },
    messages: { type: [aiChatMessageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIChat", aiChatSchema);

