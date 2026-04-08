import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// Change this to your imported fine-tuned model name in Ollama
const MODEL = "gemma3:4b";

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
      raw: data,
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