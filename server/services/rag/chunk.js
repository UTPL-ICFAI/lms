const crypto = require("crypto");

function normalizeWhitespace(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

// Simple chunker: aims ~300-500 "token-ish" words per chunk.
// For production token-accurate splitting you can swap this out for a tokenizer.
function chunkText(text, { minWords = 220, maxWords = 420 } = {}) {
  const cleaned = (text || "").replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);

  const chunks = [];
  let current = [];
  let currentWords = 0;
  let cursor = 0; // approximate char offset

  for (const p of paragraphs) {
    const words = p.split(" ").filter(Boolean);
    if (currentWords + words.length > maxWords && currentWords >= minWords) {
      const content = current.join("\n\n").trim();
      chunks.push({ content, charStart: Math.max(0, cursor - content.length), charEnd: cursor });
      current = [];
      currentWords = 0;
    }

    current.push(p);
    currentWords += words.length;
    cursor += p.length + 2;
  }

  if (current.length) {
    const content = current.join("\n\n").trim();
    chunks.push({ content, charStart: Math.max(0, cursor - content.length), charEnd: cursor });
  }

  return chunks;
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

module.exports = { chunkText, hashContent };

