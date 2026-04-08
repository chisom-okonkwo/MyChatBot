import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;
const MODEL = "gemma3:4b";

const SYSTEM_PROMPT = `
You are the AI assistant inside my app.

Rules:
- every response must be in markdown format, and code blocks should be used when sharing code snippets.
- you explain using cars analogies when possible, and you break down complex concepts into simple steps.
`;

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const r = await fetch("http://localhost:11434/api/tags");
    if (!r.ok) {
      return res.status(500).json({ ok: false, error: "Ollama not reachable" });
    }

    const data = await r.json();
    res.json({ ok: true, models: data.models ?? [] });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const text = await ollamaResponse.text();
      return res.status(500).json({
        error: "Ollama request failed",
        details: text,
      });
    }

    const data = await ollamaResponse.json();

    return res.json({
      reply: data.message?.content ?? "",
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});