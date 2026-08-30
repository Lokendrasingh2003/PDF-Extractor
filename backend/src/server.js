
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import openrouter from "./config/openrouter.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AI RAG Chatbot Backend is running",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is require",
      });
    }

    console.log("User message:", message);
    console.log("Conversation history:", messages);

    const completion = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",

      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Give clear, accurate, and concise answers.",
        },

        ...messages,
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({
      reply,
    });
  } catch (error) {
    console.error("❌ OpenRouter Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

