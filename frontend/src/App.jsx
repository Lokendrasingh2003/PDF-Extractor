import { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;
    const userMessage = {
      role: "user",
      content: message,
    };

    // Add user's message to UI
    setMessages((prev) => [...prev, userMessage]);

    // Save current message before clearing input
    const currentMessage = message;

    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/chat",
        {
          message: currentMessage,
          messages: [...messages, userMessage],
        }
      );

      const assistantMessage = {
        role: "assistant",
        content: res.data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Chat Error:", error);

      const errorMessage = {
        role: "assistant",
        content: "Something went wrong.",
      };

      setMessages((prev) => [...prev, errorMessage]);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Chatbot 🤖</h1>

      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>
              {msg.role === "user" ? "You" : "AI"}:
            </strong>

            <span> {msg.content}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask something..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default App;