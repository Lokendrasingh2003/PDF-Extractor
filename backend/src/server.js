import multer from "multer";
import express from "express";
import fs from "fs";
import pdf from "pdf-parse";
import { chunkText } from "./utils/chunkText.js";
import { createEmbedding } from "./utils/createEmbedding.js";
import { getCollection } from "./utils/vectorStore.js";
import { searchDocuments } from "./utils/searchDocuments.js";
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




app.post("/api/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    console.log("🔍 User question:", question);

    // 1. Retrieve relevant chunks from ChromaDB
    const results = await searchDocuments(question, 3);

    const documents = results.documents?.[0] || [];

    console.log("📚 Retrieved chunks:", documents.length);

    if (documents.length === 0) {
      return res.status(404).json({
        error: "No relevant information found in the uploaded documents.",
      });
    }

    // 2. Combine retrieved chunks into context
    const context = documents.join("\n\n");

    console.log("📄 Context created");

    // 3. Create prompt for the LLM
    const prompt = `
You are a helpful AI assistant answering questions about uploaded documents.

Use ONLY the information provided in the context below.

If the answer cannot be found in the context, say:
"I couldn't find that information in the uploaded document."

Context:
${context}

Question:
${question}

Answer clearly and concisely.
`;

    // 4. Send context + question to OpenRouter
    const completion = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",

      messages: [
        {
          role: "system",
          content:
            "Answer questions using only the provided document context.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 5. Get LLM response
    const reply = completion.choices[0].message.content;

    console.log("🤖 AI response generated");

    // 6. Send response to frontend
    res.json({
      question,
      answer: reply,
      sources: documents,
    });

  } catch (error) {
    console.error("❌ RAG Error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

