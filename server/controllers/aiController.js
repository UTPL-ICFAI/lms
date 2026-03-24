function buildFallbackAnswer(message, courseId) {
  return (
    `Study Assistant (fallback): I can help explain concepts and guide you.\n\n` +
    `You asked: "${message}"\n` +
    (courseId ? `Course context: ${courseId}\n\n` : "\n") +
    `Try breaking the problem into smaller parts and tell me:\n` +
    `- What topic/unit is this from?\n` +
    `- What have you tried so far?\n` +
    `- What exactly is confusing?`
  );
}

async function callOpenAI(message, courseId) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt =
    "You are an LMS study assistant. Give concise, practical academic help. " +
    "If the user asks for cheating or policy violations, refuse and suggest ethical alternatives.";

  const userContent = courseId
    ? `Course ID: ${courseId}\nQuestion: ${message}`
    : `Question: ${message}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

async function callAnthropic(message, courseId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 500,
      temperature: 0.4,
      system:
        "You are an LMS study assistant. Give concise, practical academic help. Refuse cheating requests.",
      messages: [
        {
          role: "user",
          content: courseId
            ? `Course ID: ${courseId}\nQuestion: ${message}`
            : `Question: ${message}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text?.trim() || null;
}

exports.chat = async (req, res) => {
  try {
    const { message, courseId } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    let answer = null;
    let provider = "fallback";

    try {
      // Priority: OpenAI, then Anthropic, then fallback
      answer = (await callOpenAI(message, courseId)) || (await callAnthropic(message, courseId));
      if (answer) provider = process.env.OPENAI_API_KEY ? "openai" : "anthropic";
    } catch {
      // Silent provider failure; fallback is intentional for reliability
    }

    if (!answer) {
      answer = buildFallbackAnswer(message, courseId);
    }

    res.json({ answer, provider });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

