const mongoose = require("mongoose");

// Stores vectorized chunks of extracted study materials for RAG retrieval.
// Embedding is stored as a numeric array; for Atlas Vector Search create an index on `embedding`.
const studyChunkSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseMaterial", default: null, index: true },

    subject: { type: String, default: "", trim: true, index: true },
    chapter: { type: String, default: "", trim: true, index: true },
    topic: { type: String, default: "", trim: true, index: true },

    content: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },

    // Embedding vector (e.g., OpenAI text-embedding-3-small: 1536 dims)
    embedding: { type: [Number], default: undefined },
    embeddingModel: { type: String, default: "" },

    metadata: {
      sourceFileName: { type: String, default: "" },
      sourceFileType: { type: String, default: "" },
      chunkIndex: { type: Number, default: 0 },
      charStart: { type: Number, default: 0 },
      charEnd: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

studyChunkSchema.index({ ownerUserId: 1, contentHash: 1 }, { unique: true });

module.exports = mongoose.model("StudyChunk", studyChunkSchema);

