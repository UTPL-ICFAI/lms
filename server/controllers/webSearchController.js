function buildFallbackWebAnswer(query, reason) {
  const msg =
    reason ||
    "Web search is not configured on this server. Ask the admin to set SERPAPI_API_KEY and OPENAI_API_KEY.";
  return `Web Search Assistant (fallback)\n\nQuery: "${query}"\n\n${msg}\n\nYou can still use “My Materials (RAG)” mode to get answers grounded in your uploaded files.`;
}

async function searchWithSerpApi(query) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(Math.max(3, Math.min(8, Number(process.env.WEB_SEARCH_TOPK || 5)))));

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SerpAPI error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const organic = Array.isArray(data?.organic_results) ? data.organic_results : [];
    const results = organic
      .slice(0, 8)
      .map((r) => ({
        title: r.title || "",
        link: r.link || "",
        snippet: r.snippet || r.snippet_highlighted_words?.join(" ") || "",
      }))
      .filter((r) => r.link);
    return results;
  } finally {
    clearTimeout(t);
  }
}

async function summarizeWithOpenAI({ query, results, difficulty = "beginner" }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const difficultyHint =
    difficulty === "exam"
      ? "Focus on exam-ready key points, definitions, and pitfalls."
      : difficulty === "intermediate"
        ? "Assume basics are known; give deeper but concise points."
        : "Explain simply with short bullet points.";

  const sourcesText = results
    .map((r, i) => `S${i + 1}. ${r.title}\n${r.snippet}\nURL: ${r.link}`)
    .join("\n\n");

  const system = [
    "You are a web research assistant for an LMS.",
    "You must only use the provided SOURCES.",
    "Return 6-10 concise bullet points, and end with a Sources list mapping [S1].. to URLs.",
    "Do not hallucinate; if sources are insufficient, say so.",
    difficultyHint,
  ].join("\n");

  const user = `QUERY: ${query}\n\nSOURCES:\n${sourcesText}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || "";
  } finally {
    clearTimeout(t);
  }
}

exports.webSearch = async (req, res) => {
  try {
    const { query, difficulty = "beginner" } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ message: "query is required" });
    }

    const q = String(query).trim().slice(0, 500);

    const results = await searchWithSerpApi(q);
    if (!results || results.length === 0) {
      const answer = buildFallbackWebAnswer(
        q,
        process.env.SERPAPI_API_KEY
          ? "No search results found."
          : "Missing SERPAPI_API_KEY."
      );
      return res.json({ answer, sources: [], provider: "fallback" });
    }

    const summary = await summarizeWithOpenAI({ query: q, results, difficulty });
    if (!summary) {
      const answer = buildFallbackWebAnswer(q, "Missing OPENAI_API_KEY (cannot summarize sources).");
      return res.json({ answer, sources: results, provider: "serpapi" });
    }

    return res.json({
      answer: summary,
      sources: results,
      provider: "serpapi+openai",
    });
  } catch (err) {
    return res.json({
      answer: buildFallbackWebAnswer(req.body?.query || "", err.message),
      sources: [],
      provider: "fallback",
    });
  }
};

