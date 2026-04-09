const Course = require("../models/Course");
const CourseMaterial = require("../models/CourseMaterial");
const StudyChunk = require("../models/StudyChunk");
const AIChat = require("../models/AIChat");

const { extractTextFromUpload } = require("../services/rag/textExtract");
const { chunkText, hashContent } = require("../services/rag/chunk");
const { embedTexts } = require("../services/rag/embed");

function clampK(k, def = 6) {
  const n = Number(k || def);
  return Math.max(1, Math.min(12, Number.isFinite(n) ? n : def));
}

async function assertCourseAccess({ user, courseId }) {
  if (!courseId) return null;
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) throw new Error("Course not found");

  if (user.role === "admin") return course;
  if (user.role === "faculty" && course.faculty?.toString() === user._id.toString()) return course;
  if (user.role === "student" && course.students?.some((id) => id.toString() === user._id.toString()))
    return course;

  throw new Error("Forbidden");
}

function buildAgentSystemPrompt({ mode, difficulty }) {
  const difficultyHint =
    difficulty === "exam"
      ? "Use exam-focused language, key points, and short mnemonics when appropriate."
      : difficulty === "intermediate"
        ? "Assume basic familiarity; go deeper with examples and pitfalls."
        : "Explain simply with definitions and a small example.";

  const baseRules = [
    "You MUST answer strictly using ONLY the provided CONTEXT snippets.",
    "If the answer is not in the context, say: \"No relevant content found in your materials.\"",
    "Do NOT use outside knowledge.",
    "Include a short list of citations referencing the provided snippets (by [S1], [S2], ...).",
    "Be concise and accurate.",
  ].join("\n");

  const modePrompt =
    mode === "quiz"
      ? "Generate 5 MCQs (with answers) and 2 short-answer questions based ONLY on the context."
      : mode === "summarizer"
        ? "Summarize the topic based ONLY on the context. Provide bullet points."
        : mode === "clarifier"
          ? "If the question is unclear, ask up to 2 clarifying questions BEFORE answering. Use context to guide what to ask."
          : "Explain step-by-step using ONLY the context and include one small example if possible.";

  return `${baseRules}\n\n${difficultyHint}\n\nTask:\n${modePrompt}`;
}

function buildContextBlock(chunks) {
  return chunks
    .map((c, i) => {
      const tag = `S${i + 1}`;
      const header = [
        `[${tag}]`,
        c.subject ? `Subject: ${c.subject}` : null,
        c.chapter ? `Chapter: ${c.chapter}` : null,
        c.topic ? `Topic: ${c.topic}` : null,
        c.metadata?.sourceFileName ? `File: ${c.metadata.sourceFileName}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      return `${header}\n${c.content}`;
    })
    .join("\n\n---\n\n");
}

async function callLLM({ system, user }) {
  // Reuse existing provider selection (OpenAI preferred, then Anthropic)
  // For strict grounding, the system prompt enforces constraints.
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${text}`);
    }
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || "";
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 700,
        temperature: 0.2,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${text}`);
    }
    const data = await response.json();
    return data?.content?.[0]?.text?.trim() || "";
  }

  return "";
}

async function retrieveChunks({ ownerUserId, courseId, query, topK }) {
  const k = clampK(topK, 6);

  const { vectors, model } = await embedTexts([query]);
  const queryVector = vectors?.[0] || null;

  const match = {
    ownerUserId,
  };
  if (courseId) match.courseId = courseId;

  // Prefer Atlas Vector Search when configured.
  const indexName = process.env.MONGO_VECTOR_SEARCH_INDEX;
  if (indexName && Array.isArray(queryVector)) {
    const results = await StudyChunk.aggregate([
      {
        $vectorSearch: {
          index: indexName,
          path: "embedding",
          queryVector,
          numCandidates: 80,
          limit: k,
          filter: match,
        },
      },
      {
        $project: {
          content: 1,
          subject: 1,
          chapter: 1,
          topic: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
    return { chunks: results || [], embeddingModel: model };
  }

  // Fallback: text contains match (case-insensitive). This is less accurate but works without vectors.
  const q = String(query || "").trim();
  if (!q) return { chunks: [], embeddingModel: model };
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const results = await StudyChunk.find({ ...match, content: regex })
    .sort({ createdAt: -1 })
    .limit(k)
    .lean();
  return { chunks: results || [], embeddingModel: model };
}

exports.ingestMaterial = async (req, res) => {
  try {
    const user = req.user;
    const { courseId, subject = "", chapter = "", topic = "", title, description } = req.body;

    await assertCourseAccess({ user, courseId });

    if (!req.file) return res.status(400).json({ message: "file is required" });

    const { text, kind } = await extractTextFromUpload({
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || "",
    });

    if (!text) {
      return res.status(400).json({ message: "Could not extract text from this file type" });
    }

    // Store the original material record for LMS modules
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const material = await CourseMaterial.create({
      title: title || req.file.originalname,
      description: description || "",
      course: courseId,
      uploadedBy: user._id,
      fileUrl,
      fileType: kind === "pptx" ? "ppt" : kind,
    });

    const chunks = chunkText(text, {
      minWords: Number(process.env.RAG_CHUNK_MIN_WORDS || 220),
      maxWords: Number(process.env.RAG_CHUNK_MAX_WORDS || 420),
    });

    const contents = chunks.map((c) => c.content);
    const { vectors, model } = await embedTexts(contents);

    const docs = chunks.map((c, i) => {
      const contentHash = hashContent(`${user._id}:${courseId}:${material._id}:${i}:${c.content}`);
      const embedding = Array.isArray(vectors?.[i]) ? vectors[i] : undefined;
      return {
        ownerUserId: user._id,
        courseId,
        materialId: material._id,
        subject,
        chapter,
        topic,
        content: c.content,
        contentHash,
        embedding,
        embeddingModel: model || "",
        metadata: {
          sourceFileName: req.file.originalname || "",
          sourceFileType: kind || "",
          chunkIndex: i,
          charStart: c.charStart || 0,
          charEnd: c.charEnd || 0,
        },
      };
    });

    // Upsert per unique contentHash to avoid duplicates on re-upload.
    const inserted = [];
    for (const d of docs) {
      try {
        const created = await StudyChunk.create(d);
        inserted.push(created._id);
      } catch (e) {
        // ignore duplicates
      }
    }

    return res.status(201).json({
      message: "Material ingested",
      materialId: material._id,
      chunksCreated: inserted.length,
      embeddingModel: model || null,
    });
  } catch (error) {
    const msg = error?.message === "Forbidden" ? "Forbidden" : error?.message;
    const code = msg === "Forbidden" ? 403 : msg === "Course not found" ? 404 : 500;
    return res.status(code).json({ message: msg || "Server error" });
  }
};

exports.chatRag = async (req, res) => {
  try {
    const user = req.user;
    const { message, courseId = null, mode = "explainer", difficulty = "beginner", topK, chatId } =
      req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    if (courseId) await assertCourseAccess({ user, courseId });

    const { chunks } = await retrieveChunks({
      ownerUserId: user._id,
      courseId,
      query: String(message),
      topK,
    });

    if (!chunks.length) {
      return res.json({
        answer: "No relevant content found in your materials.",
        citations: [],
      });
    }

    const context = buildContextBlock(chunks);
    const system = buildAgentSystemPrompt({ mode, difficulty });
    const userPrompt = `CONTEXT:\n${context}\n\nQUESTION:\n${message}\n\nAnswer with citations like [S1], [S2].`;

    const answer = await callLLM({ system, user: userPrompt });
    const citations = chunks.slice(0, 6).map((c, i) => {
      const snippet = String(c.content || "").slice(0, 320);
      return {
        tag: `S${i + 1}`,
        chunkId: c._id,
        subject: c.subject || "",
        chapter: c.chapter || "",
        topic: c.topic || "",
        snippet,
      };
    });

    // Store chat history (optional)
    let chat = null;
    if (chatId) {
      chat = await AIChat.findOne({ _id: chatId, ownerUserId: user._id });
    }
    if (!chat) {
      chat = await AIChat.create({
        ownerUserId: user._id,
        courseId,
        title: String(message).slice(0, 40) || "New chat",
        mode,
        difficulty,
        messages: [],
      });
    }
    chat.mode = mode;
    chat.difficulty = difficulty;
    chat.messages.push({ role: "user", text: String(message) });
    chat.messages.push({
      role: "assistant",
      text: answer || "No relevant content found in your materials.",
      citations: citations.map((c) => ({
        chunkId: c.chunkId,
        subject: c.subject,
        chapter: c.chapter,
        topic: c.topic,
        snippet: c.snippet,
      })),
    });
    await chat.save();

    return res.json({
      answer: answer || "No relevant content found in your materials.",
      citations,
      chatId: chat._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

