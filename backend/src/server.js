import multer from "multer";
import express from "express";
import fs from "fs";
import pdf from "pdf-parse";
import { chunkText } from "./utils/chunkText.js";
import { createEmbedding } from "./utils/createEmbedding.js";
import { getCollection } from "./utils/vectorStore.js";
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

    const dataBuffer = fs.readFileSync(req.file.path);

    // 1. Extract text
    const data = await pdf(dataBuffer);

    const text = data.text.trim();

    console.log("📄 PDF text extracted");
    console.log("Number of pages:", data.numpages);
    console.log("Text length:", text.length);

    if (!text) {
      return res.status(400).json({
        error:
          "No readable text found in this PDF. The PDF may be scanned/image-based.",
      });
    }

    // 2. Create chunks
    const chunks = chunkText(text);

    console.log("📦 Number of chunks:", chunks.length);

    // 3. Get Chroma collection
    const collection = await getCollection();

    // 4. Create embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      console.log(
        `🧠 Creating embedding ${i + 1}/${chunks.length}`
      );

      const embedding = await createEmbedding(chunk);

      await collection.add({
        ids: [`${req.file.filename}-${i}`],

        embeddings: [embedding],

        documents: [chunk],

        metadatas: [
          {
            filename: req.file.originalname,
            chunkIndex: i,
          },
        ],
      });
    }

    console.log("✅ All chunks stored in ChromaDB");

    res.json({
      message: "PDF processed and stored successfully",

      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
      },

      pages: data.numpages,

      totalCharacters: text.length,

      totalChunks: chunks.length,
    });

  } catch (error) {
    console.error("❌ PDF Processing Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

