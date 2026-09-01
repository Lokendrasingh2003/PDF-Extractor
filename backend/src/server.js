import multer from "multer";
import express from "express";
import fs from "fs";
import pdf from "pdf-parse";
import { chunkText } from "./utils/chunkText.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import openrouter from "./config/openrouter.js";

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

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

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    console.log("📄 Upload request received");

    if (!req.file) {
      return res.status(400).json({
        error: "PDF file is required",
      });
    }

    console.log("📁 File:", req.file.originalname);

    // Read uploaded PDF
    const dataBuffer = fs.readFileSync(req.file.path);

    // Extract text from PDF
    const data = await pdf(dataBuffer);

    console.log("📄 PDF text extracted");
    console.log("Number of pages:", data.numpages);
    console.log("Text length:", data.text.length);

    console.log("----- PDF TEXT -----");
    console.log(data.text);
    console.log("--------------------");

    const chunks = chunkText(data.text);

    console.log("📦 Number of chunks:", chunks.length);

    chunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index + 1} ---`);
      console.log(chunk);
    });

   res.json({
      message: "PDF processed successfully",

      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
      },

      pages: data.numpages,

      totalCharacters: data.text.length,

      totalChunks: chunks.length,

      chunks,
    });

  } catch (error) {
    console.error("❌ PDF Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

