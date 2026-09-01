import { useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import {
  CloudUpload,
  Description,
  Send,
  SmartToy,
  Person,
} from "@mui/icons-material";

function App() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // -------------------------
  // Upload PDF
  // -------------------------
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setUploaded(false);

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );

      setUploaded(true);

    } catch (error) {
      console.error("Upload Error:", error);

      setError(
        error.response?.data?.error ||
          "Failed to upload PDF."
      );

      setFile(null);

    } finally {
      setUploading(false);
    }
  };

  // -------------------------
  // Ask Question
  // -------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!question.trim()) return;

    if (!uploaded) {
      setError("Please upload a PDF first.");
      return;
    }

    const userQuestion = question.trim();

    const userMessage = {
      role: "user",
      content: userQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/query",
        {
          question: userQuestion,
        }
      );

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources || [],
      };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);

    } catch (error) {
      console.error("Query Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.response?.data?.error ||
            "Something went wrong.",
        },
      ]);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">

      {/* Main Container */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6">

        {/* Header */}
        <Paper
          elevation={0}
          className="rounded-2xl border border-slate-200"
        >
          <div className="flex items-center gap-4 p-5">
            <Avatar>
              <SmartToy />
            </Avatar>

            <div>
              <Typography
                variant="h5"
                className="font-bold"
              >
                RAG AI Assistant
              </Typography>

              <Typography
                variant="body2"
                className="text-slate-500"
              >
                Chat with your PDF documents using AI
              </Typography>
            </div>
          </div>
        </Paper>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Upload Section */}
          <Paper
            elevation={0}
            className="rounded-2xl border border-slate-200 p-5 lg:col-span-1"
          >
            <div className="mb-5">
              <Typography
                variant="h6"
                className="font-semibold"
              >
                Your Document
              </Typography>

              <Typography
                variant="body2"
                className="text-slate-500"
              >
                Upload a PDF to start chatting.
              </Typography>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 transition hover:bg-slate-100"
            >
              <CloudUpload
                sx={{ fontSize: 42 }}
                className="mb-2 text-slate-500"
              />

              <span className="font-medium text-slate-700">
                Choose PDF
              </span>

              <span className="mt-1 text-sm text-slate-400">
                PDF files only
              </span>
            </button>

            {/* Selected File */}
            {file && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">

                <div className="flex items-center gap-3">
                  <Description className="text-red-500" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {file.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                {uploading && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <CircularProgress size={18} />
                    Processing document...
                  </div>
                )}

                {uploaded && !uploading && (
                  <Alert
                    severity="success"
                    className="mt-4"
                  >
                    Document processed successfully.
                  </Alert>
                )}
              </div>
            )}

            {!file && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Upload your document and I'll retrieve
                  relevant information from it when you
                  ask questions.
                </p>
              </div>
            )}
          </Paper>

          {/* Chat Section */}
          <Paper
            elevation={0}
            className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 lg:col-span-2"
          >

            {/* Chat Header */}
            <div className="border-b border-slate-200 p-5">
              <Typography
                variant="h6"
                className="font-semibold"
              >
                AI Chat
              </Typography>

              <Typography
                variant="body2"
                className="text-slate-500"
              >
                Ask questions about your uploaded document.
              </Typography>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">

              {messages.length === 0 && (
                <div className="flex h-full min-h-[450px] flex-col items-center justify-center text-center">

                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                    }}
                    className="mb-4"
                  >
                    <SmartToy />
                  </Avatar>

                  <Typography
                    variant="h6"
                    className="font-semibold"
                  >
                    Ask your document anything
                  </Typography>

                  <Typography
                    variant="body2"
                    className="mt-2 max-w-md text-slate-500"
                  >
                    Upload a PDF and ask questions about
                    its content. The AI will retrieve
                    relevant information before answering.
                  </Typography>

                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {message.role === "assistant" && (
                    <Avatar>
                      <SmartToy />
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {message.role === "user" ? (
                        <Person fontSize="small" />
                      ) : (
                        <SmartToy fontSize="small" />
                      )}

                      <span className="text-xs font-semibold">
                        {message.role === "user"
                          ? "You"
                          : "AI"}
                      </span>
                    </div>

                    <div
                      className={`text-sm leading-6 ${
                        message.role === "user" ? "text-white" : ""
                      }`}
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1
                              className={`mb-3 mt-2 text-xl font-bold ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2
                              className={`mb-2 mt-4 text-lg font-bold ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3
                              className={`mb-2 mt-3 text-base font-bold ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {children}
                            </h3>
                          ),

                          p: ({ children }) => (
                            <p
                              className={`mb-3 ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-700"
                              }`}
                            >
                              {children}
                            </p>
                          ),

                          ul: ({ children }) => (
                            <ul
                              className={`mb-3 ml-5 list-disc space-y-1 ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-700"
                              }`}
                            >
                              {children}
                            </ul>
                          ),

                          ol: ({ children }) => (
                            <ol
                              className={`mb-3 ml-5 list-decimal space-y-1 ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-700"
                              }`}
                            >
                              {children}
                            </ol>
                          ),

                          li: ({ children }) => (
                            <li className="pl-1">
                              {children}
                            </li>
                          ),

                          strong: ({ children }) => (
                            <strong
                              className={`font-bold ${
                                message.role === "user"
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {children}
                            </strong>
                          ),

                          code: ({ children }) => (
                            <code
                              className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                                message.role === "user"
                                  ? "bg-slate-700 text-white"
                                  : "bg-slate-200 text-slate-900"
                              }`}
                            >
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar>
                      <Person />
                    </Avatar>
                  )}

                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <SmartToy />
                  </Avatar>

                  <div className="rounded-2xl bg-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CircularProgress size={18} />

                      <span className="text-sm text-slate-500">
                        Searching document...
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <Divider />

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex gap-3 p-4"
            >
              <TextField
                fullWidth
                size="small"
                placeholder={
                  uploaded
                    ? "Ask something about your document..."
                    : "Upload a PDF first..."
                }
                value={question}
                disabled={!uploaded || loading}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
              />

              <Button
                type="submit"
                variant="contained"
                disabled={
                  !uploaded ||
                  loading ||
                  !question.trim()
                }
                endIcon={<Send />}
              >
                Ask
              </Button>
            </form>

          </Paper>
        </div>
      </div>

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError("")}
      >
        <Alert
          severity="error"
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      </Snackbar>

    </div>
  );
}

export default App;

