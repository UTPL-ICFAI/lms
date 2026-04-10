async function embedWithOpenAI(texts) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_EMBEDDINGS_MODEL || "text-embedding-3-small";

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${t}`);
  }

  const data = await response.json();
  const vectors = (data?.data || []).map((x) => x.embedding);
  return { vectors, model };
}

async function embedTexts(texts) {
  const input = Array.isArray(texts) ? texts : [String(texts || "")];
  const cleaned = input.map((t) => String(t || "").slice(0, 6000)); // safety cap per chunk
  try {
    const res = await embedWithOpenAI(cleaned);
    if (res) return res;
  } catch {
    // Provider failure (quota/network/etc). We intentionally fall back to non-vector mode.
  }

  // No embedding provider configured: return null vectors (retrieval will fall back to text search).
  return { vectors: cleaned.map(() => null), model: "" };
}

module.exports = { embedTexts };

